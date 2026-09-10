"""Region resolution, the connector identity rewrite, cost grouping, and the probe.

Each of these is a small rule with a wrong-looking-but-plausible alternative: reading
one region and calling it "no alarms", pasting an assumed-role ARN into a trust policy
where it will never match, labelling untagged spend as $0, and reporting a connection
"ok" because the fields were saved rather than because AWS accepted them.
"""

from __future__ import annotations

from datetime import date

import pytest

from shared.aws import cost, inventory, lambda_service
from shared.aws.dto import AwsLambdaConfig


# --- regions ----------------------------------------------------------------

def test_primary_region_comes_first_and_repeats_collapse():
    cfg = AwsLambdaConfig(region="eu-west-1", regions=["us-east-1", "eu-west-1", ""])
    assert inventory.read_regions(cfg) == ["eu-west-1", "us-east-1"]


def test_a_config_with_no_extra_regions_reads_one():
    assert inventory.read_regions(AwsLambdaConfig(region="ap-south-1")) == ["ap-south-1"]


def test_region_list_changes_the_cache_key(monkeypatch):
    """Two region sets are two different answers; sharing a cache entry would serve the
    narrower one for fifteen minutes after somebody widened it."""
    calls: list[list[str]] = []

    def fake_collect(session, account_id, name, regions, connected=False):
        calls.append(list(regions))
        return inventory.AccountInventory(accountId=account_id, regions=list(regions))

    monkeypatch.setattr(inventory, "_collect", fake_collect)
    monkeypatch.setattr(inventory, "_org_accounts", lambda session: [])
    monkeypatch.setattr(inventory, "_assume", lambda *a, **k: object())

    class FakeSts:
        def get_caller_identity(self):
            return {"Account": "111122223333"}

    class FakeSession:
        def client(self, service, **kw):
            return FakeSts()

    monkeypatch.setattr(lambda_service, "_session", lambda cfg: FakeSession())

    tenant = "t-regions"
    lambda_service._IN_MEMORY_CONFIGS[tenant] = AwsLambdaConfig(region="us-east-1")
    inventory.inventory(tenant)
    lambda_service._IN_MEMORY_CONFIGS[tenant] = AwsLambdaConfig(
        region="us-east-1", regions=["eu-west-1"])
    inventory.inventory(tenant)

    assert calls == [["us-east-1"], ["us-east-1", "eu-west-1"]]
    inventory.invalidate(tenant)


# --- connector identity -----------------------------------------------------

def test_assumed_role_arn_is_rewritten_to_the_role_arn(monkeypatch):
    """A trust policy naming the assumed-role ARN never matches anything — the session
    name is per-invocation. It has to be the iam::role ARN."""
    lambda_service._CONNECTOR_IDENTITY = None

    class FakeSts:
        def get_caller_identity(self):
            return {"Arn": "arn:aws:sts::123456789012:assumed-role/lhb-stack-Role-ABC/lhb-api-prod",
                    "Account": "123456789012"}

    import types
    fake_boto3 = types.ModuleType("boto3")
    fake_boto3.client = lambda *a, **k: FakeSts()
    monkeypatch.setitem(__import__("sys").modules, "boto3", fake_boto3)

    identity = lambda_service.connector_identity()
    assert identity["principal_arn"] == "arn:aws:iam::123456789012:role/lhb-stack-Role-ABC"
    assert identity["resolved"] is True
    lambda_service._CONNECTOR_IDENTITY = None


def test_no_credentials_reports_the_reason_rather_than_an_arn(monkeypatch):
    lambda_service._CONNECTOR_IDENTITY = None

    class Boom:
        def get_caller_identity(self):
            raise RuntimeError("no credentials")

    import types
    fake_boto3 = types.ModuleType("boto3")
    fake_boto3.client = lambda *a, **k: Boom()
    monkeypatch.setitem(__import__("sys").modules, "boto3", fake_boto3)

    identity = lambda_service.connector_identity()
    assert identity["principal_arn"] is None
    assert identity["resolved"] is False
    assert "no credentials" in identity["error"]
    lambda_service._CONNECTOR_IDENTITY = None


