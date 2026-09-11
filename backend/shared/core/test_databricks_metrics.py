"""Databricks consumption/query/cluster metrics.

Databricks itself is never reached: run_query and the clusters REST call are the two
seams, and both are replaced. What is under test is the part that would be wrong
silently — the statement API returns every cell as a *string*, system tables are opt-in
so their absence must not read as an outage, and one dead dimension must not blank the
other two.
"""

from __future__ import annotations

import pytest

from shared.core import databricks as dbx
from shared.core import databricks_metrics as m


def _result(columns, rows):
    return {"columns": columns, "rows": rows, "row_count": len(rows), "truncated": False}


def test_usage_folds_daily_cost_and_ranks_spenders(monkeypatch):
    daily = _result(
        ["usage_date", "sku_name", "dbus", "list_cost", "currency"],
        [
            ["2026-09-08", "PREMIUM_ALL_PURPOSE_COMPUTE", "10.0", "5.50", "USD"],
            ["2026-09-08", "PREMIUM_SQL_COMPUTE", "4.0", "2.80", "USD"],
            ["2026-09-09", "PREMIUM_ALL_PURPOSE_COMPUTE", "20.0", "11.00", "USD"],
        ],
    )
    entities = _result(
        ["entity", "entity_type", "dbus", "list_cost", "currency"],
        [["nightly-load", "job", "18.0", "9.90", "USD"],
         ["unattributed", "unattributed", "2.0", "1.10", "USD"]],
    )
    calls = []

    def fake_query(sql, limit=1000, tenant_id=None, **kw):
        calls.append(sql)
        return daily if "GROUP BY u.usage_date" in sql else entities

    monkeypatch.setattr(m.dbx, "run_query", fake_query)
    out = m.usage("t1", days=7)

    assert out["available"] is True
    # Two SKUs on the 8th are one point, not two: the chart is daily spend, not per-SKU.
    assert out["points"] == [
        {"date": "2026-09-08", "amount": 8.3, "dbus": 14.0},
        {"date": "2026-09-09", "amount": 11.0, "dbus": 20.0},
    ]
    assert out["total_cost"] == 19.3
    assert [s["name"] for s in out["skus"]] == [
        "PREMIUM_ALL_PURPOSE_COMPUTE", "PREMIUM_SQL_COMPUTE"]
    assert out["top_spenders"][0]["entity"] == "nightly-load"
    assert out["currency"] == "USD"
    assert all("DATE_SUB(CURRENT_DATE(), 7)" in sql for sql in calls)


@pytest.mark.parametrize("days", [0, -5, 10_000, "; DROP TABLE x", None])
def test_usage_window_is_always_an_integer_literal(monkeypatch, days):
    """`days` is formatted into the SQL, so it must be impossible for it to carry any."""
    seen = []

    def fake_query(sql, limit=1000, tenant_id=None, **kw):
        seen.append(sql)
        return _result(["usage_date", "sku_name", "dbus", "list_cost", "currency"], [])

    monkeypatch.setattr(m.dbx, "run_query", fake_query)
    m.usage("t1", days=days)
    for sql in seen:
        assert "DROP" not in sql.upper()
        window = sql.split("DATE_SUB(CURRENT_DATE(), ")[1].split(")")[0]
        assert 1 <= int(window) <= 365


def test_missing_system_tables_is_a_setup_state_not_an_outage(monkeypatch):
    def fake_query(sql, **kw):
        raise dbx.DatabricksError(
            "Statement failed: [TABLE_OR_VIEW_NOT_FOUND] system.billing.usage")

    monkeypatch.setattr(m.dbx, "run_query", fake_query)
    out = m.usage("t1")
    assert out["available"] is False
    assert "system" in out["reason"]


def test_a_real_failure_still_raises(monkeypatch):
    def fake_query(sql, **kw):
        raise dbx.DatabricksError("Databricks returned 503")

    monkeypatch.setattr(m.dbx, "run_query", fake_query)
    with pytest.raises(dbx.DatabricksError):
        m.usage("t1")


def test_queries_reports_worst_p99_not_an_average_of_p99s(monkeypatch):
    monkeypatch.setattr(m.dbx, "run_query", lambda sql, **kw: _result(
        ["compute_id", "statement_type", "queries", "failures",
         "avg_duration_ms", "p99_duration_ms", "read_bytes", "read_rows"],
        [["wh-1", "SELECT", "100", "2", "40.0", "900.0", "1024", "50"],
         ["wh-2", "SELECT", "100", "0", "30.0", "100.0", "512", "20"]],
    ))
    out = m.queries("t1", hours=6)
    assert out["total_queries"] == 200
    assert out["failure_rate"] == 0.01
    assert out["worst_p99_ms"] == 900.0


def test_clusters_lists_running_first_and_needs_no_warehouse(monkeypatch):
    monkeypatch.setattr(m.dbx, "credentials",
                        lambda t=None: {"host": "h", "warehouse_id": "", "token": "tok"})
    monkeypatch.setattr(m, "_workspace_get", lambda path, t: {"clusters": [
        {"cluster_id": "b", "cluster_name": "zeta", "state": "TERMINATED", "num_workers": 0},
        {"cluster_id": "a", "cluster_name": "alpha", "state": "RUNNING", "num_workers": 4},
    ]})
    out = m.clusters("t1")
    assert [c["name"] for c in out["items"]] == ["alpha", "zeta"]
    assert out["running"] == 1
    assert out["total"] == 2


def test_summary_isolates_one_dead_dimension(monkeypatch):
    monkeypatch.setattr(m, "usage", lambda t, d: (_ for _ in ()).throw(
        dbx.DatabricksError("Databricks returned 500")))
    monkeypatch.setattr(m, "queries", lambda t, h: {"available": True, "items": []})
    monkeypatch.setattr(m, "clusters", lambda t: {"available": True, "items": []})
    out = m.summary("t1")
    assert out["usage"]["available"] is False
    # The other two survive — a broken warehouse must not blank the cluster list.
    assert out["queries"]["available"] is True
    assert out["clusters"]["available"] is True


def test_every_statement_passes_the_read_only_guard():
    """These run with the service token's full privileges — the guard must accept them
    for the right reason, not because it was never asked."""
    for sql in (m._DAILY_COST_SQL.format(days=30),
                m._BY_ENTITY_SQL.format(days=30),
                m._QUERY_SQL.format(hours=24)):
        dbx.assert_read_only(sql)
