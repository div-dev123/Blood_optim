from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import BloodUnitModel, UserModel
from ..schemas import InventoryUnit, InventoryUnitCreateRequest
from ..security import decode_token


router = APIRouter(prefix="/inventory", tags=["inventory"])


def _require_bearer_token(authorization: Optional[str]) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    return authorization.split(" ", 1)[1].strip()


def _get_current_user(
    *,
    db: Session,
    authorization: Optional[str],
) -> UserModel:
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


def _to_inventory_unit(model: BloodUnitModel) -> InventoryUnit:
    return InventoryUnit(
        id=model.id,
        hospital_id=model.hospital_id,
        bloodType=model.blood_type,
        collectionDate=model.collection_date,
        expiryDate=model.expiry_date,
        status=model.status,
        location=model.location,
        matchScore=int(model.match_score or 0),
    )


@router.get("/units", response_model=list[InventoryUnit])
def list_units(
    hospital_id: str,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(default=None),
):
    user = _get_current_user(db=db, authorization=authorization)
    if user.role != "HOSPITAL":
        raise HTTPException(status_code=403, detail="Hospital access required")

    profile = user.get_profile()
    user_hospital_id = str(profile.get("hospitalId") or "")
    if user_hospital_id and hospital_id != user_hospital_id:
        raise HTTPException(status_code=403, detail="Cannot access other hospital inventory")

    rows = db.scalars(
        select(BloodUnitModel)
        .where(BloodUnitModel.hospital_id == hospital_id)
        .order_by(BloodUnitModel.expiry_date.asc())
    ).all()

    return [_to_inventory_unit(r) for r in rows]


@router.post("/units", response_model=InventoryUnit)
def create_unit(
    payload: InventoryUnitCreateRequest,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(default=None),
):
    user = _get_current_user(db=db, authorization=authorization)
    if user.role != "HOSPITAL":
        raise HTTPException(status_code=403, detail="Hospital access required")

    profile = user.get_profile()
    user_hospital_id = str(profile.get("hospitalId") or "")
    if user_hospital_id and payload.hospital_id != user_hospital_id:
        raise HTTPException(status_code=403, detail="Cannot modify other hospital inventory")

    unit = BloodUnitModel(
        hospital_id=payload.hospital_id,
        blood_type=payload.blood_type,
        collection_date=payload.collection_date,
        expiry_date=payload.expiry_date,
        status="available",
        location=payload.location,
        match_score=0,
    )

    db.add(unit)
    db.commit()
    db.refresh(unit)

    return _to_inventory_unit(unit)
