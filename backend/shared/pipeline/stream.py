"""Streaming consumer — reads ingested events off Kafka and correlates them in the background.

This closes the live loop: POST /ingest -> Kafka (<tenant>.events.raw) -> this consumer ->
event correlation -> streamed incidents. It consumes from Kafka (not the in-process buffer), so it
proves the real transport→processing path. Env-gated on KAFKA_BOOTSTRAP; a no-op without a broker.
"""

from __future__ import annotations

import json
import logging
import os
import threading
from collections import defaultdict, deque
from typing import Deque

from shared.core.eventbus import event_bus
from shared.core.envelope import EventEnvelope
from shared.collector.cloudevents import CloudEvent
from .event_correlation import analyze, CorrelationResult

log = logging.getLogger("pinghold.stream")

_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP")
_TOPIC_SUFFIX = ".events.raw"

_consumed: dict[str, Deque[CloudEvent]] = defaultdict(lambda: deque(maxlen=200))
_results: dict[str, CorrelationResult] = {}
_started = False


def _run(consumer) -> None:
    for msg in consumer:
        try:
            ce = CloudEvent(**msg.value)
            tenant = ce.tenant_id or "default"
            _consumed[tenant].append(ce)
            _results[tenant] = analyze(tenant, list(_consumed[tenant]))
            event_bus.publish(EventEnvelope(
                tenant_id=tenant, event_type="stream.correlated", source="EP:stream",
                data={"incidents": len(_results[tenant].incidents)},
            ))
        except Exception as exc:  # pragma: no cover
            log.warning("stream processing error: %s", exc)


def start() -> None:
    """Start the background Kafka consumer (idempotent; no-op without a broker)."""
    global _started
    if _started or not _BOOTSTRAP:
        return
    try:
        from kafka import KafkaConsumer

        consumer = KafkaConsumer(
            bootstrap_servers=_BOOTSTRAP,
            group_id="pinghold-stream",
            auto_offset_reset="earliest",  # read a topic from the start (don't miss pre-join msgs)
            enable_auto_commit=True,
            # discover newly-created per-tenant topics fast (default refresh is 5 min)
            metadata_max_age_ms=5000,
            value_deserializer=lambda b: json.loads(b.decode("utf-8")),
        )
        consumer.subscribe(pattern=r".*\.events\.raw")
        threading.Thread(target=_run, args=(consumer,), daemon=True).start()
        _started = True
        log.info("stream consumer started (pattern *%s)", _TOPIC_SUFFIX)
    except Exception as exc:  # pragma: no cover - depends on external broker
        log.warning("stream consumer unavailable (%s); skipping", exc)


def stream_incidents(tenant_id: str) -> CorrelationResult | None:
    return _results.get(tenant_id)
