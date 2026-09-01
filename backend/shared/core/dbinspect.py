"""Catalog inspection for a registered Postgres: what is wrong with the data, not the server.

core/dbmon.py answers "is this database up and coping" — connections, latency,
replication lag. That leaves the failures that never touch an availability metric: a
migration applied to prod and not to stage, an upstream job that quietly stopped
loading, an index created twice. A database in that state is healthy by every
operational measure and still wrong.

Everything here is derived by querying the catalog and the tables themselves. Nothing
is stored, so there is no findings table to go stale, and no finding can exist that the
database does not currently support.

Read-only: the session is opened read-only and every statement is a SELECT.

ponytail: bounded rather than clever — volume history comes from a date column the
table already has, and duplicate-row scans are capped at _DUP_SCAN_MAX_ROWS. Neither
survives contact with a billion-row warehouse; that wants the engine's own statistics
views, and this wants to stay something you can run against prod without asking.
"""

from __future__ import annotations

import logging
import statistics
from typing import Any

log = logging.getLogger("pinghold.dbinspect")

# Comparing a partial day against full days reports a drop every morning. The newest
# *complete* day is the one worth judging.
_VOLUME_LOOKBACK_DAYS = 30
_VOLUME_MIN_DAYS = 7
_VOLUME_DROP_WARN = 0.40
_VOLUME_DROP_CRIT = 0.70

# A duplicate-row scan is a GROUP BY over every column. Fine on a demo table, not on a
# fact table — so tables above this estimated size are skipped and said to be skipped.
_DUP_SCAN_MAX_ROWS = 200_000
_MAX_TABLES_SCANNED = 25

_SKIP_SCHEMAS = ("pg_catalog", "information_schema", "pg_toast")

_SEVERITY_ORDER = {"critical": 0, "warning": 1, "info": 2}


class Unsupported(RuntimeError):
    """The registered engine has no inspector — only Postgres does today."""


def _finding(kind: str, severity: str, obj: str, summary: str, **evidence: Any) -> dict[str, Any]:
    return {"kind": kind, "severity": severity, "object": obj, "summary": summary,
            "evidence": evidence}


# --- schema drift -----------------------------------------------------------

def _schema_drift(cur) -> list[dict[str, Any]]:
    """Tables of the same name in two schemas whose columns no longer agree.

    Environments are schemas here (prod / stage). The same comparison is what you want
    across two databases; this is the version that needs one connection.
    """
    cur.execute(
        """
        SELECT table_schema, table_name, column_name, data_type,
               COALESCE(character_maximum_length, numeric_precision) AS width
        FROM information_schema.columns
        WHERE table_schema NOT IN %s
        ORDER BY table_schema, table_name, ordinal_position
        """,
        (_SKIP_SCHEMAS,),
    )
    # {table_name: {schema: {column: (type, width)}}}
    tables: dict[str, dict[str, dict[str, tuple]]] = {}
    for schema, table, column, dtype, width in cur.fetchall():
        tables.setdefault(table, {}).setdefault(schema, {})[column] = (dtype, width)

    findings = []
    for table, by_schema in sorted(tables.items()):
        if len(by_schema) < 2:
            continue
        # The alphabetically first schema is the reference. Arbitrary, but stable — a
        # drift report that reverses direction between runs is unreadable.
        schemas = sorted(by_schema)
        base_name, base = schemas[0], by_schema[schemas[0]]
        for other_name in schemas[1:]:
            other = by_schema[other_name]
            missing = sorted(set(base) - set(other))
            extra = sorted(set(other) - set(base))
            changed = [
                {"column": c, base_name: _spell(base[c]), other_name: _spell(other[c])}
                for c in sorted(set(base) & set(other))
                if base[c] != other[c]
            ]
            if not (missing or extra or changed):
                continue
            parts = []
            if missing:
                parts.append(f"{len(missing)} column(s) missing from {other_name}")
            if extra:
                parts.append(f"{len(extra)} only in {other_name}")
            if changed:
                parts.append(f"{len(changed)} type change(s)")
            findings.append(_finding(
                "schema_drift",
                "critical" if changed else "warning",
                f"{base_name}.{table} ↔ {other_name}.{table}",
                "; ".join(parts),
                missing_in=[{"schema": other_name, "columns": missing}] if missing else [],
                only_in=[{"schema": other_name, "columns": extra}] if extra else [],
                type_changes=changed,
            ))
    return findings


def _spell(col: tuple) -> str:
    dtype, width = col
    return f"{dtype}({width})" if width else dtype


# --- volume ------------------------------------------------------------------

