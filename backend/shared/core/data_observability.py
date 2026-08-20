"""Data observability for Databricks — watch tables the way the platform watches services.

A stale table is a number going wrong over time, exactly like a CPU spike. So this module
adds no detection logic: it turns Delta table history into MetricSeries and hands them to
pipeline.detector.detect_anomalies(), the same engine that already watches infrastructure.
Two pillars are covered here — freshness and volume — which is the vertical the roadmap
calls the smallest real proof. Distribution drift, schema drift and lineage follow the same
pattern onto drift/detect.py and pipeline/service_graph.py.

Everything is read over the SQL client that already exists in core/databricks.py: a
per-tenant, read-only connection to the customer's own workspace. No agent, no new
transport, no write path.

Two things make this work that are worth stating plainly:

  History, not polling. Delta keeps a commit log per table, so the *first* query already
  returns dozens of past commits. Sampling forward instead would leave detect_anomalies()
  below its six-point minimum — and silent — for hours after install.

  The open gap counts. A table that stopped updating three days ago produces no new
  commits, so the gaps *between* commits look perfectly healthy forever. The series
  therefore ends with the still-open gap (now - last commit), which is the one that
  actually grows while a table is dead.
"""

from __future__ import annotations

import json
import logging
import re
from datetime import datetime, timezone
from typing import Any

from . import databricks as dbx
from shared.collector import ingest as collector
from shared.collector.cloudevents import make_event
from shared.pipeline.detector import Anomaly, detect_anomalies
from shared.pipeline.signals import MetricSeries

log = logging.getLogger("pinghold.data_observability")

# Enough commits to give the detector its three windows with room to spare.
_HISTORY_LIMIT = 40
# Guards the reciprocal used for volume-drop detection; a commit writing 0 rows is real.
_EPS = 1e-6

# Unity Catalog names are catalog.schema.table, each part alphanumeric/underscore.
# full_name is interpolated into SQL, so it is validated rather than escaped-and-hoped.
_IDENT = re.compile(r"^[A-Za-z0-9_]+(\.[A-Za-z0-9_]+){2}$")


class InvalidTableName(ValueError):
    """Raised when a table name is not a safe catalog.schema.table identifier."""


def _ident(full_name: str) -> str:
    if not _IDENT.match(full_name or ""):
        raise InvalidTableName(
            f"'{full_name}' is not a valid catalog.schema.table name "
            "(letters, digits and underscores only)"
        )
    return ".".join(f"`{part}`" for part in full_name.split("."))


def _parse_timestamp(value: Any) -> datetime | None:
    if not value:
        return None
    text = str(value).strip().replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(text)
    except ValueError:
        try:
            parsed = datetime.strptime(text[:19], "%Y-%m-%d %H:%M:%S")
        except ValueError:
            return None
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def _rows_written(metrics: Any) -> float | None:
    """numOutputRows out of a commit's operationMetrics.

    Databricks returns MAP columns as a JSON string through the statement API, but some
    versions hand back a dict. Accept both, and treat a commit that reports no row count
    (OPTIMIZE, VACUUM, SET TBLPROPERTIES) as having no volume signal rather than zero.
    """
    if not metrics:
        return None
    if isinstance(metrics, str):
        try:
            metrics = json.loads(metrics)
        except json.JSONDecodeError:
            match = re.search(r"numOutputRows[\"']?\s*[:=]\s*[\"']?(\d+)", metrics)
            return float(match.group(1)) if match else None
    if not isinstance(metrics, dict):
        return None
    value = metrics.get("numOutputRows")
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


# --- reads ------------------------------------------------------------------

