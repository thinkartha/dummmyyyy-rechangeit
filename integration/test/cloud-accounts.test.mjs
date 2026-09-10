/**
 * Cloud Monitoring's per-account join.
 *
 * The things that fail quietly here — cost landing on the wrong account because the
 * ids were compared across types, an account AWS refused disappearing from the table
 * instead of saying why, and the cards counting resources for accounts that returned
 * nothing at all.
 *
 *   node integration/test/cloud-accounts.test.mjs
 */
import assert from 'node:assert/strict';
import { SOURCES } from '../live-data.js';

const rows = (payload) => SOURCES.cloudAccounts.rows(payload);
const stats = (payload) => SOURCES.cloudAccounts.stats(payload);
const cell = (row, i) => (typeof row.cells[i] === 'object' ? row.cells[i].text : row.cells[i]);

const account = (over = {}) => ({
  accountId: '111122223333', name: 'prod-root', connected: false,
  hostedZones: [], domains: [], distributions: [], buckets: [], users: [],
  alarms: [], serviceErrors: {}, error: null, ...over,
});

// Cost Explorer reports LINKED_ACCOUNT as a string; the inventory account id arrives
// the same way, but a payload that ever hands back a number must still join.
{
  const out = rows({
    report: { organization: true, accounts: [account({ accountId: '444455556666' })] },
    cost: { currency: 'USD', accounts: [{ account: 444455556666, mtd: 1234.5 }] },
  });
  assert.equal(out.length, 1);
  assert.equal(cell(out[0], 5), 'USD 1,234.50');
}

// An account with no spend row is a dash, not a zero: Cost Explorer omitting an account
// means "no data", and USD 0.00 would read as a free account.
{
  const out = rows({ report: { organization: true, accounts: [account()] }, cost: { accounts: [] } });
  assert.equal(cell(out[0], 5), '—');
}

// An unreachable account stays in the table, carries its reason, and reports no counts.
{
  const out = rows({
    report: {
      organization: true,
      accounts: [account({ error: 'ClientError: not authorized to perform sts:AssumeRole' })],
    },
    cost: null,
  });
  assert.equal(cell(out[0], 6), 'Unreachable');
  assert.equal(cell(out[0], 3), '—');
  assert.match(out[0].meta, /sts:AssumeRole/);
}

// A partly-readable account is neither healthy nor unreachable, and names the services
// the role was refused — that string is the fix.
{
  const out = rows({
    report: { organization: true, accounts: [account({ serviceErrors: { iam: 'AccessDenied' } })] },
    cost: null,
  });
  assert.equal(cell(out[0], 6), 'Partial access');
  assert.match(out[0].meta, /no access: iam/);
}

// Alarms outrank a clean read: an account with an open alarm is not "Healthy".
{
  const out = rows({
    report: { organization: true, accounts: [account({ alarms: [{ name: 'cpu' }, { name: 'disk' }] })] },
    cost: null,
  });
  assert.equal(cell(out[0], 6), 'Alarm');
  assert.equal(cell(out[0], 4), '2');
}

// Connected vs member is the label that tells an operator which role is missing.
{
  const out = rows({
    report: { organization: true, accounts: [account({ connected: true }), account({ accountId: '999' })] },
    cost: null,
  });
  assert.equal(cell(out[0], 2), 'Connected account');
  assert.equal(cell(out[1], 2), 'Member account');
}

// A standalone account is an answer, not a degraded org.
{
  const out = rows({ report: { organization: false, accounts: [account({ connected: true })] }, cost: null });
  assert.equal(cell(out[0], 2), 'Connected account');
  assert.equal(stats({ report: { organization: false, accounts: [account()] }, cost: null })
    .linkedAccounts.delta, 'standalone account');
}

// A rejected credential is one row saying why, never an empty table.
{
  const out = rows({ report: { error: 'ClientError: InvalidClientTokenId' }, cost: null });
  assert.equal(out.length, 1);
  assert.equal(cell(out[0], 6), 'Unreachable');
}

// Resources are summed across all five inventory lists, and an unreachable account
// contributes nothing rather than being silently averaged away.
{
  const payload = {
    report: {
      organization: true,
      accounts: [
        account({ buckets: [{ name: 'a' }, { name: 'b' }], users: [{ userName: 'u' }] }),
        account({ accountId: '999', error: 'denied' }),
      ],
    },
    cost: { currency: 'USD', mtd_total: 99.5, period_start: '2026-09-01', accounts: [] },
  };
  const out = stats(payload);
  assert.equal(out.resources.value, '3');
  assert.equal(out.linkedAccounts.value, '2');
  assert.equal(out.linkedAccounts.delta, '1 unreachable');
  assert.equal(out.mtdSpend.value, 'USD 99.50');
  assert.equal(out.mtdSpend.delta, 'since 2026-09-01');
  assert.equal(out.openAlarms.delta, 'all clear');
}

// Cost Explorer refusing the role must not read as a $0 bill.
{
  const out = stats({ report: { organization: true, accounts: [account()] },
                      cost: { error: 'AccessDeniedException', mtd_total: 0 } });
  assert.equal(out.mtdSpend.value, '—');
  assert.equal(out.mtdSpend.delta, 'Cost Explorer denied');
}

// Nothing connected at all: no rows, and the sweep renders the empty state.
assert.deepEqual(rows({ report: { configured: false, accounts: [] }, cost: null }), []);

// A managed gateway is still the only real GCP/Azure signal, and keeps its column count.
{
  const out = rows({
    report: { organization: true, accounts: [] },
    cost: null,
    gateway: { configured: true, provider: 'apigee', label: 'acme-apigee', reachable: true, routes: 27 },
  });
  assert.equal(out.length, 1);
  assert.equal(cell(out[0], 1), 'GCP');
  assert.equal(out[0].cells.length, 7);
}

console.log('cloud-accounts: ok');
