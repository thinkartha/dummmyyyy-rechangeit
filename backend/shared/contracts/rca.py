"""EP:rca output contract.

Field names are camelCase to match the frontend consumer
(`apps/web/src/lib/mock-data.ts` / `RcaScreen`) so the JSON wires up with no transform.
"""

from __future__ import annotations

from pydantic import BaseModel


class Triplet(BaseModel):
    label: str
    detail: str


class Triad(BaseModel):
    rootCause: Triplet
    criticalFailure: Triplet
    impact: Triplet


class CausalNode(BaseModel):
    name: str
    health: str  # "ok" | "warning" | "critical"
    root: bool = False


class ProbableCause(BaseModel):
    id: str
    label: str
    confidence: int
    primary: bool = False


class BlastRadius(BaseModel):
    services: int
    detail: str


class SimilarIncident(BaseModel):
    id: str
    title: str
    similarity: int
    documentedFix: bool = False
    seasonal: str | None = None
    recurrence: str | None = None


class Remediation(BaseModel):
    action: str
    gates: list[str]


class VerifyCheck(BaseModel):
    label: str
    done: bool


class ActionItem(BaseModel):
    label: str
    owner: str


class VerifyBlock(BaseModel):
    checks: list[VerifyCheck]
    resolution: str
    recurrenceNote: str
    actionItems: list[ActionItem]


class RcaResponse(BaseModel):
    tenantId: str
    id: str
    title: str
    sev: str
    service: str
    aiSummary: str
    citations: list[str]
    triad: Triad
    causalPath: list[CausalNode]
    probableCauses: list[ProbableCause]
    blastRadius: BlastRadius
    similar: list[SimilarIncident]
    remediation: Remediation
    verify: VerifyBlock
