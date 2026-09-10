"""GCP + Azure cost connectors: parsing, the roll-up, and what a refusal looks like.

    python3 backend/shared/test_cloudcost.py

The HTTP layer is the seam — every test replaces `cloudcost._post`, so nothing here
reaches a provider, and the assertions are about what we send and how we read the reply.
"""

import json
import os
import sys
from datetime import date

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

from shared import cloudcost  # noqa: E402
from shared.aws.cost import CloudCostReport  # noqa: E402
from shared.core import config_store  # noqa: E402

GCP_KEY = json.dumps({"client_email": "billing@p.iam.gserviceaccount.com",
                      "private_key": "-----BEGIN PRIVATE KEY-----\nfake\n-----END PRIVATE KEY-----\n",
                      "project_id": "billing-project"})


class FakeHttp:
    """Records every POST and replies from a URL-substring -> payload table."""

    def __init__(self, replies, raises=None):
        self.replies = replies
        self.raises = raises or {}
        self.calls = []

    def __call__(self, url, data, headers=None, form=False):
        self.calls.append({"url": url, "data": data, "headers": headers or {}, "form": form})
        for fragment, exc in self.raises.items():
            if fragment in url:
                raise exc
        for fragment, reply in self.replies.items():
            if fragment in url:
                return reply
        raise AssertionError(f"no fake reply for {url}")


# Captured before any test swaps them out. Tests run in one process in alphabetical
# order, so a patch left in place is a failure in whichever test happens to sort next.
_REAL_STORE = (config_store.save_config, config_store.get_config)


def _wire(http, gcp=None, azure=None, aws=None):
    cloudcost._post = http
    cloudcost._MEM.clear()
    cloudcost._CACHE.clear()
    config_store.save_config, config_store.get_config = _REAL_STORE
    # jwt.encode wants a real RSA key; the signing itself is not what is under test.
    cloudcost._gcp_token = lambda cfg: ("tok", cfg.billing_project or "billing-project")
    # Seeded through the real cache, not by replacing get_config, so the storage path
    # stays under test too.
    if gcp:
        cloudcost._MEM[("tenant-a", cloudcost._GCP)] = gcp
        cloudcost._MEM[("tenant-b", cloudcost._GCP)] = gcp
    if azure:
        cloudcost._MEM[("tenant-a", cloudcost._AZURE)] = azure
        cloudcost._MEM[("tenant-b", cloudcost._AZURE)] = azure
    cloudcost.aws_cloud_cost = lambda _t, today=None: aws or CloudCostReport(configured=False)
    return http


def _gcp_cfg(**kw):
    return cloudcost.GcpBillingConfig(
        serviceAccountJson=GCP_KEY,
        billingExportTable=kw.pop("table", "proj.billing.gcp_billing_export_v1_ABC"),
        **kw,
    )


def _azure_cfg(**kw):
    kw.setdefault("billingAccountId", "12345:67890_2019-05-31")
    return cloudcost.AzureCostConfig(
        directoryId="dir-1", clientId="app-1", clientSecret="shh", **kw
    )


def _bq(rows):
    return {"jobComplete": True,
            "schema": {"fields": [{"name": "account"}, {"name": "mtd"}, {"name": "currency"}]},
            "rows": [{"f": [{"v": v} for v in row]} for row in rows]}


def _azure_rows(columns, rows):
    return {"properties": {"columns": [{"name": c} for c in columns], "rows": rows}}


# --- config -----------------------------------------------------------------

def test_table_name_must_be_a_table_not_sql():
    """It is interpolated into FROM, so this is the injection boundary."""
    for bad in ("proj.billing.t` WHERE 1=1 UNION SELECT * FROM `secret.a.b",
                "proj.billing", "proj.billing.t; DROP", "proj billing.t.x"):
        try:
            _gcp_cfg(table=bad)
        except Exception:
            continue
        raise AssertionError(f"accepted {bad!r}")
    # Real export tables carry the account id and a date suffix; those must still pass.
    assert _gcp_cfg(table="`my-proj.billing.gcp_billing_export_v1_01ABCD_2FEEEE_3F1234`")


def test_azure_needs_a_scope_and_billing_account_wins():
    try:
        cloudcost.AzureCostConfig(directoryId="d", clientId="c", clientSecret="s")
        raise AssertionError("accepted a config with no scope")
    except Exception as exc:
        assert "billing_account_id" in str(exc)
    assert _azure_cfg().scope == "/providers/Microsoft.Billing/billingAccounts/12345:67890_2019-05-31"
    one = cloudcost.AzureCostConfig(directoryId="d", clientId="c", clientSecret="s", subscriptionId="sub-9")
    assert one.scope == "/subscriptions/sub-9"


