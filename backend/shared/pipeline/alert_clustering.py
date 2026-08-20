"""Collapse an alert storm into a handful of alerts a human can actually read.

pipeline/event_correlation.py groups by service, which answers "where". This answers
"what": one deploy typically produces hundreds of alerts that are the same sentence with
different ids, hosts and numbers in it. Drain3 (already a dependency — detector.py mines
log templates with it) turns those into one template, and the template becomes the
cluster key. Clusters whose templates are near-duplicates are then merged by token
overlap, because two phrasings of the same failure are still one alert.

Each cluster elects a *main alert* — the highest-severity, most recent member — and
carries the rest as evidence rather than as separate rows.

The second half of this module is agent_brief(): the same cluster condensed into
something a coding agent can act on. An agent handed 400 raw alerts spends its context
window rediscovering that they are 400 copies of one line. It is handed the templates,
the variable parts that actually differ, the timeline, and the affected services —
typically a 50x reduction — with no LLM call on this side.
"""

from __future__ import annotations

import hashlib
import re
from collections import Counter
from datetime import datetime, timezone
from typing import Any, Iterable

from drain3 import TemplateMiner
from drain3.template_miner_config import TemplateMinerConfig
from pydantic import BaseModel, Field

from shared.collector.cloudevents import CloudEvent

_SEV_RANK = {"info": 0, "warning": 1, "warn": 1, "error": 2, "critical": 3, "fatal": 3}
_RANK_SEV = {0: "info", 1: "warning", 2: "error", 3: "critical"}

# Templates this similar are the same alert phrased two ways.
_MERGE_THRESHOLD = 0.75
# Enough for an agent to see the shape of the variance without pasting the storm back in.
_SAMPLES_PER_CLUSTER = 3
_MAX_BRIEF_LOG_LINES = 40


class ClusterMember(BaseModel):
    id: str
    title: str
    severity: str
    service: str | None = None
    source: str
    timestamp: str


class AlertCluster(BaseModel):
    id: str
    """Stable across runs: the same storm re-clustered keeps the same id, so a UI
    selection and an agent brief still point at the same thing after a refresh."""
    title: str
    template: str
    severity: str
    status: str  # "firing" | "resolved"
    count: int
    services: list[str] = Field(default_factory=list)
    sources: list[str] = Field(default_factory=list)
    first_seen: str | None = None
    last_seen: str | None = None
    main_alert: ClusterMember
    samples: list[ClusterMember] = Field(default_factory=list)
    variables: dict[str, list[str]] = Field(default_factory=dict)
    merged_templates: list[str] = Field(default_factory=list)


class ClusterResult(BaseModel):
    tenantId: str
    total_alerts: int
    clusters: list[AlertCluster]
    noise_reduction: float
    """1 - clusters/alerts: the share of rows a responder no longer has to read."""


# --- normalization ----------------------------------------------------------

def _severity(event: CloudEvent) -> str:
    raw = str((event.data or {}).get("severity", "")).lower()
    return _RANK_SEV[_SEV_RANK.get(raw, 0)]


def _service(event: CloudEvent) -> str | None:
    data = event.data or {}
    value = data.get("service") or data.get("host") or data.get("resource")
    return str(value) if value else None


def _title(event: CloudEvent) -> str:
    data = event.data or {}
    return str(data.get("title") or data.get("description") or event.type or "(untitled alert)")


def _text(event: CloudEvent) -> str:
    """What gets templated: the title plus the description's first line.

    Not the whole description — a stack trace would give every alert its own template
    and defeat the clustering, which is the one thing this module exists to do.
    """
    data = event.data or {}
    description = str(data.get("description") or "").strip().splitlines()
    return f"{_title(event)} {description[0] if description else ''}".strip()


def _timestamp(event: CloudEvent) -> str:
    return event.timestamp or datetime.now(timezone.utc).isoformat()


def _tokens(text: str) -> set[str]:
    return {t for t in re.split(r"\W+", text.lower()) if t}


def _jaccard(a: set[str], b: set[str]) -> float:
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def _cluster_id(template: str) -> str:
    return "alc-" + hashlib.sha1(template.encode("utf-8")).hexdigest()[:12]


# --- clustering -------------------------------------------------------------

def _mine(texts: list[str]) -> tuple[list[int], dict[int, str]]:
    """Assign each text a Drain cluster id, and return the final template per cluster.

    Two passes on purpose. Drain generalizes a cluster's template as it sees more
    members, so the template returned when the *first* alert of a storm arrives is still
    the literal line — grouping on that value would leave alert #1 in a cluster of its
    own while the other 299 merged. Group on the cluster id, which is stable, and read
    the templates once mining is done.
    """
    miner = TemplateMiner(config=TemplateMinerConfig())
    ids = []
    for text in texts:
        result = miner.add_log_message(text) or {}
        ids.append(result.get("cluster_id", 0))
    templates = {c.cluster_id: c.get_template() for c in miner.drain.clusters}
    return ids, templates


