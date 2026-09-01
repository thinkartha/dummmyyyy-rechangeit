"""Month-to-date AWS spend, from Cost Explorer, for the account this tenant connected.

The Cloud Cost page promised "multi-account spend, budgets, and anomalies" and had no
cost source behind it at all — the rows were markup and the only real number on the
screen was the budget the operator had typed in themselves. This is the missing half:
what was actually spent, so a budget has something to be compared against.

Cost Explorer is not free and not fast-moving:
  * every request bills about $0.01, so an uncached call per page load is a real line
    on the bill rather than a rounding error;
  * the data itself lags roughly a day, so a fresher answer than that does not exist.
Both point the same way, which is why the results are cached for `_TTL_SECONDS` and
why nothing here is called on a schedule.

The role needs `ce:GetCostAndUsage` and, for the forecast, `ce:GetCostForecast`. A role
scoped to Lambda reads will not have them, and that comes back as an `error` on the
response rather than as zeros pretending to be a $0 bill.
"""

from __future__ import annotations

import time
from calendar import monthrange
from datetime import date, timedelta
from typing import Any

from pydantic import BaseModel, Field

from . import lambda_service

# Cost Explorer is a global service with one endpoint. Boto will happily build a client
# in the tenant's region and then fail to resolve it, so the region is pinned here
# rather than taken from the connector config.
_CE_REGION = "us-east-1"

# Six hours against a source that updates daily: frequent enough that a bill moving
# during the day is visible, rare enough that the page costs ~$0.04/day to look at.
# ponytail: process-local dict, so each worker pays its own miss. Move it to
# config_store or Redis if the fleet grows past a couple of workers.
_TTL_SECONDS = 6 * 60 * 60
_CACHE: dict[str, tuple[float, "CloudCostReport"]] = {}


class CloudCostAccount(BaseModel):
    account: str
    cloud: str = "AWS"
    mtd: float
    currency: str = "USD"


class CloudCostReport(BaseModel):
    accounts: list[CloudCostAccount] = Field(default_factory=list)
    mtd_total: float = 0.0
    forecast_month_end: float | None = None
    currency: str = "USD"
    period_start: str | None = None
    period_end: str | None = None
    configured: bool = False
    # Same contract as the Lambda overview: zeros with a reason beat invented numbers.
    error: str | None = None


def _month_window(today: date) -> tuple[date, date, date]:
    """Start of month, exclusive end for MTD, and the last day of the month.

    Cost Explorer's End is exclusive, so MTD has to run to *tomorrow* to include today.
    Asking for today as the end silently drops today's spend, which is the kind of
    off-by-one that shows up as "the number never moves".
    """
    start = today.replace(day=1)
    month_end = today.replace(day=monthrange(today.year, today.month)[1])
    return start, today + timedelta(days=1), month_end


def _amount(metrics: dict[str, Any], key: str = "UnblendedCost") -> float:
    try:
        return float(metrics.get(key, {}).get("Amount", 0.0))
    except (TypeError, ValueError):
        return 0.0


def _forecast(ce, tomorrow: date, month_end: date) -> float | None:
    """Cost Explorer's own EOM projection, or None.

    It refuses whenever there is not enough history — a new account, or a month whose
    remaining window is empty because today *is* the last day. That is a normal answer,
    not a failure, so it must not take the whole report down with it.
    """
    if tomorrow > month_end:
        return None
    try:
        response = ce.get_cost_forecast(
            TimePeriod={"Start": tomorrow.isoformat(), "End": (month_end + timedelta(days=1)).isoformat()},
            Metric="UNBLENDED_COST",
            Granularity="MONTHLY",
        )
        return float(response["Total"]["Amount"])
    except Exception:
        return None


def cloud_cost(tenant_id: str, today: date | None = None) -> CloudCostReport:
    """MTD spend per linked account for this tenant's connected AWS account.

    Grouped by LINKED_ACCOUNT: a payer account sees every member account it settles for,
    and a standalone account sees one row for itself, which is what the page's Account
    column has always claimed to show.
    """
    cfg = lambda_service.get_config(tenant_id)
    if not cfg:
        return CloudCostReport(configured=False)

    cached = _CACHE.get(tenant_id)
    if cached and time.monotonic() - cached[0] < _TTL_SECONDS:
        return cached[1]

    today = today or date.today()
    start, mtd_end, month_end = _month_window(today)
    try:
        ce = lambda_service._session(cfg).client("ce", region_name=_CE_REGION)
        response = ce.get_cost_and_usage(
            TimePeriod={"Start": start.isoformat(), "End": mtd_end.isoformat()},
            Granularity="MONTHLY",
            Metrics=["UnblendedCost"],
            GroupBy=[{"Type": "DIMENSION", "Key": "LINKED_ACCOUNT"}],
        )
    except Exception as exc:
        # Not cached: a denied permission is worth re-checking as soon as the operator
        # fixes the role, rather than reading as denied for the next six hours.
        return CloudCostReport(
            configured=True,
            period_start=start.isoformat(),
            period_end=today.isoformat(),
            error=f"{type(exc).__name__}: {exc}",
        )

    # MONTHLY granularity over a within-month window still returns a list, and a window
    # that straddles nothing returns an empty one. Summing across it costs nothing and
    # survives a month boundary landing mid-request.
    totals: dict[str, float] = {}
    currency = "USD"
    for period in response.get("ResultsByTime", []):
        for group in period.get("Groups", []):
            account = (group.get("Keys") or ["unknown"])[0]
            metrics = group.get("Metrics", {})
            totals[account] = totals.get(account, 0.0) + _amount(metrics)
            currency = metrics.get("UnblendedCost", {}).get("Unit") or currency

    accounts = [
        CloudCostAccount(account=account, mtd=round(amount, 2), currency=currency)
        for account, amount in sorted(totals.items(), key=lambda item: item[1], reverse=True)
    ]
    report = CloudCostReport(
        accounts=accounts,
        mtd_total=round(sum(a.mtd for a in accounts), 2),
        forecast_month_end=_forecast(ce, mtd_end, month_end),
        currency=currency,
        period_start=start.isoformat(),
        period_end=today.isoformat(),
        configured=True,
    )
    _CACHE[tenant_id] = (time.monotonic(), report)
    return report


def invalidate(tenant_id: str) -> None:
    """Drop the cached report — used when the AWS connection is re-saved."""
    _CACHE.pop(tenant_id, None)
