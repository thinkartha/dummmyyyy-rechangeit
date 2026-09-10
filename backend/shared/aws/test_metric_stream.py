"""Metric Streams ingest: the decode, the fold, the key, and the Firehose contract.

The failures that would be silent here — a delivery accepted under an unknown key, a
retried delivery double-counting a metric, a datapoint stored under its arrival time
instead of its own, and a fold that averages an average.
"""

from __future__ import annotations

import base64
import json
from datetime import datetime, timedelta, timezone

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from handlers.routers import metrics as metrics_router
from shared.aws import metric_stream
from shared.core import record_store

TENANT = "t-metrics"


def _record(**over):
    base = {
        "metric_stream_name": "lhb", "account_id": "111122223333", "region": "us-east-1",
        "namespace": "AWS/EC2", "metric_name": "CPUUtilization",
        "dimensions": {"InstanceId": "i-abc"},
        "timestamp": 1_700_000_000_000, "unit": "Percent",
        "value": {"min": 1.0, "max": 9.0, "sum": 20.0, "count": 4.0},
    }
    base.update(over)
    return base


def _delivery(records, request_id="req-1"):
    data = base64.b64encode(
        "\n".join(json.dumps(r) for r in records).encode("utf-8")
    ).decode("ascii")
    return {"requestId": request_id, "timestamp": 1_700_000_000_000,
            "records": [{"data": data}]}


@pytest.fixture(autouse=True)
def clean():
    record_store.clear(TENANT, metric_stream.STREAM)
    yield
    record_store.clear(TENANT, metric_stream.STREAM)


@pytest.fixture
def client():
    app = FastAPI()
    app.include_router(metrics_router.ingest_router)
    return TestClient(app)


@pytest.fixture
def key():
    return metric_stream.ingest_key(TENANT)["key"]


def test_decode_reads_newline_delimited_json():
    out = metric_stream.decode(_delivery([_record(), _record(metric_name="NetworkIn")]))
    assert [r["metric_name"] for r in out] == ["CPUUtilization", "NetworkIn"]


def test_decode_skips_a_bad_line_and_keeps_the_rest():
    """Firehose retries the whole delivery on a non-200, so one bad line must not cost
    the good records on this attempt and every retry after it."""
    data = base64.b64encode(b'{"metric_name": "A", "namespace": "AWS/EC2", "timestamp": 1}\nnot json\n').decode()
    out = metric_stream.decode({"records": [{"data": data}]})
    assert len(out) == 1


def test_fold_combines_an_interval_rather_than_overwriting():
    rows = metric_stream.fold([
        _record(value={"min": 2.0, "max": 5.0, "sum": 10.0, "count": 2.0}),
        _record(value={"min": 1.0, "max": 9.0, "sum": 20.0, "count": 4.0}),
    ])
    assert len(rows) == 1, "same metric+dimensions+minute is one row"
    assert rows[0]["min"] == 1.0 and rows[0]["max"] == 9.0
    assert rows[0]["sum"] == 30.0 and rows[0]["count"] == 6.0
    # 30/6, not the mean of the two averages (5.0 and 5.0 would both give 5).
    assert rows[0]["avg"] == 5.0


def test_fold_separates_resources():
    rows = metric_stream.fold([
        _record(dimensions={"InstanceId": "i-a"}),
        _record(dimensions={"InstanceId": "i-b"}),
    ])
    assert len(rows) == 2


def test_dimension_identity_is_order_independent():
    a = metric_stream.fold([_record(dimensions={"A": "1", "B": "2"})])[0]
    b = metric_stream.fold([_record(dimensions={"B": "2", "A": "1"})])[0]
    assert a["dimension_id"] == b["dimension_id"]


def test_records_without_a_usable_timestamp_are_dropped():
    assert metric_stream.fold([_record(timestamp="nonsense")]) == []
    assert metric_stream.fold([_record(namespace=None)]) == []


def test_ingest_requires_a_known_key(key):
    with pytest.raises(metric_stream.InvalidKey):
        metric_stream.ingest(_delivery([_record()]), "lhbms_not-a-real-key")
    assert metric_stream.ingest(_delivery([_record()]), key)["stored"] == 1


def test_a_retried_delivery_does_not_double_count(key):
    metric_stream.ingest(_delivery([_record()]), key)
    metric_stream.ingest(_delivery([_record()]), key)
    stored = record_store.window(TENANT, metric_stream.STREAM,
                                 datetime.now(timezone.utc) - timedelta(days=365 * 10))
    assert len(stored) == 1, "the deterministic id should overwrite, not append"


def test_stored_rows_carry_the_datapoint_time_not_the_arrival_time(key):
    metric_stream.ingest(_delivery([_record()]), key)
    # The datapoint is from 2023; a window that starts after it must not return it.
    recent = record_store.window(TENANT, metric_stream.STREAM,
                                 datetime.now(timezone.utc) - timedelta(hours=1))
    assert recent == [], "row was stamped with arrival time, so old data looks live"
    old = record_store.window(TENANT, metric_stream.STREAM,
                              datetime.now(timezone.utc) - timedelta(days=365 * 10))
    assert len(old) == 1


def test_rotate_retires_the_previous_key():
    first = metric_stream.ingest_key(TENANT)["key"]
    second = metric_stream.rotate_key(TENANT)["key"]
    assert first != second
    assert metric_stream.tenant_for_key(second) == TENANT
    assert metric_stream.tenant_for_key(first) is None


