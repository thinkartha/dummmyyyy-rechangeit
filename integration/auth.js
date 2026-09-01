/**
 * Sign-in, sign-up and session state for the whole site.
 *
 * Same shape as the other two integration modules: markup opts in with one attribute
 * and a registry entry says what that attribute means. A form carries
 * `data-lhb-auth="signup"`, its inputs are read by `name`, and the entry named there
 * decides what to call and where to go next. Adding the card and split variants of a
 * page is copying an attribute, not copying a script.
 *
 * Three jobs:
 *   1. FLOWS   — the six auth forms.
 *   2. guard() — keep signed-out visitors out of the tenant-scoped pages.
 *   3. paint() — put the real user in the navbar, and make Sign out sign out.
 */

import { api, clearSession, getSession, getToken } from './api-client.js';

/* ------------------------------------------------------------------ helpers */

/** Everything before `/apps/…`, so the auth pages can be found from any depth. */
function siteRoot() {
  const path = window.location.pathname;
  for (const marker of ['/apps/', '/pages/', '/dashboard/', '/modules/', '/documentation/']) {
    const at = path.indexOf(marker);
    if (at !== -1) return path.slice(0, at + 1);
  }
  return path.replace(/[^/]*$/, '');
}

/* Routes, not files: the app is a Next.js export with trailingSlash, so the page
   lives at .../sign-in/ and .../sign-in.html only exists as a 301 for old bookmarks.
   Redirecting through that one costs a round trip in production and 404s under
   `next dev`, which has no CloudFront function in front of it. */
const AUTH_PAGES = {
  signin: 'pages/authentication/sign-in/',
  signup: 'pages/authentication/sign-up/',
  confirm: 'pages/authentication/confirm/',
  forgot: 'pages/authentication/forgot-password/',
  reset: 'pages/authentication/reset-password/',
  home: 'apps/platform/command-center/'
};

/**
 * Where a flow should land next.
 *
 * The page can override any target with `data-lhb-<name>` — the card and split auth
 * layouts point at their own siblings so a user who started in one variant is not
 * bounced into another mid-flow.
 */
function target(root, name) {
  const override = root.dataset[`lhb${name[0].toUpperCase()}${name.slice(1)}`];
  return override || siteRoot() + AUTH_PAGES[name];
}

function fields(root) {
  const out = {};
  for (const el of root.querySelectorAll('input[name], select[name], textarea[name]')) {
    if (el.type === 'checkbox') out[el.name] = el.checked;
    else if (el.type === 'radio') { if (el.checked) out[el.name] = el.value; }
    else out[el.name] = el.value.trim();
  }
  return out;
}

/** The one status line every auth form has. Created on demand if the page has none. */
function notice(root) {
  let el = root.querySelector('[data-lhb-auth-message]');
  if (!el) {
    el = document.createElement('div');
    el.setAttribute('data-lhb-auth-message', '');
    el.className = 'alert d-none text-start py-2 fs-9';
    el.setAttribute('role', 'alert');
    const submit = root.querySelector('[data-lhb-auth-submit]');
    (submit ? submit.parentNode : root).insertBefore(el, submit || root.firstChild);
  }
  return el;
}

function say(root, message, tone = 'danger') {
  const el = notice(root);
  el.className = `alert alert-subtle-${tone} text-start py-2 fs-9`;
  el.textContent = message;
}

function hush(root) {
  notice(root).classList.add('d-none');
}

/**
 * Turn an API error into something a person can act on.
 *
 * The backend puts its reason in the body, so prefer that over the status code — "User
 * is already active" tells someone to go sign in; "API 400" tells them nothing.
 */
