/**
 * Registry integrity check: every actionKey a Pug page asks for must exist.
 *
 * The failure this catches is silent — a page ships `actionKey: 'addWidget'`, no entry
 * matches, and the button quietly does nothing in production. Nothing else in the
 * build looks at that string, so this is the only place it can be caught.
 *
 * A page can name two actions — `actionKey` and `secondaryActionKey` — and the second
 * was invisible here until this matched it: the button shipped, the check stayed green.
 *
 *   node integration/check-actions.mjs
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const source = readFileSync(new URL('./actions.js', import.meta.url), 'utf8');

/** Top-level keys of ACTIONS and UNSUPPORTED, read from the source rather than
 *  imported: actions.js touches `document` at module scope-adjacent helpers and this
 *  check has no DOM. */
function keysOf(name) {
  const start = source.indexOf(`export const ${name} = {`);
  if (start === -1) throw new Error(`${name} not found in actions.js`);
  const body = source.slice(start, source.indexOf('\n};', start));
  return new Set(Array.from(body.matchAll(/^ {2}(\w+):/gm), (m) => m[1]));
}

const known = new Set([...keysOf('ACTIONS'), ...keysOf('UNSUPPORTED')]);

function* pugFiles(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* pugFiles(path);
    else if (name.endsWith('.pug')) yield path;
  }
}

const missing = [];
let used = 0;
for (const file of pugFiles(new URL('../src/pug', import.meta.url).pathname)) {
  const text = readFileSync(file, 'utf8');
  // Two ways a page names an action: through the Obs mixin's config, or as a
  // data-lhb-action attribute written straight onto a button.
  for (const m of text.matchAll(/[sS]econdaryActionKey: '([^']+)'|actionKey: '([^']+)'|data-lhb-action='([^']+)'/g)) {
    const key = m[1] ?? m[2] ?? m[3];
    used++;
    if (!known.has(key)) missing.push(`${file}: ${key}`);
  }
}

// Entries nobody references are dead weight, but not a failure — a registry entry can
// legitimately land before the page that uses it.
const referenced = new Set();
for (const file of pugFiles(new URL('../src/pug', import.meta.url).pathname)) {
  for (const m of readFileSync(file, 'utf8').matchAll(/[sS]econdaryActionKey: '([^']+)'|actionKey: '([^']+)'|data-lhb-action='([^']+)'/g)) {
    referenced.add(m[1] ?? m[2] ?? m[3]);
  }
}
// Row-level buttons are named in live-data.js, not in a Pug page.
const rowSource = readFileSync(new URL('./live-data.js', import.meta.url), 'utf8');
for (const m of rowSource.matchAll(/key: '([^']+)'/g)) referenced.add(m[1]);

const orphans = [...known].filter((k) => !referenced.has(k) && !source.includes(`action: '${k}'`));

if (missing.length) {
  console.error(`${missing.length} page(s) reference an unknown action:\n  ` + missing.join('\n  '));
  process.exit(1);
}
console.log(`ok — ${used} action references across the pages, all resolved`);
if (orphans.length) console.log(`note — unreferenced entries: ${orphans.join(', ')}`);
