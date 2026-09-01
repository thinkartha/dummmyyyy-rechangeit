/**
 * The 10-second refresh loop.
 *
 * What is pinned here is everything that fails quietly: a second timer per hydrate call
 * (six requests a tick by mid-session), a tick firing while the previous one is still
 * in flight, a hidden tab still billing the tenant, the one-time DOM setup repeating
 * and flashing every measured stat card back to a dash, and a poll wiping the rows out
 * from under somebody who has typed a filter.
 *
 *   node integration/test/polling.test.mjs
 */
import assert from 'node:assert/strict';

// --- the smallest DOM these functions touch ---------------------------------
let hidden = false;
let active = null;
const timers = [];

function el(tag = 'div', attrs = {}) {
  const node = {
    tag, attrs, children: [], parent: null, dataset: {}, className: '', textContent: '',
    value: attrs.value ?? '',
    appendChild(c) { c.parent = node; node.children.push(c); return c; },
    replaceChildren(...c) { node.children = c; c.forEach((x) => { x.parent = node; }); },
    removeAttribute(k) { delete node.attrs[k]; },
    setAttribute(k, v) { node.attrs[k] = v; },
    getAttribute(k) { return node.attrs[k] ?? null; },
    contains(other) { for (let n = other; n; n = n.parent) if (n === node) return true; return false; },
    closest() { return null; },
    matches(sel) { return matches(node, sel); },
    querySelector(sel) { return descendants(node).find((n) => matches(n, sel)) || null; },
    querySelectorAll(sel) { return descendants(node).filter((n) => matches(n, sel)); },
    get innerHTML() { return node._html || ''; },
    set innerHTML(v) { node._html = v; node.children = []; },
    classList: { contains: () => false, add() {}, remove() {} },
  };
  return node;
}

function descendants(node, out = []) {
  for (const c of node.children) { out.push(c); descendants(c, out); }
  return out;
}

function matches(node, sel) {
  return sel.split(',').map((s) => s.trim()).some((s) => {
    if (s === 'tbody' || s === 'thead th' || s === 'tbody.list') {
      return s === 'tbody.list' ? node.tag === 'tbody' && node.className.includes('list')
        : s === 'tbody' ? node.tag === 'tbody' : node.tag === 'th';
    }
    if (s === 'input[type="search"]') return node.tag === 'input' && node.attrs.type === 'search';
    if (s.startsWith('[') && s.endsWith(']')) {
      const key = s.slice(1, -1).split('=')[0];
      return key in node.attrs;
    }
    if (s.startsWith('.')) return node.className.includes(s.slice(1));
    return node.tag === s;
  });
}

const root = el('div');
root.attrs['data-live-table'] = 'probe';
root.dataset.liveTable = 'probe';
const card = root.appendChild(el('div'));
card.className = 'card-header';
const search = card.appendChild(el('input', { type: 'search' }));
const table = root.appendChild(el('table'));
const thead = table.appendChild(el('thead'));
thead.appendChild(el('th'));
const tbody = table.appendChild(el('tbody'));
tbody.className = 'list';
tbody.attrs['data-sample-rows'] = '';

const doc = {
  get hidden() { return hidden; },
  get activeElement() { return active; },
  createElement: (t) => el(t),
  querySelectorAll(sel) { return sel === '[data-live-table]' ? [root] : descendants(root).filter((n) => matches(n, sel)); },
  querySelector(sel) { return descendants(root).find((n) => matches(n, sel)) || null; },
};

globalThis.document = doc;
globalThis.window = {
  __MOCK_DATA__: '0',
  setInterval: (fn, ms) => { timers.push({ fn, ms }); return timers.length; },
  clearInterval() {},
};

const { hydrate, SOURCES } = await import('../live-data.js');

// A stub source we can count calls on.
let loads = 0;
let payload = [{ n: 1 }];
let gate = null;
SOURCES.probe = {
  load: async () => { loads += 1; if (gate) await gate; return payload; },
  rows: (d) => (d || []).map((r) => ({ cells: [String(r.n)] })),
};

const tick = () => timers[0].fn();

// --- one timer, whatever hydrate is called from ------------------------------
await hydrate({});
assert.equal(timers.length, 1, 'the first hydrate starts the loop');
assert.equal(timers[0].ms, 10_000, 'the interval is 10 seconds');
await hydrate({});
await hydrate({});
assert.equal(timers.length, 1, 'later hydrates must not stack a second timer');

// --- a tick actually refreshes ----------------------------------------------
const before = loads;
tick();
await new Promise((r) => setTimeout(r, 0));
assert.equal(loads, before + 1, 'a tick re-reads the table');

// --- a hidden tab costs nothing ---------------------------------------------
hidden = true;
const idle = loads;
tick(); tick();
await new Promise((r) => setTimeout(r, 0));
assert.equal(loads, idle, 'a background tab does not poll');
hidden = false;

// --- ticks do not stack on a slow response ----------------------------------
let release;
gate = new Promise((r) => { release = r; });
const slow = loads;
tick();
await new Promise((r) => setTimeout(r, 0));
tick(); tick();
await new Promise((r) => setTimeout(r, 0));
assert.equal(loads, slow + 1, 'a tick while one is in flight is skipped, not queued');
release();
gate = null;
await new Promise((r) => setTimeout(r, 0));

// --- a typed filter is left alone by the timer, but not by Refresh ----------
search.value = 'nightly';
const filtered = loads;
tick();
await new Promise((r) => setTimeout(r, 0));
assert.equal(loads, filtered, 'a poll does not redraw a table being filtered');
await hydrate({});
assert.equal(loads, filtered + 1, 'an explicit refresh still redraws it');
search.value = '';

// --- focus inside the table counts as in-use --------------------------------
active = search;
const focused = loads;
tick();
await new Promise((r) => setTimeout(r, 0));
assert.equal(loads, focused, 'focus inside the table defers the poll');
active = null;

// --- an emptied source clears rows rather than leaving stale ones ------------
payload = [];
tick();
await new Promise((r) => setTimeout(r, 0));
assert.equal(tbody.children.length, 1, 'the table falls back to one row');
assert.equal(tbody.children[0].children[0].textContent, 'Nothing here yet.');

console.log('all green');