def list_tables(tenant_id: str, catalog: str, schema: str | None = None) -> list[dict[str, Any]]:
    """Discover tables to watch, from Unity Catalog's own inventory.

    Discovery only. `last_altered` here tracks metadata changes, so freshness is measured
    from the Delta commit log instead — see history().
    """
    where = ["table_catalog = :catalog", "table_schema <> 'information_schema'"]
    params: dict[str, str] = {"catalog": catalog}
    if schema:
        where.append("table_schema = :schema")
        params["schema"] = schema

    # Bound server-side, so a catalog or schema name a user typed can never become SQL.
    sql = (
        "SELECT table_catalog, table_schema, table_name, table_type, last_altered "
        "FROM system.information_schema.tables "
        f"WHERE {' AND '.join(where)} "
        "ORDER BY last_altered DESC"
    )
    result = dbx.run_query(sql, limit=500, tenant_id=tenant_id, parameters=params)
    return [{
        "catalog": row[0],
        "schema": row[1],
        "name": row[2],
        "full_name": f"{row[0]}.{row[1]}.{row[2]}",
        "table_type": row[3],
        "last_altered": row[4],
    } for row in result["rows"]]


def history(full_name: str, tenant_id: str, limit: int = _HISTORY_LIMIT) -> list[dict[str, Any]]:
    """Recent commits for one Delta table, oldest first.

    DESCRIBE HISTORY returns newest first; the detector reads a series left-to-right as
    time moving forward, so this reverses it.
    """
    result = dbx.run_query(
        f"DESCRIBE HISTORY {_ident(full_name)} LIMIT {int(limit)}",
        limit=limit,
        tenant_id=tenant_id,
    )
    index = {name.lower(): position for position, name in enumerate(result["columns"])}

    def field(row: list, name: str) -> Any:
        position = index.get(name)
        return row[position] if position is not None and position < len(row) else None

    entries = []
    for row in result["rows"]:
        timestamp = _parse_timestamp(field(row, "timestamp"))
        if not timestamp:
            continue
        entries.append({
            "version": field(row, "version"),
            "timestamp": timestamp,
            "operation": field(row, "operation") or "",
            "rows_written": _rows_written(field(row, "operationmetrics")),
        })
    entries.sort(key=lambda e: e["timestamp"])
    return entries


# --- signals ----------------------------------------------------------------

def freshness_series(full_name: str, entries: list[dict[str, Any]],
                     now: datetime | None = None) -> MetricSeries:
    """Minutes between successive commits, ending with the gap that is still open.

    That final value is the one that matters: a table that died yesterday has a perfectly
    steady history and a gap since its last commit that keeps growing.
    """
    now = now or datetime.now(timezone.utc)
    stamps = [e["timestamp"] for e in entries]
    gaps = [(b - a).total_seconds() / 60.0 for a, b in zip(stamps, stamps[1:])]
    if stamps:
        gaps.append((now - stamps[-1]).total_seconds() / 60.0)
    return MetricSeries(service=full_name, metric="freshness_gap_minutes", values=gaps)


def volume_series(full_name: str, entries: list[dict[str, Any]]) -> MetricSeries:
    """Rows written per commit, for commits that reported a row count."""
    values = [e["rows_written"] for e in entries if e["rows_written"] is not None]
    return MetricSeries(service=full_name, metric="volume_rows", values=values)


