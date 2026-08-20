from fastapi import APIRouter, Depends

from shared.contracts.rca import RcaResponse
from shared.core.tenancy import get_tenant_id
from shared.pipeline.runtime import run_scenario
from shared.pipeline.seed import demo_scenario
from shared.pipeline.store import store

router = APIRouter(prefix="/api/v1", tags=["rca"])


@router.get("/incidents/{incident_id}/rca", response_model=RcaResponse)
def incident_rca(incident_id: str, tenant_id: str = Depends(get_tenant_id)) -> RcaResponse:
    """EP:rca output for an incident, scoped to the caller's tenant.

    Computed by the EP:detector → EP:correlator → EP:rca pipeline. The seeded incident is served
    from the store; any other id is computed on the fly from the demo scenario for that tenant.
    """
    cached = store.get(tenant_id, incident_id)
    if cached is not None:
        return cached
    return run_scenario(tenant_id, demo_scenario(incident_id))
