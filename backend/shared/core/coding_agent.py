"""Provider-neutral handoff of an incident brief to a coding agent.

Loveheartbeat does not assume a particular coding-agent vendor. Operators configure an HTTP
job endpoint in PINGHOLD_CODING_AGENT_URL; this module submits the condensed prompt and
persists the returned job status in the tenant-scoped record store.
"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
import uuid
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlparse

from . import record_store

STREAM = "coding-agent-dispatches"
_TIMEOUT_SECONDS = 30
_MAX_RESPONSE_BYTES = 1_000_000


class NotConfigured(RuntimeError):
    """No coding-agent job endpoint has been configured."""


class UpstreamError(RuntimeError):
    """The configured coding-agent endpoint rejected or could not receive the job."""


def _url() -> str:
    url = os.getenv("PINGHOLD_CODING_AGENT_URL", "").strip()
    if not url:
        raise NotConfigured(
            "Coding-agent handoff is not configured. Set PINGHOLD_CODING_AGENT_URL."
        )
    if urlparse(url).scheme not in {"http", "https"}:
        raise NotConfigured("PINGHOLD_CODING_AGENT_URL must be an http(s) URL")
    return url


def _post(url: str, payload: dict[str, Any]) -> dict[str, Any]:
    headers = {"Accept": "application/json", "Content-Type": "application/json"}
    token = os.getenv("PINGHOLD_CODING_AGENT_TOKEN", "").strip()
    if token:
        headers["Authorization"] = f"Bearer {token}"
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=_TIMEOUT_SECONDS) as response:
            raw = response.read(_MAX_RESPONSE_BYTES + 1)
            if len(raw) > _MAX_RESPONSE_BYTES:
                raise UpstreamError("Coding-agent response exceeded 1 MB")
    except urllib.error.HTTPError as exc:
        raise UpstreamError(f"Coding-agent endpoint returned HTTP {exc.code}") from exc
    except UpstreamError:
        raise
    except Exception as exc:
        raise UpstreamError(f"Coding-agent endpoint is unreachable: {exc}") from exc

    if not raw:
        return {}
    try:
        decoded = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise UpstreamError("Coding-agent endpoint returned invalid JSON") from exc
    return decoded if isinstance(decoded, dict) else {"response": decoded}


def dispatch(tenant_id: str, brief: dict[str, Any]) -> dict[str, Any]:
    """Submit one cluster brief and retain enough status to audit the handoff."""
    dispatch_id = f"cad-{uuid.uuid4().hex[:12]}"
    submitted_at = datetime.now(timezone.utc).isoformat()
    payload = {
        "type": "pinghold.incident.coding_agent.v1",
        "dispatch_id": dispatch_id,
        "tenant_id": tenant_id,
        "cluster_id": brief["cluster_id"],
        "repository": os.getenv("PINGHOLD_CODING_AGENT_REPOSITORY", "").strip() or None,
        "prompt": brief["prompt"],
        "incident": {key: value for key, value in brief.items() if key != "prompt"},
    }

    try:
        response = _post(_url(), payload)
    except (NotConfigured, UpstreamError) as exc:
        record = {
            "id": dispatch_id,
            "cluster_id": brief["cluster_id"],
            "status": "failed",
            "submitted_at": submitted_at,
            "error": str(exc),
            "external_id": None,
            "result": None,
        }
        record_store.append(tenant_id, STREAM, record)
        raise

    record = {
        "id": dispatch_id,
        "cluster_id": brief["cluster_id"],
        "status": str(response.get("status") or response.get("state") or "submitted"),
        "submitted_at": submitted_at,
        "error": None,
        "external_id": response.get("job_id") or response.get("run_id") or response.get("id"),
        "result": response.get("result") or response.get("output") or response.get("message"),
    }
    record_store.append(tenant_id, STREAM, record)
    return record


def history(tenant_id: str, cluster_id: str | None = None, limit: int = 20) -> list[dict[str, Any]]:
    rows = record_store.recent(tenant_id, STREAM, limit)
    return [row for row in rows if cluster_id is None or row.get("cluster_id") == cluster_id]
