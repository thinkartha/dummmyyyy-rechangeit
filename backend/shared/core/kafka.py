"""Kafka transport sink — env-gated with Noop fallback (salvaged from kafka_helper's pattern).

When KAFKA_BOOTSTRAP is set and reachable, ingested events are published to per-tenant Kafka
topics (real transport). Otherwise it's a no-op and the in-process bus carries everything — so the
app runs identically with or without a broker.
"""

from __future__ import annotations

import json
import logging
import os

log = logging.getLogger("pinghold.kafka")

_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP")


class KafkaSink:
    def __init__(self) -> None:
        self._producer = None
        if not _BOOTSTRAP:
            return
        try:
            from kafka import KafkaProducer

            self._producer = KafkaProducer(
                bootstrap_servers=_BOOTSTRAP,
                value_serializer=lambda v: json.dumps(v).encode("utf-8"),
                key_serializer=lambda k: k.encode("utf-8") if k else None,
                retries=1,
                acks=1,
                api_version_auto_timeout_ms=5000,
            )
            log.info("Kafka transport enabled at %s", _BOOTSTRAP)
        except Exception as exc:  # pragma: no cover - depends on external broker
            log.warning("Kafka unavailable (%s); transport is a no-op", exc)
            self._producer = None

    @property
    def enabled(self) -> bool:
        return self._producer is not None

    def publish(self, topic: str, value: dict, key: str | None = None) -> bool:
        if not self._producer:
            return False
        try:
            self._producer.send(topic, value=value, key=key)
            self._producer.flush(timeout=5)
            return True
        except Exception as exc:  # pragma: no cover
            log.warning("kafka publish to %s failed: %s", topic, exc)
            return False


kafka_sink = KafkaSink()
