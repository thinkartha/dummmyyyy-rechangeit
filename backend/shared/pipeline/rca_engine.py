"""EP:rca — causal analysis producing the RcaResponse contract.

Causality comes from two signals the research flagged as the wedge:
  1. topology (deepest unhealthy service on the dependency path = root) — from the correlator, and
  2. temporal precedence (a state change, e.g. a deploy, that precedes anomaly onset = root cause).
This is where Neo4j fault-tree + DoWhy/CausalNex will deepen; the contract stays the same.
"""

from __future__ import annotations

import re

from shared.contracts.rca import (
    RcaResponse,
    Triad,
    Triplet,
    CausalNode,
    ProbableCause,
    BlastRadius,
    SimilarIncident,
    Remediation,
    VerifyBlock,
    VerifyCheck,
    ActionItem,
)
from .gate import evaluate_gates
from shared.slo.seed import service_error_budget
from .signals import Scenario
from .detector import Anomaly, LogTemplate
from .correlator import CorrelatedIncident

# Tiny similar-incident memory; a real impl queries OpenSearch kNN / Neo4j similarity.
_SIMILAR: dict[str, list[SimilarIncident]] = {
    "payments-api": [
        SimilarIncident(id="INC-1183", title="payments-db pool exhaustion", similarity=91, documentedFix=True, seasonal="month-end · 3 priors"),
        SimilarIncident(id="INC-1042", title="deploy regression payments-api", similarity=78, documentedFix=True, recurrence="4th occurrence"),
    ],
}


def _short(template: str, words: int = 5) -> str:
    parts = template.split()
    return " ".join(parts[:words]) + ("…" if len(parts) > words else "")


def _previous_version(version: str) -> str:
    m = re.match(r"^(v?)(\d+)\.(\d+)\.(\d+)$", version)
    if not m:
        return "previous"
    prefix, major, minor, patch = m.group(1), int(m.group(2)), int(m.group(3)), int(m.group(4))
    if patch > 0:
        patch -= 1
    elif minor > 0:
        minor, patch = minor - 1, 0
    return f"{prefix}{major}.{minor}.{patch}"


