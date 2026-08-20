"""Inbound webhook DTOs — salvaged from ping_hold_engine/schemas.py (pydantic v2)."""

from __future__ import annotations

from typing import Any
from pydantic import BaseModel, Field


class PagerDutyWebhook(BaseModel):
    event_type: str = Field(..., description="Type of PagerDuty event")
    incident: dict[str, Any] = Field(..., description="Incident information")


class ServiceNowWebhook(BaseModel):
    sys_id: str
    number: str
    short_description: str
    description: str | None = None
    priority: int | None = None
    state: str | None = None
    assignment_group: str | None = None


class GenericEvent(BaseModel):
    event_type: str
    source: str
    severity: str = Field(..., description="info | warning | error | critical")
    timestamp: str
    title: str
    description: str | None = None
    data: dict[str, Any] | None = None
