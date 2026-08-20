"""Databricks Delta connectivity via the SQL Statement Execution REST API.

Backs the "Databricks Delta" primary-store option in the admin settings panel.

Uses the REST API over stdlib urllib rather than `databricks-sql-connector`. The
connector pulls in pyarrow and thrift — tens of MB unzipped into a Lambda whose
requirements.txt explicitly warns about package size and cold-start import time — to do
what four HTTP calls already do.

Credentials come from PINGHOLD_DATABRICKS_TOKEN. Put it in Secrets Manager and inject it
as an env var; it is a bearer token with whatever the workspace grants it.
"""

from __future__ import annotations

import json
import logging
import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

from . import config_store

log = logging.getLogger("pinghold.databricks")

_TIMEOUT = 30
# The statement API is async above this; poll rather than hold the request open.
_POLL_INTERVAL = 1.0
_MAX_POLLS = 30


class NotConfigured(RuntimeError):
    """Raised when Databricks connection settings are absent."""


class DatabricksError(RuntimeError):
    """Raised when Databricks is configured but rejects or fails the request."""


INTEGRATION_KEY = "databricks"


def _normalize_host(value: str) -> str:
    return value.strip().rstrip("/").removeprefix("https://").removeprefix("http://")


def _env_credentials() -> dict[str, str]:
    """Deploy-time fallback, used when a tenant has saved nothing of its own."""
    return {
        "host": _normalize_host(os.getenv("PINGHOLD_DATABRICKS_HOST", "")),
        "warehouse_id": os.getenv("PINGHOLD_DATABRICKS_WAREHOUSE_ID", "").strip(),
        "token": os.getenv("PINGHOLD_DATABRICKS_TOKEN", "").strip(),
    }


def credentials(tenant_id: str | None = None) -> dict[str, str]:
    """Resolve this tenant's Databricks credentials.

    Tenant config wins over the environment, so an organization that enters its own
    workspace reaches only its own data. The env vars remain as a shared default for
    single-tenant deployments and local development.

    Never returned to a client as-is: the token is masked by masked_credentials().
    """
    if tenant_id:
        raw = config_store.get_config(tenant_id, INTEGRATION_KEY)
        if raw:
            try:
                saved = json.loads(raw)
            except json.JSONDecodeError:
                log.warning("Corrupt Databricks config for tenant %s; falling back to env", tenant_id)
            else:
                resolved = {
                    "host": _normalize_host(str(saved.get("host", ""))),
                    "warehouse_id": str(saved.get("warehouse_id", "")).strip(),
                    "token": str(saved.get("token", "")).strip(),
                }
                if all(resolved.values()):
                    return resolved
    return _env_credentials()


def save_credentials(tenant_id: str, host: str, warehouse_id: str, token: str) -> None:
    """Persist a tenant's credentials. Raises ValueError if any field is blank."""
    host, warehouse_id, token = _normalize_host(host), warehouse_id.strip(), token.strip()
    missing = [n for n, v in (("host", host), ("warehouse_id", warehouse_id), ("token", token)) if not v]
    if missing:
        raise ValueError(f"Missing required field(s): {', '.join(missing)}")
    payload = json.dumps({"host": host, "warehouse_id": warehouse_id, "token": token})
    if not config_store.save_config(tenant_id, INTEGRATION_KEY, payload):
        raise DatabricksError("Could not save Databricks credentials")


def delete_credentials(tenant_id: str) -> None:
    """Clear a tenant's credentials so it falls back to the deployment default."""
    config_store.save_config(tenant_id, INTEGRATION_KEY, json.dumps({}))


def masked_credentials(tenant_id: str | None = None) -> dict[str, Any]:
    """Safe-to-return view. The token is never echoed, only fingerprinted."""
    creds = credentials(tenant_id)
    token = creds["token"]
    tenant_saved = bool(tenant_id and config_store.get_config(tenant_id, INTEGRATION_KEY)
                        and credentials(tenant_id) != _env_credentials())
    return {
        "host": creds["host"] or None,
        "warehouse_id": creds["warehouse_id"] or None,
        # Last 4 only — enough to tell two tokens apart, useless if intercepted.
        "token_hint": f"…{token[-4:]}" if len(token) >= 4 else ("set" if token else None),
        "configured": bool(creds["host"] and creds["warehouse_id"] and token),
        # Tells the UI whether it is showing this org's own settings or the
        # deployment-wide fallback, which it must not offer to "clear".
        "source": "tenant" if tenant_saved else ("environment" if any(_env_credentials().values()) else "none"),
    }


