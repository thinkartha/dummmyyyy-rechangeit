"""Gate-first remediation model.

Posture (decided): propose -> gate (OPA/Gatekeeper + Keptn-style SLO gate) -> human approve ->
execute (Argo) -> verify -> escalate. Deny-by-default; NO autonomous execution.
"""

from __future__ import annotations

from enum import Enum
from pydantic import BaseModel


class RemediationState(str, Enum):
    proposed = "proposed"
    gated = "gated"
    awaiting_approval = "awaiting_approval"
    approved = "approved"
    executing = "executing"
    verifying = "verifying"
    resolved = "resolved"
    escalated = "escalated"
    rejected = "rejected"


class GateResult(BaseModel):
    name: str
    passed: bool
    detail: str | None = None


class RemediationProposal(BaseModel):
    action: str
    blast_radius_services: int
    gates: list[GateResult]
    requires_approval: bool = True  # deny-by-default: a human must approve
    autonomous: bool = False  # never auto-execute in this posture
    state: RemediationState = RemediationState.awaiting_approval
