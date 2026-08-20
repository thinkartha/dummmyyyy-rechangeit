from __future__ import annotations

import logging
import os
import threading
import time

from shared.collector import ingest as collector
from shared.etl.client import BoomiClient
from shared.etl.dto import BoomiExecutionEvent, EtlIntegrationHealth
from shared.etl.mappers import incident_from_event, map_boomi_execution
from shared.etl.store import execution_seen, get_boomi_config, record_event, record_incident, set_connector_error, set_health

log = logging.getLogger("pinghold.etl.boomi")
_started_tenants: set[str] = set()


def poll_once(tenant_id: str, client: BoomiClient | None = None) -> int:
    client = client or BoomiClient(get_boomi_config(tenant_id))
    if not client.configured:
        set_health(tenant_id, EtlIntegrationHealth(
            id="boomi", name="Dell Boomi", status="not_configured", mode="live", configured=False
        ))
        return 0
    set_health(tenant_id, EtlIntegrationHealth(id="boomi", name="Dell Boomi", status="ok", mode="live", configured=True))
    count = 0
    try:
        for raw in client.execution_records():
            execution_id = str(raw.get("executionId") or raw.get("execution_id") or "")
            if not execution_id or execution_seen(tenant_id, "boomi", execution_id):
                continue
            execution = BoomiExecutionEvent.model_validate({**raw, "raw": raw})
            ce = collector.ingest(map_boomi_execution(execution, tenant_id))
            record_event(tenant_id, ce)
            incident = incident_from_event(ce)
            if incident:
                record_incident(tenant_id, incident)
            count += 1
    except Exception as exc:
        log.warning("Boomi poll failed: %s", exc)
        set_connector_error(tenant_id, "boomi", str(exc))
    return count


def start(tenant_id: str) -> None:
    if tenant_id in _started_tenants or os.getenv("ETL_CONNECTOR_MODE", "live").lower() != "live":
        return
    interval = int(os.getenv("BOOMI_POLL_INTERVAL_SECONDS", "60"))

    def _loop() -> None:
        while True:
            poll_once(tenant_id)
            time.sleep(interval)

    threading.Thread(target=_loop, daemon=True).start()
    _started_tenants.add(tenant_id)
    log.info("Boomi poller started tenant=%s interval=%ss", tenant_id, interval)
