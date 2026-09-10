"""CloudWatch Metric Streams ingest — every AWS service, pushed, without a collector each.

Why this exists
---------------
`lambda_service.py` polls CloudWatch for Lambda, and that is the only AWS service this
app has ever measured. Adding EC2, RDS, ALB, SQS, DynamoDB and the rest the same way
means a new collector per service, each one paying per-API-call on every page load, and
each one only as fresh as the last time somebody looked at a page.

A CloudWatch Metric Stream inverts that. The customer creates one stream in their account
pointed at a Kinesis Data Firehose delivery stream, Firehose POSTs batches here every
minute or so, and *every* namespace they select arrives without us writing anything
service-specific. It is also the only path in this codebase where data shows up on its
own: the deployed stack has no scheduler, so before this, nothing collected anything
unless a request was in flight.

Authentication
--------------
Firehose cannot carry a Cognito token. It sends a fixed `X-Amz-Firehose-Access-Key`
header, so each tenant mints one here. The key is stored with a reverse-index row
(`key#<key>` -> tenant) in the same reserved config partition the customer-gateway
credentials use — one exact-key read, no scan, no new table.

Storage shape
-------------
A busy account streams thousands of datapoints a minute, and one DynamoDB row each would
be both slow and expensive. Firehose already buffers ~60s per delivery, so each request
*is* roughly one minute of data: the batch is folded to one row per
(account, region, namespace, metric, dimensions) with the interval's own min/max/sum/count
preserved. That gives a per-minute series for free and keeps the write count proportional
to how many distinct metrics a tenant has rather than how much traffic they serve.

ponytail: no downsampling — rows expire at record_store's 30-day TTL and a 30-day chart
reads every minute in the range. Roll up to hourly on read (or on a second stream) when
a tenant's chart actually gets slow.
"""

from __future__ import annotations

import base64
import binascii
import hashlib
import json
import logging
import secrets
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Any, Iterable

from shared.core import config_store, record_store

log = logging.getLogger("pinghold.metric_stream")

# Same reserved partition trick as customer_gateways: "~" cannot begin a tenant id, and
# config_store.list_tenants() skips it, so the ETL pollers never read it as an org.
_STORE_PARTITION = "~aws-metric-stream"

STREAM = "cloud.metrics"

# How far back a read looks when the caller does not say.
_DEFAULT_WINDOW = timedelta(hours=3)

# A single delivery is capped by Firehose at 64 MB; this is the row cap after folding,
# so one enormous tenant cannot turn one delivery into an unbounded batch write.
_MAX_ROWS_PER_DELIVERY = 5000


class InvalidKey(PermissionError):
    """The access key on a delivery does not belong to any tenant."""


# --- per-tenant ingest key --------------------------------------------------

def _read(key: str) -> Any:
    raw = config_store.get_config(_STORE_PARTITION, key)
    return json.loads(raw) if raw else None


def _write(key: str, value: Any) -> None:
    config_store.save_config(_STORE_PARTITION, key, json.dumps(value))


def ingest_key(tenant_id: str, *, create: bool = True) -> dict[str, Any] | None:
    """This tenant's Firehose access key, minted on first ask.

    Returned in full rather than masked: it is a value the operator has to paste into a
    Firehose destination config, and a key they cannot read is a key they cannot use.
    Rotation is how a leaked one is dealt with, not concealment after the fact.
    """
    existing = _read(f"tenant#{tenant_id}")
    if existing:
        return existing
    if not create:
        return None
    return _mint(tenant_id)


