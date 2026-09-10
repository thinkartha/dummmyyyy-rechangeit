/**
 * Registry integrity check: every `api.<namespace>.<method>(` call must exist.
 *
 * The third silent failure of this shape, after check-actions and check-live-tables.
 * `api.cloudMetrics.summry()` is not a syntax error and not a lint error — it is
 * `undefined is not a function` at the moment a user opens the page, which is the one
 * place nobody is looking. Renaming a client method and missing one call site does the
 * same thing.
 *
 *   node integration/check-api-calls.mjs
 */

import { readFileSync } from 'node:fs';
import { api } from './api-client.js';

const files = ['live-data.js', 'actions.js', 'auth.js', 'account.js', 'charts.js'];

const missing = new Set();
let checked = 0;

for (const name of files) {
  let text;
  try {
    text = readFileSync(new URL(`./${name}`, import.meta.url), 'utf8');
  } catch {
    continue;
  }
  // Only the two-level `api.ns.fn(` shape. Deeper chains and computed access are not
  // used by these modules, and guessing at them would report false misses.
  for (const m of text.matchAll(/\bapi\.([a-zA-Z]+)\.([a-zA-Z]+)\s*\(/g)) {
    const [, ns, fn] = m;
    checked++;
    if (!api[ns] || typeof api[ns][fn] !== 'function') {
      missing.add(`${name}: api.${ns}.${fn}`);
    }
  }
}

if (missing.size) {
  console.error(`${missing.size} call site(s) reference a method the API client does not have:\n  `
    + [...missing].join('\n  '));
  process.exit(1);
}

console.log(`ok — ${checked} api call sites, all resolve`);
