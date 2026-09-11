"""The periodic sweep: what the in-process poller threads were doing, on a schedule.

shared/etl/pollers/*.start() runs a `while True: poll_once(); sleep()` thread, started
from the FastAPI startup event. That event is skipped entirely under Lambda (api.py
checks AWS_LAMBDA_FUNCTION_NAME), and it has to be — a Lambda is frozen between
invocations, so the thread would run only while a request happened to be in flight and
would be killed mid-poll when the container went idle. The practical effect was that in
the deployed stack *nothing polled*: Databricks, Talend and Boomi data appeared only
when a person clicked "Poll now".

EventBridge is the missing half. It invokes the same function on a rate schedule with a
non-HTTP event, lambda_handler routes that here, and this walks every tenant that has
saved a connector config.

Deliberately conservative:
  * per-tenant, per-platform failures are caught and counted, never raised — one broken
    workspace must not stop the sweep for the other tenants;
  * work stops early when the remaining Lambda time runs low, so a slow provider costs a
    partial sweep rather than a timeout with nothing recorded;
  * every poller here is already idempotent (`execution_seen` deduplicates on run id +
    state), so a re-run after an early stop re-ingests nothing.
"""

from __future__ import annotations

import logging
import os
import time
from typing import Any, Callable

log = logging.getLogger("pinghold.scheduled")

# Stop starting new work with less than this left. A Databricks runs/list page plus a
# billing statement is comfortably inside it; a hung one is not, which is the point.
_RESERVE_MS = 20_000


def _remaining_ms(context: Any) -> int:
    getter = getattr(context, "get_remaining_time_in_millis", None)
    if not callable(getter):
        return _RESERVE_MS * 10
    try:
        return int(getter())
    except Exception:
        return _RESERVE_MS * 10


def _tenants() -> list[str]:
    from shared.core import config_store
    from shared.etl.pollers import poller_tenants

    return sorted(set(poller_tenants()) | set(config_store.list_tenants()))


def _tasks() -> dict[str, Callable[[str], Any]]:
    """platform -> poll_once. Only the connectors with a real provider client.

    Custom connectors are excluded: their ids are not in a static registry, so there is
    nothing to enumerate here without a second scan of every tenant's config.
    ponytail: add them when a customer actually runs one in production.
    """
    from shared.etl.pollers import boomi, databricks, talend

    return {
        "talend": talend.poll_once,
        "boomi": boomi.poll_once,
        "databricks": databricks.poll_once,
    }


def run(context: Any = None) -> dict[str, Any]:
    """One sweep. Returns a per-platform count, which lands in the invocation log."""
    started = time.time()
    tenants = _tenants()
    if not tenants:
        log.info("Scheduled sweep: no tenants with saved connector configs")
        return {"tenants": 0, "ingested": {}, "errors": {}}

    tasks = _tasks()
    ingested: dict[str, int] = {}
    errors: dict[str, str] = {}
    stopped_early = False

    for tenant_id in tenants:
        for platform, poll in tasks.items():
            if _remaining_ms(context) < _RESERVE_MS:
                stopped_early = True
                log.warning("Scheduled sweep stopping early: %sms left", _remaining_ms(context))
                break
            try:
                ingested[platform] = ingested.get(platform, 0) + int(poll(tenant_id) or 0)
            except Exception as exc:  # one tenant's broken credential is not the sweep's problem
                errors[f"{tenant_id}:{platform}"] = str(exc)
                log.warning("Scheduled poll failed tenant=%s platform=%s: %s",
                            tenant_id, platform, exc)
        if stopped_early:
            break

    result = {
        "tenants": len(tenants),
        "ingested": ingested,
        "errors": errors,
        "stopped_early": stopped_early,
        "duration_s": round(time.time() - started, 2),
    }
    log.info("Scheduled sweep: %s", result)
    return result


def handler(event: dict, context: Any = None) -> dict:
    if os.getenv("DISABLE_SCHEDULED_SWEEP"):
        log.info("Scheduled sweep disabled by DISABLE_SCHEDULED_SWEEP")
        return {"skipped": True}
    return run(context)
