"""Tenant-scoped ETL sync: extract runs → map to events → load into LoveHeartBeat.

The batch counterpart to the backend's in-process pollers. Same clients, same mappers,
but driven on a schedule (EventBridge / Step Functions / cron) instead of a thread, so
it survives Lambda cold starts and can backfill a tenant on demand.

Run locally:
  cd middleware && PYTHONPATH=. python -m pipelines.etl_sync rootvyana

Environment:
  LHB_API_BASE_URL   backend base URL (default http://localhost:8000)
  LHB_API_KEY        API key sent as X-API-Key, when the backend requires one
"""

from __future__ import annotations

import logging
import sys

from extractors.etl_platforms import PLATFORMS, extract_all
from loaders.backend_sink import load_events
from transformers.etl_events import transform_all

log = logging.getLogger("middleware.etl")


def run(
    tenant_slug: str,
    *,
    org_id: str | None = None,
    limit: int = 100,
    api_base_url: str | None = None,
) -> dict[str, object]:
    """Sync every ETL platform this organization has connected.

    `org_id` is what the backend's stored connector configs are keyed by; it defaults to
    `org_<slug>`, matching how `shared.tenant` mints ids for the demo registry. Pass it
    explicitly when a tenant's id does not follow that convention.
    """
    tenant_id = org_id or f"org_{tenant_slug}"

    extracted = extract_all(tenant_id, limit)
    events = transform_all(extracted, tenant_id)
    result = load_events(events, tenant_slug=tenant_slug, api_base_url=api_base_url)

    summary = {
        "tenant_slug": tenant_slug,
        "org_id": tenant_id,
        "extracted": {p: len(extracted.get(p, [])) for p in PLATFORMS},
        "events": len(events),
        **result,
    }
    log.info("ETL sync complete: %s", summary)
    return summary


def demo() -> None:
    """Self-check: the extract → transform → load wiring, without a vendor or a backend."""
    from loaders.backend_sink import _to_ingest_payload
    from transformers.etl_events import transform_runs

    talend_row = {
        "task_execution_id": "exec-1",
        "task_name": "nightly-customer-load",
        "status": "EXECUTION_FAILED",
        "error_message": "connection reset by peer",
    }
    events = transform_runs("talend", [talend_row], "org_rootvyana")
    assert len(events) == 1, events
    assert events[0].tenant_id == "org_rootvyana"
    assert events[0].type == "etl.job.failed", events[0].type

    payload = _to_ingest_payload(events[0])
    assert payload["severity"] == "critical", payload
    assert payload["source"] == "talend"
    assert "nightly-customer-load" in payload["title"], payload["title"]
    assert payload["description"] == "connection reset by peer"

    # A row no vendor schema accepts is dropped, not raised.
    assert transform_runs("boomi", [{"nope": True}], "org_rootvyana") == []

    print("etl_sync demo ok")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    if len(sys.argv) > 1 and sys.argv[1] == "--demo":
        demo()
    else:
        print(run(sys.argv[1] if len(sys.argv) > 1 else "rootvyana"))
