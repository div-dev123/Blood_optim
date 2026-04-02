from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Optional


@dataclass(frozen=True)
class HospitalInfo:
    hospital_id: str
    hospital_name: str
    hospital_type: str
    bed_capacity: float


class HospitalMetadataService:
    def __init__(self, csv_path: Path) -> None:
        self.csv_path = csv_path
        self._by_id: dict[str, HospitalInfo] = {}
        self._load()

    def _load(self) -> None:
        if not self.csv_path.exists():
            return

        import pandas as pd

        df = pd.read_csv(self.csv_path)
        expected = {"hospital_id", "hospital_name", "hospital_type", "bed_capacity"}
        if not expected.issubset(set(df.columns)):
            return

        by_id: dict[str, HospitalInfo] = {}
        for _, row in df.iterrows():
            hospital_id = str(row["hospital_id"])
            by_id[hospital_id] = HospitalInfo(
                hospital_id=hospital_id,
                hospital_name=str(row["hospital_name"]),
                hospital_type=str(row["hospital_type"]),
                bed_capacity=float(row["bed_capacity"]),
            )
        self._by_id = by_id

    def get(self, hospital_id: str) -> Optional[HospitalInfo]:
        return self._by_id.get(str(hospital_id))
