"""Drift: what gets sampled, what a pinned baseline compares against, and the
distinction between "not watching" and "all clear".

    python3 backend/shared/drift/test_collect.py
"""

import os
import sys
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))

from shared.core import record_store  # noqa: E402
from shared.core.agent_telemetry import SPAN_STREAM  # noqa: E402
from shared.drift import collect  # noqa: E402

# T0 is when the baseline gets pinned; NOW is a later window being judged against it.
# They have to be more than the 24h window apart, or the baseline samples are still
# inside the "current" window and every feature is compared against itself.
T0 = datetime(2026, 9, 1, 12, 0, tzinfo=timezone.utc)
NOW = datetime(2026, 9, 9, 12, 0, tzinfo=timezone.utc)


def _span(route, duration, code=200, moment=None, model=None):
    attributes = {"http.route": route, "http.response.status_code": code}
    if model:
        attributes["gen_ai.request.model"] = model
    return {"name": route, "status": "OK", "duration_ms": duration, "attributes": attributes}


def _reset(tenant="tenant-a"):
    for stream in (SPAN_STREAM, collect.BASELINE_STREAM, collect.OBSERVATION_STREAM):
        record_store.clear(tenant, stream)
    # The config half reaches into every connector's status route; the samples are what
    # these tests are about.
    collect._config_snapshot = lambda _t: {}


def _push(spans, tenant="tenant-a", moment=None):
    for span in spans:
        record_store.append(tenant, SPAN_STREAM, span, moment=moment or NOW - timedelta(hours=1))


def test_no_baseline_is_not_all_clear():
    _reset()
    _push([_span("GET /orders", 100) for _ in range(50)])
    report = collect.report("tenant-a", now=NOW)
    assert report.baseline_pinned is False
    assert report.numeric == [] and report.categorical == []
    assert report.any_drift is False


def test_a_latency_regression_is_detected():
    _reset()
    _push([_span("GET /orders", 100 + i % 5) for i in range(60)],
          moment=T0 - timedelta(hours=1))
    collect.pin_baseline("tenant-a", now=T0)
    # Same route, four times slower.
    _push([_span("GET /orders", 400 + i % 5) for i in range(60)], moment=NOW - timedelta(hours=2))
    report = collect.report("tenant-a", now=NOW)
    assert report.baseline_pinned is True
    latency = [n for n in report.numeric if n.feature == "GET /orders latency_ms"]
    assert latency and latency[0].drift is True
    assert latency[0].ks_statistic > latency[0].critical
    assert report.any_drift is True


def test_a_steady_route_is_reported_stable():
    _reset()
    _push([_span("GET /health", 50 + i % 3) for i in range(60)], moment=T0 - timedelta(hours=1))
    collect.pin_baseline("tenant-a", now=T0)
    _push([_span("GET /health", 50 + i % 3) for i in range(60)], moment=NOW - timedelta(hours=2))
    report = collect.report("tenant-a", now=NOW)
    steady = [n for n in report.numeric if n.feature == "GET /health latency_ms"]
    assert steady and steady[0].drift is False
    assert report.any_drift is False


def test_status_mix_shift_is_categorical_drift():
    _reset()
    _push([_span("GET /pay", 100, code=200) for _ in range(90)] +
          [_span("GET /pay", 100, code=500) for _ in range(2)],
          moment=T0 - timedelta(hours=1))
    collect.pin_baseline("tenant-a", now=T0)
    # Same traffic volume, a third of it now failing.
    _push([_span("GET /pay", 100, code=200) for _ in range(60)] +
          [_span("GET /pay", 100, code=500) for _ in range(30)],
          moment=NOW - timedelta(hours=2))
    report = collect.report("tenant-a", now=NOW)
    mix = [c for c in report.categorical if c.feature == "GET /pay status_mix"]
    assert mix and mix[0].drift is True