export function explain(error, fallback) {
  const message = error && error.message ? error.message : String(error);
  const detail = /API (\d{3}): ([\s\S]+)/.exec(message);
  const status = detail && detail[1];
  const body = detail && detail[2];

  /* FastAPI's `detail` is written for a person to read — "Account is pending
     organization admin approval" — so it beats anything this function could invent. */
  if (body) {
    try {
      const parsed = JSON.parse(body);
      if (parsed && parsed.detail) return String(parsed.detail);
    } catch {
      /* not JSON */
    }
  }
  /* A bare framework word is not a reason. "Unauthorized" next to a password box tells
     the user nothing they did not already know, so these two get a real sentence. */
  if (status === '401') return 'Invalid email or password.';
  if (status && status.startsWith('5')) return 'The API is having trouble. Try again in a moment.';
  if (body && body.length < 200) return body;
  /* Not every error reaching here came from the API. The action layer throws its own —
     "Enter a query first", a connection string the probe refused — and those were
     written for a person already. Replacing them with the network line says something
     untrue about the backend, so only an actual fetch failure gets it. */
  if (!detail && message && !/failed to fetch|networkerror|load failed/i.test(message)) {
    return message;
  }
  return fallback || 'Could not reach the API. Check that the backend is running.';
}

/** Carry the email between pages so nobody retypes it into the code form. */
const HANDOFF_KEY = 'lhb_auth_email';

function remember(email) {
  try { sessionStorage.setItem(HANDOFF_KEY, email); } catch { /* ignore */ }
}

function recall() {
  try { return sessionStorage.getItem(HANDOFF_KEY) || ''; } catch { return ''; }
}

function go(url) {
  window.location.href = url;
}

/* ------------------------------------------------------------------- flows */

export const FLOWS = {
  signin: {
    busy: 'Signing in…',
    run: async (root, values) => {
      if (!values.email || !values.password) throw new Error('Enter an email and password.');
      const result = await api.auth.login(values.email, values.password);

      /* A Cognito account that has not verified its email gets a token-less response
         rather than a 401. That is not a failed sign-in — it is an unfinished sign-up,
         and the code form is the only place it can be finished. */
      if (!result || !result.access_token) {
        remember(values.email);
        say(root, 'Confirm your email to finish signing in — sending you to the code form.', 'info');
        return () => go(target(root, 'confirm'));
      }

      const next = new URLSearchParams(window.location.search).get('next');
      return () => go(next || target(root, 'home'));
    }
  },

  signup: {
    busy: 'Creating account…',
    run: async (root, values) => {
      if (!values.email || !values.password) throw new Error('Enter an email and a password.');
      if (values.confirmPassword !== undefined && values.password !== values.confirmPassword) {
        throw new Error('The two passwords do not match.');
      }
      if (values.termsService === false) throw new Error('Accept the terms to continue.');

      const intent = values.intent || 'solo';
      const result = await api.auth.register({
        email: values.email,
        password: values.password,
        name: values.name || undefined,
        intent,
        org_name: intent === 'create_org' ? values.org_name : undefined,
        org_identifier: intent === 'join_org' ? values.org_identifier : undefined,
        invite_token: intent === 'accept_invite' ? values.invite_token : undefined
      });

      remember(values.email);
      const status = (result && result.status) || '';

      /* Two of the four intents end somewhere other than "signed in", and saying which
         is the whole value of this screen — an account waiting on an admin looks exactly
         like a broken sign-up otherwise. Creating an organization is not one of them any
         more: it confirms by code and signs straight in. */
      if (status === 'pending_confirmation') {
        const hint = result.confirmation_code
          ? ` Your code is ${result.confirmation_code} (shown only in local dev).`
          : ' Check your email for the code.';
        say(root, `Account created.${hint}`, 'success');
        return () => go(target(root, 'confirm'));
      }
      if (status === 'pending_join') {
        say(root, 'Request sent. An administrator of that organization has to approve it before you can sign in.', 'info');
        return null;
      }
      say(root, 'Account created. Sending you to sign in…', 'success');
      return () => go(target(root, 'signin'));
    }
  },

  confirm: {
    busy: 'Confirming…',
    prefill: (root) => {
      const email = root.querySelector('[name="email"]');
      if (email && !email.value) email.value = recall();
    },
    run: async (root, values) => {
      const email = values.email || recall();
      /* The 2FA layouts split the code across six single-character boxes; joining every
         `code`-named input covers both that and a single field. */
      const code = values.code || Array.from(root.querySelectorAll('[data-lhb-code]'))
        .map((el) => el.value.trim()).join('');
      if (!email) throw new Error('Enter the email you signed up with.');
      if (!code) throw new Error('Enter the code from your email.');

      await api.auth.confirm({ email, code });
      say(root, 'Confirmed. Sending you to sign in…', 'success');
      return () => go(target(root, 'signin'));
    }
  },

  forgot: {
    busy: 'Sending…',
    run: async (root, values) => {
      if (!values.email) throw new Error('Enter your email address.');
      const result = await api.auth.forgotPassword(values.email);
      remember(values.email);

      /* The API answers the same way for an unknown address, on purpose — this form must
         not become a way to test whether someone has an account here. */
      const hint = result && result.reset_code
        ? ` Your code is ${result.reset_code} (shown only in local dev).`
        : '';
      say(root, `If that address has an account, a reset code is on its way.${hint}`, 'success');
      return () => go(target(root, 'reset'));
    }
  },

  reset: {
    busy: 'Resetting…',
    prefill: (root) => {
      const email = root.querySelector('[name="email"]');
      if (email && !email.value) email.value = recall();
    },
    run: async (root, values) => {
      const email = values.email || recall();
      const password = values.new_password || values.password;
      if (!email) throw new Error('Enter the email you asked to reset.');
      if (!values.code) throw new Error('Enter the code you were sent.');
      if (!password) throw new Error('Enter a new password.');
      if (values.confirmPassword !== undefined && password !== values.confirmPassword) {
        throw new Error('The two passwords do not match.');
      }

      await api.auth.resetPassword({ email, code: values.code, new_password: password });
      say(root, 'Password changed. Sending you to sign in…', 'success');
      return () => go(target(root, 'signin'));
    }
  },

  /* The sign-out page used to only *claim* to have signed you out — it was static
     markup and the token outlived it. This clears the session on arrival. No redirect:
     the page already offers its own way back to sign-in. */
  signout: {
    auto: true,
    run: async () => {
      clearSession();
      return null;
    }
  }
};

