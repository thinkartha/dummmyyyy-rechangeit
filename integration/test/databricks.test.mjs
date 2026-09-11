/**
 * The Databricks sources: spend, spenders, query health and clusters.
 *
 * What is guarded here is what would be wrong *plausibly* rather than visibly — a cost
 * trend measured against the wrong baseline, an autoscaling cluster printed as its
 * floor, a p99 averaged across warehouses. All three render fine and mislead.
 *
 *   node integration/test/databricks.test.mjs
 */
import assert from 'node:assert/strict';
import { SOURCES } from '../live-data.js';

const cell = (row, i) => (typeof row.cells[i] === 'object' ? row.cells[i].text : row.cells[i]);

const usage = {
  available: true,
  currency: 'USD',
  total_cost: 40,
  total_dbus: 100,
  points: [
    { date: '2026-09-06', amount: 5, dbus: 12 },
    { date: '2026-09-07', amount: 5, dbus: 13 },
    { date: '2026-09-08', amount: 15, dbus: 37 },
    { date: '2026-09-09', amount: 15, dbus: 38 },
  ],
  skus: [{ name: 'PREMIUM_SQL', amount: 30, dbus: 70 },
         { name: 'PREMIUM_JOBS', amount: 10, dbus: 30 }],
  top_spenders: [{ entity: 'nightly-load', entity_type: 'job', dbus: 70, amount: 30 },
                 { entity: 'unattributed', entity_type: 'unattributed', dbus: 30, amount: 10 }],
};

// Trend is measured against the previous window of equal length, not against the whole
// history — "spend is up" is meaningless unless the two periods are the same size.
{
  const stats = SOURCES.databricksUsage.stats(usage);
  assert.equal(stats.dbxCost.value, 'USD 40.00');
  assert.equal(stats.dbxCost.delta, '+200.0% vs prior');   // 10 -> 30
  assert.equal(stats.dbxDbus.value, '100');
  assert.equal(stats.dbxTopSku.value, 'PREMIUM_SQL');
}

// Share is of the period total, and it has to add up.
{
  const rows = SOURCES.databricksUsage.rows(usage);
  assert.deepEqual(rows.map((r) => cell(r, 3)), ['75.0%', '25.0%']);
  assert.equal(cell(rows[0], 2), 'USD 30.00');
}

// Unattributed spend is real spend: shown, and not coloured as a fault.
{
  const rows = SOURCES.databricksSpenders.rows(usage);
  assert.equal(rows.length, 2);
  assert.equal(cell(rows[1], 0), 'unattributed');
  assert.equal(rows[1].iconColor, 'secondary');
}

// Nothing connected, or system tables not enabled: empty, never invented.
{
  for (const payload of [null, {}, { available: false, reason: 'system tables off' }]) {
    assert.deepEqual(SOURCES.databricksUsage.rows(payload), []);
    assert.deepEqual(SOURCES.databricksSpenders.rows(payload), []);
    assert.deepEqual(SOURCES.databricksQueries.rows(payload), []);
    assert.deepEqual(SOURCES.databricksClusters.rows(payload), []);
  }
  const stats = SOURCES.databricksUsage.stats(null);
  assert.equal(stats.dbxCost.value, 'USD 0.00');
  assert.equal(stats.dbxTopSku.value, 'none yet');
}

// The headline p99 is the worst compute's, not an average of p99s — percentiles do not
// recombine, and the mean of the two below (505ms) is a number nothing ever measured.
{
  const queries = {
    available: true, total_queries: 200, total_failures: 3, failure_rate: 0.015,
    worst_p99_ms: 910,
    items: [
      { compute_id: 'wh-1', statement_type: 'SELECT', queries: 100, failures: 3,
        avg_duration_ms: 40, p99_duration_ms: 910, read_bytes: 1, read_rows: 1 },
      { compute_id: 'wh-2', statement_type: 'SELECT', queries: 100, failures: 0,
        avg_duration_ms: 30, p99_duration_ms: 100, read_bytes: 1, read_rows: 1 },
    ],
  };
  const stats = SOURCES.databricksQueries.stats(queries);
  assert.equal(stats.dbxQueryP99.value, '910ms');
  assert.equal(stats.dbxQueryFailures.value, '1.50%');

  const rows = SOURCES.databricksQueries.rows(queries);
  assert.equal(cell(rows[0], 6), 'Degraded');   // 3% failing
  assert.equal(cell(rows[1], 6), 'Healthy');
}

// An autoscaling cluster has a range, not a size. Printing its floor is how a 2-64
// cluster reads as a small one.
{
  const rows = SOURCES.databricksClusters.rows({
    available: true, total: 2, running: 1,
    items: [
      { name: 'analytics', state: 'RUNNING', running: true, source: 'UI',
        node_type: 'm5d.large', workers: 2, min_workers: 2, max_workers: 64,
        autotermination_minutes: 30 },
      { name: 'batch', state: 'TERMINATED', running: false, source: 'JOB',
        node_type: 'm5.xlarge', workers: 8, min_workers: null, max_workers: null,
        autotermination_minutes: 0 },
    ],
  });
  assert.equal(cell(rows[0], 4), '2–64');
  assert.equal(cell(rows[1], 4), '8');
  // A cluster with no auto-termination says so rather than showing "0m", which reads as
  // "terminates immediately" — the opposite of what it means.
  assert.equal(cell(rows[1], 5), 'never');
  assert.equal(cell(rows[0], 1), 'Running');
}

console.log('ok — databricks sources');
