"""Tenant-aware event envelope — the unit that flows across the Kafka spine.

Multi-tenancy is baked in from PI-1: every event carries a tenant_id, and the topic name is
derived per-tenant (see `topic_name`).
"""

from __future__ import annotations

from typing import Any
from pydantic import BaseModel, Field


class EventEnvelope(BaseModel):
    tenant_id: str
    event_type: str
    source: str
    # Stamp `ts` at the edge (ingestion) — kept as a string/epoch passed in, never derived here,
    # so the model has no hidden time dependency.
    ts: float | None = None
    data: dict[str, Any] = Field(default_factory=dict)


def topic_name(tenant_id: str, stream: str) -> str:
    """Per-tenant topic naming, e.g. ('acme', 'events.raw') -> 'acme.events.raw'."""
    return f"{tenant_id}.{stream}"
