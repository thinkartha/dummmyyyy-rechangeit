"""Read rows from a local CSV (stand-in for S3/API sources)."""

from __future__ import annotations

import csv
from pathlib import Path


def extract_rows(path: str | Path) -> list[dict[str, str]]:
    csv_path = Path(path)
    if not csv_path.exists():
        # Fallback sample so the pipeline runs without extra setup
        return [
            {"id": "1", "name": " Alpha ", "status": "active"},
            {"id": "2", "name": "Beta", "status": "INACTIVE"},
            {"id": "3", "name": " gamma", "status": "active"},
        ]

    with csv_path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))
