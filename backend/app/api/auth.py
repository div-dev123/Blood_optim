from __future__ import annotations

import random
import re
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import Base, engine, get_db
from ..models import UserModel
from ..schemas import AuthLoginRequest, AuthRegisterRequest, AuthResponse, AuthUser
from ..security import create_access_token, hash_password, verify_password, decode_token


router = APIRouter(prefix="/auth", tags=["auth"])


def init_db() -> None:
    Base.metadata.create_all(bind=engine)


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _split_name(name: str) -> tuple[str, str]:
    parts = [p for p in re.split(r"\s+", name.strip()) if p]
    if not parts:
        return "", ""
    if len(parts) == 1:
        return parts[0], ""
    return parts[0], " ".join(parts[1:])


def _build_donor_profile(name: str, email: str, phone: str, blood_type: str) -> dict:
    first, last = _split_name(name)
    return {
        "firstName": first or "",
        "lastName": last or "",
        "bloodType": blood_type,
        "dateOfBirth": "1998-01-01",
        "phone": phone,
        "email": email,
        "address": "",
        "emergencyContact": "",
        "creditScore": 800,
        "totalDonations": 0,
        "lastDonationDate": None,
        "eligibleDate": "2026-01-01",
        "healthStatus": "eligible",
        "preferredDonationCenter": "",
        "achievements": [],
        "level": 1,
    }


def _build_hospital_profile(name: str, phone: str, license_number: str) -> dict:
    hospital_id = f"H{random.randint(1, 999):03d}"
    return {
        "hospitalName": name,
        "hospitalId": hospital_id,
        "location": {
            "address": "",
            "city": "",
            "coordinates": {"lat": 0.0, "lng": 0.0},
        },
        "license": license_number,
        "contactPerson": "Hospital Admin",
        "phone": phone,
        "bloodBankCapacity": 0,
        "currentInventory": {"totalUnits": 0, "byType": {}},
        "tier": "basic",
    }


def _to_auth_user(db_user: UserModel) -> AuthUser:
    return AuthUser(
        id=db_user.id,
        email=db_user.email,
        role=db_user.role,
        profile=db_user.get_profile(),
        isAuthenticated=True,
    )


@router.post("/register", response_model=AuthResponse)
def register(payload: AuthRegisterRequest, db: Session = Depends(get_db)):
    email = _normalize_email(payload.email)

    existing = db.scalar(select(UserModel).where(UserModel.email == email))
    if existing is not None:
        raise HTTPException(status_code=409, detail="Email already registered")

    if payload.role == "DONOR":
        if not payload.blood_type:
            raise HTTPException(status_code=400, detail="blood_type is required for donors")
        profile = _build_donor_profile(payload.name, email, payload.phone, payload.blood_type)
    else:
        if not payload.hospital_license:
            raise HTTPException(status_code=400, detail="hospital_license is required for hospitals")
        profile = _build_hospital_profile(payload.name, payload.phone, payload.hospital_license)

    user = UserModel(
        email=email,
        password_hash=hash_password(payload.password),
        role=payload.role,
    )
    user.set_profile(profile)

    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.id, extra={"role": user.role, "email": user.email})
    return AuthResponse(token=token, user=_to_auth_user(user))


@router.post("/login", response_model=AuthResponse)
def login(payload: AuthLoginRequest, db: Session = Depends(get_db)):
    email = _normalize_email(payload.email)

    user = db.scalar(select(UserModel).where(UserModel.email == email))
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if user.role != payload.role:
        raise HTTPException(status_code=403, detail="Account role does not match this portal")

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(subject=user.id, extra={"role": user.role, "email": user.email})
    return AuthResponse(token=token, user=_to_auth_user(user))


@router.get("/me", response_model=AuthUser)
def me(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")

    token = authorization.split(" ", 1)[1].strip()
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

    return _to_auth_user(user)


def seed_demo_users(db: Session) -> None:
    def upsert(email: str, password: str, role: str, profile: dict):
        normalized = _normalize_email(email)
        existing = db.scalar(select(UserModel).where(UserModel.email == normalized))
        if existing is not None:
            return
        user = UserModel(email=normalized, password_hash=hash_password(password), role=role)
        user.set_profile(profile)
        db.add(user)

    upsert(
        email="admin@hospital.demo",
        password="demo1234",
        role="HOSPITAL",
        profile=_build_hospital_profile("Demo General Hospital", "+1 (555) 000-1111", "LIC-DEMO-2026"),
    )
    upsert(
        email="donor@demo.com",
        password="demo1234",
        role="DONOR",
        profile=_build_donor_profile("Priya Sharma", "donor@demo.com", "+1 (555) 444-9999", "A+"),
    )

    db.commit()
