"""OTLP/HTTP JSON -> the flat dicts shared/elk/indexer.py indexes.

This is the OpenTelemetry onboarding path: a tenant already running an OTel Collector
(or an SDK's OTLP/HTTP exporter) points it at /api/v1/otlp/v1/{traces,metrics,logs}
with an X-API-Key header and their telemetry lands in the same Elasticsearch indices
the native /logs/ingest, /metrics/ingest and /traces/ingest routes write to — so the
Logs, Traces and monitoring pages work with no per-tenant code.

ponytail: JSON encoding only (`encoding: json` on the collector's otlphttp exporter),
no protobuf. Adding protobuf means a build-time dependency on the generated OTLP stubs;
do it when a customer cannot set that one line.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

# OTLP severityNumber ranges -> the level strings the logs index uses.
_SEVERITY = ((1, "TRACE"), (5, "DEBUG"), (9, "INFO"), (13, "WARN"), (17, "ERROR"), (21, "FATAL"))
_SPAN_KINDS = {0: "UNSPECIFIED", 1: "INTERNAL", 2: "SERVER", 3: "CLIENT", 4: "PRODUCER", 5: "CONSUMER"}
_STATUS_CODES = {0: "UNSET", 1: "OK", 2: "ERROR"}


def _any_value(value: Any) -> Any:
    """One OTLP AnyValue -> a plain Python value."""
    if not isinstance(value, dict):
        return value
    for key in ("stringValue", "boolValue", "doubleValue"):
        if key in value:
            return value[key]
    if "intValue" in value:  # JSON encodes 64-bit ints as strings
        try:
            return int(value["intValue"])
        except (TypeError, ValueError):
            return value["intValue"]
    if "arrayValue" in value:
        return [_any_value(v) for v in (value["arrayValue"] or {}).get("values", [])]
    if "kvlistValue" in value:
        return _attributes((value["kvlistValue"] or {}).get("values", []))
    if "bytesValue" in value:
        return value["bytesValue"]
    return None


def _attributes(attrs: list[dict] | None) -> dict[str, Any]:
    return {a["key"]: _any_value(a.get("value")) for a in (attrs or []) if a.get("key")}


def _time(nanos: Any) -> datetime:
    try:
        return datetime.fromtimestamp(int(nanos) / 1e9, tz=timezone.utc).replace(tzinfo=None)
    except (TypeError, ValueError):
        return datetime.utcnow()


def _severity_text(record: dict) -> str:
    text = record.get("severityText")
    if text:
        return str(text).upper()
    number = record.get("severityNumber") or 0
    level = "INFO"
    for floor, name in _SEVERITY:
        if number >= floor:
            level = name
    return level if number else "INFO"


def _resource(entry: dict) -> tuple[str, str, dict[str, Any]]:
    """(service, environment, remaining resource attributes) for one resource block."""
    attrs = _attributes((entry.get("resource") or {}).get("attributes"))
    service = str(attrs.pop("service.name", "unknown"))
    environment = str(attrs.pop("deployment.environment.name", None)
                      or attrs.pop("deployment.environment", None) or "production")
    return service, environment, attrs


def _scopes(entry: dict, scope_key: str, item_key: str):
    for scope in entry.get(scope_key) or []:
        for item in scope.get(item_key) or []:
            yield item


def traces(payload: dict) -> list[dict[str, Any]]:
    """OTLP ExportTraceServiceRequest -> span docs (TracesIndexer.bulk_index_spans)."""
    docs = []
    for entry in payload.get("resourceSpans") or []:
        service, environment, resource_attrs = _resource(entry)
        for span in _scopes(entry, "scopeSpans", "spans"):
            status = span.get("status") or {}
            code = _STATUS_CODES.get(status.get("code", 0), "UNSET")
            start, end = _time(span.get("startTimeUnixNano")), _time(span.get("endTimeUnixNano"))
            docs.append({
                "timestamp": start,
                "trace_id": span.get("traceId", ""),
                "span_id": span.get("spanId", ""),
                "parent_span_id": span.get("parentSpanId") or None,
                "operation_name": span.get("name", ""),
                "service": service,
                "environment": environment,
                "status": code,
                "duration_ms": (end - start).total_seconds() * 1000,
                "start_time": start,
                "end_time": end,
                "error": code == "ERROR",
                "error_message": status.get("message"),
                "attributes": {**resource_attrs,
                               "span.kind": _SPAN_KINDS.get(span.get("kind", 0), "INTERNAL"),
                               **_attributes(span.get("attributes"))},
                "events": span.get("events") or [],
            })
    return docs


def logs(payload: dict) -> list[dict[str, Any]]:
    """OTLP ExportLogsServiceRequest -> log docs (LogIndexer.bulk_index_logs)."""
    docs = []
    for entry in payload.get("resourceLogs") or []:
        service, environment, resource_attrs = _resource(entry)
        for record in _scopes(entry, "scopeLogs", "logRecords"):
            body = _any_value(record.get("body"))
            docs.append({
                "timestamp": _time(record.get("timeUnixNano") or record.get("observedTimeUnixNano")),
                "message": body if isinstance(body, str) else str(body if body is not None else ""),
                "level": _severity_text(record),
                "service": service,
                "environment": environment,
                "trace_id": record.get("traceId") or None,
                "span_id": record.get("spanId") or None,
                "attributes": {**resource_attrs, **_attributes(record.get("attributes"))},
            })
    return docs


def _points(metric: dict):
    """(data points, whether the metric is a histogram) across the OTLP metric types."""
    for kind in ("gauge", "sum", "histogram", "exponentialHistogram", "summary"):
        block = metric.get(kind)
        if block:
            return block.get("dataPoints") or [], kind in ("histogram", "exponentialHistogram")
    return [], False


def metrics(payload: dict) -> list[dict[str, Any]]:
    """OTLP ExportMetricsServiceRequest -> metric docs (MetricsIndexer.bulk_index_metrics).

    ponytail: histograms are flattened to their mean (sum/count) — the metrics index
    stores one scalar per point. Store the buckets when somebody needs percentiles.
    """
    docs = []
    for entry in payload.get("resourceMetrics") or []:
        service, environment, resource_attrs = _resource(entry)
        for metric in _scopes(entry, "scopeMetrics", "metrics"):
            points, is_histogram = _points(metric)
            for point in points:
                if is_histogram:
                    count = point.get("count") or 0
                    try:
                        count = int(count)
                    except (TypeError, ValueError):
                        count = 0
                    if not count:
                        continue
                    value = float(point.get("sum") or 0) / count
                elif "asDouble" in point or "asInt" in point:
                    value = float(point.get("asDouble", point.get("asInt", 0)) or 0)
                elif "sum" in point:  # summary
                    value = float(point.get("sum") or 0)
                else:
                    continue
                docs.append({
                    "timestamp": _time(point.get("timeUnixNano") or point.get("startTimeUnixNano")),
                    "metric_name": metric.get("name", ""),
                    "value": value,
                    "unit": metric.get("unit", "") or "",
                    "service": service,
                    "environment": environment,
                    "attributes": {**resource_attrs, **_attributes(point.get("attributes"))},
                })
    return docs
