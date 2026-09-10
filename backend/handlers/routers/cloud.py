"""GCP and Azure cost connectors — the credentials, and what they can see.

AWS keeps its own router (`aws.py`) because it carries Lambda invocation and inventory
as well. These two are cost-only, so one file covers both.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from shared.cloudcost import (
    _AZURE,
    _GCP,
    AzureCostConfig,
    GcpBillingConfig,
    config_status,
    save_config,
    visible_accounts,
)
from shared.core.tenancy import get_tenant_id

router = APIRouter(prefix="/api/v1/integrations", tags=["cloud"])


@router.put("/gcp/billing/config")
def configure_gcp(body: GcpBillingConfig, tenant_id: str = Depends(get_tenant_id)) -> dict:
    """Connect the BigQuery billing export. One export covers every project the
    billing account pays for, which is GCP's equivalent of a payer account."""
    return save_config(tenant_id, _GCP, body)


@router.get("/gcp/billing/config")
def gcp_config_status(tenant_id: str = Depends(get_tenant_id)) -> dict:
    return config_status(tenant_id, _GCP)


@router.put("/azure/cost/config")
def configure_azure(body: AzureCostConfig, tenant_id: str = Depends(get_tenant_id)) -> dict:
    """Connect Cost Management. Scoped at a billing account it reports every
    subscription; scoped at one subscription it reports only that one."""
    return save_config(tenant_id, _AZURE, body)


@router.get("/azure/cost/config")
def azure_config_status(tenant_id: str = Depends(get_tenant_id)) -> dict:
    return config_status(tenant_id, _AZURE)


@router.get("/gcp/projects")
def gcp_projects(tenant_id: str = Depends(get_tenant_id)) -> dict:
    """Active projects this credential can reach, from Cloud Resource Manager.

    The GCP answer to "does one connection cover the estate": a service account granted
    at the organization or folder level lists every project under it; one granted on a
    single project lists that project. Needs `resourcemanager.projects.list`.
    """
    return visible_accounts(tenant_id, _GCP)


@router.get("/azure/subscriptions")
def azure_subscriptions(tenant_id: str = Depends(get_tenant_id)) -> dict:
    """Enabled subscriptions this app registration can reach.

    Assigning the app a role at a management group covers every subscription beneath it;
    assigning it on one subscription returns just that one.
    """
    return visible_accounts(tenant_id, _AZURE)