def test_blank_secret_on_save_keeps_the_stored_one():
    """Editing the export table must not wipe the key the form cannot prefill."""
    _wire(FakeHttp({}))
    saved = {}
    cloudcost.config_store.save_config = lambda t, i, raw: saved.update({(t, i): raw}) or True
    cloudcost.config_store.get_config = lambda t, i: saved.get((t, i))

    cloudcost.save_config("tenant-a", cloudcost._GCP, _gcp_cfg())
    cloudcost.save_config("tenant-a", cloudcost._GCP,
                          cloudcost.GcpBillingConfig(billingExportTable="proj.billing.other"))
    kept = cloudcost.get_config("tenant-a", cloudcost._GCP)
    assert kept.billing_export_table == "proj.billing.other"
    assert kept.service_account_json == GCP_KEY


def test_status_never_returns_the_secret():
    _wire(FakeHttp({}))
    saved = {}
    cloudcost.config_store.save_config = lambda t, i, raw: saved.update({(t, i): raw}) or True
    cloudcost.config_store.get_config = lambda t, i: saved.get((t, i))
    status = cloudcost.save_config("tenant-a", cloudcost._AZURE, _azure_cfg())
    assert status["configured"] is True
    assert status["fields"]["client_secret"] == "***"
    assert "shh" not in json.dumps(status)


# --- GCP --------------------------------------------------------------------

def test_gcp_projects_become_rows():
    _wire(FakeHttp({"bigquery": _bq([("api-prod", "812.40", "USD"),
                                     ("data-lake", "97.10", "USD")])}), gcp=_gcp_cfg())
    report = cloudcost.multi_cloud_cost("tenant-a", today=date(2026, 9, 15))
    assert [(a.account, a.cloud, a.mtd) for a in report.accounts] == [
        ("api-prod", "GCP", 812.40), ("data-lake", "GCP", 97.10)]
    assert report.mtd_total == 909.50 and report.configured is True and report.errors == {}


def test_gcp_query_is_parameterised_and_month_scoped():
    http = _wire(FakeHttp({"bigquery": _bq([])}), gcp=_gcp_cfg())
    cloudcost.multi_cloud_cost("tenant-a", today=date(2026, 9, 15))
    body = http.calls[-1]["data"]
    assert body["useLegacySql"] is False
    values = {p["name"]: p["parameterValue"]["value"] for p in body["queryParameters"]}
    assert values["month"] == "202609"
    assert values["start"].startswith("2026-09-01")
    assert "@month" in body["query"] and "proj.billing.gcp_billing_export_v1_ABC" in body["query"]
    # List price is not the bill: credits must be in the sum.
    assert "credits" in body["query"]
    assert http.calls[-1]["headers"]["Authorization"] == "Bearer tok"


def test_gcp_unfinished_query_is_an_error_not_zero():
    _wire(FakeHttp({"bigquery": {"jobComplete": False}}), gcp=_gcp_cfg())
    report = cloudcost.multi_cloud_cost("tenant-a", today=date(2026, 9, 15))
    assert report.accounts == [] and "timeout" in report.errors["GCP"]


def test_gcp_rows_with_no_project_are_labelled_not_dropped():
    _wire(FakeHttp({"bigquery": _bq([(None, "4.00", "USD")])}), gcp=_gcp_cfg())
    report = cloudcost.multi_cloud_cost("tenant-a", today=date(2026, 9, 15))
    assert report.accounts[0].account == "unattributed" and report.mtd_total == 4.00


# --- Azure ------------------------------------------------------------------

def test_azure_subscriptions_become_rows():
    _wire(FakeHttp({"login.microsoftonline.com": {"access_token": "az-tok"},
                    "management.azure.com": _azure_rows(
                        ["Cost", "SubscriptionId", "Currency"],
                        [[120.5, "sub-a", "USD"], [8.25, "sub-b", "USD"]])}),
          azure=_azure_cfg())
    report = cloudcost.multi_cloud_cost("tenant-a", today=date(2026, 9, 15))
    assert [(a.account, a.cloud, a.mtd) for a in report.accounts] == [
        ("sub-a", "Azure", 120.5), ("sub-b", "Azure", 8.25)]
    assert report.mtd_total == 128.75


def test_azure_columns_are_read_by_name_not_position():
    """Cost Management returns the same columns in a different order per scope."""
    _wire(FakeHttp({"login.microsoftonline.com": {"access_token": "t"},
                    "management.azure.com": _azure_rows(
                        ["SubscriptionId", "Currency", "Cost"],
                        [["sub-a", "USD", 120.5]])}),
          azure=_azure_cfg())
    report = cloudcost.multi_cloud_cost("tenant-a", today=date(2026, 9, 15))
    assert report.accounts[0].account == "sub-a" and report.accounts[0].mtd == 120.5


def test_azure_queries_the_billing_account_scope():
    http = _wire(FakeHttp({"login.microsoftonline.com": {"access_token": "t"},
                           "management.azure.com": _azure_rows(["Cost", "SubscriptionId"], [])}),
                 azure=_azure_cfg())
    cloudcost.multi_cloud_cost("tenant-a", today=date(2026, 9, 15))
    query = http.calls[-1]
    assert "/providers/Microsoft.Billing/billingAccounts/12345:67890_2019-05-31" in query["url"]
    assert query["data"]["timeframe"] == "MonthToDate"
    assert query["data"]["dataset"]["grouping"][0]["name"] == "SubscriptionId"