def host(tenant_id: str | None = None) -> str:
    """Workspace host, e.g. dbc-1234abcd-5678.cloud.databricks.com."""
    return credentials(tenant_id)["host"]


def warehouse_id(tenant_id: str | None = None) -> str:
    return credentials(tenant_id)["warehouse_id"]


def is_configured(tenant_id: str | None = None) -> bool:
    return all(credentials(tenant_id).values())


def jobs_configured(tenant_id: str | None = None) -> bool:
    """Jobs API readiness; unlike SQL statements this does not require a warehouse."""
    creds = credentials(tenant_id)
    return bool(creds["host"] and creds["token"])


def _require_config(tenant_id: str | None = None) -> dict[str, str]:
    creds = credentials(tenant_id)
    missing = [name for name, value in creds.items() if not value]
    if missing:
        raise NotConfigured(
            "Databricks not configured for this organization: "
            f"{', '.join(missing)} missing. Set them under Config Management → Databricks."
        )
    return creds


def _post(path: str, payload: dict, tenant_id: str | None = None) -> dict:
    creds = _require_config(tenant_id)
    req = urllib.request.Request(
        f"https://{creds['host']}{path}",
        data=json.dumps(payload).encode(),
        headers={
            "Authorization": f"Bearer {creds['token']}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=_TIMEOUT) as resp:
            return json.loads(resp.read() or b"{}")
    except urllib.error.HTTPError as exc:
        # Never log the body verbatim: Databricks echoes the statement, which may carry
        # data values, and this logger goes to CloudWatch.
        raise DatabricksError(f"Databricks returned {exc.code}") from exc
    except Exception as exc:
        raise DatabricksError(f"Databricks unreachable: {exc}") from exc


def _get(path: str, tenant_id: str | None = None) -> dict:
    creds = _require_config(tenant_id)
    req = urllib.request.Request(
        f"https://{creds['host']}{path}",
        headers={"Authorization": f"Bearer {creds['token']}"},
    )
    try:
        with urllib.request.urlopen(req, timeout=_TIMEOUT) as resp:
            return json.loads(resp.read() or b"{}")
    except urllib.error.HTTPError as exc:
        raise DatabricksError(f"Databricks returned {exc.code}") from exc
    except Exception as exc:
        raise DatabricksError(f"Databricks unreachable: {exc}") from exc


# --- read-only guard --------------------------------------------------------

# This endpoint executes caller-supplied SQL against the warehouse with the service
# token's full privileges. Allow only statements that read.
_ALLOWED_LEADING = ("select", "show", "describe", "desc", "explain", "with")
_FORBIDDEN = re.compile(
    r"(?<![\w.])(insert|update|delete|merge|drop|truncate|alter|create|grant|revoke|copy)\s",
    re.IGNORECASE,
)
_COMMENT = re.compile(r"--[^\n]*|/\*.*?\*/", re.DOTALL)


def assert_read_only(sql: str) -> None:
    """Reject anything that could mutate the warehouse.

    Comments are stripped first so `/* */ DROP TABLE` cannot smuggle a keyword past
    the leading-word check, and `;` is banned outright so a read cannot be chained
    into a write.
    """
    stripped = _COMMENT.sub(" ", sql).strip()
    if not stripped:
        raise ValueError("Empty statement")
    if ";" in stripped.rstrip(";"):
        raise ValueError("Multiple statements are not allowed")
    if not stripped.lower().startswith(_ALLOWED_LEADING):
        raise ValueError(f"Only {', '.join(_ALLOWED_LEADING).upper()} statements are allowed")
    match = _FORBIDDEN.search(stripped)
    if match:
        raise ValueError(f"Statement contains a write operation: {match.group(1).upper()}")


# --- operations -------------------------------------------------------------

def run_query(sql: str, limit: int = 1000, catalog: str | None = None,
              schema: str | None = None, tenant_id: str | None = None,
              parameters: dict[str, Any] | None = None) -> dict[str, Any]:
    """Execute a read-only statement and return {columns, rows, row_count, truncated}.

    `parameters` binds `:name` markers server-side via the statement API, so a value can
    never become SQL. Internal callers that filter on user-supplied values (a catalog or
    schema name) must use it rather than formatting the value into the statement.
    """
    assert_read_only(sql)
    payload: dict[str, Any] = {
        "warehouse_id": warehouse_id(tenant_id),
        "statement": sql,
        "wait_timeout": "30s",
        "on_wait_timeout": "CONTINUE",
        # A caller asking for a billion rows should get a bounded response, not OOM
        # the Lambda; Databricks truncates and flags it.
        "row_limit": limit,
    }
    if parameters:
        payload["parameters"] = [
            {"name": name, "value": str(value)} for name, value in parameters.items()
        ]
    if catalog:
        payload["catalog"] = catalog
    if schema:
        payload["schema"] = schema

    result = _post("/api/2.0/sql/statements", payload, tenant_id)
    statement_id = result.get("statement_id")

    for _ in range(_MAX_POLLS):
        state = (result.get("status") or {}).get("state")
        if state in {"SUCCEEDED", "FAILED", "CANCELED", "CLOSED"}:
            break
        time.sleep(_POLL_INTERVAL)
        result = _get(f"/api/2.0/sql/statements/{statement_id}", tenant_id)
    else:
        raise DatabricksError("Statement did not finish within the polling window")

    status = result.get("status") or {}
    if status.get("state") != "SUCCEEDED":
        message = (status.get("error") or {}).get("message", status.get("state", "unknown"))
        raise DatabricksError(f"Statement failed: {message}")

    manifest = result.get("manifest") or {}
    columns = [c.get("name", "") for c in (manifest.get("schema") or {}).get("columns", [])]
    rows = (result.get("result") or {}).get("data_array") or []
    return {
        "columns": columns,
        "rows": rows,
        "row_count": len(rows),
        "truncated": bool(manifest.get("truncated")),
    }


def _quote(value: str) -> str:
    return urllib.parse.quote(value, safe="")


def list_tables(catalog: str, schema: str, tenant_id: str | None = None) -> list[dict[str, str]]:
    """Tables in a Delta schema, via Unity Catalog."""
    payload = _get(
        f"/api/2.1/unity-catalog/tables"
        f"?catalog_name={_quote(catalog)}&schema_name={_quote(schema)}", tenant_id
    )
    return [{
        "name": t.get("name", ""),
        "full_name": t.get("full_name", ""),
        "table_type": t.get("table_type", ""),
        "data_source_format": t.get("data_source_format", ""),
        "comment": t.get("comment") or "",
    } for t in payload.get("tables", [])]


def get_table(full_name: str, tenant_id: str | None = None) -> dict[str, Any]:
    """One table with its column list, for the schema browser."""
    t = _get(f"/api/2.1/unity-catalog/tables/{_quote(full_name)}", tenant_id)
    return {
        "name": t.get("name", ""),
        "full_name": t.get("full_name", full_name),
        "table_type": t.get("table_type", ""),
        "data_source_format": t.get("data_source_format", ""),
        "comment": t.get("comment") or "",
        "owner": t.get("owner") or "",
        "updated_at": t.get("updated_at"),
        "columns": [{
            "name": c.get("name", ""),
            # type_text is the human form ("decimal(10,2)"); type_name is the enum.
            "type": c.get("type_text") or c.get("type_name") or "",
            "nullable": bool(c.get("nullable", True)),
            "comment": c.get("comment") or "",
        } for c in sorted(t.get("columns", []), key=lambda c: c.get("position", 0))],
    }


def list_schemas(catalog: str, tenant_id: str | None = None) -> list[dict[str, str]]:
    """Schemas in a catalog. Without this the table browser has no middle step."""
    payload = _get(f"/api/2.1/unity-catalog/schemas?catalog_name={_quote(catalog)}", tenant_id)
    return [{
        "name": s.get("name", ""),
        "full_name": s.get("full_name", ""),
        "comment": s.get("comment") or "",
    } for s in payload.get("schemas", []) if s.get("name")]


def list_catalogs(tenant_id: str | None = None) -> list[str]:
    payload = _get("/api/2.1/unity-catalog/catalogs", tenant_id)
    return [c.get("name", "") for c in payload.get("catalogs", []) if c.get("name")]


def status(tenant_id: str | None = None) -> dict[str, Any]:
    """Connection health for the config panel. Never raises: it is the diagnostic."""
    view = masked_credentials(tenant_id)
    if not view["configured"]:
        return {**view, "reachable": False,
                "error": "Databricks credentials are not set for this organization."}
    try:
        info = _get(f"/api/2.0/sql/warehouses/{warehouse_id(tenant_id)}", tenant_id)
        return {**view, "reachable": True, "warehouse_name": info.get("name"),
                "warehouse_state": info.get("state"), "error": None}
    except DatabricksError as exc:
        return {**view, "reachable": False, "error": str(exc)}
