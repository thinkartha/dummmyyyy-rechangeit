"""Databricks consumption, query and cluster metrics — the dimensions the ETL poller misses.

The existing Databricks wiring watches *job runs* (shared/etl/pollers/databricks.py) and
browses Delta tables (shared/core/databricks.py). Neither answers the questions a
Databricks owner actually opens a monitoring tool for: what is this workspace costing,
which jobs and warehouses are spending it, and are the queries healthy.

Shape borrowed from New Relic's Databricks integration, which collects the same four
dimensions — consumption, jobs, queries, clusters. Two differences, both deliberate:

  * Cost and query metrics come from the **system tables** over the SQL warehouse this
    tenant already configured, not from a per-workspace agent. There is no agent to
    install and nothing new to authorise beyond SELECT on `system`.
  * Spark executor/stage metrics are not collected. They need a driver-side listener on
    every cluster; the cluster *list* below covers "is it running and how big is it",
    which is what the page shows. ponytail: add the Spark REST scrape when someone asks
    for stage-level detail.

System tables are opt-in per metastore. When they are absent this returns
`available: False` with the reason rather than raising, so the page can say "enable
system schemas" instead of showing a 502 that reads like an outage.
"""

from __future__ import annotations

import json
import logging
import urllib.error
import urllib.request
from typing import Any

from . import databricks as dbx

log = logging.getLogger("pinghold.databricks.metrics")

_TIMEOUT = 30

# Cost and usage live here. A metastore without system schemas enabled has neither, and
# the statement fails with a TABLE_OR_VIEW_NOT_FOUND that is not an outage.
_MISSING_TABLE_MARKERS = (
    "table_or_view_not_found", "schema_not_found", "does not exist",
    "cannot be found", "insufficient_permissions", "permission",
)


def _clamp(value: Any, default: int, low: int, high: int) -> int:
    try:
        return max(low, min(high, int(value)))
    except (TypeError, ValueError):
        return default


def _rows(sql: str, tenant_id: str | None, limit: int = 1000) -> list[dict[str, Any]]:
    """Run a SELECT and zip each row against its column names."""
    result = dbx.run_query(sql, limit=limit, tenant_id=tenant_id)
    columns = result["columns"]
    return [dict(zip(columns, row)) for row in result["rows"]]


def _number(value: Any, default: float = 0.0) -> float:
    """The statement API returns every cell as a string, including numerics."""
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _guarded(fn, *args, **kwargs) -> dict[str, Any]:
    """Turn "system tables are not enabled" into a state the page can render.

    A missing system schema is a setup step, not a failure: raising 502 here would put
    "Databricks is down" on screen for a workspace that is perfectly healthy and simply
    has not opted in. Anything else still raises — a real outage should look like one.
    """
    try:
        return fn(*args, **kwargs)
    except dbx.NotConfigured:
        raise
    except dbx.DatabricksError as exc:
        text = str(exc).lower()
        if any(marker in text for marker in _MISSING_TABLE_MARKERS):
            return {
                "available": False,
                "reason": (
                    "Databricks system tables are not readable by this token. Enable the "
                    "`system` schemas on the metastore and grant SELECT on system.billing "
                    "and system.query."
                ),
            }
        raise


# --- consumption ------------------------------------------------------------

# usage_quantity is DBUs; list_prices carries the published per-DBU rate, matched on the
# price window the usage falls in. This is list price, not the invoice: it excludes
# committed-use discounts and the cloud provider's own compute charge, both of which are
# outside Databricks' system tables entirely. The page says so rather than implying
# otherwise — a cost number people cannot reconcile is worse than no cost number.
_DAILY_COST_SQL = """
SELECT u.usage_date AS usage_date,
       u.sku_name AS sku_name,
       SUM(u.usage_quantity) AS dbus,
       SUM(u.usage_quantity * COALESCE(p.pricing.default, 0)) AS list_cost,
       MAX(p.currency_code) AS currency
FROM system.billing.usage u
LEFT JOIN system.billing.list_prices p
       ON u.sku_name = p.sku_name
      AND u.usage_end_time >= p.price_start_time
      AND (p.price_end_time IS NULL OR u.usage_end_time < p.price_end_time)
WHERE u.usage_date >= DATE_SUB(CURRENT_DATE(), {days})
GROUP BY u.usage_date, u.sku_name
ORDER BY u.usage_date
"""

