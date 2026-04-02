from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.routes import router
from .api.auth import init_db, seed_demo_users
from .db import SessionLocal
from .services.patchgru_service import PatchGRUService
from .services.tft_service import TFTService
from .services.metadata_service import HospitalMetadataService
from .settings import load_settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = load_settings()
    app.state.settings = settings

    # DB + auth
    init_db()
    with SessionLocal() as db:
        seed_demo_users(db)

    app.state.metadata_service = HospitalMetadataService(
        csv_path=settings.model_dir / "metadata" / "hospital_metadata.csv"
    )

    # TFT is optional (API returns 503 if model isn't available)
    try:
        app.state.tft_service = TFTService(
            checkpoint_path=settings.tft_model_path,
            device=settings.device,
        )
    except FileNotFoundError:
        app.state.tft_service = None

    # PatchGRU is optional
    try:
        app.state.patchgru_service = PatchGRUService(
            model_path=settings.patchgru_model_path,
            device=settings.device,
        )
    except FileNotFoundError:
        app.state.patchgru_service = None

    yield


app = FastAPI(title="Blood Donation Backend", version="0.1.0", lifespan=lifespan)

settings = load_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
