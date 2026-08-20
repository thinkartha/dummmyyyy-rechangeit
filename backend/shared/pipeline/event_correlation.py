"""Event dedup + correlation over the ingested CloudEvent buffer.

Salvaged from plugins/event_deduplicator + plugins/alert_correlator. Two changes from the old code:
  - Jaccard token similarity only (the sklearn TF-IDF path is a pluggable upgrade, kept out to
    avoid a heavy numpy/sklearn dependency here).
  - Coarser grouping (by service/host, not host+title-prefix) so an alert storm actually collapses
    into one incident — the old title-level key rarely grouped anything once dedup had run.
This runs over a REAL input path: the events EP:collector buffers, not seed data.
"""

from __future__ import annotations

from pydantic import BaseModel

from shared.collector.cloudevents import CloudEvent

_SEV_RANK = {"info": 0, "warning": 1, "error": 2, "critical": 3}
_RANK_SEV = {v: k for k, v in _SEV_RANK.items()}


def _text(ce: CloudEvent) -> str:
    d = ce.data or {}
    parts = [ce.source, ce.type, d.get("title"), d.get("description")]
    return " ".join(str(p) for p in parts if p)


def _jaccard(a: str, b: str) -> float:
    s1 = {t.lower() for t in a.split()}
    s2 = {t.lower() for t in b.split()}
    if not s1 or not s2:
        return 0.0
    return len(s1 & s2) / len(s1 | s2)


def _grouping_key(ce: CloudEvent) -> str:
    d = ce.data or {}
    return str(d.get("service") or d.get("host") or ce.source or "unknown")


class DedupResult(BaseModel):
    kept: int
    removed: int


class CorrelatedGroup(BaseModel):
    key: str
    severity: str
    event_count: int
    services: list[str]
    sample_titles: list[str]


class CorrelationResult(BaseModel):
    tenantId: str
    dedup: DedupResult
    incidents: list[CorrelatedGroup]


def dedup(events: list[CloudEvent], threshold: float = 0.6) -> tuple[list[CloudEvent], int]:
    kept: list[CloudEvent] = []
    removed = 0
    for e in events:
        t = _text(e)
        if any(_jaccard(t, _text(k)) >= threshold for k in kept):
            removed += 1
        else:
            kept.append(e)
    return kept, removed


def correlate(events: list[CloudEvent], min_group_size: int = 2) -> list[CorrelatedGroup]:
    groups: dict[str, list[CloudEvent]] = {}
    for e in events:
        groups.setdefault(_grouping_key(e), []).append(e)

    out: list[CorrelatedGroup] = []
    for key, evs in groups.items():
        if len(evs) < min_group_size:
            continue
        sev_rank = max(_SEV_RANK.get(str(e.data.get("severity", "info")).lower(), 0) for e in evs)
        services = sorted({str(e.data.get("service")) for e in evs if e.data.get("service")})
        titles = list({str(e.data.get("title")) for e in evs if e.data.get("title")})[:3]
        out.append(CorrelatedGroup(
            key=key, severity=_RANK_SEV[sev_rank], event_count=len(evs),
            services=services, sample_titles=titles,
        ))
    out.sort(key=lambda g: g.event_count, reverse=True)
    return out


def analyze(tenant_id: str, events: list[CloudEvent], min_group_size: int = 2) -> CorrelationResult:
    kept, removed = dedup(events)
    incidents = correlate(kept, min_group_size)
    return CorrelationResult(
        tenantId=tenant_id,
        dedup=DedupResult(kept=len(kept), removed=removed),
        incidents=incidents,
    )