# Attribution: usage_metadata carries whichever of job/warehouse/cluster produced the
# DBUs. Spend that belongs to none of them is real spend and is labelled rather than
# dropped — an "unattributed" row people can see is what makes the total add up.
_BY_ENTITY_SQL = """
SELECT COALESCE(u.usage_metadata.job_name,
                u.usage_metadata.job_id,
                u.usage_metadata.warehouse_id,
                u.usage_metadata.cluster_id,
                'unattributed') AS entity,
       CASE WHEN u.usage_metadata.job_id IS NOT NULL THEN 'job'
            WHEN u.usage_metadata.warehouse_id IS NOT NULL THEN 'warehouse'
            WHEN u.usage_metadata.cluster_id IS NOT NULL THEN 'cluster'
            ELSE 'unattributed' END AS entity_type,
       SUM(u.usage_quantity) AS dbus,
       SUM(u.usage_quantity * COALESCE(p.pricing.default, 0)) AS list_cost,
       MAX(p.currency_code) AS currency
FROM system.billing.usage u
LEFT JOIN system.billing.list_prices p
       ON u.sku_name = p.sku_name
      AND u.usage_end_time >= p.price_start_time
      AND (p.price_end_time IS NULL OR u.usage_end_time < p.price_end_time)
WHERE u.usage_date >= DATE_SUB(CURRENT_DATE(), {days})
GROUP BY 1, 2
ORDER BY list_cost DESC
LIMIT 50
"""


def usage(tenant_id: str | None = None, days: int = 30) -> dict[str, Any]:
    """DBU consumption and list cost: a daily series, a SKU split, and a spender ranking.

    `days` is clamped and formatted into the statement rather than bound as a parameter:
    DATE_SUB's second argument must be an integer literal, and a value that has been
    through int() cannot carry SQL.
    """
    days = _clamp(days, 30, 1, 365)
    return _guarded(_usage, tenant_id, days)


def _usage(tenant_id: str | None, days: int) -> dict[str, Any]:
    daily_rows = _rows(_DAILY_COST_SQL.format(days=days), tenant_id, limit=5000)
    entity_rows = _rows(_BY_ENTITY_SQL.format(days=days), tenant_id, limit=50)

    currency = next((r.get("currency") for r in daily_rows if r.get("currency")), "USD")

    by_date: dict[str, dict[str, float]] = {}
    by_sku: dict[str, dict[str, float]] = {}
    for row in daily_rows:
        date = str(row.get("usage_date") or "")[:10]
        sku = str(row.get("sku_name") or "unknown")
        cost = _number(row.get("list_cost"))
        dbus = _number(row.get("dbus"))
        day = by_date.setdefault(date, {"cost": 0.0, "dbus": 0.0})
        day["cost"] += cost
        day["dbus"] += dbus
        bucket = by_sku.setdefault(sku, {"cost": 0.0, "dbus": 0.0})
        bucket["cost"] += cost
        bucket["dbus"] += dbus

    points = [{"date": d, "amount": round(v["cost"], 2), "dbus": round(v["dbus"], 2)}
              for d, v in sorted(by_date.items())]
    skus = sorted(
        ({"name": k, "amount": round(v["cost"], 2), "dbus": round(v["dbus"], 2)}
         for k, v in by_sku.items()),
        key=lambda s: s["amount"], reverse=True)

    return {
        "available": True,
        "currency": currency,
        "days": days,
        "total_cost": round(sum(p["amount"] for p in points), 2),
        "total_dbus": round(sum(p["dbus"] for p in points), 2),
        "points": points,
        "skus": skus,
        "top_spenders": [
            {
                "entity": str(r.get("entity") or "unattributed"),
                "entity_type": str(r.get("entity_type") or "unattributed"),
                "dbus": round(_number(r.get("dbus")), 2),
                "amount": round(_number(r.get("list_cost")), 2),
            }
            for r in entity_rows
        ],
        # Said once, here, so every caller repeats the same caveat.
        "basis": "Databricks list price on DBUs consumed. Excludes committed-use "
                 "discounts and the underlying cloud compute charge.",
    }


# --- query history ----------------------------------------------------------

# MAKE_INTERVAL rather than INTERVAL <n> HOURS: the literal form will not take a
# formatted value on every runtime version, and this one is consistent.
_QUERY_SQL = """
SELECT COALESCE(q.compute.warehouse_id, q.compute.cluster_id, 'unknown') AS compute_id,
       COALESCE(q.statement_type, 'UNKNOWN') AS statement_type,
       COUNT(*) AS queries,
       SUM(CASE WHEN q.execution_status <> 'FINISHED' THEN 1 ELSE 0 END) AS failures,
       ROUND(AVG(q.total_duration_ms), 1) AS avg_duration_ms,
       ROUND(approx_percentile(q.total_duration_ms, 0.99), 1) AS p99_duration_ms,
       SUM(COALESCE(q.read_bytes, 0)) AS read_bytes,
       SUM(COALESCE(q.read_rows, 0)) AS read_rows
FROM system.query.history q
WHERE q.start_time >= CURRENT_TIMESTAMP() - MAKE_INTERVAL(0, 0, 0, 0, {hours}, 0, 0)
GROUP BY 1, 2
ORDER BY queries DESC
LIMIT 100
"""


def queries(tenant_id: str | None = None, hours: int = 24) -> dict[str, Any]:
    """Query volume, failure rate and latency per compute, from system.query.history."""
    hours = _clamp(hours, 24, 1, 720)
    return _guarded(_queries, tenant_id, hours)