# --- cost grouping ----------------------------------------------------------

def test_a_tag_key_groups_as_a_tag_not_a_dimension():
    assert cost._group_spec("SERVICE") == {"Type": "DIMENSION", "Key": "SERVICE"}
    assert cost._group_spec("region") == {"Type": "DIMENSION", "Key": "REGION"}
    assert cost._group_spec("team") == {"Type": "TAG", "Key": "team"}


def test_untagged_spend_is_labelled_not_dropped(monkeypatch):
    """Cost Explorer returns "team$" for everything the tag is not on. That bucket is
    usually the reason somebody opened the page."""
    tenant = "t-cost"
    lambda_service._IN_MEMORY_CONFIGS[tenant] = AwsLambdaConfig(region="us-east-1")
    cost.invalidate(tenant)

    class FakeCe:
        def get_cost_and_usage(self, **kw):
            return {"ResultsByTime": [{"Groups": [
                {"Keys": ["team$payments"], "Metrics": {"UnblendedCost": {"Amount": "75", "Unit": "USD"}}},
                {"Keys": ["team$"], "Metrics": {"UnblendedCost": {"Amount": "25", "Unit": "USD"}}},
            ]}]}

    class FakeSession:
        def client(self, service, **kw):
            return FakeCe()

    monkeypatch.setattr(lambda_service, "_session", lambda cfg: FakeSession())
    report = cost.breakdown(tenant, "team", today=date(2026, 9, 10))
    entries = {e.key: e for e in report.entries}
    assert set(entries) == {"payments", "untagged"}
    assert entries["payments"].mtd == 75.0
    assert entries["payments"].share == 0.75
    assert report.total == 100.0
    cost.invalidate(tenant)


def test_invalidate_clears_the_composite_cache_keys(monkeypatch):
    """New credentials must not keep showing the previous account's spend for six hours,
    which a single-key pop left them doing for every breakdown and series."""
    tenant = "t-invalidate"
    cost._CACHE[tenant] = (0.0, None)
    cost._CACHE[f"{tenant}|breakdown|SERVICE|2026-09-01"] = (0.0, None)
    cost._CACHE[f"{tenant}|daily|30|2026-09-10"] = (0.0, None)
    cost._CACHE["other-tenant|daily|30|2026-09-10"] = (0.0, None)
    cost.invalidate(tenant)
    assert [k for k in cost._CACHE if k.startswith(tenant)] == []
    assert "other-tenant|daily|30|2026-09-10" in cost._CACHE
    cost._CACHE.pop("other-tenant|daily|30|2026-09-10")


# --- connection probe -------------------------------------------------------

def test_probe_reports_each_capability_separately(monkeypatch):
    """A role good for CloudWatch and missing Cost Explorer is the normal case; one
    boolean for the whole connection cannot express it."""
    tenant = "t-probe"
    lambda_service._IN_MEMORY_CONFIGS[tenant] = AwsLambdaConfig(region="us-east-1")

    class FakeClient:
        def __init__(self, service):
            self.service = service

        def get_caller_identity(self):
            return {"Account": "111122223333", "Arn": "arn:aws:iam::111122223333:role/read"}

        def __getattr__(self, name):
            if self.service == "ce":
                raise AttributeError(name)
            return lambda **kw: {}

    class FakeSession:
        def client(self, service, **kw):
            if service == "ce":
                class Denied:
                    def get_cost_and_usage(self, **kw):
                        raise RuntimeError("AccessDeniedException: ce:GetCostAndUsage")
                return Denied()
            return FakeClient(service)

    monkeypatch.setattr(lambda_service, "_session", lambda cfg: FakeSession())
    result = lambda_service.test_connection(tenant)
    checks = {c["id"]: c for c in result["checks"]}
    assert result["ok"] is True, "the credential works even though one capability does not"
    assert result["account"] == "111122223333"
    assert checks["cloudwatch"]["ok"] is True
    assert checks["cost"]["ok"] is False
    assert "ce:GetCostAndUsage" in checks["cost"]["error"]
    assert checks["cost"]["permission"] == "ce:GetCostAndUsage"


