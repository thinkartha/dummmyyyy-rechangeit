"""What changed in the customer's AWS accounts since the last time we looked.

The inventory answers "what exists" and forgets the previous answer, so a bucket that
appeared overnight, a CloudFront distribution somebody disabled, or an IAM user created
last week are all invisible: the page looks the same either way. This keeps one snapshot
per account and reports the difference.

Why a snapshot diff rather than CloudTrail
------------------------------------------
CloudTrail is the precise answer and a much larger commitment — a trail per account, an
S3 bucket, Athena or Lake to query it, and a per-event bill. A diff of what we already
fetch costs one stored blob per account and answers the question people actually ask of
this page ("what is different?") rather than the forensic one ("who did it, when, from
where?"). When somebody needs the forensic answer, CloudTrail is the right thing to add
and this stays useful beside it.

The comparison is deliberately shallow — presence, plus the few fields whose change is
worth a line — because a deep diff of every attribute AWS returns produces noise on
fields that rewrite themselves (timestamps, ETags) and buries the two changes that
mattered.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

from shared.collector.cloudevents import CloudEvent, make_event
from shared.core import config_store, record_store

_INTEGRATION = "aws-inventory-snapshot"
STREAM = "cloud.changes"

# Per resource kind: how to identify one, and which fields are worth reporting when they
# change on a resource that already existed.
_KINDS: dict[str, dict[str, Any]] = {
    "hosted_zones": {"label": "Route 53 hosted zone", "id": "id", "name": "name",
                     "watch": ("record_count",)},
    "domains": {"label": "Route 53 domain", "id": "name", "name": "name",
                "watch": ("status", "auto_renew", "expiry")},
    "distributions": {"label": "CloudFront distribution", "id": "id", "name": "domain_name",
                      "watch": ("enabled", "status", "origin")},
    "buckets": {"label": "S3 bucket", "id": "name", "name": "name", "watch": ("region",)},
    "users": {"label": "IAM user", "id": "user_name", "name": "user_name", "watch": ()},
}


def _snapshot(account: dict[str, Any]) -> dict[str, dict[str, dict[str, Any]]]:
    """Reduce one account's inventory to {kind: {id: watched fields}}."""
    out: dict[str, dict[str, dict[str, Any]]] = {}
    for kind, spec in _KINDS.items():
        items = account.get(kind) or []
        bucket: dict[str, dict[str, Any]] = {}
        for item in items:
            identity = str(item.get(spec["id"]) or "")
            if not identity:
                continue
            bucket[identity] = {
                "name": item.get(spec["name"]) or identity,
                **{field: item.get(field) for field in spec["watch"]},
            }
        out[kind] = bucket
    return out


def _load(tenant_id: str) -> dict[str, Any]:
    raw = config_store.get_config(tenant_id, _INTEGRATION)
    return json.loads(raw) if raw else {}


def _save(tenant_id: str, snapshot: dict[str, Any]) -> None:
    config_store.save_config(tenant_id, _INTEGRATION, json.dumps(snapshot))


def diff(previous: dict[str, Any], current: dict[str, Any]) -> list[dict[str, Any]]:
    """Added, removed, and modified resources between two snapshots of one account."""
    found: list[dict[str, Any]] = []
    for kind, spec in _KINDS.items():
        before = previous.get(kind) or {}
        after = current.get(kind) or {}
        for identity in sorted(after.keys() - before.keys()):
            found.append({"change": "added", "kind": kind, "label": spec["label"],
                          "id": identity, "name": after[identity].get("name", identity),
                          "fields": {}})
        for identity in sorted(before.keys() - after.keys()):
            found.append({"change": "removed", "kind": kind, "label": spec["label"],
                          "id": identity, "name": before[identity].get("name", identity),
                          "fields": {}})
        for identity in sorted(before.keys() & after.keys()):
            fields = {
                field: {"from": before[identity].get(field), "to": after[identity].get(field)}
                for field in spec["watch"]
                if before[identity].get(field) != after[identity].get(field)
            }
            if fields:
                found.append({"change": "modified", "kind": kind, "label": spec["label"],
                              "id": identity, "name": after[identity].get("name", identity),
                              "fields": fields})
    return found


def record(tenant_id: str, report) -> list[dict[str, Any]]:
    """Compare this inventory report to the stored snapshot, store the changes, re-snapshot.

    The first run for an account records no changes and only takes the baseline: every
    resource would otherwise be reported as "added" the day monitoring was switched on,
    which is technically true and completely useless.

    Accounts that failed to read are skipped rather than diffed. An account that returned
    nothing because its role is missing has not had every bucket deleted, and saying so
    would be the single most alarming false alarm this could produce.
    """
    previous = _load(tenant_id)
    snapshot: dict[str, Any] = dict(previous)
    changes: list[dict[str, Any]] = []
    now = datetime.now(timezone.utc).isoformat()

    for account in report.accounts:
        if account.error:
            continue
        account_id = account.account_id
        current = _snapshot(account.model_dump())
        known = previous.get(account_id)
        snapshot[account_id] = current
        if known is None:
            continue
        for change in diff(known, current):
            changes.append({**change, "account": account_id,
                            "account_name": account.name, "at": now})

    _save(tenant_id, snapshot)
    if changes:
        record_store.append_many(tenant_id, STREAM, changes, moment_key="at")
    return changes


def events(tenant_id: str, changes: list[dict[str, Any]]) -> list[CloudEvent]:
    """Turn recorded changes into events for the shared collector spine.

    Removal is the one that gets a warning: a resource appearing is usually somebody
    doing their job, and a resource vanishing is usually either that or an outage, which
    is worth a look either way.
    """
    return [
        make_event(
            source="aws.inventory",
            type=f"cloud.resource.{change['change']}",
            tenant_id=tenant_id,
            data={
                "title": f"{change['label']} {change['change']}: {change['name']}",
                "severity": "warning" if change["change"] == "removed" else "info",
                "summary": _summarize(change),
                **change,
            },
        )
        for change in changes
    ]


def _summarize(change: dict[str, Any]) -> str:
    if change["change"] == "modified":
        parts = [f"{field} {value['from']} → {value['to']}"
                 for field, value in change["fields"].items()]
        return f"{change['label']} {change['name']}: " + ", ".join(parts)
    return f"{change['label']} {change['name']} was {change['change']} in {change['account']}"


def recent(tenant_id: str, limit: int = 100) -> list[dict[str, Any]]:
    return record_store.recent(tenant_id, STREAM, limit)