def _detect_drop(series: MetricSeries) -> list[Anomaly]:
    """Find a *fall* using detectors that only look for rises.

    ponytail: feed the reciprocal — an 80% drop in rows is a 5x rise in 1/rows, which the
    existing ratio/MAD/EWMA strategies catch unchanged. The alternative is a fourth
    strategy in detector.py that duplicates all three in the other direction. Reported
    numbers are rebuilt from the real values below, so nothing downstream sees a
    reciprocal.
    """
    if len(series.values) < 6:
        return []
    inverted = MetricSeries(
        service=series.service,
        metric=series.metric,
        values=[1.0 / max(v, _EPS) for v in series.values],
    )
    anomalies = detect_anomalies([inverted])

    third = max(1, len(series.values) // 3)
    baseline = sum(series.values[:third]) / third
    current = sum(series.values[-third:]) / third
    for anomaly in anomalies:
        anomaly.baseline = round(baseline, 2)
        anomaly.current = round(current, 2)
        # Restated in the real direction: how many times smaller, not how many times bigger.
        anomaly.score = round(baseline / max(current, _EPS), 2)
    return anomalies


def _title(full_name: str, anomaly: Anomaly, staleness: float | None) -> tuple[str, str]:
    if anomaly.metric == "freshness_gap_minutes":
        return (
            f"{full_name} is stale",
            f"No new data for {staleness:.0f} minutes; this table normally updates every "
            f"{anomaly.baseline:.0f} minutes.",
        )
    drop = 1 - (anomaly.current / anomaly.baseline) if anomaly.baseline else 0.0
    return (
        f"{full_name} volume dropped {drop:.0%}",
        f"Recent commits wrote {anomaly.current:.0f} rows on average, against a baseline "
        f"of {anomaly.baseline:.0f}.",
    )


def check_table(full_name: str, tenant_id: str, now: datetime | None = None) -> dict[str, Any]:
    """Freshness and volume for one table, judged by the existing anomaly engine."""
    now = now or datetime.now(timezone.utc)
    entries = history(full_name, tenant_id)

    last_commit = entries[-1]["timestamp"] if entries else None
    staleness = (now - last_commit).total_seconds() / 60.0 if last_commit else None

    freshness = freshness_series(full_name, entries, now)
    volume = volume_series(full_name, entries)

    # Staleness is a rise, so the stock detectors read it directly; a volume drop is a
    # fall and goes through the reciprocal.
    anomalies = detect_anomalies([freshness]) + _detect_drop(volume)

    findings = []
    for anomaly in anomalies:
        title, detail = _title(full_name, anomaly, staleness)
        findings.append({
            "kind": "stale" if anomaly.metric == "freshness_gap_minutes" else "volume_drop",
            "severity": anomaly.severity,
            "title": title,
            "detail": detail,
            "metric": anomaly.metric,
            "score": anomaly.score,
            "current": anomaly.current,
            "baseline": anomaly.baseline,
            "detected_by": anomaly.detected_by,
        })

    severities = {f["severity"] for f in findings}
    return {
        "table": full_name,
        "commits": len(entries),
        "last_commit": last_commit.isoformat() if last_commit else None,
        "staleness_minutes": round(staleness, 1) if staleness is not None else None,
        "freshness_values": [round(v, 2) for v in freshness.values],
        "volume_values": volume.values,
        # Says why a healthy-looking table is silent: too new to judge, not proven fine.
        "evaluated": len(freshness.values) >= 6,
        "findings": findings,
        "status": "critical" if "critical" in severities else ("warning" if severities else "healthy"),
    }


def scan(tenant_id: str, tables: list[str], emit: bool = True,
         now: datetime | None = None) -> list[dict[str, Any]]:
    """Check several tables and raise a data incident for each finding.

    Incidents go onto the same event path as everything else, so they land in the recent
    events buffer, get clustered with the rest of the alert traffic, and reach the incident
    UI without a parallel pipeline.
    """
    results = []
    for full_name in tables:
        try:
            result = check_table(full_name, tenant_id, now)
        except (dbx.NotConfigured, dbx.DatabricksError, InvalidTableName) as exc:
            results.append({"table": full_name, "status": "unknown", "error": str(exc),
                            "findings": []})
            continue

        if emit:
            for finding in result["findings"]:
                collector.ingest(make_event(
                    source="databricks",
                    type="data.incident",
                    tenant_id=tenant_id,
                    correlationid=full_name,
                    data={
                        "severity": "critical" if finding["severity"] == "critical" else "warning",
                        "title": finding["title"],
                        "description": finding["detail"],
                        "service": full_name,
                        "pillar": "freshness" if finding["kind"] == "stale" else "volume",
                    },
                ))
        results.append(result)

    order = {"critical": 0, "warning": 1, "unknown": 2, "healthy": 3}
    results.sort(key=lambda r: order.get(r["status"], 9))
    return results


def status(tenant_id: str) -> dict[str, Any]:
    """Whether this tenant can be scanned at all. Never raises: it is the diagnostic."""
    view = dbx.masked_credentials(tenant_id)
    return {
        "configured": view["configured"],
        "host": view["host"],
        "source": view["source"],
        "pillars": ["freshness", "volume"],
        "engine": "pipeline.detector (shared with infrastructure monitoring)",
    }
