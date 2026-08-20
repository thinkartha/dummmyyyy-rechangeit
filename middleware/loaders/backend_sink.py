"""Load CloudEvents into LoveHeartBeat through the backend ingest API.

Middleware talks to the same public API the frontend does rather than writing to a
store directly, so ingestion keeps going through tenant resolution, validation, and
the alert pipeline. `X-Tenant-Slug` carries the organization when the job runs without
wildcard DNS in front of it.
"""

from __future__ import annotations

import json
import logging
import os
import urllib.error
import urllib.request
from typing import Any

log = logging.getLogger("middleware.etl")

DEFAULT_API_BASE_URL = os.getenv("LHB_API_BASE_URL", "http://localhost:8000")
TIMEOUT_SECONDS = 30


def _post(url: str, payload: dict[str, Any], headers: dict[str, str]) -> None:
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", **headers},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
        response.read()


def _to_ingest_payload(event: Any) -> dict[str, Any]:
    """CloudEvent → the GenericEvent body /api/v1/ingest/events validates.

    The mappers produce CloudEvents, whose severity/status/job name live inside `data`.
    The ingest endpoint wants them as top-level fields, so lift them here rather than
    loosening the endpoint's schema — it is also the public webhook contract.
    """
    ce = event.model_dump(mode="json") if hasattr(event, "model_dump") else dict(event)
    data = ce.get("data") or {}
    job = data.get("job_name") or data.get("execution_id") or "job"
    status = data.get("status") or ce.get("type", "")
    return {
        "event_type": ce["type"],
        "source": ce["source"],
        "severity": data.get("severity", "info"),
        "timestamp": ce["timestamp"],
        "title": f"{data.get('platform', ce['source'])} · {job} · {status}",
        "description": data.get("error_message"),
        "data": data,
    }


def load_events(
    events: list[Any],
    *,
    tenant_slug: str,
    api_base_url: str | None = None,
    api_key: str | None = None,
) -> dict[str, int]:
    """POST each event to /api/v1/ingest/events. Returns counts, never raises.

    A failed event is counted and logged instead of aborting: a scheduled job that dies
    partway leaves the remaining connectors unsynced until the next window, and the
    backend deduplicates on execution id, so the next run retries it anyway.
    """
    base = (api_base_url or DEFAULT_API_BASE_URL).rstrip("/")
    url = f"{base}/api/v1/ingest/events"
    headers = {"X-Tenant-Slug": tenant_slug}
    key = api_key or os.getenv("LHB_API_KEY")
    if key:
        headers["X-API-Key"] = key

    loaded = failed = 0
    for event in events:
        try:
            _post(url, _to_ingest_payload(event), headers)
            loaded += 1
        except (urllib.error.URLError, OSError, KeyError) as exc:
            log.warning("Ingest failed for tenant=%s: %s", tenant_slug, exc)
            failed += 1

    return {"loaded": loaded, "failed": failed, "destination": url}
