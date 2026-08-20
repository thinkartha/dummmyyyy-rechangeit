"""Wires EP:detector -> EP:correlator -> EP:rca and runs scenarios.

The stages communicate results directly (typed), while lifecycle events are published on the shared
event bus for observability/auditing — the same seam a Kafka transport would carry across services.
"""

from __future__ import annotations

import logging

from shared.contracts.rca import RcaResponse
from shared.core.envelope import EventEnvelope
from shared.core.eventbus import event_bus
from .signals import Scenario
from .service_graph import get_service_graph
from .detector import detect_anomalies, extract_log_templates
from .correlator import correlate
from . import rca_engine
from .store import store

log = logging.getLogger("pinghold.pipeline")

_LIFECYCLE = ("anomaly.detected", "incident.correlated", "rca.completed", "gate.evaluated")
_initialized = False


def _audit(env: EventEnvelope) -> None:
    log.info("pipeline event %s tenant=%s data=%s", env.event_type, env.tenant_id, env.data)


def run_scenario(tenant_id: str, scenario: Scenario) -> RcaResponse:
    graph = get_service_graph(scenario.edges, scenario.entrypoint, tenant_id)

    anomalies = detect_anomalies(scenario.metrics)
    event_bus.publish(
        EventEnvelope(tenant_id=tenant_id, event_type="anomaly.detected", source="EP:detector",
                      data={"count": len(anomalies)})
    )

    log_templates = extract_log_templates(scenario.logs)
    correlated = correlate(scenario.incident_id, anomalies, graph)
    event_bus.publish(
        EventEnvelope(tenant_id=tenant_id, event_type="incident.correlated", source="EP:correlator",
                      data={"incident_id": scenario.incident_id, "root": correlated.root_service})
    )

    rca = rca_engine.analyze(tenant_id, scenario, correlated, anomalies, log_templates)
    store.put(tenant_id, scenario.incident_id, rca)
    event_bus.publish(
        EventEnvelope(tenant_id=tenant_id, event_type="rca.completed", source="EP:rca",
                      data={"incident_id": scenario.incident_id, "sev": rca.sev, "root": rca.service})
    )
    event_bus.publish(
        EventEnvelope(tenant_id=tenant_id, event_type="gate.evaluated", source="EP:gate",
                      data={"action": rca.remediation.action, "gates": rca.remediation.gates})
    )
    return rca


def init() -> None:
    """Subscribe the audit handler and seed the demo incident (idempotent)."""
    global _initialized
    if _initialized:
        return
    for evt in _LIFECYCLE:
        event_bus.subscribe(evt, _audit)
    from .seed import demo_scenario

    run_scenario("acme", demo_scenario("INC-1207"))
    _initialized = True
