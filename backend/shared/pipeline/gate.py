"""EP:gate — evaluate a remediation against SLO + OPA-style policy BEFORE it can be approved.

Gate-first posture: deny-by-default, no autonomous execution. A proposal that fails any gate is not
eligible for approval (it must be remediated/overridden first). Real impls call Keptn/Sloth for the
SLO gate and OPA/Gatekeeper for policy; this encodes the same decisions inline.
"""

from __future__ import annotations

from pydantic import BaseModel

from shared.core.remediation import GateResult


class GatePolicy(BaseModel):
    # Services too sensitive to act on automatically (data stores, etc.).
    protected_services: set[str] = {"payments-db", "postgres", "kafka"}
    max_blast_radius: int = 3
    destructive_keywords: tuple[str, ...] = ("delete", "drop", "destroy", "terminate")


DEFAULT_POLICY = GatePolicy()


class GateDecision(BaseModel):
    gates: list[GateResult]
    eligible: bool  # all gates passed → may be routed for human approval


def evaluate_gates(
    action: str,
    root_service: str,
    blast_radius: int,
    error_budget_remaining: float = 100.0,
    policy: GatePolicy = DEFAULT_POLICY,
) -> GateDecision:
    action_l = action.lower()

    # SLO gate: there must be windowed error budget to absorb the action's risk, and the action's
    # blast radius must fit the cap. (error_budget_remaining is the SLO window budget, not the
    # incident's live error rate — see slo.seed.service_error_budget.)
    slo_pass = error_budget_remaining > 0 and blast_radius <= policy.max_blast_radius
    slo = GateResult(
        name="SLO gate",
        passed=slo_pass,
        detail=None if slo_pass else (
            "no error budget remaining" if error_budget_remaining <= 0
            else f"blast radius {blast_radius} exceeds cap {policy.max_blast_radius}"
        ),
    )

    destructive = any(k in action_l for k in policy.destructive_keywords)
    protected = root_service in policy.protected_services
    opa_pass = not destructive and not protected
    opa = GateResult(
        name="OPA policy",
        passed=opa_pass,
        detail=None if opa_pass else ("protected target" if protected else "destructive action"),
    )

    br_pass = blast_radius <= policy.max_blast_radius
    br = GateResult(name=f"blast radius: {blast_radius} service(s)", passed=br_pass)

    gates = [slo, opa, br]
    return GateDecision(gates=gates, eligible=all(g.passed for g in gates))
