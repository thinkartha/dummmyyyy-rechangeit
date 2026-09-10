from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from shared.cloud import connections
from shared.core.tenancy import get_tenant_id

router = APIRouter(prefix="/api/v1/integrations/cloud", tags=["cloud"])


def _model(provider: str):
    model = connections.PROVIDERS.get(provider)
    if model is None:
        raise HTTPException(status_code=404, detail=f"Unknown cloud provider '{provider}'")
    return model


@router.get("/{provider}/config")
def get_cloud_config(provider: str, tenant_id: str = Depends(get_tenant_id)) -> dict:
    _model(provider)
    return connections.config_status(tenant_id, provider)


@router.put("/{provider}/config")
async def save_cloud_config(provider: str, body: dict, tenant_id: str = Depends(get_tenant_id)) -> dict:
    """Validation happens here rather than in the signature: the body's shape depends on
    the path parameter, which a single pydantic annotation cannot express."""
    model = _model(provider)
    try:
        config = model.model_validate(body)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return connections.save_config(tenant_id, provider, config)
