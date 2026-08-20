"""Incident store — in-memory with write-through to Postgres when DATABASE_URL is set."""

from __future__ import annotations

from shared.contracts.rca import RcaResponse
from shared.core import db


class IncidentStore:
    def __init__(self) -> None:
        self._by_key: dict[tuple[str, str], RcaResponse] = {}

    def put(self, tenant_id: str, incident_id: str, rca: RcaResponse) -> None:
        self._by_key[(tenant_id, incident_id)] = rca
        db.save_incident(tenant_id, incident_id, rca.model_dump())  # no-op if persistence disabled

    def get(self, tenant_id: str, incident_id: str) -> RcaResponse | None:
        cached = self._by_key.get((tenant_id, incident_id))
        if cached is not None:
            return cached
        payload = db.get_incident(tenant_id, incident_id)  # survives restarts when persisted
        if payload is not None:
            rca = RcaResponse(**payload)
            self._by_key[(tenant_id, incident_id)] = rca
            return rca
        return None


store = IncidentStore()
