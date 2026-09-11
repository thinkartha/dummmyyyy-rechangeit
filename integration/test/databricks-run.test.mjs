/**
 * The Databricks job-run drill-down.
 *
 * What fails quietly here: a skipped task counted as a failure (the fix is the task it
 * depends on, not this one), and an unreachable workspace rendering as a run with no
 * tasks — which reads as "this run did nothing".
 *
 *   node integration/test/databricks-run.test.mjs
 */
import assert from 'node:assert/strict';
import { SOURCES } from '../live-data.js';

const cell = (row, i) => (typeof row.cells[i] === 'object' ? row.cells[i].text : row.cells[i]);
global.window = { location: { pathname: '/apps/observability/databricks-run/', search: '?run=42' } };

const detail = {
  run_id: '42', job_id: '7', job_name: 'nightly-load', result_state: 'FAILED',
  life_cycle_state: 'TERMINATED', trigger: 'SCHEDULED', duration_ms: 90_000,
  started_at: '2026-09-11T02:00:00Z',
  tasks: [
    { task_key: 'ingest', run_id: '43', state: 'TERMINATED', result_state: 'FAILED',
      state_message: 'py4j error', duration_ms: 30_000, kind: 'notebook', target: '/Repos/etl/ingest' },
    { task_key: 'transform', state: 'SKIPPED', depends_on: ['ingest'], duration_ms: 0 },
    { task_key: 'publish', state: 'TERMINATED', result_state: 'SUCCESS', duration_ms: 61_000 },
  ],
};

// A skipped task is its own state, not a failure — only `ingest` is counted and named.
{
  const tiles = SOURCES.databricksRun.stats(detail);
  assert.equal(tiles.runTasks.value, '3');
  assert.equal(tiles.runFailedTasks.value, '1');
  assert.equal(tiles.runFailedTasks.delta, 'ingest');
  assert.equal(tiles.runState.value, 'FAILED');
  assert.equal(tiles.runDuration.value, '1m 30s');
}

// The rows carry what the task ran and what it said.
{
  const out = SOURCES.databricksRun.rows(detail);
  assert.deepEqual(out.map((r) => cell(r, 5)), ['Failed', 'Skipped', 'Succeeded']);
  assert.equal(out[0].meta, 'py4j error');
  assert.equal(cell(out[0], 3), '30s');
  // No message of its own: say what it was going to run instead of nothing.
  assert.equal(out[1].meta, null);
  assert.equal(cell(out[1], 4), 'ingest');
}

// A workspace that refused is one row saying so, not an empty table.
{
  const out = SOURCES.databricksRun.rows({ run_id: '42', tasks: [], error: 'RuntimeError: 401' });
  assert.equal(out.length, 1);
  assert.equal(out[0].meta, 'RuntimeError: 401');
  assert.equal(cell(out[0], 5), 'Error');
}

// Only Databricks rows link to the drill-down — the other connectors have no per-run
// read behind them, and a link that 404s on half the rows is worse than none.
{
  const rows = SOURCES.etlJobs.rows([
    { id: '1', source: 'databricks', type: 'etl.job.failed', timestamp: 't',
      data: { platform: 'databricks', execution_id: '42', job_name: 'nightly-load' } },
    { id: '2', source: 'talend', type: 'etl.job.failed', timestamp: 't',
      data: { platform: 'talend', execution_id: 'tal-9', job_name: 'legacy' } },
  ]);
  assert.equal(rows[0].href, '/apps/observability/databricks-run/?run=42');
  assert.equal(rows[1].href, undefined);
}

console.log('ok — databricks run drill-down');
