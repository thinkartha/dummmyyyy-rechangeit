"""Example CRUD-style handler for API Gateway → Lambda."""

from __future__ import annotations

import json
from typing import Any

from shared.response import bad_request, ok, server_error


def handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    try:
        method = (event.get("httpMethod") or event.get("requestContext", {}).get("http", {}).get("method") or "GET").upper()
        path_params = event.get("pathParameters") or {}
        resource_id = path_params.get("id")

        if method == "OPTIONS":
            return ok()

        if method == "GET":
            if resource_id:
                return ok({"id": resource_id, "message": "Replace with real lookup"})
            return ok({"items": [], "message": "Replace with real list query"})

        if method == "POST":
            body = _parse_body(event)
            if body is None:
                return bad_request("Invalid JSON body")
            return ok({"created": True, "payload": body})

        return bad_request(f"Unsupported method: {method}")
    except Exception as exc:  # noqa: BLE001 — surface to API Gateway as 500
        return server_error(str(exc))


def _parse_body(event: dict[str, Any]) -> dict[str, Any] | None:
    raw = event.get("body")
    if raw is None:
        return {}
    if event.get("isBase64Encoded"):
        return None
    if isinstance(raw, dict):
        return raw
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        return None
    return parsed if isinstance(parsed, dict) else None
