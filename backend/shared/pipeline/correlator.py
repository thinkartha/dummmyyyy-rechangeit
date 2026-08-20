"""EP:correlator — collapse anomalies into one incident using the service graph.

Topology-aware (not time-only): the root is the *deepest* unhealthy service on the dependency path,
which is what makes this causal rather than a flat correlation list.
"""

from __future__ import annotations

from pydantic import BaseModel

from .detector import Anomaly
from .service_graph import ServiceGraphProtocol


class CausalPathNode(BaseModel):
    service: str
    health: str  # "ok" | "warning" | "critical"
    is_root: bool = False


class CorrelatedIncident(BaseModel):
    incident_id: str
    root_service: str
    causal_path: list[CausalPathNode]
    affected_services: list[str]
    root_onset_index: int


def _health_for(service: str, anomalies: list[Anomaly]) -> str:
    sevs = [a.severity for a in anomalies if a.service == service]
    if "critical" in sevs:
        return "critical"
    if "warning" in sevs:
        return "warning"
    return "ok"


def correlate(incident_id: str, anomalies: list[Anomaly], graph: ServiceGraphProtocol) -> CorrelatedIncident:
    anomalous = {a.service for a in anomalies}
    if not anomalous:
        raise ValueError("no anomalies to correlate")

    # Root = deepest anomalous service; break ties by anomaly score.
    def root_key(svc: str) -> tuple[int, float]:
        depth = graph.depth(svc)
        score = max((a.score for a in anomalies if a.service == svc), default=0.0)
        return (depth, score)

    root_service = max(anomalous, key=root_key)

    path = graph.path_to(root_service)
    causal_path = [
        CausalPathNode(service=s, health=_health_for(s, anomalies), is_root=(s == root_service))
        for s in path
    ]

    affected = sorted(anomalous, key=lambda s: graph.depth(s))
    root_onset = min((a.onset_index for a in anomalies if a.service == root_service), default=0)

    return CorrelatedIncident(
        incident_id=incident_id,
        root_service=root_service,
        causal_path=causal_path,
        affected_services=affected,
        root_onset_index=root_onset,
    )