/* --------------------------------------------------------------------- bind */

function bindFlow(root) {
  const flow = FLOWS[root.dataset.lhbAuth];
  if (!flow) return;
  if (flow.prefill) flow.prefill(root);

  const submit = root.querySelector('[data-lhb-auth-submit]');

  const attempt = async () => {
    hush(root);
    const label = submit ? submit.textContent : '';
    if (submit) { submit.disabled = true; submit.textContent = flow.busy; }
    try {
      const then = await flow.run(root, fields(root));
      /* Redirect after a beat so the success line is readable rather than a flash. */
      if (then) setTimeout(then, 900);
      else if (submit) { submit.disabled = false; submit.textContent = label; }
    } catch (error) {
      say(root, explain(error));
      if (submit) { submit.disabled = false; submit.textContent = label; }
    }
  };

  if (flow.auto) return void attempt();

  if (submit) submit.addEventListener('click', (event) => { event.preventDefault(); attempt(); });
  root.addEventListener('submit', (event) => { event.preventDefault(); attempt(); });
  root.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && event.target.tagName !== 'TEXTAREA') {
      event.preventDefault();
      attempt();
    }
  });

  /* The intent picker on sign-up shows a different extra field per choice. One listener,
     because the fields are already in the markup — only their visibility changes. */
  const pickers = root.querySelectorAll('[data-lhb-intent]');
  const chosenIntent = () => {
    for (const picker of pickers) {
      if (picker.type === 'radio') { if (picker.checked) return picker.value; }
      else return picker.value;
    }
    return '';
  };
  const showIntentFields = () => {
    const chosen = chosenIntent();
    for (const el of root.querySelectorAll('[data-lhb-intent-field]')) {
      el.classList.toggle('d-none', el.dataset.lhbIntentField !== chosen);
    }
  };
  for (const picker of pickers) picker.addEventListener('change', showIntentFields);
  if (pickers.length) showIntentFields();
}

