/**
 * Registry integrity check for the auth layer, and a self-check of the one piece of
 * logic in it that is easy to get quietly wrong.
 *
 * The silent failure this catches is the same one check-actions.mjs catches for buttons:
 * a page ships `data-lhb-auth="signIn"`, no flow matches, and the form does nothing in
 * production. Nothing else in the build reads that string.
 *
 *   node integration/check-auth.mjs
 */

import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { FLOWS, explain } from './auth.js';
import { roleOf } from './api-client.js';

/* --- the error messages a user actually reads --------------------------- */

// The backend puts its reason in the body; showing "API 400" instead of that reason is
// the difference between "go sign in" and a dead end.
assert.equal(
  explain(new Error('API 400: {"detail":"User is already active"}')),
  'User is already active'
);
// A bare framework word next to a password box explains nothing.
assert.equal(explain(new Error('API 401: Unauthorized')), 'Invalid email or password.');
// ...but a 401 the backend bothered to explain keeps its explanation.
assert.equal(
  explain(new Error('API 401: {"detail":"Account is pending organization admin approval"}')),
  'Account is pending organization admin approval'
);
assert.equal(explain(new Error('API 400: end_time must be after start_time')),
  'end_time must be after start_time');
assert.equal(explain(new Error('API 503: upstream')), 'The API is having trouble. Try again in a moment.');
assert.equal(explain(new Error('Failed to fetch'), 'custom'), 'custom');
// A body too long to be a message is noise, not an explanation.
assert.equal(
  explain(new Error(`API 400: ${'x'.repeat(300)}`)),
  'Could not reach the API. Check that the backend is running.'
);

/* --- role collapsing ----------------------------------------------------- */

assert.equal(roleOf(['platform_admin', 'org_admin']), 'platform_admin');
assert.equal(roleOf(['org_admin']), 'org_admin');
assert.equal(roleOf(['user']), 'member');
assert.equal(roleOf(), 'member');

/* --- every page's flow name resolves ------------------------------------- */

function* pugFiles(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* pugFiles(path);
    else if (name.endsWith('.pug')) yield path;
  }
}

const missing = [];
const seen = new Set();
let used = 0;
for (const file of pugFiles(new URL('../src/pug', import.meta.url).pathname)) {
  for (const m of readFileSync(file, 'utf8').matchAll(/data-lhb-auth='([^']+)'/g)) {
    used++;
    seen.add(m[1]);
    if (!FLOWS[m[1]]) missing.push(`${file}: ${m[1]}`);
  }
}

if (missing.length) {
  console.error(`${missing.length} page(s) name an unknown auth flow:\n  ` + missing.join('\n  '));
  process.exit(1);
}

// A flow with no page is a screen someone forgot to wire, not a harmless spare.
const unwired = Object.keys(FLOWS).filter((key) => !seen.has(key));
console.log(`ok — ${used} auth form(s) across the pages, all resolved`);
if (unwired.length) console.log(`note — flows with no page: ${unwired.join(', ')}`);
