"""The scheduled connector sweep, and the dispatch that routes EventBridge to it."""

from __future__ import annotations

import handlers.scheduled as scheduled


class _Context:
    def __init__(self, ms: int = 300_000) -> None:
        self.ms = ms

    def get_remaining_time_in_millis(self) -> int:
        return self.ms


def _tasks(calls, failing=()):
    def make(platform):
        def poll(tenant_id):
            calls.append((platform, tenant_id))
            if platform in failing:
                raise RuntimeError(f"{platform} credential expired")
            return 2
        return poll
    return {p: make(p) for p in ("talend", "boomi", "databricks")}


def test_sweep_polls_every_platform_for_every_tenant(monkeypatch):
    calls = []
    monkeypatch.setattr(scheduled, "_tenants", lambda: ["t1", "t2"])
    monkeypatch.setattr(scheduled, "_tasks", lambda: _tasks(calls))
    out = scheduled.run(_Context())
    assert len(calls) == 6
    assert out["ingested"] == {"talend": 4, "boomi": 4, "databricks": 4}
    assert out["errors"] == {}


def test_one_broken_tenant_does_not_stop_the_others(monkeypatch):
    calls = []
    monkeypatch.setattr(scheduled, "_tenants", lambda: ["t1", "t2"])
    monkeypatch.setattr(scheduled, "_tasks", lambda: _tasks(calls, failing={"boomi"}))
    out = scheduled.run(_Context())
    # Boomi failed for both tenants; the other two still ran for both.
    assert out["ingested"] == {"talend": 4, "databricks": 4}
    assert set(out["errors"]) == {"t1:boomi", "t2:boomi"}


def test_sweep_stops_before_the_lambda_times_out(monkeypatch):
    calls = []
    monkeypatch.setattr(scheduled, "_tenants", lambda: ["t1", "t2"])
    monkeypatch.setattr(scheduled, "_tasks", lambda: _tasks(calls))
    out = scheduled.run(_Context(ms=1_000))
    assert out["stopped_early"] is True
    assert calls == []


def test_no_tenants_is_not_an_error(monkeypatch):
    monkeypatch.setattr(scheduled, "_tenants", lambda: [])
    assert scheduled.run(_Context())["tenants"] == 0


def test_disable_switch(monkeypatch):
    monkeypatch.setenv("DISABLE_SCHEDULED_SWEEP", "1")
    assert scheduled.handler({"source": "aws.events"}, _Context()) == {"skipped": True}


def test_only_an_eventbridge_envelope_triggers_the_sweep(monkeypatch):
    """A malformed HTTP event must reach Mangum and fail as a bad request, not quietly
    poll every tenant in the deployment."""
    import handlers.lambda_handler as lh

    routed = []
    monkeypatch.setattr(lh, "_http_handler", lambda e, c: routed.append("http") or "http")
    monkeypatch.setattr(scheduled, "handler", lambda e, c: routed.append("sweep") or "sweep")

    assert lh.handler({"source": "aws.events", "detail-type": "Scheduled Event"}, None) == "sweep"
    assert lh.handler({"requestContext": {}, "httpMethod": "GET"}, None) == "http"
    assert lh.handler({}, None) == "http"
    assert routed == ["sweep", "http", "http"]
