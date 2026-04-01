from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Iterable, Optional, Sequence


@dataclass(frozen=True)
class TFTForecastResult:
    dates: list[str]
    q10: list[Optional[float]]
    q50: list[float]
    q90: list[Optional[float]]


class TFTService:
    def __init__(self, checkpoint_path: Path, device: str = "cpu") -> None:
        self.checkpoint_path = checkpoint_path
        self.device_str = device

        if not self.checkpoint_path.exists():
            raise FileNotFoundError(
                f"TFT checkpoint not found: {self.checkpoint_path}. "
                "Copy it to backend/models/tft/ or set TFT_MODEL_PATH."
            )

        # Heavy imports only when service is constructed
        import torch
        from pytorch_forecasting import TemporalFusionTransformer

        self._torch = torch
        self._TemporalFusionTransformer = TemporalFusionTransformer

        self.device = self._resolve_device(device)
        self.model = self._load_model()
        self.model.to(self.device)
        self.model.eval()

        self.dataset_parameters = getattr(self.model, "dataset_parameters", None)

    def _predict_trainer_kwargs(self) -> dict:
        # Keep API logs clean and honor DEVICE selection.
        trainer_kwargs: dict = {
            "logger": False,
            "enable_checkpointing": False,
            "enable_progress_bar": False,
            "enable_model_summary": False,
        }

        device = (self.device_str or "cpu").lower()
        if device.startswith("cuda"):
            trainer_kwargs.update({"accelerator": "cuda", "devices": 1})
        elif device.startswith("mps"):
            trainer_kwargs.update({"accelerator": "mps", "devices": 1})
        else:
            trainer_kwargs.update({"accelerator": "cpu", "devices": 1})

        return trainer_kwargs

    def _categorical_classes(self, name: str) -> Optional[dict]:
        if not isinstance(self.dataset_parameters, dict):
            return None
        enc = (self.dataset_parameters.get("categorical_encoders") or {}).get(name)
        if enc is None or not hasattr(enc, "classes_"):
            return None
        classes = enc.classes_
        if isinstance(classes, dict):
            return classes
        return None

    def _format_holiday_str(self, is_holiday: bool) -> str:
        classes = self._categorical_classes("is_holiday_str") or {}
        # Some checkpoints were trained with boolean strings.
        if "False" in classes and "True" in classes:
            return "True" if is_holiday else "False"
        # Others use 0/1 strings.
        if "0" in classes and "1" in classes:
            return "1" if is_holiday else "0"
        # Default to boolean strings (matches this repo's checkpoint).
        return "True" if is_holiday else "False"

    def _resolve_device(self, device: str):
        torch = self._torch
        if device.startswith("cuda") and torch.cuda.is_available():
            return torch.device(device)
        return torch.device("cpu")

    def _load_model(self):
        torch = self._torch

        # PyTorch >=2.0 defaults to weights_only=True in some contexts.
        # This checkpoint contains pickled objects (dataset params), so we must set weights_only=False.
        original_load = torch.load

        def patched_load(*args, **kwargs):
            kwargs.setdefault("weights_only", False)
            return original_load(*args, **kwargs)

        torch.load = patched_load
        try:
            return self._TemporalFusionTransformer.load_from_checkpoint(
                str(self.checkpoint_path), map_location=self.device
            )
        finally:
            torch.load = original_load

    def _parse_end_date(self, end_date: Optional[str]) -> date:
        if not end_date:
            return date.today()
        try:
            return date.fromisoformat(end_date)
        except ValueError as exc:
            raise ValueError("end_date must be ISO format YYYY-MM-DD") from exc

    def _get_lengths(self) -> tuple[int, int]:
        default_encoder_length = 30
        default_prediction_length = 7

        params = self.dataset_parameters
        if isinstance(params, dict):
            enc = int(params.get("max_encoder_length", default_encoder_length))
            pred = int(params.get("max_prediction_length", default_prediction_length))
            return enc, pred
        return default_encoder_length, default_prediction_length

    def _build_dataframe(
        self,
        *,
        hospital_id: str,
        blood_group: str,
        historical_demand: Sequence[float],
        hospital_type: str,
        bed_capacity: float,
        end_date: date,
        forecast_days: int,
        is_holiday: Optional[Sequence[int]],
        encoder_length: int,
    ):
        import numpy as np
        import pandas as pd

        if len(historical_demand) < encoder_length:
            raise ValueError(
                f"historical_demand must have at least {encoder_length} values; got {len(historical_demand)}"
            )

        hist = list(map(float, historical_demand[-encoder_length:]))
        if is_holiday is not None and len(is_holiday) != forecast_days:
            raise ValueError("is_holiday length must equal forecast_days")

        start_date = end_date - timedelta(days=encoder_length - 1)
        total_days = encoder_length + forecast_days
        series_id = f"{hospital_id}_{blood_group}"

        rows = []
        for i in range(total_days):
            d = start_date + timedelta(days=i)
            day_of_week = d.weekday()
            month = d.month
            weekend = 1 if day_of_week >= 5 else 0
            holiday_flag = bool(is_holiday[i - encoder_length]) if (is_holiday is not None and i >= encoder_length) else False
            holiday_str = self._format_holiday_str(holiday_flag)

            rows.append(
                {
                    "date": d,
                    "hospital_id": str(hospital_id),
                    "blood_group": str(blood_group),
                    "hospital_type": str(hospital_type or "Unknown"),
                    "bed_capacity": float(bed_capacity or 0.0),
                    "series_id": series_id,
                    "time_idx": i,
                    "week_of_year": int(d.isocalendar()[1]),
                    "day_of_week_str": str(day_of_week),
                    "month_str": str(month),
                    "is_weekend_str": str(weekend),
                    "is_holiday_str": holiday_str,
                    # For inference, future targets are unknown but cannot be NA in TimeSeriesDataSet.
                    # Use a neutral placeholder (0.0) for decoder rows.
                    "demand_units": float(hist[i]) if i < encoder_length else 0.0,
                }
            )

        df = pd.DataFrame(rows)

        # Ensure correct dtypes
        df["time_idx"] = df["time_idx"].astype(int)
        df["week_of_year"] = df["week_of_year"].astype(int)
        df["bed_capacity"] = pd.to_numeric(df["bed_capacity"], errors="coerce").fillna(0.0)
        df["demand_units"] = pd.to_numeric(df["demand_units"], errors="coerce")

        return df

    def forecast_demand(
        self,
        *,
        hospital_id: str,
        blood_group: str,
        historical_demand: Sequence[float],
        hospital_type: str = "Unknown",
        bed_capacity: float = 0.0,
        end_date: Optional[str] = None,
        forecast_days: int = 7,
        is_holiday: Optional[Sequence[bool]] = None,
    ) -> TFTForecastResult:
        import numpy as np
        import pandas as pd
        from pytorch_forecasting import TimeSeriesDataSet

        encoder_length, model_prediction_length = self._get_lengths()
        if forecast_days != model_prediction_length:
            raise ValueError(
                f"This TFT checkpoint supports forecast_days={model_prediction_length}; got {forecast_days}"
            )

        end_dt = self._parse_end_date(end_date)
        df = self._build_dataframe(
            hospital_id=hospital_id,
            blood_group=blood_group,
            historical_demand=historical_demand,
            hospital_type=hospital_type,
            bed_capacity=bed_capacity,
            end_date=end_dt,
            forecast_days=forecast_days,
            is_holiday=is_holiday,
            encoder_length=encoder_length,
        )

        # Guardrail: ensure static categoricals are known to the checkpoint encoders
        encoders = (self.dataset_parameters.get("categorical_encoders") or {}) if isinstance(self.dataset_parameters, dict) else {}
        for name in ["hospital_id", "blood_group", "hospital_type"]:
            encoder = encoders.get(name)
            if encoder is None or not hasattr(encoder, "classes_"):
                continue
            classes = encoder.classes_
            if isinstance(classes, dict):
                value = str(df[name].iloc[0])
                if value not in classes:
                    known = list(classes.keys())[:20]
                    raise ValueError(
                        f"Unknown {name}='{value}'. Known examples: {known}"
                    )

        if not isinstance(self.dataset_parameters, dict):
            raise RuntimeError(
                "TFT checkpoint is missing dataset_parameters; cannot build inference dataset reliably."
            )

        predict_dataset = TimeSeriesDataSet.from_parameters(
            self.dataset_parameters,
            df,
            predict=True,
            stop_randomization=True,
        )

        dataloader = predict_dataset.to_dataloader(train=False, batch_size=1, num_workers=0)

        trainer_kwargs = self._predict_trainer_kwargs()

        # Prefer quantiles; fall back to prediction if older versions behave differently.
        try:
            raw_pred = self.model.predict(dataloader, mode="quantiles", trainer_kwargs=trainer_kwargs)
        except Exception:
            raw_pred = self.model.predict(dataloader, mode="prediction", trainer_kwargs=trainer_kwargs)

        pred_tensor = self._extract_prediction_tensor(raw_pred)

        if pred_tensor.dim() == 3 and pred_tensor.shape[-1] >= 3:
            q10 = pred_tensor[0, :, 0].detach().cpu().numpy().astype(float).tolist()
            q50 = pred_tensor[0, :, 1].detach().cpu().numpy().astype(float).tolist()
            q90 = pred_tensor[0, :, 2].detach().cpu().numpy().astype(float).tolist()
        elif pred_tensor.dim() == 2:
            q50 = pred_tensor[0, :].detach().cpu().numpy().astype(float).tolist()
            q10 = [None for _ in q50]
            q90 = [None for _ in q50]
        else:
            raise RuntimeError(f"Unexpected prediction tensor shape: {tuple(pred_tensor.shape)}")

        future_dates = (
            pd.to_datetime(df["date"]).dt.date.iloc[encoder_length : encoder_length + forecast_days].tolist()
        )
        date_strs = [d.isoformat() for d in future_dates]

        # Sanity: ensure no NaNs in outputs
        q50 = [0.0 if (x is None or (isinstance(x, float) and np.isnan(x))) else float(x) for x in q50]

        return TFTForecastResult(dates=date_strs, q10=q10, q50=q50, q90=q90)

    def _extract_prediction_tensor(self, predictions):
        torch = self._torch

        # Prediction object from pytorch-forecasting can wrap outputs.
        if hasattr(predictions, "output"):
            pred_output = predictions.output
        else:
            pred_output = predictions

        if isinstance(pred_output, dict):
            if "prediction" in pred_output:
                pred_tensor = pred_output["prediction"]
            else:
                pred_tensor = next(iter(pred_output.values()))
        else:
            pred_tensor = pred_output

        if not torch.is_tensor(pred_tensor):
            pred_tensor = torch.as_tensor(pred_tensor)
        return pred_tensor
