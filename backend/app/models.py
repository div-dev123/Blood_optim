from __future__ import annotations

import datetime as dt
import json
import uuid

from sqlalchemy import DateTime, String, Text
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