def _queries(tenant_id: str | None, hours: int) -> dict[str, Any]:
    rows = _rows(_QUERY_SQL.format(hours=hours), tenant_id, limit=100)
    items = [
        {
            "compute_id": str(r.get("compute_id") or "unknown"),
            "statement_type": str(r.get("statement_type") or "UNKNOWN"),
            "queries": int(_number(r.get("queries"))),
            "failures": int(_number(r.get("failures"))),
            "avg_duration_ms": round(_number(r.get("avg_duration_ms")), 1),
            "p99_duration_ms": round(_number(r.get("p99_duration_ms")), 1),
            "read_bytes": int(_number(r.get("read_bytes"))),
            "read_rows": int(_number(r.get("read_rows"))),
        }
        for r in rows
    ]
    total = sum(i["queries"] for i in items)
    failures = sum(i["failures"] for i in items)
    return {
        "available": True,
        "hours": hours,
        "total_queries": total,
        "total_failures": failures,
        # Percentiles do not recombine, so this is the worst compute's p99 named as such
        # rather than an average of p99s, which would be a number nothing ever measured.
        "worst_p99_ms": max((i["p99_duration_ms"] for i in items), default=0.0),
        "failure_rate": round(failures / total, 4) if total else 0.0,
        "items": items,
    }


# --- clusters ---------------------------------------------------------------

def _workspace_get(path: str, tenant_id: str | None) -> dict[str, Any]:
    """A workspace REST call that needs host+token only.

    databricks._get requires a warehouse id too, because everything else it serves is a
    SQL statement. The clusters API is not, and a tenant that connected Jobs but no
    warehouse should still see its clusters.
    """
    creds = dbx.credentials(tenant_id)
    if not (creds["host"] and creds["token"]):
        raise dbx.NotConfigured(
            "Databricks not configured for this organization: host and token missing."
        )
    req = urllib.request.Request(
        f"https://{creds['host']}{path}",
        headers={"Authorization": f"Bearer {creds['token']}"},
    )
    try:
        with urllib.request.urlopen(req, timeout=_TIMEOUT) as resp:
            return json.loads(resp.read() or b"{}")
    except urllib.error.HTTPError as exc:
        raise dbx.DatabricksError(f"Databricks returned {exc.code}") from exc
    except Exception as exc:
        raise dbx.DatabricksError(f"Databricks unreachable: {exc}") from exc


_RUNNING_STATES = {"RUNNING", "RESIZING"}


def clusters(tenant_id: str | None = None) -> dict[str, Any]:
    """Every cluster in the workspace with its state and size.

    Job clusters are included and labelled: they are where most job DBUs are spent, and
    hiding them would make the cluster list disagree with the cost attribution above it.
    """
    data = _workspace_get("/api/2.1/clusters/list?page_size=100", tenant_id)
    raw = data.get("clusters") if isinstance(data, dict) else None
    items = []
    for entry in raw or []:
        if not isinstance(entry, dict):
            continue
        state = str(entry.get("state") or "UNKNOWN").upper()
        autoscale = entry.get("autoscale") if isinstance(entry.get("autoscale"), dict) else {}
        items.append({
            "cluster_id": str(entry.get("cluster_id") or ""),
            "name": str(entry.get("cluster_name") or entry.get("cluster_id") or "unnamed"),
            "state": state,
            "state_message": str(entry.get("state_message") or "") or None,
            "source": str(entry.get("cluster_source") or "UNKNOWN"),
            "spark_version": str(entry.get("spark_version") or ""),
            "node_type": str(entry.get("node_type_id") or ""),
            "workers": int(_number(entry.get("num_workers"))),
            "min_workers": int(_number(autoscale.get("min_workers"))) or None,
            "max_workers": int(_number(autoscale.get("max_workers"))) or None,
            "autotermination_minutes": int(_number(entry.get("autotermination_minutes"))),
            "creator": str(entry.get("creator_user_name") or "") or None,
            "running": state in _RUNNING_STATES,
        })
    items.sort(key=lambda c: (not c["running"], c["name"].lower()))
    return {
        "available": True,
        "total": len(items),
        "running": sum(1 for c in items if c["running"]),
        "items": items,
    }


# --- rollup -----------------------------------------------------------------

def summary(tenant_id: str | None = None, days: int = 30, hours: int = 24) -> dict[str, Any]:
    """The headline numbers, with each dimension's failure isolated to its own key.

    One unavailable dimension must not blank the other three: a metastore with no system
    tables still has clusters, and a workspace with no warehouse still has cost history.
    """
    out: dict[str, Any] = {"configured": dbx.jobs_configured(tenant_id)}
    for key, fn in (("usage", lambda: usage(tenant_id, days)),
                    ("queries", lambda: queries(tenant_id, hours)),
                    ("clusters", lambda: clusters(tenant_id))):
        try:
            out[key] = fn()
        except dbx.NotConfigured as exc:
            out[key] = {"available": False, "reason": str(exc)}
        except dbx.DatabricksError as exc:
            log.warning("Databricks %s metrics failed: %s", key, exc)
            out[key] = {"available": False, "reason": str(exc)}
    return out
