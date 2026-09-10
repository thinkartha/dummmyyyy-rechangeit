"""GCP and Azure month-to-date spend, joined onto the same Cloud Cost page as AWS.

The page has always said "multi-account spend ... across AWS, GCP, and Azure" and only
AWS was ever real. This is the other two thirds. The shape of the answer is deliberately
identical to `shared.aws.cost`: one row per billable child (AWS linked account, GCP
project, Azure subscription), so "does connecting one credential show me everything?"
has the same answer everywhere — yes, if you connect the payer.

  * AWS    — Cost Explorer, grouped by LINKED_ACCOUNT. Payer sees every member.
  * Azure  — Cost Management query API, grouped by SubscriptionId. Scope it at a billing
             account to see every subscription; a subscription scope sees only itself.
  * GCP    — there is no Cost Explorer equivalent. The only authoritative per-project
             spend is the BigQuery billing export, so that is what this queries. A
             billing account's export covers every project it pays for.

Neither provider needs an SDK: both are plain REST, and the GCP service-account JWT is
signed with PyJWT, which is already vendored for Cognito. `urllib` and one RS256 sign
beat 40 MB of google-cloud-* in a 250 MB Lambda.

Both sources cost money to read — BigQuery bills per byte scanned, Cost Management is
rate limited hard — and both lag about a day, so answers are cached for the same six
hours as Cost Explorer and nothing here runs on a schedule.
"""

from __future__ import annotations

import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import date
from typing import Any, Callable

from pydantic import BaseModel, Field, field_validator, model_validator

from shared.aws.cost import CloudCostAccount, CloudCostReport, _month_window
from shared.aws.cost import cloud_cost as aws_cloud_cost
from shared.core import config_store

_TIMEOUT = 30
# Same six hours as Cost Explorer: both sources update daily and both bill per read.
_TTL_SECONDS = 6 * 60 * 60
# ponytail: process-local, like the AWS one. Both move to Redis together or neither does.
_CACHE: dict[tuple[str, str], tuple[float, CloudCostReport]] = {}

_GCP = "gcp-billing"
_AZURE = "azure-cost"


# --- http -------------------------------------------------------------------


def _get(url: str, headers: dict | None = None) -> dict:
    request = urllib.request.Request(url, headers=headers or {}, method="GET")
    try:
        with urllib.request.urlopen(request, timeout=_TIMEOUT) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:400]
        raise RuntimeError(f"HTTP {exc.code}: {detail}") from None


def _post(url: str, data: dict, headers: dict | None = None, form: bool = False) -> dict:
    """POST JSON (or a form) and decode JSON back.

    A 4xx from either provider carries the only useful diagnosis in its *body*
    ("AADSTS7000215: Invalid client secret", "Access Denied: Table ..."), and
    HTTPError's str() shows just the status. Losing that turns every misconfiguration
    into an indistinguishable "HTTP Error 400".
    """
    body = urllib.parse.urlencode(data).encode() if form else json.dumps(data).encode()
    request = urllib.request.Request(
        url,
        data=body,
        headers={
            "Content-Type": "application/x-www-form-urlencoded" if form else "application/json",
            **(headers or {}),
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=_TIMEOUT) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:400]
        raise RuntimeError(f"HTTP {exc.code}: {detail}") from None


# --- config -----------------------------------------------------------------


class GcpBillingConfig(BaseModel):
    """A service account that can query the billing export, and where that export is."""

    # The whole downloaded key file, pasted. Asking for client_email and private_key
    # separately means the operator hand-splits a JSON blob and gets the \n escaping
    # wrong, which surfaces as an unreadable RS256 error.
    service_account_json: str | None = Field(default=None, alias="serviceAccountJson", repr=False)
    billing_export_table: str = Field(alias="billingExportTable")
    # Where the query runs (and is billed). Defaults to the service account's own project.
    billing_project: str | None = Field(default=None, alias="billingProject")

    model_config = {"populate_by_name": True}

    @field_validator("billing_export_table")
    @classmethod
    def _safe_table(cls, value: str) -> str:
        """A table name cannot be a query parameter — it is interpolated into the FROM
        clause, so this is the trust boundary and it is checked rather than escaped."""
        value = value.strip().strip("`")
        if not re.fullmatch(r"[A-Za-z0-9_\-]{1,60}\.[A-Za-z0-9_]{1,1024}\.[A-Za-z0-9_]{1,1024}", value):
            raise ValueError("billing_export_table must be project.dataset.table")
        return value


