"""Database health monitoring from a connection string.

A tenant registers one or more databases by URI. Postgres and MySQL get real health —
version, session counts against max_connections, database size, the longest-running
query, replication lag. Everything else (Redis, Mongo, SQL Server, …) gets a TCP
reachability probe and says so, rather than pretending to know more than it does.

Connection strings are credentials. They are stored per tenant via config_store, never
returned to a client, and never logged: reads go through masked(), which rebuilds the
URI without the password.

ponytail: connect-per-check, matching core/db.py. A pool would help if this ran on a
tight schedule against many databases; it runs when someone opens the page.
"""

from __future__ import annotations

import json
import logging
import socket
import time
import urllib.parse
import uuid
from typing import Any

from . import config_store

log = logging.getLogger("pinghold.dbmon")

INTEGRATION_KEY = "db-monitoring"
_CONNECT_TIMEOUT = 5

# Postgres and MySQL are read in depth; the rest are probed at the socket. Ports let a
# TCP-only entry still say what it is when the URI omits one.
ENGINES: dict[str, dict[str, Any]] = {
    "postgresql": {"label": "PostgreSQL", "port": 5432, "depth": "full",
                   "aliases": ("postgres", "postgresql", "psql", "pgsql")},
    "mysql": {"label": "MySQL / MariaDB", "port": 3306, "depth": "full",
              "aliases": ("mysql", "mariadb")},
    "mssql": {"label": "SQL Server", "port": 1433, "depth": "tcp",
              "aliases": ("mssql", "sqlserver")},
    "mongodb": {"label": "MongoDB", "port": 27017, "depth": "tcp",
                "aliases": ("mongodb", "mongo", "mongodb+srv")},
    "redis": {"label": "Redis", "port": 6379, "depth": "tcp", "aliases": ("redis", "rediss")},
    "clickhouse": {"label": "ClickHouse", "port": 8123, "depth": "tcp", "aliases": ("clickhouse",)},
    "elasticsearch": {"label": "Elasticsearch", "port": 9200, "depth": "tcp",
                      "aliases": ("elasticsearch", "es")},
}

_ALIASES = {alias: engine for engine, spec in ENGINES.items() for alias in spec["aliases"]}

# Above these a database is "degraded"; the connection-saturation one is what actually
# pages people, because a pool leak looks fine on every other metric until it doesn't.
_SLOW_CONNECT_MS = 500
_SATURATION_WARN = 0.80
_SATURATION_CRIT = 0.95


def engine_catalog() -> list[dict[str, Any]]:
    """Supported engines and how deeply each is inspected — drives the UI's picker."""
    return [{"id": key, "label": spec["label"], "default_port": spec["port"],
             "depth": spec["depth"], "schemes": list(spec["aliases"])}
            for key, spec in ENGINES.items()]


class InvalidDsn(ValueError):
    """Raised when a connection string cannot be parsed or names an unknown engine."""


def parse_dsn(dsn: str) -> dict[str, Any]:
    """Split a connection URI into its parts. Raises InvalidDsn on anything unusable."""
    dsn = (dsn or "").strip()
    if not dsn:
        raise InvalidDsn("Connection string is empty")
    parsed = urllib.parse.urlsplit(dsn)
    scheme = (parsed.scheme or "").lower().split("+")[0]
    if not scheme:
        raise InvalidDsn("Connection string must start with a scheme, e.g. postgresql://…")
    engine = _ALIASES.get(scheme)
    if not engine:
        raise InvalidDsn(
            f"Unsupported database scheme '{scheme}'. Supported: {', '.join(sorted(_ALIASES))}"
        )
    if not parsed.hostname:
        raise InvalidDsn("Connection string has no host")
    return {
        "engine": engine,
        "scheme": scheme,
        "host": parsed.hostname,
        "port": parsed.port or ENGINES[engine]["port"],
        "database": parsed.path.lstrip("/") or None,
        "user": urllib.parse.unquote(parsed.username) if parsed.username else None,
        "password": urllib.parse.unquote(parsed.password) if parsed.password else None,
    }