/* -------------------------------------------------------------------- guard */

/**
 * Pages that show one tenant's data. Everything else in this repo is theme
 * demonstration and stays open — guarding the component gallery would be theatre.
 */
const PROTECTED = ['/apps/observability/', '/apps/platform/', '/apps/organization/'];

/**
 * Send signed-out visitors to sign-in, remembering where they were headed.
 *
 * A missing token is decided locally and instantly. A token that the API has since
 * stopped accepting can only be found by asking, so the redirect for that case waits on
 * /auth/me — and a *failure to reach* the API is not a redirect, or a backend hiccup
 * would log everyone out.
 */
async function guard() {
  if (window.__LHB_REQUIRE_AUTH__ === false) return;
  const path = window.location.pathname;
  if (!PROTECTED.some((prefix) => path.includes(prefix))) return;

  const back = () => {
    const next = encodeURIComponent(path + window.location.search);
    go(`${siteRoot()}${AUTH_PAGES.signin}?next=${next}`);
  };

  if (!getToken()) return back();

  try {
    await api.auth.me();
  } catch (error) {
    if (/API 40[13]/.test(error.message || '')) {
      clearSession();
      back();
    }
    /* Anything else — network, 5xx — leaves the session alone. */
  }
}

/* -------------------------------------------------------------------- paint */

const ROLE_LABELS = {
  platform_admin: 'Platform admin',
  org_admin: 'Organization admin',
  member: 'Member'
};

/**
 * Show who is signed in, and wire Sign out.
 *
 * The theme ships a placeholder name in its profile dropdown. Leaving that in place next
 * to live tenant data is worse than showing nothing — it reads as the signed-in user.
 */
function paint() {
  const session = getSession();

  for (const el of document.querySelectorAll('[data-lhb-user]')) {
    /* A name slot wants a name. The address is the fallback for an account that has
       none, and `sub` — a login identifier — only when there is no address either. */
    el.textContent = session ? (session.name || session.email || session.sub) : 'Not signed in';
  }
  for (const el of document.querySelectorAll('[data-lhb-role]')) {
    el.textContent = session ? (ROLE_LABELS[session.role] || session.role) : '—';
  }
  /* Platform-admin-only links stay hidden for everyone else. The backend enforces this
     regardless; hiding is so the page does not advertise a 403. */
  for (const el of document.querySelectorAll('[data-lhb-requires-role]')) {
    const need = el.dataset.lhbRequiresRole.split(/\s*,\s*/);
    el.classList.toggle('d-none', !session || !need.includes(session.role));
  }
  for (const el of document.querySelectorAll('[data-lhb-signed-in]')) {
    el.classList.toggle('d-none', !session);
  }
  for (const el of document.querySelectorAll('[data-lhb-signed-out]')) {
    el.classList.toggle('d-none', !!session);
  }

  for (const el of document.querySelectorAll('[data-lhb-signout]')) {
    if (el.dataset.lhbSignoutBound === '1') continue;
    el.dataset.lhbSignoutBound = '1';
    el.addEventListener('click', (event) => {
      event.preventDefault();
      clearSession();
      go(`${siteRoot()}${AUTH_PAGES.signin}`);
    });
  }
}

/* --------------------------------------------------------------------- init */

export function init() {
  for (const root of document.querySelectorAll('[data-lhb-auth]')) bindFlow(root);
  paint();

  /* A refresh token the server rejected mid-session: api-client clears the tokens and
     fires this, and the guard turns it into a redirect from wherever the user was. */
  window.addEventListener('lhb:session-expired', () => {
    paint();
    if (PROTECTED.some((prefix) => window.location.pathname.includes(prefix))) {
      go(`${siteRoot()}${AUTH_PAGES.signin}?expired=1`);
    }
  });

  return guard();
}
