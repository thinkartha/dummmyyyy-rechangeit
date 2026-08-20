"""Postgres persistence — env-gated (DATABASE_URL), with in-memory fallback.

Tenant-scoped incident storage. Connect-per-op (safe under uvicorn's threads); if DATABASE_URL is
unset or the DB is unreachable, every call is a no-op/None and the caller keeps its in-memory store.
"""

from __future__ import annotations

import json
import logging
import os

log = logging.getLogger("pinghold.db")

_URL = os.getenv("DATABASE_URL")
_disabled = _URL is None
_initialized = False

_DDL = """
CREATE TABLE IF NOT EXISTS incidents (
  tenant text NOT NULL,
  id text NOT NULL,
  payload jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant, id)
)
"""


def _connect():
    global _disabled
    if _disabled:
        return None
    try:
        import psycopg2

        return psycopg2.connect(_URL)
    except Exception as exc:  # pragma: no cover - depends on external db
        log.warning("Postgres unavailable (%s); persistence disabled", exc)
        _disabled = True
        return None


def _ensure(conn) -> None:
    global _initialized
    if _initialized:
        return
    with conn.cursor() as cur:
        cur.execute(_DDL)
    conn.commit()
    _initialized = True
    log.info("Postgres persistence enabled")


def enabled() -> bool:
    conn = _connect()
    if not conn:
        return False
    conn.close()
    return True


def save_incident(tenant: str, incident_id: str, payload: dict) -> bool:
    conn = _connect()
    if not conn:
        return False
    try:
        _ensure(conn)
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO incidents (tenant, id, payload, updated_at) VALUES (%s, %s, %s, now()) "
                "ON CONFLICT (tenant, id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = now()",
                (tenant, incident_id, json.dumps(payload)),
            )
        conn.commit()
        return True
    except Exception as exc:  # pragma: no cover
        log.warning("save_incident failed: %s", exc)
        return False
    finally:
        conn.close()


def get_incident(tenant: str, incident_id: str) -> dict | None:
    conn = _connect()
    if not conn:
        return None
    try:
        _ensure(conn)
        with conn.cursor() as cur:
            cur.execute("SELECT payload FROM incidents WHERE tenant=%s AND id=%s", (tenant, incident_id))
            row = cur.fetchone()
            return row[0] if row else None  # psycopg2 returns jsonb as a dict
    except Exception as exc:  # pragma: no cover
        log.warning("get_incident failed: %s", exc)
        return None
    finally:
        conn.close()
