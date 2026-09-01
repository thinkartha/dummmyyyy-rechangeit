/**
 * The ETL job-run mapping: dedup, the status vocabulary, and duration.
 *
 * The three things that fail quietly here — a job counted three times because its
 * started/running/succeeded events were all kept, a vendor status shown raw so
 * "TIMEDOUT" and "launch_failed" read as different outcomes, and a duration silently
 * dropped because that vendor spells the field differently.
 *
 *   node integration/test/etl-jobs.test.mjs
 */
import assert from 'node:assert/strict';
import { SOURCES } from '../live-data.js';

const rows = (events) => SOURCES.etlJobs.rows(events);
const cell = (row, i) => (typeof row.cells[i] === 'object' ? row.cells[i].text : row.cells[i]);

const event = (over = {}) => ({
  id: 'evt-1', source: 'talend', type: 'etl.job.succeeded',
  timestamp: '2026-09-01T10:00:00Z',
  ...over,
  data: { execution_id: 'exec-1', job_name: 'nightly-load', status: 'COMPLETE', ...(over.data || {}) },
});

// Newest-first in, one row out: the current state, not the whole history.
{
  const out = rows([
    event({ type: 'etl.job.succeeded', data: { status: 'COMPLETE' } }),
    event({ type: 'etl.job.running', data: { status: 'RUNNING' } }),
    event({ type: 'etl.job.started', data: { status: 'submitted' } }),
  ]);
  assert.equal(out.length, 1, 'one execution must not become three rows');
  assert.equal(cell(out[0], 3), 'Success', 'the newest event wins');
}

// Every vendor's spelling lands in one of four words.
{
  const cases = {
    COMPLETE: 'Success', execution_success: 'Success',
    ERROR: 'Failed', TIMEDOUT: 'Failed', launch_failed: 'Failed', CANCELLED: 'Failed',
    TERMINATING: 'Running', dry_run_started: 'Running',
    PENDING: 'Queued', submitted: 'Queued',
  };
  for (const [raw, want] of Object.entries(cases)) {
    const [row] = rows([event({ data: { execution_id: raw, status: raw } })]);
    assert.equal(cell(row, 3), want, `${raw} -> ${want}`);
  }
}

// Databricks reports its outcome in result_state, with life_cycle_state as the fallback.
{
  const [row] = rows([event({
    source: 'databricks', type: 'etl.job.running',
    data: { status: undefined, result_state: 'FAILED', life_cycle_state: 'TERMINATED' },
  })]);
  assert.equal(cell(row, 3), 'Failed');
}

// An unmapped status is shown as-is rather than swallowed into "Unknown".
{
  const [row] = rows([event({ type: 'x', data: { status: 'SKIPPED' } })]);
  assert.equal(cell(row, 3), 'SKIPPED');
}

// Duration: each vendor's own field, then a start/finish pair, then a dash.
{
  const d = (data) => cell(rows([event({ data })])[0], 4);
  assert.equal(d({ duration_ms: 45000 }), '45s');
  assert.equal(d({ run_duration: 125000 }), '2m 5s');
  assert.equal(d({ execution_duration: 3000 }), '3s');
  assert.equal(d({ start_time: '2026-09-01T10:00:00Z', finish_time: '2026-09-01T10:01:30Z' }), '1m 30s');
  assert.equal(d({}), '—', 'no duration is a dash, not 0s');
  assert.equal(d({ duration_ms: -5 }), '—', 'a negative span is missing data, not a run');
}

// Retry is offered on a failed run this app launched, and on nothing else.
{
  const [failed] = rows([event({ data: { status: 'ERROR', execution_id: 'exec-9' } })]);
  assert.deepEqual(failed.actions.map((a) => a.key), ['retryEtlExecution']);
  assert.equal(failed.actions[0].arg, 'exec-9');

  const [ok] = rows([event({ data: { status: 'COMPLETE' } })]);
  assert.deepEqual(ok.actions, [], 'a successful run has nothing to retry');

  const [polled] = rows([event({ correlationid: 'c-1', data: { status: 'ERROR', execution_id: undefined } })]);
  assert.deepEqual(polled.actions, [], 'a run with no execution record here cannot be retried');
}

// The job name falls back through each vendor's spelling before giving up.
{
  const name = (data) => cell(rows([event({ data: { job_name: undefined, ...data } })])[0], 0);
  assert.equal(name({ process_name: 'boomi-proc' }), 'boomi-proc');
  assert.equal(name({ run_name: 'dbx-run' }), 'dbx-run');
  assert.equal(name({ job_id: 'job-77' }), 'job-77');
  assert.equal(name({}), 'unnamed job');
}

// Nothing stored is an empty table, not a crash.
assert.deepEqual(rows(null), []);
assert.deepEqual(rows([]), []);

console.log('all green');