class AzureCostConfig(BaseModel):
    """An app registration with Cost Management Reader, and the scope to read."""

    directory_id: str = Field(alias="directoryId")
    client_id: str = Field(alias="clientId")
    client_secret: str | None = Field(default=None, alias="clientSecret", repr=False)
    # Billing account wins when both are set: it is the scope that sees every
    # subscription, which is the whole point of connecting once.
    billing_account_id: str | None = Field(default=None, alias="billingAccountId")
    subscription_id: str | None = Field(default=None, alias="subscriptionId")

    model_config = {"populate_by_name": True}

    @model_validator(mode="after")
    def _needs_a_scope(self):
        if not (self.billing_account_id or self.subscription_id):
            raise ValueError("Set billing_account_id (all subscriptions) or subscription_id (one)")
        return self

    @property
    def scope(self) -> str:
        if self.billing_account_id:
            return f"/providers/Microsoft.Billing/billingAccounts/{self.billing_account_id}"
        return f"/subscriptions/{self.subscription_id}"


_MODELS: dict[str, type[BaseModel]] = {_GCP: GcpBillingConfig, _AZURE: AzureCostConfig}
# Fields that are write-only: sent once, never read back, and blank on save means
# "keep what is stored" rather than "erase it". Without this, editing the export table
# would silently wipe the service-account key, because the form cannot prefill it.
_SECRETS: dict[str, tuple[str, ...]] = {
    _GCP: ("service_account_json",),
    _AZURE: ("client_secret",),
}
_MEM: dict[tuple[str, str], BaseModel] = {}


def _mask(value: str | None) -> str | None:
    if not value:
        return None
    return "***" if len(value) <= 6 else f"{value[:3]}...{value[-3:]}"


def get_config(tenant_id: str, integration: str) -> Any | None:
    cached = _MEM.get((tenant_id, integration))
    if cached:
        return cached
    raw = config_store.get_config(tenant_id, integration)
    if not raw:
        return None
    cfg = _MODELS[integration].model_validate_json(raw)
    _MEM[(tenant_id, integration)] = cfg
    return cfg


def save_config(tenant_id: str, integration: str, config: BaseModel) -> dict:
    prior = get_config(tenant_id, integration)
    if prior:
        for name in _SECRETS[integration]:
            if not getattr(config, name, None):
                setattr(config, name, getattr(prior, name))
    _MEM[(tenant_id, integration)] = config
    config_store.save_config(tenant_id, integration, config.model_dump_json(by_alias=True))
    # Saving credentials is exactly when somebody is watching the page for a change, so
    # the six-hour-old answer goes with them.
    _CACHE.pop((tenant_id, integration), None)
    return config_status(tenant_id, integration)


def config_status(tenant_id: str, integration: str) -> dict:
    cfg = get_config(tenant_id, integration)
    secrets = _SECRETS[integration]
    fields: dict[str, Any] = {}
    if cfg:
        for name, value in cfg.model_dump().items():
            fields[name] = _mask(value) if name in secrets else value
    return {
        "id": integration,
        "configured": cfg is not None,
        "source": "frontend" if cfg else "unset",
        "fields": fields,
    }


# --- GCP --------------------------------------------------------------------


def _gcp_token(cfg: GcpBillingConfig) -> tuple[str, str]:
    """(access token, project). A self-signed JWT exchanged for a bearer token — the
    same two-legged flow google-auth runs, minus the dependency."""
    import jwt  # PyJWT, already required for Cognito RS256.

    key = json.loads(cfg.service_account_json or "{}")
    if not key.get("client_email") or not key.get("private_key"):
        raise RuntimeError("service account JSON is missing client_email/private_key")
    now = int(time.time())
    assertion = jwt.encode(
        {
            "iss": key["client_email"],
            "scope": "https://www.googleapis.com/auth/bigquery",
            "aud": "https://oauth2.googleapis.com/token",
            "iat": now,
            "exp": now + 3600,
        },
        key["private_key"],
        algorithm="RS256",
    )
    token = _post(
        "https://oauth2.googleapis.com/token",
        {"grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer", "assertion": assertion},
        form=True,
    )
    return token["access_token"], cfg.billing_project or key.get("project_id", "")


# `invoice.month` is the billing month a line belongs to, so for the current month it is
# exactly month-to-date — no window arithmetic, and it prunes partitions. `usage_start_time`
# is added because the export is partitioned on it and a bare invoice.month filter scans
# the whole table, which is the part that costs money.
# Credits (committed-use discounts, promotions, SUDs) are negative rows in a repeated
# field. Summing `cost` alone reports list price, which is not what anyone is billed.
_GCP_SQL = """
SELECT
  IFNULL(project.id, 'unattributed') AS account,
  SUM(cost) + SUM(IFNULL((SELECT SUM(c.amount) FROM UNNEST(credits) c), 0)) AS mtd,
  currency
FROM `{table}`
WHERE invoice.month = @month
  AND usage_start_time >= @start
GROUP BY account, currency
"""