def test_summary_and_catalog_describe_what_arrived(key):
    metric_stream.ingest(_delivery([
        _record(dimensions={"InstanceId": "i-a"}),
        _record(dimensions={"InstanceId": "i-b"}),
        _record(namespace="AWS/SQS", metric_name="ApproximateNumberOfMessagesVisible",
                dimensions={"QueueName": "orders"}),
    ]), key)
    since = datetime.now(timezone.utc) - timedelta(days=365 * 10)
    summary = metric_stream.summary(TENANT, since)
    services = {s["service"]: s for s in summary["services"]}
    assert services["EC2"]["resources"] == 2
    assert services["SQS"]["resources"] == 1
    assert summary["accounts"] == ["111122223333"]

    catalog = metric_stream.catalog(TENANT, since)
    assert {(c["service"], c["metric"]) for c in catalog} == {
        ("EC2", "CPUUtilization"), ("SQS", "ApproximateNumberOfMessagesVisible")}

    resources = metric_stream.resources(TENANT, since)
    assert {r["name"] for r in resources} == {"i-a", "i-b", "orders"}


def test_series_combines_resources_unless_one_is_named(key):
    metric_stream.ingest(_delivery([
        _record(dimensions={"InstanceId": "i-a"}, value={"min": 1, "max": 3, "sum": 4, "count": 2}),
        _record(dimensions={"InstanceId": "i-b"}, value={"min": 5, "max": 7, "sum": 12, "count": 2}),
    ]), key)
    since = datetime.now(timezone.utc) - timedelta(days=365 * 10)
    fleet = metric_stream.series(TENANT, "AWS/EC2", "CPUUtilization", since=since)
    assert len(fleet) == 1
    assert fleet[0]["value"] == 4.0, "(4+12)/(2+2)"
    assert fleet[0]["max"] == 7

    one = [r for r in metric_stream.resources(TENANT, since) if r["name"] == "i-a"][0]
    single = metric_stream.series(TENANT, "AWS/EC2", "CPUUtilization",
                                  since=since, dimension_id=one["id"])
    assert single[0]["value"] == 2.0, "(4)/(2)"


def test_firehose_contract(client, key):
    """The response must echo requestId; a bad key is 401 so Firehose stops retrying."""
    body = _delivery([_record()], request_id="req-42")
    ok = client.post("/api/v1/integrations/aws/metrics/stream", json=body,
                     headers={"X-Amz-Firehose-Access-Key": key,
                              "X-Amz-Firehose-Request-Id": "req-42"})
    assert ok.status_code == 200
    assert ok.json()["requestId"] == "req-42"
    assert "timestamp" in ok.json()

    denied = client.post("/api/v1/integrations/aws/metrics/stream", json=body,
                         headers={"X-Amz-Firehose-Access-Key": "nope",
                                  "X-Amz-Firehose-Request-Id": "req-42"})
    assert denied.status_code == 401
    assert denied.json()["requestId"] == "req-42"
    assert denied.json()["errorMessage"]


def test_ingest_endpoint_takes_no_session(client, key):
    """The whole point: Firehose has no bearer token and must still be accepted."""
    response = client.post("/api/v1/integrations/aws/metrics/stream",
                           json=_delivery([_record()]),
                           headers={"X-Amz-Firehose-Access-Key": key})
    assert response.status_code == 200


def test_series_by_resource_ranks_by_peak_and_folds_the_tail(key):
    """A chart that silently omits half the fleet is worse than one that says how much
    it is showing — and the fold has to re-aggregate, not average the lines."""
    metric_stream.ingest(_delivery([
        _record(dimensions={"InstanceId": f"i-{n}"},
                value={"min": n, "max": n * 10, "sum": n * 10, "count": 10.0})
        for n in range(1, 8)
    ]), key)
    since = datetime.now(timezone.utc) - timedelta(days=365 * 10)
    out = metric_stream.series_by_resource(TENANT, "AWS/EC2", "CPUUtilization",
                                           since=since, cap=3)
    names = [s["name"] for s in out["series"]]
    # Peak is max = n*10, so i-7 leads and the four smallest fold.
    assert names[:3] == ["i-7", "i-6", "i-5"]
    assert names[3] == "Other (4)"
    assert out["folded"] == 4
    # Other = (1+2+3+4)*10 summed over count 40 -> 2.5, not the mean of four averages.
    assert out["series"][3]["points"][0]["value"] == 2.5


def test_series_by_resource_is_empty_when_nothing_matches(key):
    since = datetime.now(timezone.utc) - timedelta(days=365 * 10)
    out = metric_stream.series_by_resource(TENANT, "AWS/NOPE", "Nothing", since=since)
    assert out["series"] == [] and out["folded"] == 0


def test_account_filter_narrows_every_reader(key):
    metric_stream.ingest(_delivery([
        _record(account_id="111111111111", dimensions={"InstanceId": "i-a"}),
        _record(account_id="222222222222", dimensions={"InstanceId": "i-b"}),
    ]), key)
    since = datetime.now(timezone.utc) - timedelta(days=365 * 10)
    assert len(metric_stream.read(TENANT, since)) == 2
    assert len(metric_stream.read(TENANT, since, account="111111111111")) == 1
    assert metric_stream.summary(TENANT, since, account="222222222222")["accounts"] == ["222222222222"]
    assert [r["name"] for r in metric_stream.resources(TENANT, since, account="111111111111")] == ["i-a"]
    scoped = metric_stream.series_by_resource(TENANT, "AWS/EC2", "CPUUtilization",
                                              since=since, account="222222222222")
    assert [s["name"] for s in scoped["series"]] == ["i-b"]
