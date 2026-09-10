/**
 * Registry integrity check: every `live:` a Pug page asks for must exist in SOURCES,
 * and its column count must match what that source emits.
 *
 * Both failures are silent. A table naming a source that is not there is skipped by the
 * sweep — no request, no badge, no error — and sits on "Nothing here yet" forever, which
 * is indistinguishable from a tenant that genuinely has no data. Renaming a source and
 * missing one page is exactly how that happens.
 *
 * The column check catches the other half: `render()` zips cells against the `<th>`
 * list, so a source emitting seven cells into a six-column table silently drops the
 * last one, and one emitting six into seven leaves a blank column with no warning.
 *
 *   node integration/check-live-tables.mjs
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { SOURCES } from './live-data.js';

function* pugFiles(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* pugFiles(path);
    else if (name.endsWith('.pug')) yield path;
  }
}

/** The `columns: [...]` array belonging to the ObsToolTable that declared `live:`. */
function columnCount(text, from) {
  const start = text.indexOf('columns: [', from);
  if (start === -1) return null;
  const end = text.indexOf(']', start);
  if (end === -1) return null;
  return text.slice(start, end).split('{ label:').length - 1 || null;
}

const problems = [];
const referenced = new Set();
let used = 0;

for (const file of pugFiles(new URL('../src/pug', import.meta.url).pathname)) {
  const text = readFileSync(file, 'utf8');
  for (const m of text.matchAll(/\blive: '([^']+)'/g)) {
    const name = m[1];
    used++;
    referenced.add(name);
    if (!SOURCES[name]) {
      problems.push(`${file}: no SOURCES entry named '${name}'`);
      continue;
    }
    /* The static rows are the same shape the source emits — the mixin renders them and
       live-data replaces them — so the page's own first row is a faithful stand-in for
       a real one, and needs no network call to count. */
    const columns = columnCount(text, m.index);
    const cells = /cells: \[/.test(text.slice(m.index))
      ? text.slice(text.indexOf('cells: [', m.index)).match(/cells: \[([\s\S]*?)\]/)
      : null;
    if (columns && cells) {
      /* Split on top-level commas only, and only outside quotes. A badge cell is an
         object with a comma in it, and plenty of cells are strings with a comma in
         them — 'USD 18,220.14', 'user-service, auth-service'. Counting either as a
         separator made seven honest pages look wrong. */
      let depth = 0;
      let count = 1;
      let quote = null;
      for (const ch of cells[1]) {
        if (quote) {
          if (ch === quote) quote = null;
        } else if (ch === "'" || ch === '"' || ch === '`') quote = ch;
        else if (ch === '{' || ch === '[') depth++;
        else if (ch === '}' || ch === ']') depth--;
        else if (ch === ',' && depth === 0) count++;
      }
      if (count !== columns) {
        problems.push(`${file}: '${name}' table has ${columns} columns but its rows carry ${count} cells`);
      }
    }
  }
}

const orphans = Object.keys(SOURCES).filter((k) => !referenced.has(k));

if (problems.length) {
  console.error(`${problems.length} live table problem(s):\n  ` + problems.join('\n  '));
  process.exit(1);
}

console.log(`ok — ${used} live table(s) across the pages, all resolved`);
if (orphans.length) {
  // Not a failure: a source can legitimately land before the page that reads it.
  console.log(`   ${orphans.length} source(s) no page reads yet: ${orphans.join(', ')}`);
}
