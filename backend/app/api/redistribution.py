from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import RedistributionRequestModel, UserModel
from ..schemas import (
    RedistributionRecommendation,
    RedistributionRequest,
    RedistributionRequestCreate,
)
from ..security import decode_token


router = APIRouter(prefix="/redistribution", tags=["redistribution"])


def _require_bearer_token(authorization: Optional[str]) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    return authorization.split(" ", 1)[1].strip()


def _get_current_user(*, db: Session, authorization: Optional[str]) -> UserModel:
    token = _require_bearer_token(authorization)
    try:
        decoded = decode_token(token)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_id = str(decoded.get("sub") or "")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.get(UserModel, user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def _to_request(model: RedistributionRequestModel) -> RedistributionRequest:
    return RedistributionRequest(
        id=model.id,
        fromLocation=model.from_hospital_id,
        toLocation=model.to_hospital_id,
        bloodTypes=model.get_blood_types(),
        units=int(model.units),
        status=model.status,
        urgency=model.urgency,
        eta=model.eta,
    )


@router.get("/requests", response_model=list[RedistributionRequest])
def list_requests(
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(default=None),
):
    user = _get_current_user(db=db, authorization=authorization)
    if user.role != "HOSPITAL":
        raise HTTPException(status_code=403, detail="Hospital access required")

    hospital_id = str(user.get_profile().get("hospitalId") or "")
    if not hospital_id:
        return []

    rows = db.scalars(
        select(RedistributionRequestModel)
        .where(
            (RedistributionRequestModel.from_hospital_id == hospital_id)
            | (RedistributionRequestModel.to_hospital_id == hospital_id)
        )
        .order_by(RedistributionRequestModel.created_at.desc())
    ).all()
    return [_to_request(r) for r in rows]


@router.post("/requests", response_model=RedistributionRequest)
def create_request(
    payload: RedistributionRequestCreate,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(default=None),
):
    user = _get_current_user(db=db, authorization=authorization)
    if user.role != "HOSPITAL":
        raise HTTPException(status_code=403, detail="Hospital access required")

    hospital_id = str(user.get_profile().get("hospitalId") or "")
    if hospital_id and payload.to_hospital_id != hospital_id:
        raise HTTPException(status_code=403, detail="Requests must target your hospital")

    req = RedistributionRequestModel(
        from_hospital_id=payload.from_hospital_id,
        to_hospital_id=payload.to_hospital_id,
        units=int(payload.units),
        status="requested",
        urgency=payload.urgency,
        eta=None,
        requested_by_user_id=user.id,
    )
    req.set_blood_types([str(v) for v in payload.blood_types])

    db.add(req)
    db.commit()
    db.refresh(req)
    return _to_request(req)


@router.post("/requests/{request_id}/advance", response_model=RedistributionRequest)
def advance_request(
    request_id: str,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(default=None),
):
    user = _get_current_user(db=db, authorization=authorization)
    if user.role != "HOSPITAL":
        raise HTTPException(status_code=403, detail="Hospital access required")

    hospital_id = str(user.get_profile().get("hospitalId") or "")

    req = db.get(RedistributionRequestModel, request_id)
    if req is None:
        raise HTTPException(status_code=404, detail="Request not found")

    if hospital_id and req.to_hospital_id != hospital_id and req.from_hospital_id != hospital_id:
        raise HTTPException(status_code=403, detail="Cannot modify other hospital requests")

    next_status = {
        "requested": "approved",
        "approved": "in-transit",
        "in-transit": "delivered",
        "delivered": "delivered",
    }.get(req.status, "requested")
    req.status = next_status

    if next_status == "approved":
        req.eta = req.eta or "4 hours"
    if next_status == "in-transit":
        req.eta = "2 hours"
    if next_status == "delivered":
        req.eta = None

    req.updated_at = datetime.now(timezone.utc)
    db.add(req)
    db.commit()
    db.refresh(req)
    return _to_request(req)


@router.get("/recommendations", response_model=list[RedistributionRecommendation])
def recommendations(
    blood_type: str,
    needed_units: int = 10,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(default=None),
):
    """Simple recommendations using hospital_network.csv (ETA proxy via distance).

    This intentionally does not expose other hospitals' inventory; it only provides a ranked
    list of potential source hospitals by network proximity.
    """

    user = _get_current_user(db=db, authorization=authorization)
    if user.role != "HOSPITAL":
        raise HTTPException(status_code=403, detail="Hospital access required")

    to_hospital_id = str(user.get_profile().get("hospitalId") or "")
    if not to_hospital_id:
        return []

    here = Path(__file__).resolve()

    # repo root: .../backend/app/api/redistribution.py -> parents[3] == repo root
    # also support historical location under backend/models/metadata
    csv_candidates = [
        here.parents[2] / "models" / "metadata" / "hospital_network.csv",
        here.parents[3] / "hospital_network.csv",
        Path.cwd() / "hospital_network.csv",
    ]
    csv_path = next((p for p in csv_candidates if p.exists()), None)
    if csv_path is None:
        return []

    try:
        import pandas as pd

        df = pd.read_csv(csv_path)
    except Exception:
        return []

    # Try common column names; fall back to best-effort.
    cols = {c.lower(): c for c in df.columns}
    from_col = (
        cols.get("from")
        or cols.get("from_hospital")
        or cols.get("source")
        or cols.get("hospital_from")
        or cols.get("source_hospital")
    )
    to_col = (
        cols.get("to")
        or cols.get("to_hospital")
        or cols.get("target")
        or cols.get("hospital_to")
        or cols.get("target_hospital")
    )
    dist_col = cols.get("distance") or cols.get("distance_km") or cols.get("km")
    time_col = cols.get("travel_time_minutes") or cols.get("travel_minutes") or cols.get("minutes")
    connected_col = cols.get("is_connected") or cols.get("connected")

    if not from_col or not to_col:
        return []

    selected_cols: list[str] = [from_col, to_col]
    if dist_col:
        selected_cols.append(dist_col)
    if time_col:
        selected_cols.append(time_col)
    if connected_col:
        selected_cols.append(connected_col)

    edges = df[selected_cols].dropna(subset=[from_col, to_col]).copy()
    edges[from_col] = edges[from_col].astype(str)
    edges[to_col] = edges[to_col].astype(str)

    if connected_col and connected_col in edges.columns:
        try:
            edges = edges[edges[connected_col].astype(str).str.lower().isin(["true", "1", "yes"])].copy()
        except Exception:
            pass

    # Some demo profiles may have hospital IDs that don't exist in the network CSV.
    # In that case, map the ID into the network's ID space (H001..H025) for lookup,
    # but keep the real hospitalId in the returned recommendations.
    nodes = set(edges[from_col].unique().tolist()) | set(edges[to_col].unique().tolist())
    lookup_to_id = to_hospital_id
    if lookup_to_id not in nodes:
        import re

        m = re.fullmatch(r"H(\d+)", lookup_to_id)
        if m:
            n = int(m.group(1))
            mapped = ((n - 1) % 25) + 1
            lookup_to_id = f"H{mapped:03d}"

    candidates = edges[edges[to_col] == lookup_to_id]
    if candidates.empty:
        candidates = edges[edges[from_col] == lookup_to_id]
        # If only outgoing edges, invert for recommendations.
        candidates = candidates.rename(columns={to_col: from_col, from_col: to_col})

    out: list[RedistributionRecommendation] = []
    for _, row in candidates.iterrows():
        from_hospital_id = str(row[from_col])
        if from_hospital_id == to_hospital_id:
            continue

        distance = None
        if dist_col and dist_col in row and row[dist_col] is not None:
            try:
                distance = float(row[dist_col])
            except Exception:
                distance = None

        minutes = None
        if time_col and time_col in row and row[time_col] is not None:
            try:
                minutes = float(row[time_col])
            except Exception:
                minutes = None

        eta = "4 hours"
        if minutes is not None:
            eta = f"{max(1, int(round(minutes)))} minutes"
        elif distance is not None:
            if distance <= 5:
                eta = "45 minutes"
            elif distance <= 15:
                eta = "2 hours"

        out.append(
            RedistributionRecommendation(
                from_hospital_id=from_hospital_id,
                to_hospital_id=to_hospital_id,
                blood_type=blood_type,
                units=int(max(1, needed_units)),
                reason="Predicted shortage vs current inventory",
                eta=eta,
            )
        )

    return out[:6]