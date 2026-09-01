"""Nobody sees numbers that aren't theirs.

Three leaks, one theme — a page that had nothing to show showed something anyway:

  * a tenant with no stored telemetry read the shared Phoenix project, so API
    Monitoring and Traces listed routes belonging to whoever had pushed spans last;
  * an AWS account whose credentials AWS refused fell back to three invented Lambda
    functions, so "connected" and "connected and broken" rendered identically;
  * /drift, /slo and /finops/recommendations returned the demo fixtures to every
    tenant regardless of the mock-data switch.

    python3 backend/shared/core/test_no_junk_data.py
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))

from shared.aws import lambda_service  # noqa: E402
from shared.core import agents, mock_data  # noqa: E402


def _mock(on):
    for var in ("PINGHOLD_MOCK_DATA", "PINGHOLD_DEMO_AGENTS"):
        os.environ.pop(var, None)
    if on:
        os.environ["PINGHOLD_MOCK_DATA"] = "1"


def test_tenant_without_telemetry_sees_nothing():
    """The failing case: uses_store() says no, so the shared pool must not be read."""
    _mock(False)
    calls = []
    agents.obs._fetch_spans = lambda *a, **k: calls.append(a) or [{"span_id": "leaked"}]
    agents.agent_telemetry.uses_store = lambda _tenant: False

    assert agents._all_spans(tenant_id="tenant-a") == []
    assert agents.route_stats("tenant-a") == []
    assert agents.list_traces(tenant_id="tenant-a") == []
    assert not calls, "a tenant request reached the untenanted Phoenix project"


def test_tenant_with_telemetry_sees_only_its_own():
    _mock(False)
    stored = {"tenant-a": [{"span_id": "a1", "name": "GET /a", "status": "OK"}]}
    agents.agent_telemetry.uses_store = lambda tenant: tenant in stored
    agents.agent_telemetry.spans = lambda tenant, limit: stored.get(tenant, [])

    assert [s["span_id"] for s in agents._all_spans(tenant_id="tenant-a")] == ["a1"]
    assert agents._all_spans(tenant_id="tenant-b") == []


def test_unconfigured_aws_account_is_empty_not_invented():
    _mock(False)
    lambda_service.get_config = lambda _tenant: None
    overview = lambda_service.lambda_overview("tenant-a")
    assert overview.configured is False
    assert overview.source == "none"
    assert overview.functions == 0 and overview.function_list == []


def test_refused_aws_account_reports_the_refusal():
    """Connected, but AWS said no. Zeros plus a reason — never a healthy-looking row."""
    _mock(False)
    cfg = lambda_service.AwsLambdaConfig(region="eu-west-1")
    lambda_service.get_config = lambda _tenant: cfg
    lambda_service._session = lambda _cfg: (_ for _ in ()).throw(
        RuntimeError("ExpiredToken: security token expired"))

    overview = lambda_service.lambda_overview("tenant-a")
    assert overview.configured is True
    assert overview.source == "error"
    assert overview.functions == 0
    assert "ExpiredToken" in overview.error


def test_mock_mode_still_serves_the_demo_account():
    _mock(True)
    assert mock_data.enabled() is True
    lambda_service.get_config = lambda _tenant: None
    assert lambda_service.lambda_overview("tenant-a").source == "demo"


def test_seeded_routers_are_empty_with_mock_off():
    _mock(False)
    from handlers.routers import drift, finops, slo

    assert slo.slos(tenant_id="tenant-a") == []
    report = drift.drift(tenant_id="tenant-a")
    assert report.any_drift is False and report.numeric == [] and report.categorical == []
    assert finops.finops_recommendations(tenant_id="tenant-a").recommendations == []


if __name__ == "__main__":
    for name, fn in sorted(globals().items()):
        if name.startswith("test_"):
            fn()
            print(f"ok  {name}")
    print("all green")