def _masked_dsn(dsn: str) -> str:
    """The URI with the password replaced — safe for the UI and for logs."""
    try:
        parts = parse_dsn(dsn)
    except InvalidDsn:
        return "(unparseable)"
    auth = ""
    if parts["user"]:
        auth = urllib.parse.quote(parts["user"], safe="")
        if parts["password"]:
            auth += ":***"
        auth += "@"
    db = f"/{parts['database']}" if parts["database"] else ""
    return f"{parts['scheme']}://{auth}{parts['host']}:{parts['port']}{db}"


# --- registry ---------------------------------------------------------------

def _load(tenant_id: str) -> list[dict[str, Any]]:
    raw = config_store.get_config(tenant_id, INTEGRATION_KEY)
    if not raw:
        return []
    try:
        return json.loads(raw).get("databases", [])
    except (json.JSONDecodeError, AttributeError):
        log.warning("Corrupt database-monitoring config for tenant %s", tenant_id)
        return []


def _store(tenant_id: str, databases: list[dict[str, Any]]) -> None:
    if not config_store.save_config(tenant_id, INTEGRATION_KEY, json.dumps({"databases": databases})):
        raise RuntimeError("Could not save database configuration")


def masked(entry: dict[str, Any]) -> dict[str, Any]:
    """Registry row without the credential."""
    parts = parse_dsn(entry["dsn"])
    return {
        "id": entry["id"],
        "name": entry["name"],
        "engine": parts["engine"],
        "engine_label": ENGINES[parts["engine"]]["label"],
        "depth": ENGINES[parts["engine"]]["depth"],
        "host": parts["host"],
        "port": parts["port"],
        "database": parts["database"],
        "user": parts["user"],
        "dsn": _masked_dsn(entry["dsn"]),
    }


def list_databases(tenant_id: str) -> list[dict[str, Any]]:
    return [masked(e) for e in _load(tenant_id)]


def add_database(tenant_id: str, name: str, dsn: str) -> dict[str, Any]:
    """Register a database. Raises InvalidDsn if the URI does not parse."""
    parse_dsn(dsn)  # validate before persisting a credential we can never use
    name = (name or "").strip()
    if not name:
        raise InvalidDsn("Name is required")
    databases = _load(tenant_id)
    if any(e["name"].lower() == name.lower() for e in databases):
        raise InvalidDsn(f"A database named '{name}' is already registered")
    entry = {"id": uuid.uuid4().hex[:12], "name": name, "dsn": dsn.strip()}
    databases.append(entry)
    _store(tenant_id, databases)
    return masked(entry)


def delete_database(tenant_id: str, database_id: str) -> bool:
    databases = _load(tenant_id)
    remaining = [e for e in databases if e["id"] != database_id]
    if len(remaining) == len(databases):
        return False
    _store(tenant_id, remaining)
    return True


def _find(tenant_id: str, database_id: str) -> dict[str, Any] | None:
    return next((e for e in _load(tenant_id) if e["id"] == database_id), None)


# --- probes -----------------------------------------------------------------

def _tcp_probe(host: str, port: int) -> dict[str, Any]:
    """Reachability and connect latency. All we can honestly claim without a driver."""
    started = time.perf_counter()
    try:
        with socket.create_connection((host, port), timeout=_CONNECT_TIMEOUT):
            pass
    except Exception as exc:
        return {"reachable": False, "latency_ms": None, "error": f"{type(exc).__name__}: {exc}"}
    return {"reachable": True, "latency_ms": round((time.perf_counter() - started) * 1000, 1),
            "error": None}