def test_pushed_features_split_numeric_from_categorical():
    _reset()
    # record_observations stamps "now", so the pushed-feature case is exercised with a
    # baseline pinned at real now and the drifted batch inside the same window; the
    # split by value type is what this test is about.
    for _ in range(20):
        collect.record_observations("tenant-a", {"credit_score": 700, "region": "eu-west"})
    collect.pin_baseline("tenant-a")
    for _ in range(20):
        collect.record_observations("tenant-a", {"credit_score": 480, "region": "eu-west"})
    report = collect.report("tenant-a")
    assert any(n.feature == "credit_score" and n.drift for n in report.numeric)
    assert any(c.feature == "region" for c in report.categorical)


def test_a_thin_sample_is_left_out_rather_than_called_stable():
    """KS on a handful of points has a critical value wide enough to hide anything."""
    _reset()
    _push([_span("GET /rare", 100) for _ in range(60)], moment=T0 - timedelta(hours=1))
    collect.pin_baseline("tenant-a", now=T0)
    _push([_span("GET /rare", 900) for _ in range(3)], moment=NOW - timedelta(hours=2))
    report = collect.report("tenant-a", now=NOW)
    assert [n for n in report.numeric if n.feature == "GET /rare latency_ms"] == []


def test_a_recent_regression_is_not_diluted_by_the_baseline_period():
    """The bug this guards: the 24h current window used to overlap the baseline period,
    so a feature was partly compared against its own baseline samples. A route that went
    from 1ms to 10s reported Stable (KS 0.273 against a 0.283 critical) because the
    healthy traffic still sitting in the window outnumbered the regression."""
    _reset()
    # Baseline and regression are deliberately inside the same 24h window.
    _push([_span("GET /slow", 1) for _ in range(40)], moment=NOW - timedelta(hours=6))
    collect.pin_baseline("tenant-a", now=NOW - timedelta(hours=5))
    _push([_span("GET /slow", 10000) for _ in range(15)], moment=NOW - timedelta(hours=1))
    report = collect.report("tenant-a", now=NOW)
    slow = [n for n in report.numeric if n.feature == "GET /slow latency_ms"]
    assert slow, "the feature dropped out of the comparison entirely"
    assert slow[0].drift is True, f"a 1ms->10s regression read as stable: {slow[0]}"


def test_config_change_is_drift_on_its_own():
    _reset()
    collect._config_snapshot = lambda _t: {"api-gateway.metrics_url": "http://old:9091/metrics"}
    _push([_span("GET /orders", 100) for _ in range(30)], moment=T0 - timedelta(hours=1))
    collect.pin_baseline("tenant-a", now=T0)
    collect._config_snapshot = lambda _t: {"api-gateway.metrics_url": "http://new:9091/metrics"}
    report = collect.report("tenant-a", now=NOW)
    assert report.config.changed == ["api-gateway.metrics_url"]
    assert report.config.baseline_hash != report.config.current_hash
    assert report.any_drift is True


def test_baselines_do_not_leak_between_tenants():
    _reset("tenant-a")
    _reset("tenant-b")
    _push([_span("GET /orders", 100) for _ in range(30)], tenant="tenant-a",
          moment=T0 - timedelta(hours=1))
    collect.pin_baseline("tenant-a", now=T0)
    assert collect.report("tenant-b", now=NOW).baseline_pinned is False
    assert collect.report("tenant-a", now=NOW).baseline_pinned is True


def test_rebaseline_replaces_what_is_compared_against():
    _reset()
    _push([_span("GET /orders", 100) for _ in range(60)], moment=T0 - timedelta(hours=1))
    collect.pin_baseline("tenant-a", now=T0)
    _push([_span("GET /orders", 400) for _ in range(60)], moment=NOW - timedelta(hours=2))
    assert collect.report("tenant-a", now=NOW).any_drift is True
    # Accepting the new normal must clear the finding: re-pin over the window that
    # contains the regression, then judge that same window against it.
    collect.pin_baseline("tenant-a", now=NOW)
    report = collect.report("tenant-a", now=NOW)
    assert all(not n.drift for n in report.numeric)


if __name__ == "__main__":
    for name, fn in sorted(globals().items()):
        if name.startswith("test_"):
            fn()
            print(f"ok  {name}")
    print("all green")
