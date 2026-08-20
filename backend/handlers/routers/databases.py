"""Database monitoring routes: register databases by connection string, report health.

Connection strings are credentials. They go in on POST and never come back out — every
response passes through dbmon.masked(), which rebuilds the URI without the password.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from shared.core import dbmon
from shared.core.auth import ROLE_ORG_ADMIN, ROLE_PLATFORM_ADMIN, Principal, get_current_principal
from shared.core.tenancy import get_tenant_id

router = APIRouter(prefix="/api/v1/databases", tags=["databases"])


class DatabaseRequest(BaseModel):
    name: str = Field(min_length=1, max_length=64)
    # e.g. postgresql://user:pass@host:5432/dbname
    dsn: str = Field(min_length=1, max_length=2048)


class DsnRequest(BaseModel):
    dsn: str = Field(min_length=1, max_length=2048)


def _require_admin(principal: Principal = Depends(get_current_principal)) -> Principal:
    """Registering a database means handing the platform a credential the whole org's
    health checks will use. Reading the resulting health is open to the org."""
    if not ({ROLE_ORG_ADMIN, ROLE_PLATFORM_ADMIN} & set(principal.roles)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This action requires an org admin or platform admin role",
        )
    return principal


def _guard(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except dbmon.InvalidDsn as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc


@router.get("/engines")
def get_engines() -> list[dict]:
    """Supported engines and how deeply each is inspected (full metrics vs TCP probe)."""
    return dbmon.engine_catalog()


@router.get("")
def list_databases(tenant_id: str = Depends(get_tenant_id)) -> list[dict]:
    """Registered databases, without their credentials."""
    return dbmon.list_databases(tenant_id)


@router.post("", status_code=status.HTTP_201_CREATED)
def add_database(
    body: DatabaseRequest,
    tenant_id: str = Depends(get_tenant_id),
    _: Principal = Depends(_require_admin),
) -> dict:
    """Register a database by connection string."""
    return _guard(dbmon.add_database, tenant_id, body.name, body.dsn)


@router.delete("/{database_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_database(
    database_id: str,
    tenant_id: str = Depends(get_tenant_id),
    _: Principal = Depends(_require_admin),
) -> None:
    if not dbmon.delete_database(tenant_id, database_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Database not found")


@router.post("/test")
def test_connection(
    body: DsnRequest,
    _: Principal = Depends(_require_admin),
) -> dict:
    """Probe a connection string without saving it — the form's 'Test connection'."""
    return _guard(dbmon.test_dsn, body.dsn)


@router.get("/summary")
def get_summary(tenant_id: str = Depends(get_tenant_id)) -> dict:
    """Headline counts across every registered database."""
    return dbmon.summary(tenant_id)


@router.get("/health")
def get_health(tenant_id: str = Depends(get_tenant_id)) -> list[dict]:
    """Live health for every registered database. Never raises: it is the diagnostic."""
    return dbmon.check_all(tenant_id)


@router.get("/{database_id}/health")
def get_one_health(database_id: str, tenant_id: str = Depends(get_tenant_id)) -> dict:
    result = dbmon.check_one(tenant_id, database_id)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Database not found")
    return result
