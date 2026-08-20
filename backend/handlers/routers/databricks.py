"""Databricks Delta routes: per-tenant credentials, catalog browsing, read-only queries.

Every route is scoped to the caller's tenant, resolved from the verified JWT claim by
get_tenant_id — never from anything the client sends. Two organizations that both
configure Databricks reach their own workspaces and cannot reach each other's.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from shared.core import databricks as dbx
from shared.core.tenancy import get_tenant_id

router = APIRouter(prefix="/api/v1/databricks", tags=["databricks"])


class QueryRequest(BaseModel):
    sql: str = Field(min_length=1, max_length=20000)
    limit: int = Field(default=1000, ge=1, le=10000)
    catalog: str | None = None
    schema_name: str | None = None


class CredentialsRequest(BaseModel):
    host: str = Field(min_length=1, max_length=253)
    warehouse_id: str = Field(min_length=1, max_length=128)
    # Write-only. It is never echoed back; reads return a 4-character hint instead.
    token: str = Field(min_length=1, max_length=512)


def _guard(fn, *args, **kwargs):
    """Turn store-level failures into honest status codes.

    Not-configured is a 501 (this tenant has not connected Databricks), unreachable is
    a 502 (it is configured and broken). Collapsing both into 500 would make "enter
    your credentials" indistinguishable from "Databricks is down".
    """
    try:
        return fn(*args, **kwargs)
    except dbx.NotConfigured as exc:
        raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except dbx.DatabricksError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc


# --- credentials ------------------------------------------------------------

@router.get("/config")
def get_config(tenant_id: str = Depends(get_tenant_id)) -> dict:
    """This tenant's Databricks settings. The token is fingerprinted, never returned."""
    return dbx.masked_credentials(tenant_id)


@router.put("/config")
def put_config(
    body: CredentialsRequest,
    tenant_id: str = Depends(get_tenant_id),
) -> dict:
    """Save this tenant's credentials, then immediately report whether they work."""
    _guard(dbx.save_credentials, tenant_id, body.host, body.warehouse_id, body.token)
    return dbx.status(tenant_id)


@router.delete("/config")
def delete_config(
    tenant_id: str = Depends(get_tenant_id),
) -> dict:
    """Clear this tenant's credentials, falling back to the deployment default if any."""
    dbx.delete_credentials(tenant_id)
    return dbx.masked_credentials(tenant_id)


# --- connection -------------------------------------------------------------

@router.get("/status")
def get_status(tenant_id: str = Depends(get_tenant_id)) -> dict:
    """Whether this tenant's Databricks is configured and the warehouse is reachable."""
    return dbx.status(tenant_id)


# --- metadata browsing ------------------------------------------------------

@router.get("/catalogs")
def get_catalogs(tenant_id: str = Depends(get_tenant_id)) -> list[str]:
    return _guard(dbx.list_catalogs, tenant_id)


@router.get("/schemas")
def get_schemas(
    catalog: str = Query(min_length=1),
    tenant_id: str = Depends(get_tenant_id),
) -> list[dict]:
    """Schemas in a catalog."""
    return _guard(dbx.list_schemas, catalog, tenant_id)


@router.get("/tables")
def get_tables(
    catalog: str = Query(min_length=1),
    schema_name: str = Query(min_length=1, alias="schema"),
    tenant_id: str = Depends(get_tenant_id),
) -> list[dict]:
    """Delta tables in a Unity Catalog schema."""
    return _guard(dbx.list_tables, catalog, schema_name, tenant_id)


@router.get("/tables/{full_name}")
def get_table_detail(full_name: str, tenant_id: str = Depends(get_tenant_id)) -> dict:
    """One table with its columns. full_name is catalog.schema.table."""
    if full_name.count(".") != 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="full_name must be catalog.schema.table",
        )
    return _guard(dbx.get_table, full_name, tenant_id)


# --- query ------------------------------------------------------------------

@router.post("/query")
def run_query(
    body: QueryRequest,
    tenant_id: str = Depends(get_tenant_id),
) -> dict:
    """Run a read-only statement. Writes are rejected before reaching Databricks."""
    return _guard(dbx.run_query, body.sql, body.limit, body.catalog, body.schema_name, tenant_id)