def _gcp_cost(cfg: GcpBillingConfig, start: date) -> tuple[list[CloudCostAccount], str | None]:
    token, project = _gcp_token(cfg)
    if not project:
        raise RuntimeError("no billing_project set and the key file has no project_id")
    payload = {
        "query": _GCP_SQL.format(table=cfg.billing_export_table),
        "useLegacySql": False,
        "timeoutMs": _TIMEOUT * 1000,
        "parameterMode": "NAMED",
        "queryParameters": [
            {"name": "month", "parameterType": {"type": "STRING"},
             "parameterValue": {"value": start.strftime("%Y%m")}},
            {"name": "start", "parameterType": {"type": "TIMESTAMP"},
             "parameterValue": {"value": f"{start.isoformat()} 00:00:00"}},
        ],
    }
    result = _post(
        f"https://bigquery.googleapis.com/bigquery/v2/projects/{urllib.parse.quote(project)}/queries",
        payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    # A query that outran timeoutMs returns a job reference and no rows. Reporting that
    # as $0 would be a lie; reporting it as an error is one an operator can act on.
    if not result.get("jobComplete", True):
        raise RuntimeError("BigQuery did not finish within the timeout — narrow the export table")
    names = [f["name"] for f in result.get("schema", {}).get("fields", [])]
    accounts, currency = [], None
    for row in result.get("rows", []):
        values = dict(zip(names, [cell.get("v") for cell in row.get("f", [])]))
        currency = currency or values.get("currency") or "USD"
        accounts.append(
            CloudCostAccount(
                account=values.get("account") or "unattributed",
                cloud="GCP",
                mtd=round(float(values.get("mtd") or 0), 2),
                currency=values.get("currency") or "USD",
            )
        )
    return accounts, currency


# --- Azure ------------------------------------------------------------------


def _azure_token(cfg: AzureCostConfig) -> str:
    token = _post(
        f"https://login.microsoftonline.com/{urllib.parse.quote(cfg.directory_id)}/oauth2/v2.0/token",
        {
            "grant_type": "client_credentials",
            "client_id": cfg.client_id,
            "client_secret": cfg.client_secret or "",
            "scope": "https://management.azure.com/.default",
        },
        form=True,
    )
    return token["access_token"]


def _azure_cost(cfg: AzureCostConfig) -> tuple[list[CloudCostAccount], str | None]:
    token = _azure_token(cfg)
    result = _post(
        f"https://management.azure.com{cfg.scope}"
        "/providers/Microsoft.CostManagement/query?api-version=2023-03-01",
        {
            "type": "ActualCost",
            "timeframe": "MonthToDate",
            "dataset": {
                "granularity": "None",
                "aggregation": {"totalCost": {"name": "Cost", "function": "Sum"}},
                "grouping": [{"type": "Dimension", "name": "SubscriptionId"}],
            },
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    properties = result.get("properties", {})
    # Column *order* is not stable across scopes (a billing-account query returns Cost
    # first, a subscription query does not), so rows are indexed by name.
    names = [c.get("name") for c in properties.get("columns", [])]
    index = {name: i for i, name in enumerate(names)}
    accounts, currency = [], None
    for row in properties.get("rows", []):
        def cell(name, default=None):
            position = index.get(name)
            return row[position] if position is not None and position < len(row) else default

        currency = currency or cell("Currency") or "USD"
        accounts.append(
            CloudCostAccount(
                account=str(cell("SubscriptionId") or cfg.subscription_id or "subscription"),
                cloud="Azure",
                mtd=round(float(cell("Cost") or cell("PreTaxCost") or 0), 2),
                currency=str(cell("Currency") or "USD"),
            )
        )
    return accounts, currency


# --- what the credential can see --------------------------------------------
#
# The Cloud accounts page could only count GCP projects and Azure subscriptions by
# reading the cost roll-up, which means a tenant who has connected credentials but not
# yet a billing export shows zero of everything, and every count costs a BigQuery scan.
# These are the providers' own "list what I can reach" calls: one request each, free,
# and they answer the question the page is actually asking — did connecting one
# credential give us the whole estate, or just one child?
#
# ponytail: reach only. No DNS/CDN/bucket walk like shared/aws/inventory.py does — that
# is a per-service crawl per project and nothing on screen asks for it yet.


def visible_accounts(tenant_id: str, integration: str) -> dict:
    """{configured, accounts: [{id, name}], error} for one provider."""
    cfg = get_config(tenant_id, integration)
    if not cfg:
        return {"configured": False, "accounts": [], "error": None}
    try:
        if integration == _GCP:
            token, _ = _gcp_token(cfg)
            found = _get(
                "https://cloudresourcemanager.googleapis.com/v1/projects?filter=lifecycleState:ACTIVE",
                {"Authorization": f"Bearer {token}"},
            )
            accounts = [{"id": p.get("projectId", ""), "name": p.get("name")}
                        for p in found.get("projects", [])]
        else:
            token = _azure_token(cfg)
            found = _get(
                "https://management.azure.com/subscriptions?api-version=2022-12-01",
                {"Authorization": f"Bearer {token}"},
            )
            accounts = [{"id": s.get("subscriptionId", ""), "name": s.get("displayName")}
                        for s in found.get("value", [])
                        if s.get("state", "Enabled") == "Enabled"]
    except Exception as exc:
        return {"configured": True, "accounts": [], "error": f"{type(exc).__name__}: {exc}"}
    return {"configured": True, "accounts": accounts, "error": None}


# --- one report -------------------------------------------------------------


_PROVIDERS: dict[str, tuple[str, Callable]] = {
    _GCP: ("GCP", _gcp_cost),
    _AZURE: ("Azure", _azure_cost),
}


def _provider_report(tenant_id: str, integration: str, start: date) -> tuple[list[CloudCostAccount], str | None, str | None, bool]:
    """(accounts, currency, error, configured) for one non-AWS provider, cached."""
    cfg = get_config(tenant_id, integration)
    if not cfg:
        return [], None, None, False

    key = (tenant_id, integration)
    hit = _CACHE.get(key)
    if hit and time.monotonic() - hit[0] < _TTL_SECONDS:
        return hit[1].accounts, hit[1].currency, hit[1].error, True

    _, fetch = _PROVIDERS[integration]
    try:
        accounts, currency = fetch(cfg, start) if integration == _GCP else fetch(cfg)
    except Exception as exc:
        # Not cached, for the same reason AWS does not cache one: a denied permission
        # should clear the moment the operator grants it, not six hours later.
        return [], None, f"{type(exc).__name__}: {exc}", True
    report = CloudCostReport(configured=True, accounts=accounts, currency=currency or "USD")
    _CACHE[key] = (time.monotonic(), report)
    return accounts, currency, None, True


def multi_cloud_cost(tenant_id: str, today: date | None = None) -> CloudCostReport:
    """Month-to-date spend across every cloud this tenant has connected.

    One row per billable child, whatever the cloud calls it. A cloud that is not
    connected contributes nothing and is not an error; a cloud that refused contributes
    an entry in `errors` keyed by cloud name, so one broken credential cannot blank the
    other two providers' spend.
    """
    today = today or date.today()
    start, _, _ = _month_window(today)

    aws = aws_cloud_cost(tenant_id, today=today)
    accounts = list(aws.accounts)
    errors: dict[str, str] = {"AWS": aws.error} if aws.error else {}
    configured = aws.configured
    currency = aws.currency if aws.configured and not aws.error else None

    for integration, (cloud, _fetch) in _PROVIDERS.items():
        rows, provider_currency, error, is_configured = _provider_report(tenant_id, integration, start)
        configured = configured or is_configured
        if error:
            errors[cloud] = error
        accounts.extend(rows)
        currency = currency or provider_currency

    currency = currency or "USD"
    # Adding EUR to USD produces a number that is wrong in both. Rows in another
    # currency stay visible with their own currency; only the roll-up excludes them,
    # and says that it did.
    other = sorted({a.currency for a in accounts if a.currency != currency})
    if other:
        errors["currency"] = (
            f"Total covers {currency} only — also seeing {', '.join(other)}. "
            "Convert with your own rates."
        )

    accounts.sort(key=lambda a: a.mtd, reverse=True)
    return CloudCostReport(
        accounts=accounts,
        mtd_total=round(sum(a.mtd for a in accounts if a.currency == currency), 2),
        # Only AWS forecasts: Cost Management's forecast is a second billed call and
        # BigQuery has nothing to forecast from. A partial forecast next to a
        # multi-cloud total would read as a prediction of the whole bill.
        forecast_month_end=aws.forecast_month_end,
        currency=currency,
        period_start=aws.period_start or start.isoformat(),
        period_end=aws.period_end or today.isoformat(),
        configured=configured,
        errors=errors,
    )


def invalidate(tenant_id: str) -> None:
    for integration in _PROVIDERS:
        _CACHE.pop((tenant_id, integration), None)
