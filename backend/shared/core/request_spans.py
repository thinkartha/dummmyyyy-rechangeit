"""One span per handled request, so this API's own traffic reaches the API Monitoring page.

The page was empty for people who use the product every day, and the reason was not the
read path: `/api/v1/observability/routes` -> agents.route_stats() derives its rows from
the `agent-spans` stream, and until now only two things ever wrote to that stream — an
enrolled customer APISIX gateway, and an external AI agent posting a telemetry batch. A
user clicking around the product generates real HTTP traffic against *this* FastAPI app,
and nothing recorded any of it. So the honest state of the page was "no API traffic has
ever been reported", which is indistinguishable on screen from "your instrumentation is
broken".

This middleware closes that gap with the pieces that already exist: it builds the same
span agent_telemetry.http_span() gives the gateway path and hands it to the same
agent_telemetry.ingest() writer, so route_stats() needs no change and the two producers
land in one table.

What is recorded is the route template, the method, the status code and the wall time —
no request body, no response body, no headers. There is nothing to redact because
nothing sensitive is collected in the first place.
"""

from __future__ import annotations

import logging
import time
from datetime import datetime, timezone
from typing import Any, Callable

from fastapi import Request

from . import agent_telemetry

log = logging.getLogger(__name__)

# Route templates that are never recorded.
#
#   * the health probes: an uptime checker or an ALB hits these every few seconds
#     forever, and nobody looking at API Monitoring means them by "my API traffic".
#   * the two endpoints the observability pages themselves live-poll (live-data.js
#     re-reads every live table every 10s per open tab). Recording those is a mirror
#     facing a mirror: leave /observability/routes in and it becomes the busiest route
#     on the page purely because the page is open, permanently pinned at the top, and
#     the number it reports is mostly a count of itself.
#   * the telemetry intake routes, which are machine plumbing rather than product
#     traffic, and which already write a span per *reported* request — a span for the
#     delivery on top of that counts the same traffic twice.
#
# Everything else is recorded, including reads: for a dashboard product most of what a
# person does is GETs, and dropping them would leave the page as empty as it was.
_SKIP_ROUTES = frozenset({
    "/health",
    "/health/store",
    "/api/v1/observability/routes",
    "/api/v1/gateways/status",
    "/api/v1/observability/agents/telemetry",
    "/api/v1/telemetry/apisix",
})


def _record(request: Request, status_code: int, duration_ms: float, start_time: str) -> None:
    """Store one span for a finished request. Never raises — see the caller."""
    route = getattr(request.scope.get("route"), "path", "")
    if not route or route in _SKIP_ROUTES:
        # No matched route means a 404, a redirect, or a scan for a path that does not
        # exist here. The raw path is deliberately not used as a fallback: it is caller
        # controlled, so anything on the internet probing for /wp-login.php could invent
        # rows in a customer's route table.
        return

    # The tenant the request itself resolved, published by tenancy.get_tenant_id. A
    # request that never resolved one — an unauthenticated call, /health, a login — is
    # dropped rather than guessed at: attributing it to a default tenant is the exact
    # bug tenancy.py was just fixed for, and a span filed under the wrong organization
    # is worse than a span nobody has.
    tenant_id = getattr(request.state, "tenant_id", "")
    if not tenant_id:
        return

    span = agent_telemetry.http_span(
        request.method,
        route,
        status_code,
        duration_ms,
        start_time=start_time,
        attributes={"http.server": "loveheartbeat-api"},
    )
    agent_telemetry.ingest(tenant_id, [], [span], [])


async def record_request_span(request: Request, call_next: Callable) -> Any:
    """HTTP middleware: time the request, then store a span for it.

    Instrumentation must never be why a request fails, so every failure below is
    swallowed and logged: an unreachable DynamoDB, a throttled write, a span the store
    rejects. The caller gets its response either way.

    ponytail: one synchronous DynamoDB write per recorded request, on the request path.
    That is the ceiling — a few hundred requests a second per tenant before the write
    cost and the added latency matter, and the 5000-span read window route_stats() uses
    covers proportionally less history the busier the tenant is. The upgrade path, in
    order: sample (record 1 in N and multiply the counts), then buffer and batch through
    record_store.append_many, then pre-aggregate per route per minute on write so the
    read stops scanning raw spans at all. None of that is worth building before a tenant
    is actually big enough to need it.
    """
    started = time.perf_counter()
    start_time = datetime.now(timezone.utc).isoformat()
    try:
        response = await call_next(request)
    except Exception:
        # The handler raised: that is a 500 to the caller and exactly the kind of thing
        # this page exists to show, so record it and re-raise untouched.
        try:
            _record(request, 500, (time.perf_counter() - started) * 1000, start_time)
        except Exception:
            log.warning("request span not recorded for %s", request.url.path, exc_info=True)
        raise

    try:
        _record(request, response.status_code, (time.perf_counter() - started) * 1000, start_time)
    except Exception:
        log.warning("request span not recorded for %s", request.url.path, exc_info=True)
    return response
