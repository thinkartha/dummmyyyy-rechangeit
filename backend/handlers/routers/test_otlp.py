"""OTLP JSON -> index-doc conversion (shared/elk/otlp.py), and the ingest routes.

    python3 -m pytest backend/handlers/routers/test_otlp.py -q
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))

from fastapi.testclient import TestClient  # noqa: E402

from shared.elk import otlp  # noqa: E402

RESOURCE = {"attributes": [
    {"key": "service.name", "value": {"stringValue": "checkout"}},
    {"key": "deployment.environment", "value": {"stringValue": "staging"}},
    {"key": "host.name", "value": {"stringValue": "box-1"}},
]}


def test_traces():
    docs = otlp.traces({"resourceSpans": [{"resource": RESOURCE, "scopeSpans": [{"spans": [{
        "traceId": "abc", "spanId": "def", "name": "GET /pay", "kind": 2,
        "startTimeUnixNano": "1700000000000000000", "endTimeUnixNano": "1700000000250000000",
        "status": {"code": 2, "message": "boom"},
        "attributes": [{"key": "http.status_code", "value": {"intValue": "500"}}],
    }]}]}]})
    assert len(docs) == 1
    doc = docs[0]
    assert doc["service"] == "checkout" and doc["environment"] == "staging"
    assert doc["status"] == "ERROR" and doc["error"] is True
    assert doc["duration_ms"] == 250
    assert doc["attributes"]["http.status_code"] == 500
    assert doc["attributes"]["span.kind"] == "SERVER"
    assert doc["attributes"]["host.name"] == "box-1"


def test_logs_severity_and_body():
    docs = otlp.logs({"resourceLogs": [{"resource": RESOURCE, "scopeLogs": [{"logRecords": [
        {"body": {"stringValue": "hi"}, "severityNumber": 17, "timeUnixNano": "1700000000000000000"},
        {"body": {"stringValue": "yo"}, "severityText": "warn"},
    ]}]}]})
    assert [d["level"] for d in docs] == ["ERROR", "WARN"]
    assert [d["message"] for d in docs] == ["hi", "yo"]


def test_metrics_gauge_sum_and_histogram():
    docs = otlp.metrics({"resourceMetrics": [{"resource": RESOURCE, "scopeMetrics": [{"metrics": [
        {"name": "cpu", "unit": "1", "gauge": {"dataPoints": [{"asDouble": 0.5, "timeUnixNano": "1"}]}},
        {"name": "reqs", "sum": {"dataPoints": [{"asInt": "7", "timeUnixNano": "1"}]}},
        {"name": "lat", "histogram": {"dataPoints": [{"sum": 100, "count": "4", "timeUnixNano": "1"}]}},
        {"name": "empty", "histogram": {"dataPoints": [{"sum": 0, "count": 0}]}},
    ]}]}]})
    assert [(d["metric_name"], d["value"]) for d in docs] == [("cpu", 0.5), ("reqs", 7.0), ("lat", 25.0)]


def test_empty_payload_is_not_an_error():
    assert otlp.traces({}) == [] and otlp.logs({}) == [] and otlp.metrics({"resourceMetrics": []}) == []


def _client():
    from handlers.api import app

    return TestClient(app)


def test_empty_export_is_accepted_without_elasticsearch():
    """A collector with nothing to send must not get an error — and an empty export
    never reaches the indexer, so this holds with no cluster configured."""
    client = _client()
    for path, key in (("traces", "resourceSpans"), ("metrics", "resourceMetrics"), ("logs", "resourceLogs")):
        r = client.post(f"/api/v1/otlp/v1/{path}", json={key: []},
                        headers={"X-API-Key": "dev-admin-key", "X-Tenant-Id": "acme-test"})
        assert r.status_code == 200, (path, r.text)
        assert r.json() == {"partialSuccess": {}}


def test_status_reports_the_endpoint_to_configure():
    body = _client().get("/api/v1/otlp/status",
                         headers={"X-API-Key": "dev-admin-key", "X-Tenant-Id": "acme-test"}).json()
    assert body["endpoint"].endswith("/api/v1/otlp")
    assert body["connected"] is False and set(body["signals"]) == {"traces", "metrics", "logs"}


def test_garbage_body_is_a_400():
    r = _client().post("/api/v1/otlp/v1/traces", content=b"not json",
                       headers={"X-API-Key": "dev-admin-key", "X-Tenant-Id": "acme-test",
                                "content-type": "application/json"})
    assert r.status_code == 400