def _mint(tenant_id: str) -> dict[str, Any]:
    key = f"lhbms_{secrets.token_urlsafe(32)}"
    record = {
        "tenant_id": tenant_id,
        "key": key,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _write(f"tenant#{tenant_id}", record)
    _write(f"key#{key}", tenant_id)
    return record


def rotate_key(tenant_id: str) -> dict[str, Any]:
    """Mint a new key and retire the old one.

    The old reverse-index row is blanked rather than left behind: a rotated key that
    still resolves is not rotated, it is a second key nobody is watching.
    """
    previous = _read(f"tenant#{tenant_id}")
    if previous and previous.get("key"):
        _write(f"key#{previous['key']}", None)
    return _mint(tenant_id)


def tenant_for_key(key: str | None) -> str | None:
    if not key:
        return None
    return _read(f"key#{key.strip()}") or None


# --- delivery ---------------------------------------------------------------

def _number(value: Any) -> float | None:
    try:
        out = float(value)
    except (TypeError, ValueError):
        return None
    return out if out == out and out not in (float("inf"), float("-inf")) else None


def _moment(millis: Any) -> datetime | None:
    ms = _number(millis)
    if ms is None:
        return None
    try:
        return datetime.fromtimestamp(ms / 1000, tz=timezone.utc)
    except (OverflowError, OSError, ValueError):
        return None


def _dimension_id(dimensions: dict[str, Any]) -> str:
    """A stable, short identity for a dimension set, used in the row's dedupe key.

    Sorted before hashing because two deliveries describing the same resource must land
    on the same row, and JSON preserves insertion order — which CloudWatch does not
    promise to keep stable between batches.
    """
    canonical = json.dumps({str(k): str(v) for k, v in sorted((dimensions or {}).items())},
                           separators=(",", ":"))
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()[:16]


def decode(body: dict[str, Any]) -> list[dict[str, Any]]:
    """Firehose envelope -> CloudWatch metric records.

    Each `records[].data` is base64 of newline-delimited JSON — one delivery carries many
    datapoints, and a partially unreadable record is skipped rather than failing the
    batch: Firehose retries the *whole* delivery on a non-200, so rejecting 5000 good
    datapoints over one malformed line would lose the good ones on every retry too.
    """
    out: list[dict[str, Any]] = []
    for record in body.get("records") or []:
        raw = record.get("data")
        if not isinstance(raw, str):
            continue
        try:
            text = base64.b64decode(raw, validate=True).decode("utf-8", "replace")
        except (binascii.Error, ValueError):
            continue
        for line in text.splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                parsed = json.loads(line)
            except json.JSONDecodeError:
                continue
            if isinstance(parsed, dict):
                out.append(parsed)
    return out


def fold(records: Iterable[dict[str, Any]]) -> list[dict[str, Any]]:
    """One row per (account, region, namespace, metric, dimensions) in this delivery.

    min/max/sum/count are combined across the interval rather than overwritten, because
    they are the only reason to prefer a metric stream over a spot value: a p99-ish max
    and a real count survive the fold, an average of averages would not.
    """
    folded: dict[tuple, dict[str, Any]] = {}
    for record in records:
        metric = record.get("metric_name")
        namespace = record.get("namespace")
        if not metric or not namespace:
            continue
        moment = _moment(record.get("timestamp"))
        if moment is None:
            continue
        dimensions = record.get("dimensions") if isinstance(record.get("dimensions"), dict) else {}
        dim_id = _dimension_id(dimensions)
        account = str(record.get("account_id") or "")
        region = str(record.get("region") or "")
        # Truncated to the minute so datapoints inside one delivery collapse onto one
        # row even when CloudWatch stamps them a few seconds apart.
        bucket = moment.replace(second=0, microsecond=0)
        key = (account, region, namespace, metric, dim_id, bucket)

        value = record.get("value") if isinstance(record.get("value"), dict) else {}
        v_min = _number(value.get("min"))
        v_max = _number(value.get("max"))
        v_sum = _number(value.get("sum"))
        v_count = _number(value.get("count"))

        row = folded.get(key)
        if row is None:
            folded[key] = {
                "account": account,
                "region": region,
                "namespace": namespace,
                "metric": str(metric),
                "dimensions": {str(k): str(v) for k, v in dimensions.items()},
                "dimension_id": dim_id,
                "unit": record.get("unit"),
                "ts": bucket.isoformat(),
                "min": v_min,
                "max": v_max,
                "sum": v_sum or 0.0,
                "count": v_count or 0.0,
                # Deterministic, so a retried delivery overwrites its own rows.
                "id": f"{account}:{region}:{namespace}:{metric}:{dim_id}:{int(bucket.timestamp())}",
            }
            continue
        if v_min is not None:
            row["min"] = v_min if row["min"] is None else min(row["min"], v_min)
        if v_max is not None:
            row["max"] = v_max if row["max"] is None else max(row["max"], v_max)
        row["sum"] += v_sum or 0.0
        row["count"] += v_count or 0.0
    for row in folded.values():
        row["avg"] = round(row["sum"] / row["count"], 6) if row["count"] else None
    return sorted(folded.values(), key=lambda r: r["ts"])


def ingest(body: dict[str, Any], access_key: str | None) -> dict[str, Any]:
    """One Firehose delivery. Raises InvalidKey when the key resolves to no tenant."""
    tenant_id = tenant_for_key(access_key)
    if not tenant_id:
        raise InvalidKey("Unknown or retired Firehose access key")
    rows = fold(decode(body))
    if not rows:
        return {"tenant_id": tenant_id, "stored": 0, "received": 0}
    stored = rows[:_MAX_ROWS_PER_DELIVERY]
    # require_durable: Firehose retries a non-200, which is exactly the behaviour wanted
    # when the write failed — acknowledging data this process then dropped is the one
    # outcome with no recovery.
    record_store.append_many(tenant_id, STREAM, stored,
                             moment_key="ts", id_key="id", require_durable=True)

    # Evaluated here because the delivery is the only tick this deployment has — there is
    # no scheduler, so a condition checked on a timer would never run. Storing first means
    # an alerting failure cannot cost the metrics; the data is already safe by this point.
    alerts = 0
    try:
        from . import metric_alerts
        from shared.collector import ingest as collector

        for event in metric_alerts.evaluate(tenant_id, stored):
            collector.ingest(event)
            alerts += 1
    except Exception:  # pragma: no cover - alerting must never fail an ingest
        # A 500 here would make Firehose retry a delivery that was already stored, which
        # re-evaluates the same datapoints and is the one thing that could duplicate an
        # alert. Metrics are the contract; alerting is best-effort on top of them.
        log.exception("metric alert evaluation failed for %s", tenant_id)
    return {"tenant_id": tenant_id, "stored": len(stored), "received": len(rows),
            "alerts": alerts}


# --- read -------------------------------------------------------------------

# CloudWatch namespaces carry the service in the name; this is only for display, and an
# unknown namespace falls back to the namespace itself rather than being hidden.
_SERVICE_LABELS = {
    "AWS/EC2": "EC2", "AWS/RDS": "RDS", "AWS/Lambda": "Lambda",
    "AWS/ApplicationELB": "Application Load Balancer", "AWS/ELB": "Classic Load Balancer",
    "AWS/NetworkELB": "Network Load Balancer", "AWS/DynamoDB": "DynamoDB",
    "AWS/SQS": "SQS", "AWS/SNS": "SNS", "AWS/S3": "S3", "AWS/ECS": "ECS",
    "AWS/EKS": "EKS", "AWS/ApiGateway": "API Gateway", "AWS/CloudFront": "CloudFront",
    "AWS/ElastiCache": "ElastiCache", "AWS/Kinesis": "Kinesis", "AWS/States": "Step Functions",
    "AWS/Redshift": "Redshift", "AWS/ES": "OpenSearch", "AWS/EFS": "EFS",
    "AWS/AutoScaling": "Auto Scaling", "AWS/NATGateway": "NAT Gateway",
}


def service_label(namespace: str) -> str:
    return _SERVICE_LABELS.get(namespace, namespace.removeprefix("AWS/") or namespace)


def read(tenant_id: str, since: datetime | None = None,
         limit: int = record_store.MAX_READ, *,
         account: str | None = None, region: str | None = None) -> list[dict[str, Any]]:
    """Stored datapoints, optionally narrowed to one account or region.

    Filtered here rather than in the query: the sort key is time, so account is not
    something DynamoDB can range over without a second index. At one row per metric per
    minute this is a small list to walk, and an index that exists only to serve a drill-
    down page is the wrong trade until a tenant's stream is big enough to prove it.
    """
    since = since or datetime.now(timezone.utc) - _DEFAULT_WINDOW
    rows = record_store.window(tenant_id, STREAM, since, limit)
    if account:
        rows = [r for r in rows if r.get("account") == account]
    if region:
        rows = [r for r in rows if r.get("region") == region]
    return rows


def configured(tenant_id: str) -> bool:
    """Whether anything has ever been delivered — the honest answer to "is it working?".

    A minted key is not evidence of a working stream: the whole failure this page has to
    make visible is a customer who created the key, never finished the Firehose side, and
    sees an empty page with no explanation.
    """
    return bool(record_store.recent(tenant_id, STREAM, 1))


def summary(tenant_id: str, since: datetime | None = None, *,
            account: str | None = None) -> dict[str, Any]:
    """What is reporting, per service — the Cloud Monitoring service-coverage table."""
    rows = read(tenant_id, since, account=account)
    services: dict[tuple[str, str], dict[str, Any]] = {}
    for row in rows:
        key = (row.get("namespace") or "", row.get("account") or "")
        entry = services.setdefault(key, {
            "namespace": row.get("namespace"),
            "service": service_label(row.get("namespace") or ""),
            "account": row.get("account"),
            "regions": set(),
            "metrics": set(),
            "resources": set(),
            "datapoints": 0,
            "last_seen": None,
        })
        entry["regions"].add(row.get("region") or "—")
        entry["metrics"].add(row.get("metric"))
        entry["resources"].add(row.get("dimension_id"))
        entry["datapoints"] += 1
        ts = row.get("ts")
        if ts and (entry["last_seen"] is None or ts > entry["last_seen"]):
            entry["last_seen"] = ts
    out = [{
        "namespace": e["namespace"],
        "service": e["service"],
        "account": e["account"],
        "regions": sorted(e["regions"]),
        "metrics": len(e["metrics"]),
        # A dimension set is one resource — one instance, one queue, one table.
        "resources": len(e["resources"]),
        "datapoints": e["datapoints"],
        "last_seen": e["last_seen"],
    } for e in services.values()]
    out.sort(key=lambda e: (-e["resources"], e["service"]))
    return {
        "services": out,
        "configured": bool(rows),
        "accounts": sorted({r.get("account") for r in rows if r.get("account")}),
        "regions": sorted({r.get("region") for r in rows if r.get("region")}),
        "datapoints": len(rows),
    }


def series(tenant_id: str, namespace: str, metric: str, *,
           since: datetime | None = None, dimension_id: str | None = None,
           statistic: str = "avg", account: str | None = None) -> list[dict[str, Any]]:
    """One metric over time, oldest first — what a chart reads.

    Points sharing a minute across several resources are combined, so asking for
    `AWS/EC2 CPUUtilization` without naming an instance gives the fleet rather than
    whichever instance happened to be written last.
    """
    buckets: dict[str, dict[str, Any]] = {}
    for row in read(tenant_id, since, account=account):
        if row.get("namespace") != namespace or row.get("metric") != metric:
            continue
        if dimension_id and row.get("dimension_id") != dimension_id:
            continue
        ts = row.get("ts")
        if not ts:
            continue
        point = buckets.setdefault(ts, {"ts": ts, "min": None, "max": None,
                                        "sum": 0.0, "count": 0.0})
        if row.get("min") is not None:
            point["min"] = row["min"] if point["min"] is None else min(point["min"], row["min"])
        if row.get("max") is not None:
            point["max"] = row["max"] if point["max"] is None else max(point["max"], row["max"])
        point["sum"] += row.get("sum") or 0.0
        point["count"] += row.get("count") or 0.0
    points = []
    for point in sorted(buckets.values(), key=lambda p: p["ts"]):
        avg = round(point["sum"] / point["count"], 6) if point["count"] else None
        value = {"avg": avg, "min": point["min"], "max": point["max"],
                 "sum": point["sum"], "count": point["count"]}.get(statistic, avg)
        points.append({**point, "avg": avg, "value": value})
    return points


# How many resources a multi-series chart draws before the tail is folded together.
# The series-count ladder is the reason for a cap at all: past about six lines nobody
# can tell them apart, and inventing more colours makes it worse rather than better.
_SERIES_CAP = 5


def series_by_resource(tenant_id: str, namespace: str, metric: str, *,
                       since: datetime | None = None, statistic: str = "avg",
                       account: str | None = None,
                       cap: int = _SERIES_CAP) -> dict[str, Any]:
    """One line per resource for a metric — the shape a multi-series chart reads.

    Ranked by the resource's own peak rather than by name, so the lines that get their
    own colour are the ones worth looking at. Everything past the cap is folded into a
    single "Other" series instead of being dropped: a chart that silently omits half the
    fleet is worse than one that says how much it is showing.
    """
    rows = [r for r in read(tenant_id, since, account=account)
            if r.get("namespace") == namespace and r.get("metric") == metric]
    if not rows:
        return {"namespace": namespace, "metric": metric, "unit": None,
                "series": [], "folded": 0}

    by_resource: dict[str, dict[str, Any]] = {}
    for row in rows:
        dim_id = row.get("dimension_id") or "-"
        entry = by_resource.setdefault(dim_id, {
            "id": dim_id,
            "name": _resource_name(row.get("dimensions") or {}),
            "points": {},
            "peak": None,
        })
        ts = row.get("ts")
        if not ts:
            continue
        point = entry["points"].setdefault(ts, {"sum": 0.0, "count": 0.0,
                                                "min": None, "max": None})
        point["sum"] += row.get("sum") or 0.0
        point["count"] += row.get("count") or 0.0
        for edge, pick in (("min", min), ("max", max)):
            value = row.get(edge)
            if value is not None:
                point[edge] = value if point[edge] is None else pick(point[edge], value)

    def _stat(point: dict[str, Any]) -> float | None:
        if statistic == "avg":
            return point["sum"] / point["count"] if point["count"] else None
        return point.get(statistic)

    for entry in by_resource.values():
        values = [v for v in (_stat(p) for p in entry["points"].values()) if v is not None]
        entry["peak"] = max(values) if values else None

    ranked = sorted(by_resource.values(),
                    key=lambda e: (e["peak"] is None, -(e["peak"] or 0), e["name"]))
    head, tail = ranked[:cap], ranked[cap:]

    def _points(entry) -> list[dict[str, Any]]:
        return [{"ts": ts, "value": round(v, 6)}
                for ts, v in sorted((ts, _stat(p)) for ts, p in entry["points"].items())
                if v is not None]

    series = [{"id": e["id"], "name": e["name"], "points": _points(e)} for e in head]

    if tail:
        # Folded by re-aggregating the raw buckets, not by averaging the lines: the
        # mean of four averages is not the average of what they measured.
        merged: dict[str, dict[str, Any]] = {}
        for entry in tail:
            for ts, point in entry["points"].items():
                into = merged.setdefault(ts, {"sum": 0.0, "count": 0.0,
                                              "min": None, "max": None})
                into["sum"] += point["sum"]
                into["count"] += point["count"]
                for edge, pick in (("min", min), ("max", max)):
                    if point[edge] is not None:
                        into[edge] = point[edge] if into[edge] is None else pick(into[edge], point[edge])
        series.append({
            "id": "__other__",
            "name": f"Other ({len(tail)})",
            "points": [{"ts": ts, "value": round(v, 6)}
                       for ts, v in sorted((ts, _stat(p)) for ts, p in merged.items())
                       if v is not None],
        })

    return {
        "namespace": namespace,
        "metric": metric,
        "unit": next((r.get("unit") for r in rows if r.get("unit")), None),
        "statistic": statistic,
        "series": series,
        "folded": len(tail),
    }


def catalog(tenant_id: str, since: datetime | None = None, *,
            account: str | None = None) -> list[dict[str, Any]]:
    """Every (namespace, metric) that has arrived, for populating a metric picker."""
    seen: dict[tuple[str, str], dict[str, Any]] = {}
    for row in read(tenant_id, since, account=account):
        key = (row.get("namespace") or "", row.get("metric") or "")
        entry = seen.setdefault(key, {
            "namespace": key[0], "service": service_label(key[0]),
            "metric": key[1], "unit": row.get("unit"), "resources": set(),
        })
        entry["resources"].add(row.get("dimension_id"))
    out = [{**e, "resources": len(e["resources"])} for e in seen.values()]
    out.sort(key=lambda e: (e["service"], e["metric"]))
    return out


def resources(tenant_id: str, since: datetime | None = None, *,
              account: str | None = None) -> list[dict[str, Any]]:
    """One row per distinct resource seen, with the dimensions that identify it.

    This is the closest thing to an inventory that a metric stream provides, and unlike
    the API-based inventory it covers every service the stream carries rather than the
    five services somebody wrote a reader for.
    """
    seen: dict[str, dict[str, Any]] = {}
    for row in read(tenant_id, since, account=account):
        dim_id = row.get("dimension_id")
        if not dim_id or not row.get("dimensions"):
            continue
        entry = seen.setdefault(dim_id, {
            "id": dim_id,
            "namespace": row.get("namespace"),
            "service": service_label(row.get("namespace") or ""),
            "account": row.get("account"),
            "region": row.get("region"),
            "dimensions": row.get("dimensions"),
            "metrics": set(),
            "last_seen": None,
        })
        entry["metrics"].add(row.get("metric"))
        ts = row.get("ts")
        if ts and (entry["last_seen"] is None or ts > entry["last_seen"]):
            entry["last_seen"] = ts
    out = [{**e, "metrics": len(e["metrics"]),
            "name": _resource_name(e["dimensions"])} for e in seen.values()]
    out.sort(key=lambda e: (e["service"], e["name"]))
    return out


# The dimension that names the thing, per service. CloudWatch has no general "name"
# dimension, so this is a lookup with a defensible fallback: the first dimension value,
# which for a single-dimension metric is the name anyway.
_NAME_DIMENSIONS = (
    "InstanceId", "FunctionName", "DBInstanceIdentifier", "DBClusterIdentifier",
    "LoadBalancer", "TargetGroup", "QueueName", "TopicName", "TableName",
    "BucketName", "ClusterName", "ServiceName", "DistributionId", "ApiName",
    "CacheClusterId", "StreamName", "StateMachineArn", "DomainName", "FileSystemId",
    "AutoScalingGroupName", "NatGatewayId",
)


def _resource_name(dimensions: dict[str, Any]) -> str:
    for name in _NAME_DIMENSIONS:
        if dimensions.get(name):
            return str(dimensions[name])
    return next(iter(dimensions.values()), "—") if dimensions else "—"