def test_azure_bad_secret_says_which_cloud_failed():
    _wire(FakeHttp({}, raises={"login.microsoftonline.com":
                               RuntimeError("HTTP 401: AADSTS7000215: Invalid client secret")}),
          azure=_azure_cfg())
    report = cloudcost.multi_cloud_cost("tenant-a", today=date(2026, 9, 15))
    assert "AADSTS7000215" in report.errors["Azure"]
    assert report.configured is True and report.accounts == []


# --- the roll-up ------------------------------------------------------------

def test_nothing_connected_is_not_an_error():
    _wire(FakeHttp({}))
    report = cloudcost.multi_cloud_cost("tenant-a", today=date(2026, 9, 15))
    assert report.configured is False and report.accounts == [] and report.errors == {}
    assert report.mtd_total == 0.0


def test_all_three_clouds_merge_into_one_sorted_list():
    aws = CloudCostReport(configured=True, currency="USD", forecast_month_end=5000.0,
                          period_start="2026-09-01", period_end="2026-09-15",
                          accounts=[{"account": "111122223333", "cloud": "AWS", "mtd": 400.0,
                                     "currency": "USD"}],
                          mtd_total=400.0)
    _wire(FakeHttp({"bigquery": _bq([("api-prod", "900.00", "USD")]),
                    "login.microsoftonline.com": {"access_token": "t"},
                    "management.azure.com": _azure_rows(["Cost", "SubscriptionId", "Currency"],
                                                        [[50.0, "sub-a", "USD"]])}),
          gcp=_gcp_cfg(), azure=_azure_cfg(), aws=aws)
    report = cloudcost.multi_cloud_cost("tenant-a", today=date(2026, 9, 15))
    assert [a.cloud for a in report.accounts] == ["GCP", "AWS", "Azure"]
    assert report.mtd_total == 1350.0
    # Only AWS can forecast; the number must stay AWS's rather than pose as the total.
    assert report.forecast_month_end == 5000.0
    assert report.period_start == "2026-09-01"


def test_one_broken_cloud_does_not_blank_the_others():
    aws = CloudCostReport(configured=True, error="AccessDeniedException: ce:GetCostAndUsage")
    _wire(FakeHttp({"bigquery": _bq([("api-prod", "900.00", "USD")])}), gcp=_gcp_cfg(), aws=aws)
    report = cloudcost.multi_cloud_cost("tenant-a", today=date(2026, 9, 15))
    assert report.mtd_total == 900.0
    assert "AccessDenied" in report.errors["AWS"] and "GCP" not in report.errors


def test_mixed_currencies_are_shown_but_not_added_up():
    _wire(FakeHttp({"bigquery": _bq([("api-prod", "100.00", "USD"), ("eu-prod", "80.00", "EUR")])}),
          gcp=_gcp_cfg())
    report = cloudcost.multi_cloud_cost("tenant-a", today=date(2026, 9, 15))
    assert len(report.accounts) == 2
    assert report.mtd_total == 100.0
    assert "EUR" in report.errors["currency"]


def test_a_second_read_is_served_from_cache():
    """BigQuery bills per byte scanned; a page refresh must not be a second scan."""
    http = _wire(FakeHttp({"bigquery": _bq([("api-prod", "10.00", "USD")])}), gcp=_gcp_cfg())
    cloudcost.multi_cloud_cost("tenant-a", today=date(2026, 9, 15))
    cloudcost.multi_cloud_cost("tenant-a", today=date(2026, 9, 15))
    assert len(http.calls) == 1
    cloudcost.invalidate("tenant-a")
    cloudcost.multi_cloud_cost("tenant-a", today=date(2026, 9, 15))
    assert len(http.calls) == 2


def test_a_refusal_is_never_cached():
    http = _wire(FakeHttp({}, raises={"bigquery": RuntimeError("HTTP 403: Access Denied")}),
                 gcp=_gcp_cfg())
    cloudcost.multi_cloud_cost("tenant-a", today=date(2026, 9, 15))
    cloudcost.multi_cloud_cost("tenant-a", today=date(2026, 9, 15))
    assert len(http.calls) == 2


def test_tenants_do_not_share_a_cached_bill():
    http = _wire(FakeHttp({"bigquery": _bq([("api-prod", "10.00", "USD")])}), gcp=_gcp_cfg())
    assert cloudcost.multi_cloud_cost("tenant-a", today=date(2026, 9, 15)).mtd_total == 10.0
    http.replies["bigquery"] = _bq([("other", "77.00", "USD")])
    assert cloudcost.multi_cloud_cost("tenant-b", today=date(2026, 9, 15)).mtd_total == 77.0


if __name__ == "__main__":
    for name, fn in sorted(globals().items()):
        if name.startswith("test_"):
            fn()
            print(f"ok  {name}")
    print("all green")
