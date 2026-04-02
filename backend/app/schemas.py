from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class AuthRegisterRequest(BaseModel):
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)
    role: str = Field(..., pattern="^(HOSPITAL|DONOR)$")

    name: str = Field(..., min_length=1)
    phone: str = Field(..., min_length=1)

    blood_type: Optional[str] = None
    hospital_license: Optional[str] = None


class AuthLoginRequest(BaseModel):
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=1)
    role: str = Field(..., pattern="^(HOSPITAL|DONOR)$")


class AuthUser(BaseModel):
    id: str
    email: str
    role: str
    profile: dict
    isAuthenticated: bool = True


class AuthResponse(BaseModel):
    token: str
    user: AuthUser


class AuthUpdateProfileRequest(BaseModel):
    display_name: Optional[str] = None
    phone: Optional[str] = None
    notifications: Optional[dict] = None
    animation_speed: Optional[str] = Field(None, pattern="^(Normal|Fast|Reduced Motion)$")


class InventoryUnitCreateRequest(BaseModel):
    hospital_id: str = Field(..., min_length=1)
    blood_type: str = Field(..., min_length=1)
    collection_date: str = Field(..., min_length=10, max_length=10)  # YYYY-MM-DD
    expiry_date: str = Field(..., min_length=10, max_length=10)  # YYYY-MM-DD
    location: str = Field("Main Storage", min_length=1)


class InventoryUnit(BaseModel):
    id: str
    hospital_id: str
    bloodType: str
    collectionDate: str
    expiryDate: str
    status: str
    location: str
    matchScore: int


class InventoryUnitUpdateRequest(BaseModel):
    status: Optional[str] = Field(None, pattern="^(available|reserved|expired|dispatched)$")
    location: Optional[str] = Field(None, min_length=1)
    expiry_date: Optional[str] = Field(None, min_length=10, max_length=10)


class RedistributionRequestCreate(BaseModel):
    from_hospital_id: str = Field(..., min_length=1)
    to_hospital_id: str = Field(..., min_length=1)
    blood_types: List[str] = Field(..., min_length=1)
    units: int = Field(..., ge=1)
    urgency: str = Field("medium", pattern="^(low|medium|high|critical)$")


class RedistributionRequest(BaseModel):
    id: str
    fromLocation: str
    toLocation: str
    bloodTypes: List[str]
    units: int
    status: str
    urgency: str
    eta: Optional[str] = None


class RedistributionRecommendation(BaseModel):
    from_hospital_id: str
    to_hospital_id: str
    blood_type: str
    units: int
    reason: str
    eta: str


class DemandForecastRequest(BaseModel):
    hospital_id: str = Field(..., min_length=1)
    blood_group: str = Field(..., min_length=1)
    historical_demand: List[float] = Field(..., min_length=1)

    # Optional; if omitted, backend will try to look it up from hospital metadata.
    hospital_type: Optional[str] = None
    # Optional; if omitted, backend will try to look it up from hospital metadata.
    bed_capacity: Optional[float] = None

    # ISO date (YYYY-MM-DD) for the LAST value in historical_demand.
    # If omitted, defaults to today.
    end_date: Optional[str] = None

    # Currently the shipped TFT checkpoint is trained for 7-day horizon.
    forecast_days: int = Field(7, ge=1, le=14)

    # Optional future holiday flags for the forecast horizon.
    # If provided, must have length == forecast_days.
    # Accepts booleans or 0/1 values.
    is_holiday: Optional[List[bool]] = None


class ForecastPoint(BaseModel):
    date: str
    q10: Optional[float] = None
    q50: float
    q90: Optional[float] = None


class DemandForecastResponse(BaseModel):
    model: str
    hospital_id: str
    blood_group: str
    forecast_days: int
    forecast: List[ForecastPoint]


class PatchGRUForecastRequest(BaseModel):
    hospital_id: str = Field(..., min_length=1)
    blood_group: str = Field(..., min_length=1)
    historical_demand: List[float] = Field(..., min_length=1)
    historical_stock: Optional[List[float]] = None

    # ISO date (YYYY-MM-DD) for the LAST value in historical_demand.
    # If omitted, defaults to today.
    end_date: Optional[str] = None

    # Optional override if you already know the numeric encodings used in training.
    hospital_id_encoded: Optional[int] = None
    blood_group_encoded: Optional[int] = None

    # Optional holiday flags for the 28-day lookback.
    # If provided, must have length == lookback_days (28).
    is_holiday_lookback: Optional[List[bool]] = None


class PatchGRUForecastResponse(BaseModel):
    model: str
    forecast_days: int
    demand_forecast_14d: List[float]
    days_until_expiry_14d: List[float]

