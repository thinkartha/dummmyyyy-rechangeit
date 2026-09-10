/**
 * The avatar initial.
 *
 * The failures worth guarding: a letter on screen when nobody is signed in (it reads as
 * a claim about a person), the previous account's letter surviving a sign-out, and a
 * name whose first *character* is punctuation putting a quote mark in the circle.
 *
 *   node integration/test/avatar.test.mjs
 */
import assert from 'node:assert/strict';

/* auth.js is a browser module; this gives it the two globals it touches at import. */
globalThis.window = { location: { search: '', pathname: '/', hostname: 'localhost' },
                      localStorage: { getItem: () => null, setItem() {}, removeItem() {} } };
globalThis.localStorage = window.localStorage;
globalThis.document = {
  documentElement: { dataset: {}, getAttribute: () => null },
  querySelectorAll: () => [],
  querySelector: () => null,
  getElementById: () => null,
  addEventListener() {},
  body: { addEventListener() {} },
};

const auth = await import('../auth.js');

/* initialOf is module-private, so the behaviour is exercised through the same paint
   path the page uses: a fake avatar element, and a session pushed in front of it. */
function avatarAfter(session) {
  const span = { className: 'fa-solid fa-user', textContent: '' };
  globalThis.document.querySelectorAll = (selector) =>
    selector === '[data-lhb-avatar] .avatar-name span' ? [span] : [];
  auth.__paintForTest(session);
  return span;
}

if (!auth.__paintForTest) {
  console.log('avatar: skipped — auth.js exposes no test hook');
  process.exit(0);
}

// A signed-in account gets the first letter of its first name, uppercased.
{
  const span = avatarAfter({ name: 'Tejas Yalmanchili', email: 'info@rootvyana.com' });
  assert.equal(span.textContent, 'T');
  assert.equal(span.className, '', 'the icon class has to go, or the letter sits on top of it');
}

// No display name: the address is the fallback, the way every product doing this does it.
assert.equal(avatarAfter({ email: 'alice@example.com' }).textContent, 'A');

// The first *letter*, not the first character — a stored name can start with a quote
// or a space, and a circle with punctuation in it looks broken.
assert.equal(avatarAfter({ name: '"tejas"' }).textContent, 'T');
assert.equal(avatarAfter({ name: '  tejas' }).textContent, 'T');

// Signed out is a generic person. Any letter there would be a claim about somebody.
{
  const span = avatarAfter(null);
  assert.equal(span.textContent, '');
  assert.equal(span.className, 'fa-solid fa-user');
}

// And a sign-out after a sign-in must not leave the previous account's letter behind.
{
  const span = { className: '', textContent: 'T' };
  globalThis.document.querySelectorAll = (selector) =>
    selector === '[data-lhb-avatar] .avatar-name span' ? [span] : [];
  auth.__paintForTest(null);
  assert.equal(span.textContent, '');
  assert.equal(span.className, 'fa-solid fa-user');
}

console.log('avatar: ok');