def _volume(cur) -> list[dict[str, Any]]:
    """Tables whose newest complete day is far below their own recent norm.

    A table that stops loading stays reachable, keeps its schema, and reports healthy
    everywhere else. Its daily row count is the only thing that changes.
    """
    cur.execute(
        """
        SELECT c.table_schema, c.table_name, MIN(c.column_name) AS date_column
        FROM information_schema.columns c
        JOIN pg_catalog.pg_stat_user_tables s
          ON s.schemaname = c.table_schema AND s.relname = c.table_name
        WHERE c.table_schema NOT IN %s
          AND c.data_type IN ('date', 'timestamp without time zone',
                              'timestamp with time zone')
        GROUP BY 1, 2
        ORDER BY 1, 2
        LIMIT %s
        """,
        (_SKIP_SCHEMAS, _MAX_TABLES_SCANNED),
    )
    candidates = cur.fetchall()

    findings = []
    for schema, table, column in candidates:
        try:
            cur.execute(
                f'SELECT {_ident(column)}::date AS day, count(*) '
                f'FROM {_ident(schema)}.{_ident(table)} '
                f'WHERE {_ident(column)} >= CURRENT_DATE - %s '
                f'  AND {_ident(column)} < CURRENT_DATE '
                f'GROUP BY 1 ORDER BY 1',
                (_VOLUME_LOOKBACK_DAYS,),
            )
            series = cur.fetchall()
        except Exception as exc:  # a view, a permission, a partition — skip, don't fail
            log.debug("volume scan skipped for %s.%s: %s", schema, table, exc)
            continue

        if len(series) < _VOLUME_MIN_DAYS:
            continue
        counts = [int(n) for _, n in series]
        latest_day, latest = series[-1][0], counts[-1]
        baseline = statistics.median(counts[:-1])
        if not baseline:
            continue
        drop = 1 - (latest / baseline)
        if drop < _VOLUME_DROP_WARN:
            continue
        findings.append(_finding(
            "volume_drop",
            "critical" if drop >= _VOLUME_DROP_CRIT else "warning",
            f"{schema}.{table}",
            f"{drop:.0%} below its {len(counts) - 1}-day median on {latest_day}",
            date_column=column,
            latest_day=str(latest_day),
            latest_rows=latest,
            median_rows=int(baseline),
            series=[{"day": str(d), "rows": int(n)} for d, n in series[-14:]],
        ))
    return findings


# --- redundancy --------------------------------------------------------------

