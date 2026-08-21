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
# Tenant frontends live at https://<slug>.loveheartbeat.com. Set to "" to allow only the
# hosts named in ALLOWED_FRONTEND_ORIGINS.
_TENANT_ORIGIN_SUFFIX = os.getenv("TENANT_ORIGIN_SUFFIX", "loveheartbeat.com").strip().lstrip(".")
_BODY_METHODS = {"POST", "PUT", "PATCH"}
# Only used when a preflight arrives without Access-Control-Request-Headers, which a
# browser never omits — this is for curl and health probes.
_DEFAULT_ALLOW_HEADERS = "Authorization,Content-Type,Accept,X-Tenant-Slug"
_HOP_HEADERS = {
    "connection", "content-length", "host", "keep-alive", "proxy-authenticate",
    "proxy-authorization", "te", "trailer", "transfer-encoding", "upgrade",
}


def _header(event: dict[str, Any], name: str) -> str:
    """Header lookup that does not care about casing. API Gateway preserves whatever
    the client sent, so `Origin` and `origin` both turn up in the wild."""
    return next(
        (str(value) for key, value in (event.get("headers") or {}).items()
         if key.lower() == name.lower() and value),
        "",
    )


def _origin_allowed(origin: str) -> bool:
    """Every tenant browses from its own subdomain.

    The product hands each organization `<slug>.loveheartbeat.com`, so an allow-list of
    three fixed hosts rejects real customers the moment they use the URL they were given.
    Match the apex and any single-label subdomain of it, over https only — the check is
    on the suffix *after* a dot, so `evil-loveheartbeat.com` does not slip through."""
    if origin in _ALLOWED_ORIGINS:
        return True
    if not _TENANT_ORIGIN_SUFFIX:
        return False
    scheme, _, host = origin.partition("://")
    if scheme != "https" or not host.endswith(f".{_TENANT_ORIGIN_SUFFIX}"):
        return False
    label = host[: -(len(_TENANT_ORIGIN_SUFFIX) + 1)]
    return bool(label) and "." not in label


def _cors_headers(event: dict[str, Any]) -> dict[str, str]:
    origin = _header(event, "origin").rstrip("/")
    if origin and _origin_allowed(origin):
        return {
            "Access-Control-Allow-Origin": origin,
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
        # Echo back whatever the browser asked to send. The previous fixed list did not
        # include X-Tenant-Slug — which api-client.js sends on *every* request — so the
        # preflight failed and the frontend could not even reach the login route. A
        # hardcoded list goes stale the next time a header is added; this one cannot.
        # `*` is not an option: with Allow-Credentials it is read literally, not as a
        # wildcard.
        requested = _header(event, "access-control-request-headers")
        return _response(event, 204, "", {
            "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
            "Access-Control-Allow-Headers": requested or _DEFAULT_ALLOW_HEADERS,
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
