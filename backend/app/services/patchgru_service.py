from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
from pathlib import Path
from typing import Optional, Sequence

import torch
from torch import nn


@dataclass(frozen=True)
class PatchGRUForecastResult:
    demand_forecast_14d: list[float]
    days_until_expiry_14d: list[float]


class VarianceSeparator(nn.Module):
    """Feature re-weighting module.

    The checkpoint contains two learnable vectors (variant/invariant). We apply a stable
    sigmoid-based scaling to keep factors positive.
    """

    def __init__(self, num_features: int):
        super().__init__()
        self.variant_weight = nn.Parameter(torch.zeros(num_features))
        self.invariant_weight = nn.Parameter(torch.zeros(num_features))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        scale = torch.sigmoid(self.variant_weight) + torch.sigmoid(self.invariant_weight)
        return x * scale


class PatchEncoder(nn.Module):
    def __init__(self, input_size: int, hidden_size: int, num_layers: int):
        super().__init__()
        self.gru = nn.GRU(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        _, h_n = self.gru(x)
        return h_n[-1]


def _build_decoder(input_dim: int, hidden1: int, hidden2: int, out_dim: int):
    return nn.Sequential(
        nn.Linear(input_dim, hidden1),
        nn.ReLU(),
        nn.Dropout(p=0.1),
        nn.Linear(hidden1, hidden2),
        nn.ReLU(),
        nn.Linear(hidden2, out_dim),
    )


class PatchGRUModel(nn.Module):
    def __init__(
        self,
        *,
        input_size: int,
        patch_hidden: int,
        patch_layers: int,
        agg_input_size: int,
        agg_hidden: int,
        static_dim: int,
        static_emb_dim: int,
        decoder_in_dim: int,
        forecast_days: int,
    ) -> None:
        super().__init__()

        self.variance_separator = VarianceSeparator(num_features=input_size)
        self.patch_encoder = PatchEncoder(input_size=input_size, hidden_size=patch_hidden, num_layers=patch_layers)
        self.patch_aggregator = nn.GRU(
            input_size=agg_input_size,
            hidden_size=agg_hidden,
            num_layers=1,
            batch_first=True,
        )

        self.static_embedding = nn.Linear(static_dim, static_emb_dim)
        self.demand_decoder = _build_decoder(decoder_in_dim, 128, 64, forecast_days)
        self.expiry_decoder = _build_decoder(decoder_in_dim, 128, 64, forecast_days)

    def forward(self, x_seq: torch.Tensor, static_vec: torch.Tensor, patch_size: int, num_patches: int):
        # x_seq: (B, lookback, input_size)
        x_seq = self.variance_separator(x_seq)

        b, lookback, feat = x_seq.shape
        expected = patch_size * num_patches
        if lookback != expected:
            raise ValueError(f"Expected lookback={expected} (=patch_size*num_patches); got {lookback}")

        patches = x_seq.reshape(b * num_patches, patch_size, feat)
        patch_emb = self.patch_encoder(patches)  # (B*num_patches, patch_hidden)
        patch_embs = patch_emb.reshape(b, num_patches, -1)  # (B, num_patches, patch_hidden)

        _, h_n = self.patch_aggregator(patch_embs)
        agg = h_n[-1]  # (B, agg_hidden)

        static_emb = torch.relu(self.static_embedding(static_vec))
        combined = torch.cat([agg, static_emb], dim=-1)

        demand = self.demand_decoder(combined)
        expiry = self.expiry_decoder(combined)
        return demand, expiry


class PatchGRUService:
    def __init__(self, model_path: Path, device: str = "cpu") -> None:
        self.model_path = model_path
        self.device_str = device

        if not self.model_path.exists():
            raise FileNotFoundError(f"PatchGRU checkpoint not found: {self.model_path}")

        self._torch = torch
        self.device = self._resolve_device(device)
        self.checkpoint = self._load_checkpoint()

        self.config = self.checkpoint.get("config") or {}
        self.patch_size = int(self.config.get("patch_size", 7))
        self.lookback_days = int(self.config.get("lookback_days", 28))
        self.forecast_days = int(self.config.get("forecast_days", 14))
        self.num_patches = int(self.config.get("num_patches", 4))

        self.model = self._build_model_from_state(self.checkpoint["model_state_dict"]).to(self.device).eval()

    def _resolve_device(self, device: str):
        torch = self._torch
        if device.startswith("cuda") and torch.cuda.is_available():
            return torch.device(device)
        return torch.device("cpu")

    def _load_checkpoint(self) -> dict:
        torch = self._torch
        # Ensure we can load pickled dicts
        return torch.load(self.model_path, map_location="cpu", weights_only=False)

    def _build_model_from_state(self, state: dict) -> PatchGRUModel:
        # Infer dimensions directly from the checkpoint tensors
        input_size = int(state["patch_encoder.gru.weight_ih_l0"].shape[1])
        patch_hidden = int(state["patch_encoder.gru.weight_hh_l0"].shape[1])
        patch_layers = 2  # inferred from l0+l1

        agg_input = int(state["patch_aggregator.weight_ih_l0"].shape[1])
        agg_hidden = int(state["patch_aggregator.weight_hh_l0"].shape[1])

        static_dim = int(state["static_embedding.weight"].shape[1])
        static_emb_dim = int(state["static_embedding.weight"].shape[0])

        decoder_in = int(state["demand_decoder.0.weight"].shape[1])
        forecast_days = int(state["demand_decoder.5.weight"].shape[0])

        model = PatchGRUModel(
            input_size=input_size,
            patch_hidden=patch_hidden,
            patch_layers=patch_layers,
            agg_input_size=agg_input,
            agg_hidden=agg_hidden,
            static_dim=static_dim,
            static_emb_dim=static_emb_dim,
            decoder_in_dim=decoder_in,
            forecast_days=forecast_days,
        )
        model.load_state_dict(state, strict=True)
        return model

    def _parse_end_date(self, end_date: Optional[str]) -> date:
        if not end_date:
            return date.today()
        try:
            return date.fromisoformat(end_date)
        except ValueError as exc:
            raise ValueError("end_date must be ISO format YYYY-MM-DD") from exc

    def _encode_static(self, hospital_id: str, blood_group: str) -> tuple[float, float]:
        # Deterministic encodings. If your training used different encodings,
        # send hospital_id_encoded/blood_group_encoded in the request.
        hospital_ids = [f"H{n:03d}" for n in range(1, 26)]
        blood_groups = ["A+", "A-", "AB+", "AB-", "B+", "B-", "O+", "O-"]

        try:
            hid = float(hospital_ids.index(str(hospital_id)))
        except ValueError:
            hid = 0.0
        try:
            bg = float(blood_groups.index(str(blood_group)))
        except ValueError:
            bg = 0.0
        return hid, bg

    def forecast(
        self,
        *,
        hospital_id: str,
        blood_group: str,
        historical_demand: Sequence[float],
        end_date: Optional[str] = None,
        hospital_id_encoded: Optional[int] = None,
        blood_group_encoded: Optional[int] = None,
        is_holiday_lookback: Optional[Sequence[bool]] = None,
    ) -> PatchGRUForecastResult:
        import numpy as np

        if len(historical_demand) < self.lookback_days:
            raise ValueError(
                f"historical_demand must have at least {self.lookback_days} values; got {len(historical_demand)}"
            )

        if is_holiday_lookback is not None and len(is_holiday_lookback) != self.lookback_days:
            raise ValueError("is_holiday_lookback length must equal lookback_days (28)")

        end_dt = self._parse_end_date(end_date)
        start_dt = end_dt - timedelta(days=self.lookback_days - 1)

        demand_hist = list(map(float, historical_demand[-self.lookback_days :]))

        # Build dynamic features per day
        x_rows = []
        for i in range(self.lookback_days):
            d = start_dt + timedelta(days=i)
            day_of_week = d.weekday()
            month = d.month
            weekend = 1 if day_of_week >= 5 else 0
            holiday = 1 if (is_holiday_lookback[i] if is_holiday_lookback is not None else False) else 0
            week_of_year = int(d.isocalendar()[1])

            x_rows.append(
                [
                    float(demand_hist[i]),
                    float(day_of_week),
                    float(month),
                    float(weekend),
                    float(holiday),
                    float(week_of_year),
                ]
            )

        x = self._torch.tensor([x_rows], dtype=self._torch.float32, device=self.device)

        if hospital_id_encoded is None or blood_group_encoded is None:
            hid, bg = self._encode_static(hospital_id, blood_group)
        else:
            hid, bg = float(hospital_id_encoded), float(blood_group_encoded)
        static_vec = self._torch.tensor([[hid, bg]], dtype=self._torch.float32, device=self.device)

        with self._torch.no_grad():
            demand_pred, expiry_pred = self.model(
                x,
                static_vec,
                patch_size=self.patch_size,
                num_patches=self.num_patches,
            )

        demand_list = demand_pred.detach().cpu().numpy().astype(float).reshape(-1).tolist()
        expiry_list = expiry_pred.detach().cpu().numpy().astype(float).reshape(-1).tolist()

        demand_list = [0.0 if (np.isnan(v) or np.isinf(v)) else float(v) for v in demand_list]
        expiry_list = [0.0 if (np.isnan(v) or np.isinf(v)) else float(v) for v in expiry_list]

        return PatchGRUForecastResult(demand_forecast_14d=demand_list, days_until_expiry_14d=expiry_list)

