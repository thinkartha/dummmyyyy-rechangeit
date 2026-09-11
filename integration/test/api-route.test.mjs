/**
 * API Monitoring's per-route drill-down.
 *
 * The things that fail quietly here — a route selected by a path that needs escaping,
 * shares that do not add up because one code was counted twice, and the trace list
 * showing every trace on the system when the route matches nothing.
 *
 *   node integration/test/api-route.test.mjs
 */
import assert from 'node:assert/strict';
import { SOURCES } from '../live-data.js';

const cell = (row, i) => (typeof row.cells[i] === 'object' ? row.cells[i].text : row.cells[i]);

/* routeParam() reads window.location, so the tests stand one up. A route is a path and
   arrives percent-encoded in the query string. */
const at = (route) => {
  global.window = { location: { pathname: '/apps/observability/api-route/',
                               search: `?route=${encodeURIComponent(route)}` } };
};

const ROUTE = 'POST /api/v1/ingest/events';
const row = {
  route: ROUTE, requests: 200, errors: 10, avg_latency_ms: 42.5, p99_latency_ms: 900,
  error_rate: 0.05, by_code: { 200: 180, 404: 10, 503: 10 },
};

// Codes are split by class, and the shares are of this route's traffic.
{
  at(ROUTE);
  const out = SOURCES.apiRouteCodes.rows(row);
  assert.deepEqual(out.map((r) => cell(r, 0)), ['200', '404', '503']);
  assert.deepEqual(out.map((r) => cell(r, 2)), ['90.0%', '5.0%', '5.0%']);
  assert.deepEqual(out.map((r) => cell(r, 3)), ['Success', 'Client error', 'Server error']);
}

// A route that is not in the response is empty with no tiles inventing numbers —
// the usual cause is traffic that aged out of the retention window.
{
  at('GET /nothing');
  assert.deepEqual(SOURCES.apiRouteCodes.rows(null), []);
  const tiles = SOURCES.apiRouteCodes.stats(null);
  assert.equal(tiles.routeRequests.value, '0');
  assert.equal(tiles.routeRequests.delta, 'route not found');
  assert.equal(tiles.routeErrorRate.value, '0.00%');
}

// p99 is this route's own, not the fleet's — the whole reason the row is worth opening.
{
  at(ROUTE);
  const tiles = SOURCES.apiRouteCodes.stats(row);
  /* num() drops a trailing zero — 900ms, not 900.0ms. */
  assert.equal(tiles.routeP99Latency.value, '900ms');
  assert.equal(tiles.routeAvgLatency.value, '42.5ms');
  assert.equal(tiles.routeErrorRate.value, '5.00%');
}

// Traces are matched on the root span name. A route with none shows none, rather than
// every trace on the system.
{
  at(ROUTE);
  const traces = [
    { trace_id: 't1', root_name: ROUTE, span_count: 4, errors: 1, duration_ms: 120.4, start_time: '2026-09-11T00:00:00Z' },
    { trace_id: 't2', root_name: 'GET /api/v1/traces/search', span_count: 2, errors: 0, duration_ms: 10 },
  ];
  const out = SOURCES.apiRouteTraces.rows(traces);
  assert.equal(out.length, 1);
  assert.equal(cell(out[0], 0), 't1');
  assert.equal(cell(out[0], 5), 'Failed');

  at('GET /never-called');
  assert.deepEqual(SOURCES.apiRouteTraces.rows(traces), []);
}

console.log('ok — api-route drill-down');
