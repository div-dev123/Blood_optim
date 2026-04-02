from __future__ import annotations

import datetime as dt
import json
import uuid

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


class UserModel(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(32), nullable=False)  # 'HOSPITAL' | 'DONOR'

    profile_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")

    created_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: dt.datetime.now(dt.timezone.utc), nullable=False
    )
    updated_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: dt.datetime.now(dt.timezone.utc),
        onupdate=lambda: dt.datetime.now(dt.timezone.utc),
        nullable=False,
    )

    def set_profile(self, profile: dict) -> None:
        self.profile_json = json.dumps(profile, separators=(",", ":"), ensure_ascii=False)

    def get_profile(self) -> dict:
        try:
            value = json.loads(self.profile_json)
            if isinstance(value, dict):
                return value
        except Exception:
            pass
        return {}


class BloodUnitModel(Base):
    __tablename__ = "blood_units"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    hospital_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    blood_type: Mapped[str] = mapped_column(String(8), index=True, nullable=False)

    collection_date: Mapped[str] = mapped_column(String(10), nullable=False)  # YYYY-MM-DD
    expiry_date: Mapped[str] = mapped_column(String(10), nullable=False)  # YYYY-MM-DD
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="available")
    location: Mapped[str] = mapped_column(String(128), nullable=False, default="Main Storage")
    match_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    created_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: dt.datetime.now(dt.timezone.utc), nullable=False
    )
    updated_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: dt.datetime.now(dt.timezone.utc),
        onupdate=lambda: dt.datetime.now(dt.timezone.utc),
        nullable=False,
    )


class RedistributionRequestModel(Base):
    __tablename__ = "redistribution_requests"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    from_hospital_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    to_hospital_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)

    blood_types_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    units: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    status: Mapped[str] = mapped_column(String(32), nullable=False, default="requested")
    urgency: Mapped[str] = mapped_column(String(16), nullable=False, default="medium")
    eta: Mapped[str] = mapped_column(String(64), nullable=True)

    requested_by_user_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)

    created_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: dt.datetime.now(dt.timezone.utc), nullable=False
    )
    updated_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: dt.datetime.now(dt.timezone.utc),
        onupdate=lambda: dt.datetime.now(dt.timezone.utc),
        nullable=False,
    )

    def set_blood_types(self, blood_types: list[str]) -> None:
        self.blood_types_json = json.dumps(blood_types, separators=(",", ":"), ensure_ascii=False)

    def get_blood_types(self) -> list[str]:
        try:
            value = json.loads(self.blood_types_json)
            if isinstance(value, list):
                return [str(v) for v in value]
        except Exception:
            pass
        return []
