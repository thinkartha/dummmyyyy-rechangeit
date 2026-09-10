"""What drift is measured *over*, and the baseline it is measured *against*.

`detect.py` had the statistics — two-sample KS, Chi-square, config hashing — and no
caller: `GET /drift` returned a hardcoded empty report, so the page could not tell
"nothing drifted" from "nothing is watching". This is the missing half.

Features are pulled from telemetry the product already stores rather than from a new
integration the tenant has to wire up. Every handled request lands a span in
`agent-spans` (shared.core.request_spans), so a tenant that uses the product at all
already has a feature stream:

  * numeric     — request latency per route, and per-model LLM latency
  * categorical — the HTTP status mix per route, and which models traffic went to
  * config      — which integrations are connected and their non-secret fields

A baseline is an explicit act, not a rolling window: `pin_baseline` snapshots the
current samples and stores them. Comparing "recent" against "slightly less recent"
makes a gradual regression invisible, because the thing being compared against moves
with it. Pinning is what the page's "Rebaseline" button does.

Secrets never enter the config baseline — config_status() masks them before this sees
them, and a masked value is stable, so it cannot manufacture a phantom change either.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from shared.core import record_store
from shared.core.agent_telemetry import SPAN_STREAM

from .detect import (
    CategoricalDrift,
    ConfigDrift,
    DriftReport,
    NumericDrift,
    chi_square_drift,
    config_drift,
    ks_two_sample,
)

BASELINE_STREAM = "drift-baseline"
# Pushed feature values, for tenants scoring a model rather than serving HTTP.
OBSERVATION_STREAM = "drift-observations"

# Enough spans to characterise a distribution without scanning the whole retention
# window on every page load.
_SPAN_LIMIT = 2000
_CURRENT_WINDOW = timedelta(hours=24)
# KS on eight points is noise with a critical value wide enough to hide anything real.
# A feature under this stays out of the report instead of reporting a confident "Stable".
_MIN_SAMPLES = 12


def _attr(span: dict, *names: str) -> Any:
    attributes = span.get("attributes") or {}
    for name in names:
        if attributes.get(name) is not None:
            return attributes[name]
        if span.get(name) is not None:
            return span[name]
    return None


def _number(value: Any) -> float | None:
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _parse(value: Any) -> datetime | None:
    try:
        moment = datetime.fromisoformat(str(value))
    except (TypeError, ValueError):
        return None
    return moment if moment.tzinfo else moment.replace(tzinfo=timezone.utc)


def _spans(tenant_id: str, since: datetime | None) -> list[dict]:
    return record_store.window(tenant_id, SPAN_STREAM, since=since, limit=_SPAN_LIMIT)


def _samples(tenant_id: str, since: datetime | None) -> tuple[dict[str, list[float]], dict[str, dict[str, int]]]:
    """(numeric samples, categorical counts) keyed by feature name."""
    numeric: dict[str, list[float]] = {}
    categorical: dict[str, dict[str, int]] = {}

    for span in _spans(tenant_id, since):
        route = _attr(span, "http.route")
        duration = _number(span.get("duration_ms"))
        if route:
            if duration is not None:
                numeric.setdefault(f"{route} latency_ms", []).append(duration)
            code = _attr(span, "http.response.status_code", "http.status_code")
            if code is not None:
                bucket = categorical.setdefault(f"{route} status_mix", {})
                bucket[str(code)] = bucket.get(str(code), 0) + 1

        model = _attr(span, "gen_ai.request.model", "llm.model_name", "gen_ai.response.model")
        if model:
            if duration is not None:
                numeric.setdefault(f"{model} latency_ms", []).append(duration)
            mix = categorical.setdefault("llm model_mix", {})
            mix[str(model)] = mix.get(str(model), 0) + 1

    # Values a tenant pushed itself. These are the real ML-feature case: a scoring
    # service reporting the inputs it saw, which no amount of HTTP telemetry implies.
    for record in record_store.window(tenant_id, OBSERVATION_STREAM, since=since, limit=_SPAN_LIMIT):
        for feature, value in (record.get("features") or {}).items():
            values = value if isinstance(value, list) else [value]
            for item in values:
                as_number = _number(item)
                if as_number is not None and not isinstance(item, bool):
                    numeric.setdefault(str(feature), []).append(as_number)
                elif item is not None:
                    bucket = categorical.setdefault(str(feature), {})
                    bucket[str(item)] = bucket.get(str(item), 0) + 1

    return numeric, categorical


def record_observations(tenant_id: str, features: dict[str, Any], config: dict | None = None) -> dict:
    """Store one batch of pushed feature values."""
    payload: dict[str, Any] = {"features": features or {}}
    if config:
        payload["config"] = config
    record_store.append(tenant_id, OBSERVATION_STREAM, payload)
    return {"accepted": len(payload["features"]), "stream": OBSERVATION_STREAM}


def _config_snapshot(tenant_id: str) -> dict[str, Any]:
    """Which integrations are connected, and their non-secret settings.

    Imported here rather than at module scope: these modules reach back into the store
    layer, and a cycle at import time takes the whole API down on boot.
    """
    snapshot: dict[str, Any] = {}
    try:
        from shared.aws.lambda_service import config_status as aws_status
        from shared.cloudcost import _AZURE, _GCP
        from shared.cloudcost import config_status as cloud_status
        from shared.core import gateways

        for name, status in (
            ("aws-lambda", aws_status(tenant_id)),
            ("gcp-billing", cloud_status(tenant_id, _GCP)),
            ("azure-cost", cloud_status(tenant_id, _AZURE)),
            ("api-gateway", gateways.masked_config(tenant_id)),
        ):
            if not status or not status.get("configured"):
                continue
            for field, value in (status.get("fields") or {}).items():
                if value in (None, "", []):
                    continue
                snapshot[f"{name}.{field}"] = value
    except Exception:
        # A drift report is worth having without the config half; losing the whole
        # page because one connector's status route moved is not a trade worth making.
        return snapshot
    return snapshot


def pin_baseline(tenant_id: str, now: datetime | None = None) -> dict:
    """Snapshot the current window as the baseline for future windows to be judged against.

    The same 24h window `report` reads, not all of history: pinning means "what is
    happening now is normal". Snapshotting everything ever recorded mixes the old normal
    into the new baseline, so re-pinning after accepting a regression left the old
    distribution in the comparison and the finding never cleared.
    """
    now = now or datetime.now(timezone.utc)
    numeric, categorical = _samples(tenant_id, now - _CURRENT_WINDOW)
    payload = {
        # `now`, not a fresh clock read: the stamp has to agree with the window that was
        # actually sampled, or `report` bounds the current window at a moment the
        # baseline never covered and every feature falls out of the comparison.
        "pinned_at": now.isoformat(),
        "numeric": {k: v for k, v in numeric.items() if len(v) >= _MIN_SAMPLES},
        "categorical": categorical,
        "config": _config_snapshot(tenant_id),
    }
    record_store.append(tenant_id, BASELINE_STREAM, payload, moment=now)
    return {
        "pinned_at": payload["pinned_at"],
        "numeric_features": sorted(payload["numeric"]),
        "categorical_features": sorted(payload["categorical"]),
        "config_keys": len(payload["config"]),
    }


def _baseline(tenant_id: str) -> dict | None:
    found = record_store.recent(tenant_id, BASELINE_STREAM, limit=1)
    return found[0] if found else None


def report(tenant_id: str, now: datetime | None = None) -> DriftReport:
    """Current 24h window against the pinned baseline.

    With no baseline this is an empty report and `baseline_pinned` is false — the page
    needs to say "nothing is being compared yet", which is a different sentence from
    "nothing has drifted".
    """
    base = _baseline(tenant_id)
    if not base:
        return DriftReport(
            numeric=[], categorical=[], any_drift=False, baseline_pinned=False,
            config=ConfigDrift(added=[], removed=[], changed=[], baseline_hash="", current_hash=""),
        )

    now = now or datetime.now(timezone.utc)
    # The window starts at the later of "24h ago" and "when the baseline was pinned".
    # Without the second bound the current window overlaps the baseline period, so a
    # feature is partly compared against its own baseline samples: a route that went
    # from 1ms to 10s an hour ago stayed "Stable", because 23 hours of healthy traffic
    # sat in the current window diluting the shift (KS 0.27 against a 0.28 critical).
    since = now - _CURRENT_WINDOW
    pinned_at = _parse(base.get("pinned_at"))
    if pinned_at and pinned_at > since:
        since = pinned_at
    numeric_now, categorical_now = _samples(tenant_id, since)
    base_numeric: dict[str, list[float]] = base.get("numeric") or {}
    base_categorical: dict[str, dict[str, int]] = base.get("categorical") or {}

    numeric: list[NumericDrift] = []
    for feature in sorted(set(base_numeric) & set(numeric_now)):
        current = numeric_now[feature]
        if len(current) < _MIN_SAMPLES:
            continue
        statistic, critical, drifted = ks_two_sample([float(v) for v in base_numeric[feature]], current)
        numeric.append(NumericDrift(feature=feature, ks_statistic=statistic,
                                    critical=critical, drift=drifted))

    categorical: list[CategoricalDrift] = []
    for feature in sorted(set(base_categorical) & set(categorical_now)):
        chi, critical, drifted = chi_square_drift(
            {str(k): int(v) for k, v in base_categorical[feature].items()},
            categorical_now[feature],
        )
        categorical.append(CategoricalDrift(feature=feature, chi_square=chi,
                                            critical=critical, drift=drifted))

    config = config_drift(base.get("config") or {}, _config_snapshot(tenant_id))
    return DriftReport(
        numeric=numeric,
        categorical=categorical,
        config=config,
        any_drift=(any(n.drift for n in numeric) or any(c.drift for c in categorical)
                   or bool(config.added or config.removed or config.changed)),
        baseline_pinned=True,
        baseline_at=base.get("pinned_at"),
    )
