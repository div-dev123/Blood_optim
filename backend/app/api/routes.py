from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request

from ..schemas import (
    DemandForecastRequest,
    DemandForecastResponse,
    ForecastPoint,
    PatchGRUForecastRequest,
    PatchGRUForecastResponse,
)


router = APIRouter(prefix="/api/v1")


@router.get("/health")
async def health(request: Request):
    tft_loaded = hasattr(request.app.state, "tft_service") and request.app.state.tft_service is not None
    patchgru = getattr(request.app.state, "patchgru_service", None)
    patchgru_available = patchgru is not None

    return {
        "status": "ok",
        "models": {
            "tft": {"loaded": tft_loaded},
            "patchgru": {
                "loaded": patchgru is not None,
                "available": patchgru_available,
                "detail": None,
            },
        },
    }


@router.post("/forecast/demand", response_model=DemandForecastResponse)
async def forecast_demand(payload: DemandForecastRequest, request: Request):
    service = getattr(request.app.state, "tft_service", None)
    if service is None:
        raise HTTPException(status_code=503, detail="TFT service not available")

    # Fill static features from metadata if not provided
    metadata = getattr(request.app.state, "metadata_service", None)
    hospital_type = payload.hospital_type
    bed_capacity = payload.bed_capacity
    if (hospital_type is None or bed_capacity is None) and metadata is not None:
        info = metadata.get(payload.hospital_id)
        if info is not None:
            hospital_type = hospital_type or info.hospital_type
            bed_capacity = bed_capacity if bed_capacity is not None else info.bed_capacity

    try:
        result = service.forecast_demand(
            hospital_id=payload.hospital_id,
            blood_group=payload.blood_group,
            historical_demand=payload.historical_demand,
            hospital_type=hospital_type or "Government",
            bed_capacity=0.0 if bed_capacity is None else bed_capacity,
            end_date=payload.end_date,
            forecast_days=payload.forecast_days,
            is_holiday=payload.is_holiday,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"TFT inference failed: {exc}") from exc

    forecast_points = [
        ForecastPoint(date=d, q10=q10, q50=q50, q90=q90)
        for d, q10, q50, q90 in zip(result.dates, result.q10, result.q50, result.q90)
    ]

    return DemandForecastResponse(
        model="tft",
        hospital_id=payload.hospital_id,
        blood_group=payload.blood_group,
        forecast_days=payload.forecast_days,
        forecast=forecast_points,
    )


@router.post("/forecast/expiry", response_model=PatchGRUForecastResponse)
async def forecast_expiry(payload: PatchGRUForecastRequest, request: Request):
    patchgru = getattr(request.app.state, "patchgru_service", None)
    if patchgru is None:
        raise HTTPException(status_code=503, detail="PatchGRU service not available")

    try:
        result = patchgru.forecast(
            hospital_id=payload.hospital_id,
            blood_group=payload.blood_group,
            historical_demand=payload.historical_demand,
            end_date=payload.end_date,
            hospital_id_encoded=payload.hospital_id_encoded,
            blood_group_encoded=payload.blood_group_encoded,
            is_holiday_lookback=payload.is_holiday_lookback,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"PatchGRU inference failed: {exc}") from exc

    return PatchGRUForecastResponse(
        model="patchgru",
        forecast_days=len(result.demand_forecast_14d),
        demand_forecast_14d=result.demand_forecast_14d,
        days_until_expiry_14d=result.days_until_expiry_14d,
    )