def _redundancy(cur) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []

    # Indexes, with their column list in key order.
    cur.execute(
        """
        SELECT n.nspname, t.relname, i.relname,
               array_agg(a.attname ORDER BY k.ord) AS cols,
               ix.indisunique, ix.indisprimary,
               pg_relation_size(ix.indexrelid) AS bytes
        FROM pg_index ix
        JOIN pg_class i ON i.oid = ix.indexrelid
        JOIN pg_class t ON t.oid = ix.indrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        JOIN LATERAL unnest(ix.indkey) WITH ORDINALITY AS k(attnum, ord) ON TRUE
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.attnum
        WHERE n.nspname NOT IN %s
        GROUP BY 1, 2, 3, 5, 6, 7
        ORDER BY 1, 2, 3
        """,
        (_SKIP_SCHEMAS,),
    )
    indexes = [
        {"schema": s, "table": t, "index": i, "cols": list(cols),
         "unique": uniq, "primary": pk, "bytes": int(b)}
        for s, t, i, cols, uniq, pk, b in cur.fetchall()
    ]

    # Identical column lists on the same table: one of them is dead weight that every
    # write still has to maintain.
    by_cols: dict[tuple, list[dict]] = {}
    for idx in indexes:
        by_cols.setdefault((idx["schema"], idx["table"], tuple(idx["cols"])), []).append(idx)
    for (schema, table, cols), group in sorted(by_cols.items()):
        if len(group) < 2:
            continue
        names = sorted(i["index"] for i in group)
        findings.append(_finding(
            "duplicate_index", "warning", f"{schema}.{table}",
            f"{len(group)} indexes on the same column(s) ({', '.join(cols)})",
            indexes=names, columns=list(cols),
            wasted_bytes=sum(i["bytes"] for i in group[1:]),
        ))

    # A narrower index whose columns are a leading prefix of a wider one is already
    # served by the wider one.
    for a in indexes:
        if a["primary"] or a["unique"]:
            continue
        for b in indexes:
            if a is b or a["schema"] != b["schema"] or a["table"] != b["table"]:
                continue
            if len(a["cols"]) < len(b["cols"]) and b["cols"][: len(a["cols"])] == a["cols"]:
                findings.append(_finding(
                    "redundant_index", "info", f"{a['schema']}.{a['table']}",
                    f"{a['index']} is a prefix of {b['index']} and can be dropped",
                    index=a["index"], covered_by=b["index"],
                    columns=a["cols"], wasted_bytes=a["bytes"],
                ))
                break

    # Never scanned since the last statistics reset.
    cur.execute(
        """
        SELECT s.schemaname, s.relname, s.indexrelname,
               pg_relation_size(s.indexrelid) AS bytes
        FROM pg_stat_user_indexes s
        JOIN pg_index i ON i.indexrelid = s.indexrelid
        WHERE s.idx_scan = 0 AND NOT i.indisunique AND NOT i.indisprimary
        ORDER BY bytes DESC
        """
    )
    for schema, table, index, size in cur.fetchall():
        findings.append(_finding(
            "unused_index", "info", f"{schema}.{table}",
            f"{index} has never been scanned",
            index=index, wasted_bytes=int(size),
        ))

    # No primary key — and therefore nothing preventing the same row twice.
    cur.execute(
        """
        SELECT n.nspname, c.relname, COALESCE(st.n_live_tup, 0)
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        LEFT JOIN pg_stat_user_tables st
          ON st.schemaname = n.nspname AND st.relname = c.relname
        WHERE c.relkind = 'r' AND n.nspname NOT IN %s
          AND NOT EXISTS (
              SELECT 1 FROM pg_index i WHERE i.indrelid = c.oid AND i.indisprimary
          )
        ORDER BY 1, 2
        """,
        (_SKIP_SCHEMAS,),
    )
    keyless = cur.fetchall()
    for schema, table, live in keyless:
        findings.append(_finding(
            "no_primary_key", "info", f"{schema}.{table}",
            "No primary key, so duplicate rows cannot be rejected",
            estimated_rows=int(live),
        ))

    # Only the keyless tables can hold exact duplicates, and only small ones are worth
    # a full GROUP BY. Anything skipped is reported as skipped rather than as clean.
    for schema, table, live in keyless:
        if live > _DUP_SCAN_MAX_ROWS:
            findings.append(_finding(
                "duplicate_rows", "info", f"{schema}.{table}",
                f"Not scanned for duplicates: ~{live:,} rows exceeds the "
                f"{_DUP_SCAN_MAX_ROWS:,}-row scan limit",
                skipped=True, estimated_rows=int(live),
            ))
            continue
        try:
            cur.execute(
                f"SELECT COALESCE(sum(n), 0), count(*) FROM ("
                f"  SELECT count(*) - 1 AS n FROM {_ident(schema)}.{_ident(table)} "
                f"  GROUP BY {_ident(schema)}.{_ident(table)}.* HAVING count(*) > 1"
                f") d"
            )
            surplus, groups = cur.fetchone()
        except Exception as exc:
            log.debug("duplicate scan skipped for %s.%s: %s", schema, table, exc)
            continue
        if not surplus:
            continue
        findings.append(_finding(
            "duplicate_rows", "warning", f"{schema}.{table}",
            f"{int(surplus):,} duplicate row(s) across {int(groups):,} distinct value(s)",
            duplicate_rows=int(surplus), duplicate_groups=int(groups),
        ))

    return findings


def _ident(name: str) -> str:
    """Quote an identifier that came from the catalog. Belt and braces: these names are
    already the database's own, but they are interpolated into SQL text."""
    return '"' + str(name).replace('"', '""') + '"'


# --- entry point -------------------------------------------------------------

CHECKS = (
    ("schema_drift", _schema_drift),
    ("volume", _volume),
    ("redundancy", _redundancy),
)


def inspect_postgres(dsn: str) -> dict[str, Any]:
    """Run every check against one Postgres DSN and return the findings, worst first."""
    try:
        import psycopg2
    except ImportError as exc:  # pragma: no cover - deployment gap, not a DB fault
        raise Unsupported("psycopg2 is not installed in this deployment") from exc

    conn = psycopg2.connect(dsn, connect_timeout=5)
    findings: list[dict[str, Any]] = []
    failed: list[dict[str, str]] = []
    try:
        conn.set_session(readonly=True, autocommit=True)
        for name, check in CHECKS:
            with conn.cursor() as cur:
                try:
                    findings.extend(check(cur))
                except Exception as exc:
                    # One check that cannot run must not hide the other two.
                    log.warning("inspect check %s failed: %s", name, exc)
                    failed.append({"check": name, "error": str(exc).strip()})
    finally:
        conn.close()

    findings.sort(key=lambda f: (_SEVERITY_ORDER.get(f["severity"], 9), f["kind"], f["object"]))
    counts: dict[str, int] = {}
    for f in findings:
        counts[f["severity"]] = counts.get(f["severity"], 0) + 1
    return {
        "findings": findings,
        "counts": {"total": len(findings), **counts},
        "checks_run": [name for name, _ in CHECKS if name not in {f["check"] for f in failed}],
        "checks_failed": failed,
    }
