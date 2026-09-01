"""What the catalog inspector reports, and what it declines to report.

Runs against a live Postgres seeded from backend/seeds/demo_commerce.sql, and skips
itself when one is not reachable — so it is a check you can run, not a gate that fails
on every machine without Docker.

    docker run -d --name lhb-demo-db -e POSTGRES_PASSWORD=lhbdemo -e POSTGRES_USER=lhb \
        -e POSTGRES_DB=commerce -p 55432:5432 postgres:16-alpine
    docker exec -i lhb-demo-db psql -U lhb -d commerce < backend/seeds/demo_commerce.sql
    python3 -m pytest backend/handlers/routers/test_dbinspect.py -q
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))

import pytest  # noqa: E402

from shared.core import dbinspect  # noqa: E402

DSN = os.getenv("LHB_DEMO_DSN", "postgresql://lhb:lhbdemo@127.0.0.1:55432/commerce")


@pytest.fixture(scope="module")
def report():
    try:
        import psycopg2

        psycopg2.connect(DSN, connect_timeout=2).close()
    except Exception as exc:
        pytest.skip(f"no seeded demo database at {DSN}: {exc}")
    return dbinspect.inspect_postgres(DSN)


def _of(report, kind):
    return [f for f in report["findings"] if f["kind"] == kind]


def test_every_check_ran(report):
    assert report["checks_failed"] == []
    assert set(report["checks_run"]) == {"schema_drift", "volume", "redundancy"}


def test_schema_drift_names_the_added_dropped_and_retyped_columns(report):
    drift = {f["object"]: f for f in _of(report, "schema_drift")}
    orders = drift["prod.orders ↔ stage.orders"]
    assert orders["severity"] == "critical"
    assert orders["evidence"]["missing_in"][0]["columns"] == ["currency"]
    assert orders["evidence"]["only_in"][0]["columns"] == ["promo_code"]
    assert {c["column"] for c in orders["evidence"]["type_changes"]} == {"status", "total"}
    # A column added to prod alone drifts just as much as one added to stage.
    assert drift["prod.customers ↔ stage.customers"]["evidence"]["missing_in"][0][
        "columns"
    ] == ["deleted_at"]


def test_volume_drop_is_found_and_the_steady_table_is_not(report):
    drops = {f["object"]: f for f in _of(report, "volume_drop")}
    events = drops["prod.daily_events"]
    assert events["severity"] == "critical"
    assert events["evidence"]["latest_rows"] < events["evidence"]["median_rows"] / 2
    # order_items loads at a constant rate. A detector that flags it flags everything.
    assert "prod.order_items" not in drops


def test_partial_today_is_not_mistaken_for_a_drop(report):
    """The newest day in the window is yesterday, never a half-finished today."""
    import datetime

    yesterday = str(datetime.date.today() - datetime.timedelta(days=1))
    for f in _of(report, "volume_drop"):
        assert f["evidence"]["latest_day"] == yesterday


def test_redundancy_finds_each_flavour(report):
    dup_index = _of(report, "duplicate_index")
    assert any(set(f["evidence"]["indexes"])
               == {"idx_orders_customer", "idx_orders_customer_dup"} for f in dup_index)

    prefix = _of(report, "redundant_index")
    assert any(f["evidence"]["index"] == "idx_orders_status"
               and f["evidence"]["covered_by"] == "idx_orders_status_placed" for f in prefix)

    dup_rows = {f["object"]: f for f in _of(report, "duplicate_rows")}
    assert dup_rows["prod.payments"]["evidence"]["duplicate_rows"] == 120

    keyless = {f["object"] for f in _of(report, "no_primary_key")}
    assert {"prod.payments", "prod.audit_log"} <= keyless
    # Tables that do have a key are not accused of lacking one.
    assert "prod.orders" not in keyless


def test_findings_are_ordered_worst_first(report):
    rank = {"critical": 0, "warning": 1, "info": 2}
    order = [rank[f["severity"]] for f in report["findings"]]
    assert order == sorted(order)


if __name__ == "__main__":
    sys.exit(pytest.main([__file__, "-q"]))
