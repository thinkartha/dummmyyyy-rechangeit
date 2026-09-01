"""Durable, asynchronous AI-agent telemetry backed by the shared DynamoDB record table.

Agents POST logs, spans, and optional evaluation results to the Lambda API. Each record is
written through before the request is acknowledged, so a Lambda cold start or scale-to-
zero event cannot erase it. Dashboard rollups are intentionally computed on a later read;
the ingestion path does not need a long-running Phoenix or APISIX process.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from . import observability as obs
from . import record_store

LOG_STREAM = "agent-logs"
SPAN_STREAM = "agent-spans"
EVALUATION_STREAM = "agent-evaluations"
MAX_INGEST_RECORDS = 200


class InvalidTelemetry(ValueError):
    """The submitted telemetry payload is malformed or too large."""


def _moment(value: Any) -> datetime:
    if isinstance(value, (int, float)):
        # OpenTelemetry commonly sends epoch nanoseconds.
        return datetime.fromtimestamp(float(value) / 1_000_000_000, tz=timezone.utc)
    if value:
        try:
            parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
            return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
        except (ValueError, OSError):
            pass
    return datetime.now(timezone.utc)


def http_span(
    method: Any,
    path: Any,
    status_code: Any,
    duration_ms: Any,
    *,
    start_time: Any = None,
    span_id: str | None = None,
    attributes: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """One handled HTTP request as an OTel-shaped SERVER span.

    agents.route_stats() — what the API Monitoring page reads — groups on the
    `http.route` attribute and counts `http.response.status_code`. Two different things
    now produce that traffic: a customer's enrolled APISIX gateway, and this API
    instrumenting its own requests. They have to agree with the read path down to the
    attribute names, so the shape is defined once, here, next to the writer that stores
    it — not copied into each producer where the two copies can drift apart.

    `path` must be a route template (`/api/v1/orgs/{org_id}`), never a concrete path:
    the caller's ids are the grouping key otherwise and every request becomes its own
    single-hit "route".
    """
    method = str(method or "GET").strip().upper()
    path = str(path or "/").strip() or "/"
    route = f"{method} {path}"
    code = str(status_code or "").strip() or "200"
    try:
        duration = round(float(duration_ms), 3)
    except (TypeError, ValueError):
        duration = 0.0
    identity = str(span_id or "").strip() or uuid.uuid4().hex
    attrs: dict[str, Any] = {
        "http.route": route,
        "http.request.method": method,
        "http.response.status_code": code,
        **(attributes or {}),
    }
    return {
        # A retried delivery of the same request must not be counted twice; when the
        # caller has a stable request id it is the span id, and both DynamoDB and
        # _dedupe() collapse a repeat of it.
        "span_id": identity,
        "trace_id": identity,
        "name": route,
        "span_kind": "SERVER",
        "start_time": start_time or datetime.now(timezone.utc).isoformat(),
        "duration_ms": duration,
        # Only 5xx is the server's failure. A 4xx is the caller's mistake and marking it
        # ERROR here would make a healthy route read as down.
        "status_code": "ERROR" if code.startswith("5") else "OK",
        "attributes": {k: v for k, v in attrs.items() if v is not None},
    }


def _dedupe(rows: list[dict[str, Any]], key: str) -> list[dict[str, Any]]:
    # DynamoDB overwrites a retry with the same deterministic key. The local in-memory
    # fallback is append-only, so deduplicate here to give both modes the same contract.
    unique: dict[str, dict[str, Any]] = {}
    for row in rows:
        identity = str(row.get(key) or row.get("id") or uuid.uuid4())
        unique[identity] = row
    return list(unique.values())


def ingest(
    tenant_id: str,
    logs: list[dict[str, Any]],
    spans: list[dict[str, Any]],
    evaluations: list[dict[str, Any]],
) -> dict[str, Any]:
    total = len(logs) + len(spans) + len(evaluations)
    if total == 0:
        raise InvalidTelemetry("Provide at least one log, span, or evaluation")
    if total > MAX_INGEST_RECORDS:
        raise InvalidTelemetry(f"A single request may contain at most {MAX_INGEST_RECORDS} records")

    prepared_logs: list[tuple[dict[str, Any], str, datetime]] = []
    for raw in logs:
        if not isinstance(raw, dict):
            raise InvalidTelemetry("Every log must be a JSON object")
        row = dict(raw)
        log_id = str(row.get("id") or row.get("log_id") or uuid.uuid4().hex)
        row["id"] = log_id
        row["timestamp"] = row.get("timestamp") or datetime.now(timezone.utc).isoformat()
        prepared_logs.append((row, log_id, _moment(row["timestamp"])))

    prepared_spans: list[tuple[dict[str, Any], str, datetime]] = []
    for raw in spans:
        if not isinstance(raw, dict):
            raise InvalidTelemetry("Every span must be a JSON object")
        normalized = obs._normalize(raw)
        span_id = str(normalized.get("span_id") or uuid.uuid4().hex)
        normalized["span_id"] = span_id
        normalized["trace_id"] = str(normalized.get("trace_id") or span_id)
        normalized["start_time"] = normalized.get("start_time") or datetime.now(timezone.utc).isoformat()
        prepared_spans.append((normalized, span_id, _moment(normalized["start_time"])))

    prepared_evaluations: list[tuple[dict[str, Any], str, datetime]] = []
    for raw in evaluations:
        if not isinstance(raw, dict):
            raise InvalidTelemetry("Every evaluation must be a JSON object")
        row = dict(raw)
        evaluation_id = str(row.get("id") or row.get("annotation_id") or uuid.uuid4().hex)
        row["id"] = evaluation_id
        row["created_at"] = row.get("created_at") or datetime.now(timezone.utc).isoformat()
        prepared_evaluations.append((row, evaluation_id, _moment(row["created_at"])))

    # Validate/normalize the complete batch before making the first write. If a durable
    # write later fails the caller can retry safely when it supplies stable record IDs;
    # those IDs map to deterministic DynamoDB keys.
    for row, log_id, moment in prepared_logs:
        record_store.append(
            tenant_id,
            LOG_STREAM,
            row,
            moment,
            record_id=log_id,
            require_durable=True,
        )

    for normalized, span_id, moment in prepared_spans:
        record_store.append(
            tenant_id,
            SPAN_STREAM,
            normalized,
            moment,
            record_id=span_id,
            require_durable=True,
        )

    for row, evaluation_id, moment in prepared_evaluations:
        record_store.append(
            tenant_id,
            EVALUATION_STREAM,
            row,
            moment,
            record_id=evaluation_id,
            require_durable=True,
        )

    return {
        "accepted": total,
        "logs": len(logs),
        "spans": len(spans),
        "evaluations": len(evaluations),
        "storage": "dynamodb" if record_store.configured() else "memory",
        "processing": "on-read",
    }


def uses_store(tenant_id: str) -> bool:
    if record_store.configured():
        return True
    return bool(
        record_store.recent(tenant_id, SPAN_STREAM, 1)
        or record_store.recent(tenant_id, LOG_STREAM, 1)
        or record_store.recent(tenant_id, EVALUATION_STREAM, 1)
    )


def spans(tenant_id: str, limit: int = 5000) -> list[dict[str, Any]]:
    rows = record_store.window(tenant_id, SPAN_STREAM, limit=limit, require_durable=True)
    return _dedupe(rows, "span_id")


def logs(tenant_id: str, limit: int = 5000) -> list[dict[str, Any]]:
    rows = record_store.recent(tenant_id, LOG_STREAM, limit=limit, require_durable=True)
    return _dedupe(rows, "id")


def evaluations(tenant_id: str, limit: int = 5000) -> list[dict[str, Any]]:
    rows = record_store.window(tenant_id, EVALUATION_STREAM, limit=limit, require_durable=True)
    return _dedupe(rows, "id")


def status(tenant_id: str) -> dict[str, Any]:
    reachable, error = record_store.health()
    stored_logs: list[dict[str, Any]] = []
    stored_spans: list[dict[str, Any]] = []
    stored_evaluations: list[dict[str, Any]] = []
    if reachable:
        try:
            stored_logs = logs(tenant_id, 1)
            stored_spans = spans(tenant_id, 1)
            stored_evaluations = evaluations(tenant_id, 1)
        except record_store.StorageUnavailable as exc:
            reachable, error = False, str(exc)
    return {
        "mode": "dynamodb" if record_store.configured() else "memory",
        "durable": record_store.configured(),
        "configured": record_store.configured(),
        "reachable": reachable,
        "error": error,
        "processing": "on-read",
        "logs_available": bool(stored_logs),
        "spans_available": bool(stored_spans),
        "evaluations_available": bool(stored_evaluations),
    }