def analyze(
    tenant_id: str,
    scenario: Scenario,
    correlated: CorrelatedIncident,
    anomalies: list[Anomaly],
    log_templates: list[LogTemplate],
) -> RcaResponse:
    root = correlated.root_service
    root_node = next((n for n in correlated.causal_path if n.is_root), correlated.causal_path[-1])
    sev = "SEV-2" if root_node.health == "critical" else "SEV-3"

    root_anoms = [a for a in anomalies if a.service == root]
    root_anoms.sort(key=lambda a: a.score, reverse=True)
    err = next((a for a in root_anoms if a.metric == "error_rate"), None)
    lat = next((a for a in root_anoms if a.metric in ("latency_p95", "latency")), None)

    # Root cause via temporal precedence: a deploy on the root service at/just before onset.
    deploy = next(
        (d for d in scenario.deploys if d.service == root and d.at_index <= correlated.root_onset_index),
        None,
    )
    if deploy:
        root_cause = Triplet(label=f"Deploy {deploy.version}", detail=f"state change · {deploy.at_label}")
    else:
        top = root_anoms[0]
        root_cause = Triplet(label=f"{top.metric} anomaly", detail=f"{top.score}× baseline")

    lt = next((t for t in log_templates if t.service == root), None)
    cf_label = _short(lt.template) if lt else f"{root} failing"
    if err:
        cf_detail = f"error rate {int(err.current)}%"
    elif lat:
        cf_detail = f"p95 {lat.current}"
    else:
        cf_detail = "degraded"
    critical_failure = Triplet(label=cf_label, detail=cf_detail)

    err_pct = err.current if err else 20.0
    impacted = int(scenario.baseline_users * min(0.9, err_pct / 100.0)) or int(scenario.baseline_users * 0.1)
    n_services = len(correlated.affected_services)
    impact = Triplet(
        label=f"{scenario.entrypoint} −{int(err_pct * 0.6)}%",
        detail=f"{impacted:,} users · {n_services} services",
    )

    causal_path = [CausalNode(name=n.service, health=n.health, root=n.is_root) for n in correlated.causal_path]

    # Ranked probable causes (confidence derived from anomaly strength).
    ranked: list[tuple[int, ProbableCause]] = []
    strength = (err.score if err else lat.score if lat else (root_anoms[0].score if root_anoms else 2.0))
    if deploy:
        conf = min(95, int(55 + strength * 8))
        ranked.append((conf, ProbableCause(id="pc-deploy", label=f"Deploy {deploy.version}", confidence=conf)))
    rps = next((a for a in anomalies if a.metric in ("rps", "traffic")), None)
    if rps:
        c = min(90, int(35 + rps.score * 8))
        ranked.append((c, ProbableCause(id="pc-traffic", label=f"Traffic surge {rps.score:.1f}×", confidence=c)))
    mem = next((a for a in anomalies if a.metric == "mem"), None)
    if mem:
        c = min(80, int(25 + mem.score * 10))
        ranked.append((c, ProbableCause(id="pc-mem", label="Node mem pressure", confidence=c)))
    if not ranked and root_anoms:
        top = root_anoms[0]
        c = min(90, int(40 + top.score * 8))
        ranked.append((c, ProbableCause(id="pc-top", label=f"{root} {top.metric}", confidence=c)))
    ranked.sort(key=lambda x: x[0], reverse=True)
    probable_causes = [pc for _, pc in ranked]
    if probable_causes:
        probable_causes[0].primary = True
    primary_conf = ranked[0][0] if ranked else 0

    blast = BlastRadius(
        services=n_services,
        detail=" · ".join(correlated.affected_services) + f" · {impacted:,} users · 1 region (us-east)",
    )

    similar = _SIMILAR.get(root, [])

    # Gate-first remediation (deny-by-default; never autonomous).
    prev = _previous_version(deploy.version) if deploy else None
    action = f"Roll back {root} → {prev}" if deploy else f"Restart {root}"
    decision = evaluate_gates(action, root, n_services, error_budget_remaining=service_error_budget(root))
    remediation = Remediation(
        action=action,
        gates=[g.name if g.passed else f"{g.name} ✗ ({g.detail})" for g in decision.gates],
    )

    failing_metric = err.metric if err else (lat.metric if lat else "health")
    verify = VerifyBlock(
        checks=[
            VerifyCheck(label=f"{root} {failing_metric} returns to baseline", done=False),
            VerifyCheck(label=f"{scenario.entrypoint} success recovers", done=False),
            VerifyCheck(label="Original failure no longer reproduces", done=False),
        ],
        resolution="Pending — runs after approval; clock stops on verified recovery",
        recurrenceNote=(
            f"Resembles {similar[0].seasonal}." if similar and similar[0].seasonal else "No prior seasonal pattern detected."
        ),
        actionItems=[
            ActionItem(label=f"Alert on {root} {failing_metric} threshold", owner="@oncall"),
            ActionItem(label=f"Canary {root} deploys", owner="@platform"),
        ],
    )

    change_desc = f"deploy {deploy.version}" if deploy else "a state change"
    ai_summary = (
        f"{root} {failing_metric} rose ~{strength:.0f}× after {change_desc}, "
        f"degrading {scenario.entrypoint}. Top hypothesis confidence {primary_conf}%."
    )
    citations = [c for c in [deploy.version if deploy else None, lt.template[:40] if lt else None, similar[0].id if similar else None] if c]

    return RcaResponse(
        tenantId=tenant_id,
        id=correlated.incident_id,
        title=f"{scenario.entrypoint} {('latency' if lat else 'error')} spike",
        sev=sev,
        service=root,
        aiSummary=ai_summary,
        citations=citations,
        triad=Triad(rootCause=root_cause, criticalFailure=critical_failure, impact=impact),
        causalPath=causal_path,
        probableCauses=probable_causes,
        blastRadius=blast,
        similar=similar,
        remediation=remediation,
        verify=verify,
    )
