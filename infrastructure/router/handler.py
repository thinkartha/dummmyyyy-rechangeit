"""Shared-domain router for the dev, QA, and production Loveheartbeat APIs.

The frontend sends an opaque HMAC-SHA256 token as `env`: query string for read/delete
requests, JSON field for writes. Tokens only choose an origin; authentication remains
the responsibility of the selected backend.
"""

from __future__ import annotations

import base64
import hmac
import json
import os
import urllib.error
import urllib.parse
import urllib.request
from typing import Any


_TOKENS = {
    "dev": os.getenv("DEV_ENV_TOKEN", ""),
    "qa": os.getenv("QA_ENV_TOKEN", ""),
    "prod": os.getenv("PROD_ENV_TOKEN", ""),
}
def _origin(name: str) -> str:
    value = os.getenv(name, "").strip()
    return "" if value == "UNCONFIGURED" else value


_ORIGINS = {
    "dev": _origin("DEV_API_ORIGIN"),
    "qa": _origin("QA_API_ORIGIN"),
    "prod": _origin("PROD_API_ORIGIN"),
}
_ALLOWED_ORIGINS = {
    value.strip().rstrip("/")
    for value in os.getenv(
        "ALLOWED_FRONTEND_ORIGINS",
        "https://dev.loveheartbeat.com,https://qa.loveheartbeat.com,https://loveheartbeat.com",
    ).split(",")
    if value.strip()
}
_BODY_METHODS = {"POST", "PUT", "PATCH"}
_HOP_HEADERS = {
    "connection", "content-length", "host", "keep-alive", "proxy-authenticate",
    "proxy-authorization", "te", "trailer", "transfer-encoding", "upgrade",
}


def _cors_headers(event: dict[str, Any]) -> dict[str, str]:
    origin = (event.get("headers") or {}).get("origin") or (event.get("headers") or {}).get("Origin")
    if origin and origin.rstrip("/") in _ALLOWED_ORIGINS:
        return {
            "Access-Control-Allow-Origin": origin.rstrip("/"),
            "Access-Control-Allow-Credentials": "true",
            "Vary": "Origin",
        }
    return {}


def _response(event: dict[str, Any], status: int, body: Any, headers: dict[str, str] | None = None) -> dict:
    response_headers = {"Content-Type": "application/json", **_cors_headers(event), **(headers or {})}
    text = body if isinstance(body, str) else json.dumps(body)
    return {"statusCode": status, "headers": response_headers, "body": text, "isBase64Encoded": False}


def _query_pairs(event: dict[str, Any]) -> list[tuple[str, str]]:
    multi = event.get("multiValueQueryStringParameters")
    if multi:
        return [(key, str(value)) for key, values in multi.items() for value in (values or [])]
    return [(key, str(value)) for key, value in (event.get("queryStringParameters") or {}).items()]


def _body_and_token(event: dict[str, Any], method: str) -> tuple[bytes | None, str | None, str | None]:
    raw = event.get("body")
    if raw is None:
        return None, None, "The env selector is required in the JSON payload"
    body = base64.b64decode(raw) if event.get("isBase64Encoded") else raw.encode("utf-8")
    content_type = next(
        (value for key, value in (event.get("headers") or {}).items() if key.lower() == "content-type"),
        "",
    )
    if "application/json" not in content_type.lower():
        return body, None, f"{method} requests must use a JSON payload containing env"
    try:
        payload = json.loads(body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return body, None, "Request body is not valid JSON"
    if not isinstance(payload, dict):
        return body, None, "Request body must be a JSON object containing env"
    token = payload.pop("env", None)
    return json.dumps(payload, separators=(",", ":")).encode(), str(token) if token else None, None


def _select_environment(token: str | None) -> str | None:
    if not token:
        return None
    return next(
        (stage for stage, expected in _TOKENS.items() if expected and hmac.compare_digest(token, expected)),
        None,
    )


def _target_url(origin: str, path: str, query: list[tuple[str, str]]) -> str:
    base = origin.rstrip("/")
    # Stack outputs include /api/v1. The public path includes it too; remove one copy.
    if base.endswith("/api/v1"):
        base = base[:-7]
    encoded_query = urllib.parse.urlencode(query, doseq=True)
    return f"{base}{path}{'?' + encoded_query if encoded_query else ''}"


def _forward(event: dict[str, Any], stage: str, body: bytes | None, query: list[tuple[str, str]]) -> dict:
    origin = _ORIGINS.get(stage, "").rstrip("/")
    if not origin:
        return _response(event, 503, {"detail": f"The {stage} backend is not configured"})
    if urllib.parse.urlsplit(origin).hostname == "app.loveheartbeat.com":
        return _response(event, 500, {"detail": "Router origin points back to the router"})

    method = event.get("httpMethod", "GET").upper()
    path = event.get("path") or "/"
    headers = {
        key: value for key, value in (event.get("headers") or {}).items()
        if key.lower() not in _HOP_HEADERS
        and key.lower() not in {"x-loveheartbeat-environment", "x-loveheartbeat-environment"}
    }
    headers["X-Loveheartbeat-Environment"] = stage
    request = urllib.request.Request(
        _target_url(origin, path, query), data=body, headers=headers, method=method,
    )
    try:
        upstream = urllib.request.urlopen(request, timeout=28)
        status = upstream.status
        response_body = upstream.read()
        response_headers = dict(upstream.headers.items())
    except urllib.error.HTTPError as exc:
        status = exc.code
        response_body = exc.read()
        response_headers = dict(exc.headers.items())
    except (urllib.error.URLError, TimeoutError) as exc:
        return _response(event, 502, {"detail": f"The {stage} backend is unavailable: {exc.reason if hasattr(exc, 'reason') else exc}"})

    safe_headers = {
        key: value for key, value in response_headers.items()
        if key.lower() not in _HOP_HEADERS
    }
    cors_headers = _cors_headers(event)
    for cors_name in cors_headers:
        safe_headers = {key: value for key, value in safe_headers.items() if key.lower() != cors_name.lower()}
    safe_headers.update(cors_headers)
    try:
        text = response_body.decode("utf-8")
        encoded = False
    except UnicodeDecodeError:
        text = base64.b64encode(response_body).decode("ascii")
        encoded = True
    return {"statusCode": status, "headers": safe_headers, "body": text, "isBase64Encoded": encoded}


def handler(event: dict[str, Any], _context: Any) -> dict:
    method = event.get("httpMethod", "GET").upper()
    path = event.get("path") or "/"
    if method == "OPTIONS":
        return _response(event, 204, "", {
            "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
            "Access-Control-Allow-Headers": "Authorization,Content-Type,Accept",
            "Access-Control-Max-Age": "600",
        })
    if method == "GET" and path in {"/health", "/router/health"}:
        configured = [stage for stage, origin in _ORIGINS.items() if origin]
        return _response(event, 200, {"status": "ok", "configured_environments": configured})

    query = _query_pairs(event)
    body: bytes | None = None
    error: str | None = None
    if method in _BODY_METHODS:
        body, token, error = _body_and_token(event, method)
    else:
        tokens = [value for key, value in query if key == "env"]
        token = tokens[-1] if tokens else None
        query = [(key, value) for key, value in query if key != "env"]
    if error:
        return _response(event, 400, {"detail": error})
    if not token:
        location = "JSON payload" if method in _BODY_METHODS else "query string"
        return _response(event, 400, {"detail": f"The env selector is required in the {location}"})
    stage = _select_environment(token)
    if stage is None:
        return _response(event, 403, {"detail": "Invalid env selector"})
    return _forward(event, stage, body, query)