def _merge_similar(
    groups: dict[str, list[CloudEvent]],
) -> tuple[dict[str, list[CloudEvent]], dict[str, list[str]]]:
    """Fold near-duplicate templates into the largest one.

    Drain splits on the first token, so "Timeout calling payments" and "Timed out
    calling payments" land in different clusters no matter how the tree is tuned. One
    Jaccard pass over the templates — there are tens of them, not thousands — costs
    nothing and fixes it.

    Returns the merged groups and, per surviving template, the templates folded into it.
    """
    ordered = sorted(groups.items(), key=lambda kv: len(kv[1]), reverse=True)
    merged: dict[str, list[CloudEvent]] = {}
    aliases: dict[str, list[str]] = {}

    for template, events in ordered:
        tokens = _tokens(template)
        target = next(
            (kept for kept in merged if _jaccard(tokens, _tokens(kept)) >= _MERGE_THRESHOLD),
            None,
        )
        if target:
            merged[target].extend(events)
            aliases.setdefault(target, []).append(template)
        else:
            merged[template] = list(events)

    return merged, aliases


def _variables(template: str, events: list[CloudEvent]) -> dict[str, list[str]]:
    """The parts that actually differ across a cluster.

    Drain marks them <*>; this recovers what filled each slot. It is the difference
    between "connection to <*> refused" and knowing all 300 were the same host.
    """
    pattern = re.compile(
        "^" + "(.*?)".join(re.escape(part) for part in template.split("<*>")) + "$"
    )
    slots: dict[int, Counter] = {}
    for event in events:
        match = pattern.match(_text(event))
        if not match:
            continue
        for index, value in enumerate(match.groups()):
            value = value.strip()
            if value:
                slots.setdefault(index, Counter())[value] += 1
    return {
        f"slot_{index}": [value for value, _ in counter.most_common(5)]
        for index, counter in sorted(slots.items())
        # A slot with one value across the whole cluster is a constant, not a variable.
        if len(counter) > 1
    }


def _member(event: CloudEvent) -> ClusterMember:
    return ClusterMember(
        id=event.id,
        title=_title(event),
        severity=_severity(event),
        service=_service(event),
        source=event.source,
        timestamp=_timestamp(event),
    )


def _resolved(event: CloudEvent) -> bool:
    data = event.data or {}
    return str(data.get("status") or data.get("state") or "").lower() in {
        "resolved", "closed", "ok", "recovered"
    }


def cluster(events: Iterable[CloudEvent]) -> list[AlertCluster]:
    """Group alerts into clusters, most alerts first."""
    events = [e for e in events if e is not None]
    if not events:
        return []

    ids, templates = _mine([_text(e) for e in events])
    groups: dict[str, list[CloudEvent]] = {}
    for event, cluster_id in zip(events, ids):
        groups.setdefault(templates.get(cluster_id) or _text(event), []).append(event)

    merged, aliases = _merge_similar(groups)

    clusters = []
    for template, members in merged.items():
        by_time = sorted(members, key=_timestamp)
        # The main alert is the worst one, and among equally bad ones the newest —
        # that is the row a responder should open first.
        main = max(members, key=lambda e: (_SEV_RANK.get(_severity(e), 0), _timestamp(e)))
        severity = _RANK_SEV[max(_SEV_RANK.get(_severity(e), 0) for e in members)]
        clusters.append(AlertCluster(
            id=_cluster_id(template),
            title=_title(main),
            template=template,
            severity=severity,
            # Firing unless every member resolved; one open alert keeps it open.
            status="resolved" if all(_resolved(e) for e in members) else "firing",
            count=len(members),
            services=sorted({s for s in (_service(e) for e in members) if s}),
            sources=sorted({e.source for e in members}),
            first_seen=_timestamp(by_time[0]),
            last_seen=_timestamp(by_time[-1]),
            main_alert=_member(main),
            samples=[_member(e) for e in by_time[-_SAMPLES_PER_CLUSTER:]],
            variables=_variables(template, members),
            merged_templates=aliases.get(template, []),
        ))

    clusters.sort(key=lambda c: (_SEV_RANK.get(c.severity, 0), c.count), reverse=True)
    return clusters


def cluster_alerts(tenant_id: str, events: Iterable[CloudEvent]) -> ClusterResult:
    events = list(events)
    clusters = cluster(events)
    return ClusterResult(
        tenantId=tenant_id,
        total_alerts=len(events),
        clusters=clusters,
        noise_reduction=round(1 - len(clusters) / len(events), 4) if events else 0.0,
    )


# --- agent brief ------------------------------------------------------------

