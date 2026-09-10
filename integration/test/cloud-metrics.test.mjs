/**
 * The streamed-metric tables: freshness, the three-state condition badge, and the
 * breakdown's error row.
 *
 * A metric stream delivers about once a minute, so the failure these guard against is a
 * stopped stream rendering exactly like a healthy idle service.
 *
 *   node integration/test/cloud-metrics.test.mjs
 */
import assert from 'node:assert/strict';
import { SOURCES } from '../live-data.js';

const cell = (row, i) => (typeof row.cells[i] === 'object' ? row.cells[i].text : row.cells[i]);
const ago = (ms) => new Date(Date.now() - ms).toISOString();

// A stream that stopped an hour ago must not read as a quiet service.
{
  const rows = SOURCES.cloudServices.rows({
    services: [
      { service: 'EC2', namespace: 'AWS/EC2', account: '1', regions: ['us-east-1'],
        resources: 4, metrics: 9, last_seen: ago(60 * 1000) },
      { service: 'RDS', namespace: 'AWS/RDS', account: '1', regions: ['us-east-1'],
        resources: 1, metrics: 3, last_seen: ago(30 * 60 * 1000) },
      { service: 'SQS', namespace: 'AWS/SQS', account: '1', regions: ['us-east-1'],
        resources: 1, metrics: 3, last_seen: ago(6 * 60 * 60 * 1000) },
      { service: 'S3', namespace: 'AWS/S3', account: '1', regions: [], resources: 0,
        metrics: 0, last_seen: null },
    ],
  });
  assert.deepEqual(rows.map((r) => cell(r, 6)), ['Live', 'Lagging', 'Stale', 'No data']);
}

// Nothing streamed is an empty table and a card that says so, never invented rows.
{
  const empty = { services: [], accounts: [], regions: [], datapoints: 0 };
  assert.deepEqual(SOURCES.cloudServices.rows(empty), []);
  const stats = SOURCES.cloudServices.stats(empty);
  assert.equal(stats.streamedServices.value, '0');
  assert.equal(stats.streamedServices.delta, 'no stream yet');
}

// Cards roll up the same answer the table shows.
{
  const stats = SOURCES.cloudServices.stats({
    services: [
      { service: 'EC2', resources: 40, metrics: 10, regions: ['us-east-1'] },
      { service: 'RDS', resources: 2, metrics: 5, regions: ['eu-west-1'] },
    ],
    accounts: ['1', '2'], regions: ['us-east-1', 'eu-west-1'], datapoints: 1234,
  });
  assert.equal(stats.streamedServices.value, '2');
  assert.equal(stats.streamedResources.value, '42');
  assert.equal(stats.streamedResources.delta, '15 metrics');
  assert.equal(stats.streamedRegions.value, '2');
  assert.equal(stats.streamedRegions.delta, '2 accounts');
  assert.equal(stats.datapoints.value, '1,234');
}

// A condition nothing has matched is neither firing nor healthy — showing it as OK
// hides a rule watching a metric that never arrives.
{
  const rows = SOURCES.metricConditions.rows([
    { id: 'a', name: 'CPU', namespace: 'AWS/EC2', metric: 'CPUUtilization', statistic: 'avg',
      comparison: 'gt', threshold: 80, for_periods: 2, enabled: true, watching: 4, firing: 2 },
    { id: 'b', name: 'Queue', namespace: 'AWS/SQS', metric: 'Visible', statistic: 'max',
      comparison: 'gt', threshold: 100, for_periods: 3, enabled: true, watching: 3, firing: 0 },
    { id: 'c', name: 'Unmatched', namespace: 'AWS/RDS', metric: 'CPU', statistic: 'avg',
      comparison: 'lt', threshold: 5, for_periods: 1, enabled: true, watching: 0, firing: 0 },
    { id: 'd', name: 'Off', namespace: 'AWS/EC2', metric: 'CPU', statistic: 'avg',
      comparison: 'gt', threshold: 90, for_periods: 1, enabled: false, watching: 9, firing: 4 },
  ]);
  assert.deepEqual(rows.map((r) => cell(r, 5)), ['Firing', 'OK', 'No data', 'Disabled']);
  assert.match(rows[0].meta, /AWS\/EC2 · avg > 80/);
  assert.match(rows[1].meta, /max > 100/);
  assert.equal(rows[0].action.key, 'deleteMetricCondition');
  assert.equal(rows[0].action.arg, 'a');
}

// Changes carry what actually changed, not just that something did.
{
  const rows = SOURCES.cloudChanges.rows([
    { change: 'added', kind: 'buckets', label: 'S3 bucket', name: 'assets',
      account: '111', account_name: 'prod', at: '2026-09-10T08:00:00Z', fields: {} },
    { change: 'removed', kind: 'buckets', label: 'S3 bucket', name: 'legacy',
      account: '222', account_name: 'dev', at: '2026-09-09T08:00:00Z', fields: {} },
    { change: 'modified', kind: 'distributions', label: 'CloudFront distribution',
      name: 'd.example', account: '111', account_name: 'prod', at: '2026-09-10T09:00:00Z',
      fields: { enabled: { from: true, to: false } } },
  ]);
  assert.deepEqual(rows.map((r) => cell(r, 4)), ['Added', 'Removed', 'Modified']);
  assert.equal(rows[2].meta, 'enabled: true → false');
  // A change with no field diff falls back to naming the account rather than showing
  // an empty meta line.
  assert.equal(rows[0].meta, '111');
}

// Cost Explorer refusing the role is a row that says so — an empty table reads as $0.
{
  const rows = SOURCES.costBreakdown.rows({ error: 'AccessDeniedException' });
  assert.equal(rows.length, 1);
  assert.equal(cell(rows[0], 3), 'Unavailable');
}

// Money keeps its cents, and share drives the weight badge.
{
  const rows = SOURCES.costBreakdown.rows({
    currency: 'USD',
    entries: [
      { key: 'EC2', mtd: 18220.5, share: 0.468 },
      { key: 'RDS', mtd: 9140, share: 0.1 },
      { key: 'untagged', mtd: 4, share: 0.01 },
    ],
  });
  assert.equal(cell(rows[0], 1), 'USD 18,220.50');
  assert.deepEqual(rows.map((r) => cell(r, 3)), ['Major', 'Notable', 'Minor']);
  assert.equal(cell(rows[2], 0), 'untagged', 'untagged spend is shown, not dropped');
}

// Resource rows name the thing and carry its dimensions.
{
  const rows = SOURCES.cloudResources.rows([
    { id: 'x', name: 'i-0abc', service: 'EC2', account: '1', region: 'us-east-1',
      metrics: 14, last_seen: ago(60 * 1000), dimensions: { InstanceId: 'i-0abc' } },
  ]);
  assert.equal(cell(rows[0], 0), 'i-0abc');
  assert.equal(rows[0].meta, 'InstanceId=i-0abc');
  assert.equal(cell(rows[0], 6), 'Live');
}

console.log('cloud-metrics: ok');
