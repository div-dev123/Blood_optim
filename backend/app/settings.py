from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    model_dir: Path
    tft_model_path: Path
    patchgru_model_path: Path
    device: str
    cors_origins: list[str]


def _split_origins(value: str) -> list[str]:
    value = value.strip()
    if not value or value == "*":
        return ["*"]
    return [part.strip() for part in value.split(",") if part.strip()]


def load_settings() -> Settings:
    backend_dir = Path(__file__).resolve().parents[1]  # backend/
    default_model_dir = backend_dir / "models"

    model_dir = Path(os.getenv("MODEL_DIR", str(default_model_dir))).expanduser().resolve()
    tft_model_path = Path(
        os.getenv("TFT_MODEL_PATH", str(model_dir / "tft" / "tft_blood_demand_model.ckpt"))
    ).expanduser().resolve()
    patchgru_model_path = Path(
        os.getenv("PATCHGRU_MODEL_PATH", str(model_dir / "patchgru" / "patchgru_best_model_fixed.pt"))
    ).expanduser().resolve()

    device = os.getenv("DEVICE", "cpu").strip() or "cpu"
    cors_origins = _split_origins(os.getenv("CORS_ORIGINS", "*"))

    return Settings(
        model_dir=model_dir,
        tft_model_path=tft_model_path,
        patchgru_model_path=patchgru_model_path,
        device=device,
        cors_origins=cors_origins,
    )