def _postgres_probe(dsn: str) -> dict[str, Any]:
    try:
        import psycopg2
    except ImportError:
        return {"error": "psycopg2 is not installed in this deployment"}

    started = time.perf_counter()
    try:
        conn = psycopg2.connect(dsn, connect_timeout=_CONNECT_TIMEOUT)
    except Exception as exc:
        return {"reachable": False, "latency_ms": None, "error": str(exc).strip()}
    latency = round((time.perf_counter() - started) * 1000, 1)

    metrics: dict[str, Any] = {}
    try:
        conn.set_session(readonly=True, autocommit=True)
        with conn.cursor() as cur:
            cur.execute("SELECT version()")
            metrics["version"] = cur.fetchone()[0].split(" on ")[0]

            cur.execute("SHOW max_connections")
            max_conn = int(cur.fetchone()[0])
            cur.execute("SELECT count(*), count(*) FILTER (WHERE state = 'active') FROM pg_stat_activity")
            total, active = cur.fetchone()
            metrics.update({"connections": total, "active_connections": active,
                            "max_connections": max_conn})

            cur.execute("SELECT pg_database_size(current_database())")
            metrics["size_bytes"] = cur.fetchone()[0]

            # The single most useful number on a struggling database: is something
            # holding a transaction open? Excludes idle sessions and this query.
            cur.execute(
                "SELECT COALESCE(EXTRACT(EPOCH FROM max(now() - query_start)), 0) "
                "FROM pg_stat_activity WHERE state = 'active' AND pid <> pg_backend_pid()"
            )
            metrics["longest_query_s"] = round(float(cur.fetchone()[0]), 1)

            cur.execute("SELECT sum(xact_commit), sum(xact_rollback), sum(blks_hit), sum(blks_read) "
                        "FROM pg_stat_database")
            commits, rollbacks, hits, reads = (v or 0 for v in cur.fetchone())
            total_blocks = hits + reads
            metrics["cache_hit_ratio"] = round(hits / total_blocks, 4) if total_blocks else None
            metrics["commits"] = int(commits)
            metrics["rollbacks"] = int(rollbacks)

            cur.execute("SELECT pg_is_in_recovery()")
            if cur.fetchone()[0]:
                cur.execute("SELECT COALESCE(EXTRACT(EPOCH FROM now() - pg_last_xact_replay_timestamp()), 0)")
                metrics["replica_lag_s"] = round(float(cur.fetchone()[0]), 1)
    except Exception as exc:
        # A working connection with a failed query is still worth reporting as "up".
        metrics["warning"] = f"Some metrics unavailable: {exc}"
    finally:
        conn.close()

    return {"reachable": True, "latency_ms": latency, "error": None, **metrics}


def _mysql_probe(dsn: str) -> dict[str, Any]:
    try:
        import pymysql
    except ImportError:
        return {"error": "pymysql is not installed in this deployment"}

    parts = parse_dsn(dsn)
    started = time.perf_counter()
    try:
        conn = pymysql.connect(
            host=parts["host"], port=parts["port"], user=parts["user"] or "",
            password=parts["password"] or "", database=parts["database"] or None,
            connect_timeout=_CONNECT_TIMEOUT, read_timeout=_CONNECT_TIMEOUT,
        )
    except Exception as exc:
        return {"reachable": False, "latency_ms": None, "error": str(exc).strip()}
    latency = round((time.perf_counter() - started) * 1000, 1)

    metrics: dict[str, Any] = {}
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT VERSION()")
            metrics["version"] = cur.fetchone()[0]

            cur.execute("SHOW GLOBAL STATUS WHERE Variable_name IN "
                        "('Threads_connected','Threads_running','Slow_queries','Uptime')")
            status = {k: v for k, v in cur.fetchall()}
            cur.execute("SHOW VARIABLES LIKE 'max_connections'")
            max_conn = int(cur.fetchall()[0][1])
            metrics.update({
                "connections": int(status.get("Threads_connected", 0)),
                "active_connections": int(status.get("Threads_running", 0)),
                "max_connections": max_conn,
                "slow_queries": int(status.get("Slow_queries", 0)),
                "uptime_s": int(status.get("Uptime", 0)),
            })

            if parts["database"]:
                cur.execute("SELECT COALESCE(SUM(data_length + index_length), 0) "
                            "FROM information_schema.tables WHERE table_schema = %s",
                            (parts["database"],))
                metrics["size_bytes"] = int(cur.fetchone()[0])

            # MySQL 8.0.22 renamed SLAVE to REPLICA; MariaDB only knows the old name.
            # Try both rather than parsing a version string that MariaDB spells its
            # own way.
            for statement in ("SHOW REPLICA STATUS", "SHOW SLAVE STATUS"):
                try:
                    cur.execute(statement)
                except Exception:
                    continue
                row = cur.fetchone()
                if not row:
                    break
                fields = dict(zip([c[0] for c in cur.description], row))
                lag = fields.get("Seconds_Behind_Source", fields.get("Seconds_Behind_Master"))
                if lag is not None:
                    metrics["replica_lag_s"] = float(lag)
                break
    except Exception as exc:
        metrics["warning"] = f"Some metrics unavailable: {exc}"
    finally:
        conn.close()

    return {"reachable": True, "latency_ms": latency, "error": None, **metrics}


