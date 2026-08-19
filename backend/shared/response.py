"""API Gateway–compatible Lambda responses."""

from __future__ import annotations

import json
from typing import Any


def api_response(
    status_code: int,
    body: Any,
    *,
    headers: dict[str, str] | None = None,
) -> dict[str, Any]:
    default_headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    }
    if headers:
        default_headers.update(headers)

    return {
        "statusCode": status_code,
        "headers": default_headers,
        "body": body if isinstance(body, str) else json.dumps(body),
    }


def ok(body: Any = None) -> dict[str, Any]:
    return api_response(200, body if body is not None else {"ok": True})


def created(body: Any) -> dict[str, Any]:
    return api_response(201, body)


def bad_request(message: str, **extra: Any) -> dict[str, Any]:
    return api_response(400, {"error": message, **extra})


def not_found(message: str = "Not found") -> dict[str, Any]:
    return api_response(404, {"error": message})


def server_error(message: str = "Internal server error") -> dict[str, Any]:
    return api_response(500, {"error": message})
