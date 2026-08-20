"""Data observability routes — Databricks tables watched like services.

Reads the tenant's own Databricks workspace over the read-only client in
core/databricks.py, derives freshness and volume signals from Delta history, and judges
them with the same anomaly engine that watches infrastructure.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from shared.core import data_observability as dataobs
from shared.core import databricks as dbx
from shared.core.tenancy import get_tenant_id

router = APIRouter(prefix="/api/v1/data-observability", tags=["data-observability"])


class ScanRequest(BaseModel):
    tables: list[str] = Field(min_length=1, max_length=50)
    # Off by default: a UI polling this endpoint should not manufacture a fresh incident
    # on every refresh.
    emit: bool = False


def _guard(fn, *args, **kwargs):
    """Not-configured is a 501 (this tenant has not connected Databricks), unreachable is
    a 502 (it is connected and broken)."""
    try:
        return fn(*args, **kwargs)
    except dbx.NotConfigured as exc:
        raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail=str(exc)) from exc
    except (dataobs.InvalidTableName, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except dbx.DatabricksError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc


@router.get("/status")
def get_status(tenant_id: str = Depends(get_tenant_id)) -> dict:
    """Whether this tenant can be scanned, and which pillars are covered. Never raises."""
    return dataobs.status(tenant_id)


@router.get("/tables")
def get_tables(
    catalog: str = Query(min_length=1),
    schema: str | None = Query(default=None),
    tenant_id: str = Depends(get_tenant_id),
) -> list[dict]:
    """Tables available to watch, most recently altered first."""
    return _guard(dataobs.list_tables, tenant_id, catalog, schema)


@router.get("/tables/{full_name}")
def get_table_health(full_name: str, tenant_id: str = Depends(get_tenant_id)) -> dict:
    """Freshness and volume for one table, with the raw series behind the verdict."""
    return _guard(dataobs.check_table, full_name, tenant_id)


@router.post("/scan")
def post_scan(body: ScanRequest, tenant_id: str = Depends(get_tenant_id)) -> list[dict]:
    """Check several tables at once, worst first.

    With `emit`, each finding is published as a data incident onto the same event path as
    every other alert — so it clusters and reaches the incident UI with no parallel
    pipeline.
    """
    return _guard(dataobs.scan, tenant_id, body.tables, body.emit)