def _condense_logs(events: list[CloudEvent]) -> list[str]:
    """Deduplicate log lines by template and prefix each with how many it stands for.

    This is the compression that makes the brief fit: 400 lines that differ only in a
    request id become one line reading "[×400]".
    """
    lines = [
        stripped
        for event in events
        for line in str((event.data or {}).get("description") or "").splitlines()
        if (stripped := line.strip())
    ]
    if not lines:
        return []

    ids, _ = _mine(lines)
    counts: Counter = Counter(ids)
    examples: dict[int, str] = {}
    for cluster_id, line in zip(ids, lines):
        examples.setdefault(cluster_id, line)

    return [
        f"[×{count}] {examples[cluster_id]}" if count > 1 else examples[cluster_id]
        for cluster_id, count in counts.most_common(_MAX_BRIEF_LOG_LINES)
    ]


def agent_brief(cluster_obj: AlertCluster, events: list[CloudEvent]) -> dict[str, Any]:
    """A coding agent's view of one cluster: the facts, condensed, plus a ready prompt.

    No LLM call happens here. This backend has no model client and adding one would mean
    a key, a vendor and a bill for a step that is string assembly. The prompt goes to
    whichever agent the caller already runs.
    """
    members = [e for e in events if _cluster_id_matches(cluster_obj, e)]
    logs = _condense_logs(members)
    timeline = _timeline(members)

    facts = {
        "cluster_id": cluster_obj.id,
        "title": cluster_obj.title,
        "template": cluster_obj.template,
        "severity": cluster_obj.severity,
        "status": cluster_obj.status,
        "alert_count": cluster_obj.count,
        "affected_services": cluster_obj.services,
        "sources": cluster_obj.sources,
        "first_seen": cluster_obj.first_seen,
        "last_seen": cluster_obj.last_seen,
        "variable_parts": cluster_obj.variables,
        "condensed_logs": logs,
        "timeline": timeline,
    }
    return {
        **facts,
        "compression": {
            "alerts_in": cluster_obj.count,
            "lines_out": len(logs) + len(timeline),
        },
        "prompt": _prompt(facts),
    }


def _cluster_id_matches(cluster_obj: AlertCluster, event: CloudEvent) -> bool:
    """Membership without re-running Drain: a member's id is in the cluster's samples,
    or its text still matches the cluster template."""
    if event.id == cluster_obj.main_alert.id or any(s.id == event.id for s in cluster_obj.samples):
        return True
    pattern = re.compile(
        "^" + "(.*?)".join(re.escape(part) for part in cluster_obj.template.split("<*>")) + "$"
    )
    if pattern.match(_text(event)):
        return True
    return _jaccard(_tokens(_text(event)), _tokens(cluster_obj.template)) >= _MERGE_THRESHOLD


def _timeline(events: list[CloudEvent]) -> list[str]:
    """First and last occurrence per service — the shape of the spread, not every tick."""
    per_service: dict[str, list[str]] = {}
    for event in sorted(events, key=_timestamp):
        per_service.setdefault(_service(event) or "unknown", []).append(_timestamp(event))
    return [
        f"{service}: {stamps[0]} → {stamps[-1]} ({len(stamps)} alerts)"
        for service, stamps in sorted(per_service.items(), key=lambda kv: kv[1][0])
    ]


def _prompt(facts: dict[str, Any]) -> str:
    """Markdown brief. Written as instructions to an agent with repo access, which is
    the case this exists for — an agent that can go read the code that is failing."""
    lines = [
        f"# Incident: {facts['title']}",
        "",
        f"{facts['alert_count']} alerts collapsed into one. "
        f"Severity: {facts['severity']}. Status: {facts['status']}.",
        f"Window: {facts['first_seen']} → {facts['last_seen']}.",
        "",
        "## Alert template",
        "```",
        facts["template"],
        "```",
    ]
    if facts["affected_services"]:
        lines += ["", "## Affected services", ", ".join(facts["affected_services"])]
    if facts["variable_parts"]:
        lines += ["", "## What varies across the alerts"]
        lines += [f"- {slot}: {', '.join(values)}" for slot, values in facts["variable_parts"].items()]
    if facts["timeline"]:
        lines += ["", "## Timeline"] + [f"- {entry}" for entry in facts["timeline"]]
    if facts["condensed_logs"]:
        lines += ["", "## Condensed logs (deduplicated, ×N = repeat count)", "```"]
        lines += facts["condensed_logs"]
        lines += ["```"]
    lines += [
        "",
        "## Task",
        "Find the code path responsible for this failure. Report the root cause, the "
        "file and line, and the smallest safe fix. If the evidence above is not enough "
        "to identify a single cause, say what is missing rather than guessing.",
    ]
    return "\n".join(lines)