_PROBES = {"postgresql": _postgres_probe, "mysql": _mysql_probe}


def _classify(probe: dict[str, Any]) -> tuple[str, list[str]]:
    """Health verdict plus the reasons behind it, so the UI never shows a bare 'degraded'."""
    if not probe.get("reachable"):
        return "down", [probe.get("error") or "Unreachable"]

    reasons: list[str] = []
    status = "healthy"

    max_conn = probe.get("max_connections")
    used = probe.get("connections")
    if max_conn and used is not None:
        ratio = used / max_conn
        if ratio >= _SATURATION_CRIT:
            status = "critical"
            reasons.append(f"Connections at {ratio:.0%} of max ({used}/{max_conn})")
        elif ratio >= _SATURATION_WARN:
            status = "degraded"
            reasons.append(f"Connections at {ratio:.0%} of max ({used}/{max_conn})")

    latency = probe.get("latency_ms")
    if latency and latency > _SLOW_CONNECT_MS:
        status = "critical" if status == "critical" else "degraded"
        reasons.append(f"Slow to connect ({latency:.0f} ms)")

    lag = probe.get("replica_lag_s")
    if lag is not None and lag > 60:
        status = "critical" if lag > 300 else ("degraded" if status == "healthy" else status)
        reasons.append(f"Replica {lag:.0f}s behind")

    longest = probe.get("longest_query_s")
    if longest is not None and longest > 300:
        status = "degraded" if status == "healthy" else status
        reasons.append(f"A query has been running for {longest:.0f}s")

    hit_ratio = probe.get("cache_hit_ratio")
    if hit_ratio is not None and hit_ratio < 0.90:
        reasons.append(f"Cache hit ratio {hit_ratio:.1%}")

    return status, reasons


def check(entry: dict[str, Any]) -> dict[str, Any]:
    """Probe one registered database. Never raises: this is the diagnostic."""
    view = masked(entry)
    parts = parse_dsn(entry["dsn"])
    probe_fn = _PROBES.get(parts["engine"])

    if probe_fn:
        probe = probe_fn(entry["dsn"])
        # A missing driver is a deployment gap, not a database outage — fall back to
        # TCP so the row still says whether the host is up.
        if probe.get("reachable") is None:
            probe = {**_tcp_probe(parts["host"], parts["port"]),
                     "warning": probe.get("error"), "depth": "tcp"}
    else:
        probe = _tcp_probe(parts["host"], parts["port"])

    status, reasons = _classify(probe)
    return {**view, **probe, "status": status, "reasons": reasons,
            "checked_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}


def check_one(tenant_id: str, database_id: str) -> dict[str, Any] | None:
    entry = _find(tenant_id, database_id)
    return check(entry) if entry else None


def check_all(tenant_id: str) -> list[dict[str, Any]]:
    return [check(entry) for entry in _load(tenant_id)]


def test_dsn(dsn: str) -> dict[str, Any]:
    """Probe a connection string without registering it — the form's 'Test' button."""
    parts = parse_dsn(dsn)
    return check({"id": "test", "name": parts["host"], "dsn": dsn})


def summary(tenant_id: str) -> dict[str, Any]:
    """Headline counts for the overview cards."""
    rows = check_all(tenant_id)
    counts = {"healthy": 0, "degraded": 0, "critical": 0, "down": 0}
    for row in rows:
        counts[row["status"]] = counts.get(row["status"], 0) + 1
    latencies = [r["latency_ms"] for r in rows if r.get("latency_ms")]
    return {
        "databases": len(rows),
        **counts,
        "avg_latency_ms": round(sum(latencies) / len(latencies), 1) if latencies else None,
    }
