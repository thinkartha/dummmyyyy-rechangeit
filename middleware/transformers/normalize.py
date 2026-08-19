"""Normalize row fields for downstream loads."""

from __future__ import annotations


def transform_rows(rows: list[dict[str, str]]) -> list[dict[str, str]]:
    cleaned: list[dict[str, str]] = []
    for row in rows:
        cleaned.append(
            {
                "id": row.get("id", "").strip(),
                "name": row.get("name", "").strip().title(),
                "status": row.get("status", "").strip().lower(),
            }
        )
    return cleaned
