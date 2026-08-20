"""In-process event bus — a TRUE singleton.

This is the fix for the bug the old engine had: it instantiated `EventBus()` in many places, so
publishers and subscribers never shared subscriber state and no in-process event was ever
delivered. Here there is exactly one shared instance (`event_bus`), and `EventBus()` always returns
it. A Kafka transport can be layered behind the same `publish`/`subscribe` interface later without
changing callers.
"""

from __future__ import annotations

from collections import defaultdict
from typing import Callable

from .envelope import EventEnvelope

Handler = Callable[[EventEnvelope], None]


class EventBus:
    _instance: "EventBus | None" = None

    def __new__(cls) -> "EventBus":
        if cls._instance is None:
            inst = super().__new__(cls)
            inst._subscribers = defaultdict(list)  # type: ignore[attr-defined]
            cls._instance = inst
        return cls._instance

    def subscribe(self, event_type: str, handler: Handler) -> None:
        self._subscribers[event_type].append(handler)

    def publish(self, envelope: EventEnvelope) -> int:
        """Deliver to all subscribers of this event_type. Returns the count delivered."""
        handlers = self._subscribers.get(envelope.event_type, [])
        for handler in handlers:
            handler(envelope)
        return len(handlers)


# The single shared instance every caller should import.
event_bus = EventBus()
