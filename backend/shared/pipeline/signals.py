"""Raw inputs to the pipeline (what EP:collector would feed onto the bus)."""

from __future__ import annotations

from pydantic import BaseModel, Field


class MetricSeries(BaseModel):
    service: str
    metric: str  # e.g. "latency_p95", "error_rate", "rps", "mem"
    values: list[float]


class DeployEvent(BaseModel):
    service: str
    version: str
    at_index: int  # position in the metric window where the deploy happened
    at_label: str  # human time label, e.g. "13:42"


class LogLine(BaseModel):
    service: str
    level: str  # "error" | "warn" | "info"
    message: str


class Scenario(BaseModel):
    """A bundle of raw signals for one incident window."""

    incident_id: str
    entrypoint: str  # customer-facing service
    edges: list[tuple[str, str]]  # directed dependency edges (caller -> callee)
    metrics: list[MetricSeries]
    deploys: list[DeployEvent] = Field(default_factory=list)
    logs: list[LogLine] = Field(default_factory=list)
    baseline_users: int = 1000
