"""Cost Explorer: the month window, the cache, and what happens when AWS says no.

    python3 backend/shared/aws/test_cost.py
"""

import os
import sys
from datetime import date

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))

from shared.aws import cost, lambda_service  # noqa: E402
from shared.aws.dto import AwsLambdaConfig  # noqa: E402


class FakeCE:
    """Enough of the Cost Explorer client to exercise the parsing, and nothing else."""

    def __init__(self, groups=None, raises=None, forecast="900.00", forecast_raises=False):
        self.groups = groups if groups is not None else []
        self.raises = raises
        self.forecast = forecast
        self.forecast_raises = forecast_raises
        self.windows = []

    def get_cost_and_usage(self, **kwargs):
        if self.raises:
            raise self.raises
        self.windows.append(kwargs["TimePeriod"])
        return {"ResultsByTime": [{"Groups": self.groups}]}

    def get_cost_forecast(self, **kwargs):
        if self.forecast_raises:
            raise RuntimeError("insufficient historical data")
        return {"Total": {"Amount": self.forecast}}


def _group(account, amount):
    return {"Keys": [account],
            "Metrics": {"UnblendedCost": {"Amount": amount, "Unit": "USD"}}}


def _wire(ce, configured=True):
    cost._CACHE.clear()
    lambda_service.get_config = lambda _t: AwsLambdaConfig(region="eu-west-1") if configured else None
    lambda_service._session = lambda _cfg: type("S", (), {"client": lambda self, *a, **k: ce})()
    return ce


def test_unconnected_tenant_gets_nothing_not_zero():
    _wire(FakeCE(), configured=False)
    report = cost.cloud_cost("tenant-a")
    assert report.configured is False
    assert report.accounts == [] and report.mtd_total == 0.0
    assert report.error is None


def test_spend_is_grouped_and_sorted_by_account():
    ce = _wire(FakeCE([_group("111122223333", "62.40"),
                       _group("444455556666", "281.10")]))
    report = cost.cloud_cost("tenant-a", today=date(2026, 9, 15))
    assert [a.account for a in report.accounts] == ["444455556666", "111122223333"]
    assert [a.mtd for a in report.accounts] == [281.10, 62.40]
    assert report.mtd_total == 343.50
    assert report.forecast_month_end == 900.00
    assert report.currency == "USD"
    assert ce.windows == [{"Start": "2026-09-01", "End": "2026-09-16"}]


def test_mtd_window_includes_today():
    """Cost Explorer's End is exclusive — ending on today drops today's spend."""
    ce = _wire(FakeCE())
    cost.cloud_cost("tenant-a", today=date(2026, 9, 1))
    assert ce.windows == [{"Start": "2026-09-01", "End": "2026-09-02"}]


def test_forecast_refusal_is_not_a_failure():
    _wire(FakeCE([_group("111122223333", "10.00")], forecast_raises=True))
    report = cost.cloud_cost("tenant-a", today=date(2026, 9, 15))
    assert report.forecast_month_end is None
    assert report.mtd_total == 10.00 and report.error is None


def test_last_day_of_month_asks_for_no_forecast():
    ce = _wire(FakeCE([_group("111122223333", "10.00")]))
    report = cost.cloud_cost("tenant-a", today=date(2026, 9, 30))
    assert report.forecast_month_end is None


def test_denied_permission_says_so_and_is_not_cached():
    """The likeliest empty-table cause. It must be visible, and must clear on a fix."""
    ce = _wire(FakeCE(raises=RuntimeError("AccessDeniedException: ce:GetCostAndUsage")))
    report = cost.cloud_cost("tenant-a", today=date(2026, 9, 15))
    assert report.configured is True
    assert report.accounts == []
    assert "AccessDenied" in report.error
    assert "tenant-a" not in cost._CACHE

    ce.raises = None
    ce.groups = [_group("111122223333", "5.00")]
    assert cost.cloud_cost("tenant-a", today=date(2026, 9, 15)).mtd_total == 5.00


def test_second_read_is_served_from_cache():
    """Every call bills ~$0.01, so a second page load must not be a second request."""
    ce = _wire(FakeCE([_group("111122223333", "5.00")]))
    cost.cloud_cost("tenant-a", today=date(2026, 9, 15))
    cost.cloud_cost("tenant-a", today=date(2026, 9, 15))
    assert len(ce.windows) == 1

    cost.invalidate("tenant-a")
    cost.cloud_cost("tenant-a", today=date(2026, 9, 15))
    assert len(ce.windows) == 2


def test_tenants_do_not_share_a_cached_bill():
    ce = _wire(FakeCE([_group("111122223333", "5.00")]))
    cost.cloud_cost("tenant-a", today=date(2026, 9, 15))
    ce.groups = [_group("999988887777", "77.00")]
    assert cost.cloud_cost("tenant-b", today=date(2026, 9, 15)).mtd_total == 77.00


if __name__ == "__main__":
    for name, fn in sorted(globals().items()):
        if name.startswith("test_"):
            fn()
            print(f"ok  {name}")
    print("all green")
