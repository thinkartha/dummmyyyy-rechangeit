"""Minimal extract → transform → load example.

Run locally:
  cd middleware && PYTHONPATH=. python -m pipelines.example_pipeline
"""

from __future__ import annotations

from extractors.csv_source import extract_rows
from loaders.stdout_sink import load_rows
from transformers.normalize import transform_rows


def run(source_path: str = "sample_data/input.csv") -> dict:
    raw = extract_rows(source_path)
    clean = transform_rows(raw)
    result = load_rows(clean)
    return {"extracted": len(raw), "loaded": result["count"], "rows": clean}


if __name__ == "__main__":
    print(run())