def test_probe_on_a_refused_credential_does_not_repeat_the_error_five_times(monkeypatch):
    tenant = "t-probe-bad"
    lambda_service._IN_MEMORY_CONFIGS[tenant] = AwsLambdaConfig(region="us-east-1")

    def boom(cfg):
        raise RuntimeError("AccessDenied: not authorized to perform sts:AssumeRole")

    monkeypatch.setattr(lambda_service, "_session", boom)
    result = lambda_service.test_connection(tenant)
    assert result["ok"] is False
    assert result["checks"] == []
    assert "sts:AssumeRole" in result["error"]
    assert "trust policy" in result["hint"]


def test_probe_without_a_saved_connection_says_so():
    result = lambda_service.test_connection("t-never-connected")
    assert result["configured"] is False and result["ok"] is False


def test_daily_and_breakdown_scope_to_one_account(monkeypatch):
    """A payer account's spend is every member account's until it is filtered, so the
    drill-down asking for one account has to narrow at Cost Explorer — not after it,
    which would still have paid to move every other account's numbers."""
    tenant = "t-account-cost"
    lambda_service._IN_MEMORY_CONFIGS[tenant] = AwsLambdaConfig(region="us-east-1")
    cost.invalidate(tenant)
    seen: list[dict] = []

    class FakeCe:
        def get_cost_and_usage(self, **kw):
            seen.append(kw)
            return {"ResultsByTime": [{
                "Groups": [{"Keys": ["Amazon EC2"],
                            "Metrics": {"UnblendedCost": {"Amount": "10", "Unit": "USD"}}}],
                "Total": {"UnblendedCost": {"Amount": "10", "Unit": "USD"}},
                "TimePeriod": {"Start": "2026-09-01"},
            }]}

    class FakeSession:
        def client(self, service, **kw):
            return FakeCe()

    monkeypatch.setattr(lambda_service, "_session", lambda cfg: FakeSession())

    cost.breakdown(tenant, "SERVICE", today=date(2026, 9, 10), account="111122223333")
    cost.daily(tenant, 30, today=date(2026, 9, 10), account="111122223333")
    assert len(seen) == 2
    for call in seen:
        assert call["Filter"]["Dimensions"]["Values"] == ["111122223333"]

    # And the unfiltered call must not carry a Filter at all, or the whole-org view
    # would silently become one account's.
    cost.invalidate(tenant)
    seen.clear()
    cost.breakdown(tenant, "SERVICE", today=date(2026, 9, 10))
    assert "Filter" not in seen[0]
    cost.invalidate(tenant)


def test_account_scoping_is_part_of_the_cost_cache_key(monkeypatch):
    """Two accounts are two answers; sharing an entry would serve one account's spend
    for the other for six hours."""
    tenant = "t-cache-key"
    lambda_service._IN_MEMORY_CONFIGS[tenant] = AwsLambdaConfig(region="us-east-1")
    cost.invalidate(tenant)
    calls = []

    class FakeCe:
        def get_cost_and_usage(self, **kw):
            calls.append(kw.get("Filter"))
            return {"ResultsByTime": []}

    class FakeSession:
        def client(self, service, **kw):
            return FakeCe()

    monkeypatch.setattr(lambda_service, "_session", lambda cfg: FakeSession())
    cost.breakdown(tenant, "SERVICE", today=date(2026, 9, 10), account="111")
    cost.breakdown(tenant, "SERVICE", today=date(2026, 9, 10), account="222")
    assert len(calls) == 2, "the second account reused the first account's cache entry"
    cost.invalidate(tenant)
