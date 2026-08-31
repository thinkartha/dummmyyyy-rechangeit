from fastapi import APIRouter, Depends, HTTPException, status

from shared.contracts.rca import RcaResponse
from shared.core import mock_data
from shared.core.tenancy import get_tenant_id
from shared.pipeline.runtime import run_scenario
from shared.pipeline.seed import demo_scenario
from shared.pipeline.store import store

router = APIRouter(prefix="/api/v1", tags=["rca"])


@router.get("/incidents/{incident_id}/rca", response_model=RcaResponse)
def incident_rca(incident_id: str, tenant_id: str = Depends(get_tenant_id)) -> RcaResponse:
    """EP:rca output for an incident, scoped to the caller's tenant.

    Computed by the EP:detector → EP:correlator → EP:rca pipeline and served from the
    store. With PINGHOLD_MOCK_DATA=1 an unknown id falls back to the demo scenario; with
    it off — the default — an unknown id is a 404.
    """
    cached = store.get(tenant_id, incident_id)
    if cached is not None:
        return cached
    # An id the pipeline never produced is only answerable from the demo scenario, which
    # is mock data: with it off, say the incident is unknown instead of inventing one.
    if not mock_data.enabled():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"No RCA for incident '{incident_id}'.")
    return run_scenario(tenant_id, demo_scenario(incident_id))
