"""Canonical event envelope — salvaged from schemas/ping-hold-{raw,curated,alerts}.

CloudEvents-style record (matches schemas/ping-hold-raw/value.avsc). `tenant_id` is the
multi-tenancy hook carried on every event. This is the canonical data contract for the platform.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel, Field


class CloudEvent(BaseModel):
    id: str
    source: str
    type: str
    timestamp: str
    specversion: str = "1.0"
    datacontenttype: str = "application/json"
    correlationid: str | None = None
    tenant_id: str | None = None
    data: dict[str, Any] = Field(default_factory=dict)


def make_event(
    *,
    source: str,
    type: str,
    tenant_id: str,
    data: dict[str, Any],
    correlationid: str | None = None,
) -> CloudEvent:
    return CloudEvent(
        id=str(uuid.uuid4()),
        source=source,
        type=type,
        timestamp=datetime.now(timezone.utc).isoformat(),
        tenant_id=tenant_id,
        correlationid=correlationid,
        data=data,
    )
