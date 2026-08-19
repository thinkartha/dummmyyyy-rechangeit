"""Load destination stubs (stdout / later S3, warehouse, Lambda)."""

from __future__ import annotations

import json


def load_rows(rows: list[dict[str, str]]) -> dict:
    print(json.dumps({"destination": "stdout", "rows": rows}, indent=2))
    return {"count": len(rows), "destination": "stdout"}
