/**
 * Write actions for the observability pages.
 *
 * The read side (live-data.js) turns a `data-live-table` attribute into a hydrated
 * table. This is the same idea for writes: a control carries `data-lhb-action="key"`,
 * the entry named there says what to ask for and what to call, and one delegated
 * listener does the rest. Adding a button is a registry entry, not another modal.
 *
 * Every entry declares its endpoint honestly. A button whose endpoint does not exist
 * yet gets `unsupported` with the reason — it renders disabled and says so on hover,
 * rather than opening a form that posts nowhere. A dashboard that silently drops a
 * submission is worse than one that admits the gap.
 */

import { hydrate } from './live-data.js';
/* The API puts its reason in the body — "Talend requires a Bearer token…" — and the raw
   error reads "API 422: {\"detail\":…}". auth.js already unwraps that for the sign-in
   forms; the same unwrapping is what makes a failed connector test actionable here. */
import { explain } from './auth.js';

/* ------------------------------------------------------------------ feedback */

function toast(message, tone = 'success') {
  let host = document.querySelector('[data-lhb-toasts]');
  if (!host) {
    host = document.createElement('div');
    host.setAttribute('data-lhb-toasts', '');
    host.className = 'position-fixed bottom-0 end-0 p-3';
    host.style.zIndex = '1080';
    document.body.appendChild(host);
  }
  const el = document.createElement('div');
  el.className = `alert alert-${tone} alert-dismissible shadow mb-2`;
  el.setAttribute('role', 'alert');
  el.textContent = message;
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'btn-close';
  close.addEventListener('click', () => el.remove());
  el.appendChild(close);
  host.appendChild(el);
  setTimeout(() => el.remove(), 6000);
}

/* --------------------------------------------------------------------- modal */

/** Build (once) and return the shared modal shell. */
function shell() {
  let el = document.querySelector('[data-lhb-modal]');
  if (el) return el;
  el = document.createElement('div');
  el.setAttribute('data-lhb-modal', '');
  el.className = 'modal fade';
  el.tabIndex = -1;
  el.innerHTML = `
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content">
        <div class="modal-header border-bottom border-translucent">
          <h5 class="modal-title mb-0"></h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body"></div>
        <div class="modal-footer border-top border-translucent"></div>
      </div>
    </div>`;
  document.body.appendChild(el);
  return el;
}

/**
 * Show the shared modal.
 *
 * Bootstrap's JS is loaded by the layout, but this falls back to toggling the classes
 * itself if it is not — a page that cannot open its own form is a dead page, and the
 * fallback is six lines.
 */
function open(title, bodyNode, footerNode) {
  const el = shell();
  el.querySelector('.modal-title').textContent = title;
  const body = el.querySelector('.modal-body');
  const footer = el.querySelector('.modal-footer');
  body.replaceChildren(bodyNode);
  footer.replaceChildren(footerNode);

  const bs = window.bootstrap && window.bootstrap.Modal;
  if (bs) {
    const instance = bs.getOrCreateInstance(el);
    instance.show();
    return () => instance.hide();
  }
  el.classList.add('show');
  el.style.display = 'block';
  document.body.classList.add('modal-open');
  const hide = () => {
    el.classList.remove('show');
    el.style.display = 'none';
    document.body.classList.remove('modal-open');
  };
  el.querySelector('.btn-close').addEventListener('click', hide, { once: true });
  return hide;
}

/* Names match the channels alert_management seeds, so a rule created here routes the
 * same way as the ones that shipped with the tenant. FontAwesome has brand marks for
 * only some of them; the rest get the solid icon closest to how they deliver. */
const CHANNELS = [
  { value: 'Slack', icon: 'fa-brands fa-slack' },
  { value: 'Teams', icon: 'fa-brands fa-microsoft' },
  { value: 'PagerDuty', icon: 'fa-solid fa-bell' },
  { value: 'Email', icon: 'fa-solid fa-envelope' },
  { value: 'SMS', icon: 'fa-solid fa-comment-sms' },
  { value: 'Webhook', icon: 'fa-solid fa-link' },
];

/* ---------------------------------------------------------------------- form */

const uid = (() => { let n = 0; return () => `lhb-f${++n}`; })();

function field(spec) {
  const id = uid();
  const wrap = document.createElement('div');
  wrap.className = spec.width === 'half' ? 'col-12 col-md-6' : 'col-12';

  const label = document.createElement('label');
  label.className = 'form-label fs-9';
  label.htmlFor = id;
  label.textContent = spec.label + (spec.required ? ' *' : '');

  /* Channels are a fixed set the backend already seeds by name, so a free-text box
     only ever produced typos ("slak", "Page rDuty") that no router matched. Toggle
     buttons carrying each platform's logo pick from that set instead. */
  if (spec.type === 'icons') {
    const group = document.createElement('div');
    group.className = 'd-flex flex-wrap gap-2';
    for (const opt of spec.options) {
      const box = document.createElement('input');
      box.type = 'checkbox';
      box.className = 'btn-check';
      box.id = uid();
      box.name = spec.name;
      box.value = opt.value;
      box.checked = (spec.value || []).includes(opt.value);
      const btn = document.createElement('label');
      btn.className = 'btn btn-phoenix-secondary btn-sm';
      btn.htmlFor = box.id;
      const icon = document.createElement('span');
      icon.className = `${opt.icon} me-2`;
      btn.append(icon, document.createTextNode(opt.value));
      group.append(box, btn);
    }
    wrap.append(label, group);
    return wrap;
  }

  let input;
  if (spec.type === 'select') {
    input = document.createElement('select');
    input.className = 'form-select form-select-sm';
    for (const opt of spec.options || []) {
      const o = document.createElement('option');
      o.value = typeof opt === 'string' ? opt : opt.value;
      o.textContent = typeof opt === 'string' ? opt : opt.label;
      input.appendChild(o);
    }
  } else if (spec.type === 'textarea') {
    input = document.createElement('textarea');
    input.className = 'form-control form-control-sm';
    input.rows = spec.rows || 3;
  } else if (spec.type === 'checkbox') {
    input = document.createElement('input');
    input.type = 'checkbox';
    input.className = 'form-check-input';
    input.checked = spec.value !== false;
  } else {
    input = document.createElement('input');
    input.type = spec.type || 'text';
    input.className = 'form-control form-control-sm';
  }
  input.id = id;
  input.name = spec.name;
  /* A number input without `step` is integers-only, so 0.02 fails validation and the
     dialog's submit silently does nothing — the browser cannot show its bubble on a
     field inside the modal. Any fractional field must say so. */
  if (spec.step) input.step = spec.step;
  if (spec.placeholder) input.placeholder = spec.placeholder;
  if (spec.required) input.required = true;
  if (spec.value !== undefined && spec.type !== 'checkbox') input.value = spec.value;

  if (spec.type === 'checkbox') {
    const check = document.createElement('div');
    check.className = 'form-check';
    label.className = 'form-check-label fs-9';
    check.append(input, label);
    wrap.appendChild(check);
  } else {
    wrap.append(label, input);
  }
  if (spec.help) {
    const help = document.createElement('div');
    help.className = 'form-text fs-10';
    help.textContent = spec.help;
    wrap.appendChild(help);
  }
  return wrap;
}

/** Read a form's values, coercing to the types the API expects. */
function values(form, specs) {
  const out = {};
  for (const spec of specs) {
    const el = form.elements[spec.name];
    if (!el) continue;
    if (spec.type === 'icons') {
      out[spec.name] = Array.from(form.querySelectorAll(`input[name="${spec.name}"]:checked`), (b) => b.value);
      continue;
    }
    if (spec.type === 'checkbox') out[spec.name] = el.checked;
    else if (spec.type === 'number') out[spec.name] = el.value === '' ? undefined : Number(el.value);
    // A comma-separated text box is the lazy way to fill a list field, and the only
    // one worth building until someone asks for chips.
    else if (spec.type === 'list') {
      out[spec.name] = el.value.split(',').map((s) => s.trim()).filter(Boolean);
    } else out[spec.name] = el.value;
    if (out[spec.name] === '' && !spec.required) delete out[spec.name];
  }
  return out;
}

/**
 * A form in a dialog whose result opens the next dialog.
 *
 * `runForm` closes its own modal and toasts, which is right for save-and-done. It is
 * wrong when the API answers with something the operator must copy before it is gone —
 * an enrollment token, an agent key. Those need the form's result handed to a second
 * dialog instead of a toast.
 */
async function formThen(title, specs, submitLabel, submit) {
  const form = document.createElement('form');
  form.className = 'row g-3';
  form.noValidate = true;
  for (const spec of specs) form.appendChild(field(spec));

  const error = document.createElement('div');
  error.className = 'alert alert-danger mt-3 mb-0 d-none fs-9';
  const body = document.createElement('div');
  body.append(form, error);

  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.className = 'btn btn-phoenix-secondary btn-sm';
  cancel.textContent = 'Cancel';
  const go = document.createElement('button');
  go.type = 'button';
  go.className = 'btn btn-primary btn-sm';
  go.textContent = submitLabel;
  const footer = document.createElement('div');
  footer.className = 'd-flex gap-2';
  footer.append(cancel, go);

  const close = open(title, body, footer);
  cancel.addEventListener('click', close);
  go.addEventListener('click', async () => {
    if (!form.reportValidity()) return;
    go.disabled = true;
    go.textContent = 'Working…';
    error.classList.add('d-none');
    try {
      const result = await submit(values(form, specs));
      close();
      await result;
    } catch (err) {
      error.textContent = explain(err);
      error.classList.remove('d-none');
    } finally {
      go.disabled = false;
      go.textContent = submitLabel;
    }
  });
}

/** A labelled value in a result dialog. `mono` for anything meant to be copied. */
function resultLine(label, value, mono) {
  const row = document.createElement('div');
  row.className = 'mb-3';
  const head = document.createElement('div');
  head.className = 'fs-10 text-body-tertiary text-uppercase mb-1';
  head.textContent = label;
  const val = document.createElement('div');
  val.className = mono ? 'font-monospace fs-9 text-break' : 'fs-9 text-break';
  val.textContent = value || '—';
  row.append(head, val);
  return row;
}

/**
 * One cluster's brief, rendered for a human before it is handed to an agent.
 *
 * Both clustering paths return the same shape, so they share this. `options.dispatch`
 * is what separates them: alert clusters can only be copied, agent incidents can also
 * be sent. Condensed logs are shown rather than the raw ones — the whole point of the
 * brief is that N repeats of a line collapse to one with a count.
 */
function showBrief(brief, options = {}) {
  const body = document.createElement('div');

  const facts = document.createElement('dl');
  facts.className = 'row mb-3 fs-9';
  const rows = [
    ['Cluster', brief.title],
    ['Severity', brief.severity],
    ['Status', brief.status],
    ['Alerts collapsed', brief.alert_count],
    ['Services', (brief.affected_services || []).join(', ') || '—'],
    ['Window', `${brief.first_seen || '—'} → ${brief.last_seen || '—'}`],
    ['Compression', brief.compression
      ? `${brief.compression.alerts_in} alerts → ${brief.compression.lines_out} lines`
      : '—'],
  ];
  for (const [k, v] of rows) {
    const dt = document.createElement('dt');
    dt.className = 'col-4 col-sm-3 text-body-tertiary fw-normal';
    dt.textContent = k;
    const dd = document.createElement('dd');
    dd.className = 'col-8 col-sm-9 mb-1';
    dd.textContent = String(v ?? '—');
    facts.append(dt, dd);
  }
  body.appendChild(facts);

  /* Where the handoff reports back. Created up front so both the dispatch result and
     any earlier dispatch of the same cluster have somewhere to land. */
  const status = document.createElement('div');
  status.className = 'alert alert-subtle-info fs-9 d-none';
  body.appendChild(status);

  const block = (heading, text) => {
    const h = document.createElement('h6');
    h.className = 'fs-9 mb-2';
    h.textContent = heading;
    const pre = document.createElement('pre');
    pre.className = 'bg-body-emphasis border border-translucent rounded-3 p-3 fs-10 mb-3';
    pre.style.maxHeight = '14rem';
    pre.style.overflow = 'auto';
    pre.style.whiteSpace = 'pre-wrap';
    pre.textContent = text;
    body.append(h, pre);
  };

  if ((brief.condensed_logs || []).length) {
    block('Condensed logs — ×N is the repeat count', brief.condensed_logs.join('\n'));
  }

  if ((brief.timeline || []).length) {
    const h = document.createElement('h6');
    h.className = 'fs-9 mb-2';
    h.textContent = 'Timeline';
    const ul = document.createElement('ul');
    ul.className = 'fs-9 mb-3';
    for (const line of brief.timeline) {
      const li = document.createElement('li');
      li.textContent = line;
      ul.appendChild(li);
    }
    body.append(h, ul);
  }

  block('Prompt for your coding agent', brief.prompt || '');

  const copy = document.createElement('button');
  copy.type = 'button';
  copy.className = 'btn btn-phoenix-secondary btn-sm';
  copy.textContent = 'Copy prompt';
  copy.addEventListener('click', async () => {
    // navigator.clipboard needs a secure context; the textarea trick is the
    // fallback that still works over plain http and in older Safari.
    try {
      await navigator.clipboard.writeText(brief.prompt || '');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = brief.prompt || '';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    copy.textContent = 'Copied';
    setTimeout(() => { copy.textContent = 'Copy prompt'; }, 2000);
  });

  const done = document.createElement('button');
  done.type = 'button';
  done.className = 'btn btn-phoenix-secondary btn-sm';
  done.textContent = 'Close';

  const footer = document.createElement('div');
  footer.className = 'd-flex gap-2';
  footer.append(done, copy);

  const say = (text, tone) => {
    status.className = `alert alert-subtle-${tone} fs-9`;
    status.textContent = text;
  };
  const describe = (d) => [
    `Handoff ${d.status || 'submitted'}`,
    d.external_id ? `job ${d.external_id}` : '',
    d.submitted_at || '',
    d.error || '',
  ].filter(Boolean).join(' · ');

  if (options.dispatch) {
    const send = document.createElement('button');
    send.type = 'button';
    send.className = 'btn btn-primary btn-sm';
    send.textContent = 'Send to coding agent';
    send.addEventListener('click', async () => {
      send.disabled = true;
      send.textContent = 'Sending…';
      try {
        say(describe(await options.dispatch()), 'success');
      } catch (err) {
        say(explain(err), 'warning');
      } finally {
        send.disabled = false;
        send.textContent = 'Send to coding agent';
      }
    });
    footer.appendChild(send);
  }

  const close = open(`${options.title || 'Agent brief'} · ${brief.title}`, body, footer);
  done.addEventListener('click', close);

  /* Asynchronous on purpose: the brief opens immediately and the earlier-handoff line
     fills in when it arrives, rather than the dialog waiting on a second request. */
  if (options.history) {
    options.history().then((list) => {
      if (list && list.length) say(`Already handed over — ${describe(list[0])}`, 'info');
    });
  }
}

/**
 * The agent key, and how to install the agent that uses it.
 *
 * `create_agent` returns the key once and never again — every later read of the agent
 * omits it. Closing this dialog without copying it means rotating the key to get
 * another one, so the install manifest is fetched and shown here too rather than
 * behind a second click somewhere else.
 */
async function showAgentKey(api, created) {
  const wrap = document.createElement('div');
  wrap.appendChild(resultLine('Agent id', created.id, true));
  wrap.appendChild(resultLine('Agent key — shown once', created.key, true));
  wrap.appendChild(resultLine('Status', created.status || 'pending'));

  const manifest = await api.automation.agentInstall(created.id).catch(() => null);
  if (manifest) {
    const head = document.createElement('div');
    head.className = 'fs-10 text-body-tertiary text-uppercase mb-1';
    head.textContent = 'Install';
    const list = document.createElement('ul');
    list.className = 'list-unstyled mb-3';
    for (const platform of manifest.platforms || []) {
      const item = document.createElement('li');
      item.className = 'mb-2';
      const label = document.createElement('div');
      label.className = 'fs-10 text-body-tertiary';
      label.textContent = platform.label || platform.id;
      const cmd = document.createElement('div');
      cmd.className = 'font-monospace fs-9 text-break';
      cmd.textContent = platform.install_command;
      item.append(label, cmd);
      list.appendChild(item);
    }
    wrap.append(head, list);
    if (manifest.config) {
      wrap.appendChild(resultLine('Reports to', manifest.config.api_base, true));
    }
  }

  const done = document.createElement('button');
  done.type = 'button';
  done.className = 'btn btn-primary btn-sm';
  done.textContent = 'Done';
  const footer = document.createElement('div');
  footer.className = 'd-flex gap-2';
  footer.appendChild(done);

  const close = open('Agent registered', wrap, footer);
  done.addEventListener('click', () => { close(); hydrate(api); });
}

/**
 * Step two of gateway onboarding: what the customer has to run.
 *
 * Rendered from the API's own `installation.instructions` rather than a copy kept
 * here, because the commands differ per deployment type and the backend is the one
 * that knows which. The token is shown once — it is single-use and expires — so this
 * dialog is the only place it exists outside the control plane.
 */
function showEnrollment(api, created) {
  const wrap = document.createElement('div');

  const line = (label, value, mono) => {
    const row = document.createElement('div');
    row.className = 'mb-3';
    const head = document.createElement('div');
    head.className = 'fs-10 text-body-tertiary text-uppercase mb-1';
    head.textContent = label;
    const val = document.createElement('div');
    val.className = mono ? 'font-monospace fs-9 text-break' : 'fs-9 text-break';
    val.textContent = value || '—';
    row.append(head, val);
    return row;
  };

  wrap.appendChild(line('Gateway id', created.gateway_id, true));
  wrap.appendChild(line('Gateway address', created.gateway_address, true));

  const token = line('Enrollment token — shown once', created.enrollment_token, true);
  const expiry = document.createElement('div');
  expiry.className = 'fs-10 text-body-tertiary mt-1';
  expiry.textContent = created.expires_at ? `Expires ${created.expires_at}` : '';
  token.appendChild(expiry);
  wrap.appendChild(token);

  const steps = (created.installation && created.installation.instructions) || [];
  if (steps.length) {
    const head = document.createElement('div');
    head.className = 'fs-10 text-body-tertiary text-uppercase mb-1';
    head.textContent = 'Run these where the gateway lives';
    const list = document.createElement('ol');
    list.className = 'ps-3 mb-3';
    for (const step of steps) {
      const item = document.createElement('li');
      item.className = 'font-monospace fs-9 text-break mb-2';
      item.textContent = step;
      list.appendChild(item);
    }
    wrap.append(head, list);
  }

  /* The cutover check runs against the gateway address with a Host header, so it can be
     proved working before public DNS moves. That ordering is the whole point of it. */
  const result = document.createElement('div');
  result.className = 'alert alert-subtle-info fs-9 mt-2 d-none';
  wrap.appendChild(result);

  const done = document.createElement('button');
  done.type = 'button';
  done.className = 'btn btn-phoenix-secondary btn-sm';
  done.textContent = 'Close';
  const check = document.createElement('button');
  check.type = 'button';
  check.className = 'btn btn-primary btn-sm';
  check.textContent = 'Validate cutover';
  const footer = document.createElement('div');
  footer.className = 'd-flex gap-2';
  footer.append(done, check);

  const close = open('Gateway created', wrap, footer);
  done.addEventListener('click', () => { close(); hydrate(api); });

  check.addEventListener('click', async () => {
    check.disabled = true;
    check.textContent = 'Checking…';
    try {
      const report = await api.gateways.validateCutover(created.gateway_id, {});
      result.className = 'alert alert-subtle-success fs-9 mt-2';
      result.textContent = [
        `gateway ${report.gateway_reachable ? 'reachable' : 'unreachable'}`,
        `TLS ${report.tls_valid ? 'valid' : 'invalid'}`,
        `origin ${report.origin_reachable ? 'reachable' : 'unreachable'}`,
        `status ${report.returned_status_code}`,
        `${report.total_latency_ms}ms`
      ].join(' · ');
    } catch (err) {
      result.className = 'alert alert-subtle-danger fs-9 mt-2';
      result.textContent = err.message || String(err);
    } finally {
      check.disabled = false;
      check.textContent = 'Validate cutover';
    }
  });
}

/** "org_id:email" -> [org_id, email]. Split once: an email has no colon, an org id might. */
function splitPair(arg) {
  const at = String(arg).indexOf(':');
  return at === -1 ? [arg, ''] : [String(arg).slice(0, at), String(arg).slice(at + 1)];
}

/** Which organization this host is. Org-scoped endpoints need the id; the operator
    should not have to paste it into a form to edit a member of the org they are in. */
async function orgId(api) {
  const tenant = await api.tenant();
  const id = tenant && (tenant.org_id || tenant.orgId);
  if (!id) throw new Error('Could not resolve this organization from the current host.');
  return id;
}

/* ------------------------------------------------------------------- runners */

async function runForm(api, entry, arg) {
  const form = document.createElement('form');
  form.className = 'row g-3';
  form.noValidate = true;
  /* A form that edits an existing row needs that row's current values, and the row in
     the table only carries an id. `prefill` fetches the record so the fields open
     populated — without it, saving one changed field blanks every other one. */
  const current = entry.prefill ? await entry.prefill(api, arg) : arg;
  const specs = typeof entry.fields === 'function' ? entry.fields(current) : entry.fields;
  for (const spec of specs) form.appendChild(field(spec));

  const error = document.createElement('div');
  error.className = 'alert alert-danger mt-3 mb-0 d-none fs-9';
  const note = document.createElement('div');
  note.className = 'alert alert-success mt-3 mb-0 d-none fs-9';

  const body = document.createElement('div');
  body.append(form, error, note);

  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.className = 'btn btn-phoenix-secondary btn-sm';
  cancel.textContent = 'Cancel';

  const submit = document.createElement('button');
  submit.type = 'button';
  submit.className = 'btn btn-primary btn-sm';
  submit.textContent = entry.submit || 'Save';

  const footer = document.createElement('div');
  footer.className = 'd-flex gap-2';
  footer.append(cancel);

  /* A check the operator runs *before* saving — "does this connection string work" —
     belongs beside the fields it reads, not on a second dialog they have to fill in
     twice. `aux` runs against the values already typed and reports in place; only
     `submit` closes the dialog. */
  if (entry.aux) {
    const aux = document.createElement('button');
    aux.type = 'button';
    aux.className = 'btn btn-phoenix-secondary btn-sm';
    aux.textContent = entry.aux.label;
    footer.appendChild(aux);
    aux.addEventListener('click', async () => {
      if (!form.reportValidity()) return;
      aux.disabled = true;
      aux.textContent = 'Working…';
      error.classList.add('d-none');
      note.classList.add('d-none');
      try {
        note.textContent = await entry.aux.run(api, values(form, specs));
        note.classList.remove('d-none');
      } catch (err) {
        error.textContent = explain(err);
        error.classList.remove('d-none');
      } finally {
        aux.disabled = false;
        aux.textContent = entry.aux.label;
      }
    });
  }
  footer.append(submit);

  const close = open(entry.title, body, footer);
  cancel.addEventListener('click', close);

  submit.addEventListener('click', async () => {
    if (!form.reportValidity()) return;
    submit.disabled = true;
    submit.textContent = 'Working…';
    error.classList.add('d-none');
    try {
      /* A form's run() may answer with something worth reading — which database it
         reached, how fast. Prefer that over the generic success line. */
      const message = await entry.run(api, values(form, specs), arg);
      close();
      toast(typeof message === 'string' && message ? message : (entry.success || 'Saved.'));
      if (entry.refresh !== false) hydrate(api);
    } catch (err) {
      error.textContent = explain(err);
      error.classList.remove('d-none');
    } finally {
      submit.disabled = false;
      submit.textContent = entry.submit || 'Save';
    }
  });
}

async function runDirect(api, entry, arg, trigger) {
  if (entry.confirm && !window.confirm(entry.confirm)) return;
  const label = trigger && trigger.textContent;
  if (trigger) { trigger.disabled = true; trigger.textContent = 'Working…'; }
  try {
    const message = await entry.run(api, arg);
    toast(message || entry.success || 'Done.');
    if (entry.refresh !== false) hydrate(api);
  } catch (err) {
    toast(explain(err), 'danger');
  } finally {
    if (trigger) { trigger.disabled = false; trigger.textContent = label; }
  }
}

/**
 * A one-button page header that fronts several different forms — "Connect ETL tool"
 * covers Talend and Boomi, whose configs share nothing. Rather than a union form with
 * half its fields greyed out, pick the target first, then open that entry's form.
 */
function runChoice(api, entry) {
  const body = document.createElement('div');
  body.className = 'd-grid gap-2';
  const close = () => hide();
  for (const choice of entry.choices) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn btn-phoenix-secondary text-start';
    b.innerHTML = `<strong>${choice.label}</strong>` +
      (choice.help ? `<span class="d-block fs-9 text-body-tertiary">${choice.help}</span>` : '');
    b.addEventListener('click', () => {
      close();
      const next = ACTIONS[choice.action];
      if (!next) return toast(UNSUPPORTED[choice.action] || 'Not available yet.', 'warning');
      if (next.custom) next.custom(api).catch((err) => toast(explain(err), 'danger'));
      else runForm(api, next);
    });
    body.appendChild(b);
  }
  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.className = 'btn btn-phoenix-secondary btn-sm';
  cancel.textContent = 'Cancel';
  const footer = document.createElement('div');
  footer.appendChild(cancel);
  const hide = open(entry.title, body, footer);
  cancel.addEventListener('click', () => hide());
}

/* ------------------------------------------------------------------ registry */

/**
 * One incident's root-cause analysis, and the prompt that hands it to a coding agent.
 *
 * /incidents/{id}/rca answers with the EP:rca contract — triad, causal path, probable
 * causes, remediation, verification. The prompt is assembled here rather than server
 * side: every field it needs is already in this payload, and a second endpoint that
 * only reformats it would be one more thing to keep in step.
 */
function showRca(rca) {
  const body = document.createElement('div');
  const triplet = (t) => (t ? `${t.label} — ${t.detail}` : '—');
  body.appendChild(resultLine('Incident', `${rca.title} · ${rca.sev} · ${rca.service}`));
  body.appendChild(resultLine('Summary', rca.aiSummary));
  body.appendChild(resultLine('Root cause', triplet(rca.triad && rca.triad.rootCause)));
  body.appendChild(resultLine('Critical failure', triplet(rca.triad && rca.triad.criticalFailure)));
  body.appendChild(resultLine('Impact', triplet(rca.triad && rca.triad.impact)));
  body.appendChild(resultLine('Causal path',
    (rca.causalPath || []).map((n) => `${n.name}${n.root ? ' (root)' : ''}`).join(' → ')));
  body.appendChild(resultLine('Probable causes',
    (rca.probableCauses || []).map((c) => `${c.label} ${c.confidence}%`).join(' · ')));
  body.appendChild(resultLine('Blast radius', rca.blastRadius
    ? `${rca.blastRadius.services} service(s) — ${rca.blastRadius.detail}` : '—'));
  body.appendChild(resultLine('Remediation', rca.remediation
    ? `${rca.remediation.action}${(rca.remediation.gates || []).length
        ? ` (gates: ${rca.remediation.gates.join(', ')})` : ''}` : '—'));

  const prompt = rcaPrompt(rca);
  const h = document.createElement('h6');
  h.className = 'fs-9 mb-2';
  h.textContent = 'Prompt for your coding agent';
  const pre = document.createElement('pre');
  pre.className = 'bg-body-emphasis border border-translucent rounded-3 p-3 fs-10 mb-3';
  pre.style.maxHeight = '14rem';
  pre.style.overflow = 'auto';
  pre.style.whiteSpace = 'pre-wrap';
  pre.textContent = prompt;
  body.append(h, pre);

  const copy = document.createElement('button');
  copy.type = 'button';
  copy.className = 'btn btn-phoenix-secondary btn-sm';
  copy.textContent = 'Copy prompt';
  copy.addEventListener('click', async () => {
    // navigator.clipboard needs a secure context; the textarea trick still works over
    // plain http, which is what a self-hosted deployment often is.
    try {
      await navigator.clipboard.writeText(prompt);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = prompt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    copy.textContent = 'Copied';
    setTimeout(() => { copy.textContent = 'Copy prompt'; }, 2000);
  });

  const done = document.createElement('button');
  done.type = 'button';
  done.className = 'btn btn-phoenix-secondary btn-sm';
  done.textContent = 'Close';
  const footer = document.createElement('div');
  footer.className = 'd-flex gap-2';
  footer.append(done, copy);

  const close = open('Root cause analysis', body, footer);
  done.addEventListener('click', close);
}

/** The RCA rendered as instructions an agent can act on. */
function rcaPrompt(rca) {
  const triplet = (t) => (t ? `${t.label} — ${t.detail}` : 'unknown');
  const lines = [
    `Fix incident ${rca.id}: ${rca.title} (severity ${rca.sev}) on ${rca.service}.`,
    '',
    `Summary: ${rca.aiSummary}`,
    `Root cause: ${triplet(rca.triad && rca.triad.rootCause)}`,
    `Critical failure: ${triplet(rca.triad && rca.triad.criticalFailure)}`,
    `Impact: ${triplet(rca.triad && rca.triad.impact)}`,
    `Causal path: ${(rca.causalPath || []).map((n) => n.name).join(' → ') || 'unknown'}`,
    `Probable causes: ${(rca.probableCauses || [])
      .map((c) => `${c.label} (${c.confidence}%${c.primary ? ', primary' : ''})`).join('; ') || 'unknown'}`,
    `Blast radius: ${rca.blastRadius ? `${rca.blastRadius.services} services — ${rca.blastRadius.detail}` : 'unknown'}`,
    '',
    `Proposed remediation: ${rca.remediation ? rca.remediation.action : 'none proposed'}`,
  ];
  if (rca.remediation && (rca.remediation.gates || []).length) {
    lines.push(`Do not merge until these gates pass: ${rca.remediation.gates.join(', ')}.`);
  }
  if (rca.verify) {
    lines.push('', `Verify: ${(rca.verify.checks || []).map((c) => c.label).join('; ') || 'no checks listed'}`);
    if (rca.verify.resolution) lines.push(`Resolution expected: ${rca.verify.resolution}`);
  }
  if ((rca.similar || []).length) {
    lines.push('', `Similar past incidents: ${rca.similar
      .map((s) => `${s.id} ${s.title} (${s.similarity}% match${s.documentedFix ? ', documented fix' : ''})`)
      .join('; ')}`);
  }
  if ((rca.citations || []).length) lines.push('', `Evidence: ${rca.citations.join('; ')}`);
  lines.push('', 'Return a patch with the smallest change that removes the root cause, and say which verification check proves it.');
  return lines.join('\n');
}

/* --------------------------------------------------------- saved log searches */

const SEARCH_KEY = 'lhb.savedSearches';

const readSearches = () => {
  try { return JSON.parse(localStorage.getItem(SEARCH_KEY)) || []; } catch { return []; }
};
const writeSearches = (list) => localStorage.setItem(SEARCH_KEY, JSON.stringify(list));

/** The logs filter bar, read from and written back to the page. */
const searchFilters = () => ({
  q: (document.getElementById('log-query') || {}).value || '',
  service: (document.getElementById('log-service') || {}).value || '',
  level: (document.getElementById('log-level') || {}).value || '',
});

function applyFilters(saved) {
  for (const [id, value] of [['log-query', saved.q], ['log-service', saved.service],
                             ['log-level', saved.level]]) {
    const el = document.getElementById(id);
    if (el) el.value = value || '';
  }
}

/**
 * Save the current logs filter bar, and load one back.
 *
 * Both halves live in one dialog because a save you cannot reopen is a write-only
 * feature. Loading applies the filters to the page and re-hydrates, which is exactly
 * what the Search button does.
 */
function showSavedSearches(api) {
  const body = document.createElement('div');
  const current = searchFilters();

  const describe = (f) => [f.q && `q=${f.q}`, f.service && `service=${f.service}`,
                           f.level && `level=${f.level}`].filter(Boolean).join(' · ') || 'no filters';

  const list = document.createElement('div');
  list.className = 'mb-3';
  const draw = () => {
    const saved = readSearches();
    list.innerHTML = '';
    if (!saved.length) {
      const empty = document.createElement('p');
      empty.className = 'text-body-tertiary fs-9 mb-0';
      empty.textContent = 'Nothing saved yet.';
      list.appendChild(empty);
      return;
    }
    for (const entry of saved) {
      const row = document.createElement('div');
      row.className = 'd-flex align-items-center justify-content-between border-bottom border-translucent py-2 gap-2';
      const text = document.createElement('div');
      text.className = 'fs-9';
      const heading = document.createElement('div');
      heading.className = 'fw-semibold';
      heading.textContent = entry.name;
      const detail = document.createElement('div');
      detail.className = 'text-body-tertiary fs-10 font-monospace';
      detail.textContent = describe(entry);
      text.append(heading, detail);
      const load = document.createElement('button');
      load.type = 'button';
      load.className = 'btn btn-phoenix-secondary btn-sm';
      load.textContent = 'Load';
      load.addEventListener('click', () => {
        applyFilters(entry);
        close();
        hydrate(api);
        toast(`Loaded “${entry.name}”.`);
      });
      const drop = document.createElement('button');
      drop.type = 'button';
      drop.className = 'btn btn-phoenix-danger btn-sm';
      drop.textContent = 'Delete';
      drop.addEventListener('click', () => {
        writeSearches(readSearches().filter((e) => e.name !== entry.name));
        draw();
      });
      const buttons = document.createElement('div');
      buttons.className = 'd-flex gap-2';
      buttons.append(load, drop);
      row.append(text, buttons);
      list.appendChild(row);
    }
  };
  draw();

  const heading = document.createElement('h6');
  heading.className = 'fs-9 mb-2';
  heading.textContent = 'Saved searches';
  const nameWrap = document.createElement('div');
  nameWrap.className = 'mb-2';
  const nameLabel = document.createElement('label');
  nameLabel.className = 'form-label fs-9';
  nameLabel.textContent = 'Save the current filters as';
  const name = document.createElement('input');
  name.className = 'form-control form-control-sm';
  name.placeholder = 'Checkout errors, last hour';
  nameWrap.append(nameLabel, name);
  const currently = document.createElement('div');
  currently.className = 'form-text fs-10 font-monospace';
  currently.textContent = describe(current);
  nameWrap.appendChild(currently);

  body.append(heading, list, nameWrap);

  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.className = 'btn btn-phoenix-secondary btn-sm';
  cancel.textContent = 'Close';
  const save = document.createElement('button');
  save.type = 'button';
  save.className = 'btn btn-primary btn-sm';
  save.textContent = 'Save';
  const footer = document.createElement('div');
  footer.className = 'd-flex gap-2';
  footer.append(cancel, save);

  const close = open('Saved searches', body, footer);
  cancel.addEventListener('click', close);
  save.addEventListener('click', () => {
    const label = name.value.trim();
    if (!label) { name.focus(); return; }
    // Same name replaces rather than duplicates — re-saving a tweaked search is the
    // common case, and two rows called "checkout errors" help nobody.
    writeSearches([...readSearches().filter((e) => e.name !== label), { name: label, ...current }]);
    close();
    toast(`Saved “${label}”.`);
  });
}

/** Hand the browser a file it never had to ask the server for. */
function download(filename, text, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  /* Revoking immediately can beat the download off the mark in Safari; one tick is
     enough and the object is a few MB at most. */
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Dial the connection string and describe what answered.
 *
 * The route replies 200 with a `reachable` flag rather than an error status, so a
 * refused connection has to be turned into a throw here or it reads as success.
 */
async function testDsn(api, dsn) {
  const result = await api.databases.test({ dsn });
  if (result && result.reachable === false) {
    throw new Error(result.error || (result.reasons || []).join(' ') || 'Could not connect with that string.');
  }
  const detail = [result.engine_label || result.engine, result.host,
    result.latency_ms != null ? `${result.latency_ms}ms` : null].filter(Boolean).join(' · ');
  return `Connected${detail ? ` — ${detail}` : ''}.`;
}

/* One AWS connection per tenant, configured from two pages — the orchestrator's job
 * stream and the cloud account list are both fed by these credentials, so both forms
 * are built from this one list. */
const AWS_FIELDS = (current = {}) => [
      { name: 'region', label: 'AWS region', required: true, width: 'half',
        value: current.region || 'us-east-1' },
      { name: 'auth_method', label: 'Authentication', type: 'select', width: 'half',
        options: ['default-chain', 'access-keys', 'iam-role'],
        value: current.auth_method || 'default-chain',
        help: 'default-chain uses the role the backend already runs as.' },
      { name: 'role_arn', label: 'Role ARN', width: 'half', value: current.role_arn,
        placeholder: 'arn:aws:iam::123456789012:role/loveheartbeat-read' },
      { name: 'external_id', label: 'External ID', width: 'half',
        help: 'Only for iam-role. Left blank keeps the stored one.' },
      { name: 'access_key_id', label: 'Access key ID', width: 'half',
        help: 'Only for access-keys.' },
      { name: 'secret_access_key', label: 'Secret access key', type: 'password', width: 'half' },
      { name: 'function_prefixes', label: 'Function prefixes', type: 'list',
        value: current.function_prefixes,
        help: 'Comma separated. Empty collects every function the role can see.' },
      { name: 'log_groups', label: 'Log groups', type: 'list', value: current.log_groups },
      { name: 'collection_interval_seconds', label: 'Collect every (seconds)', type: 'number',
        width: 'half', value: current.collection_interval_seconds || 300 },
      { name: 'error_rate_threshold', label: 'Error rate alert (%)', type: 'number', step: 'any',
        width: 'half', value: current.error_rate_threshold ?? 5 },
      { name: 'duration_ms_threshold', label: 'Duration alert (ms)', type: 'number', step: 'any',
        width: 'half', value: current.duration_ms_threshold ?? 1000 },
      { name: 'throttle_threshold', label: 'Throttle alert (count)', type: 'number',
        width: 'half', value: current.throttle_threshold ?? 1 },
    ];

export const ACTIONS = {
  /* --- alert clustering + coding-agent handoff ---------------------------- */

  /**
   * The brief the backend assembles for a coding agent: facts, deduplicated logs,
   * and a ready-to-send prompt. Nothing is dispatched from here — the prompt is
   * copied and pasted into whichever agent you run.
   */
  /**
   * The brief the backend assembles for a coding agent: facts, deduplicated logs,
   * and a ready-to-send prompt. Nothing is dispatched from here — the prompt is
   * copied and pasted into whichever agent you run.
   */
  clusterBrief: {
    title: 'Agent brief',
    custom: async (api, arg) => showBrief(await api.alerts.brief(arg)),
  },

  /**
   * "Root cause" on a correlated incident: the EP:rca output plus the agent prompt.
   *
   * The correlation table had no way through to /incidents/{id}/rca — the analysis was
   * computed on every read and never shown. This is the row action that opens it.
   */
  incidentRca: {
    title: 'Root cause analysis',
    custom: async (api, id) => showRca(await api.rca.forIncident(id)),
  },

  /**
   * The same brief for an *agent* incident cluster, plus the handoff the alert side
   * has no endpoint for: /dispatch hands the brief to the configured coding agent and
   * returns a job to follow, so this dialog can send rather than only copy.
   */
  agentIncidentBrief: {
    title: 'Coding-agent brief',
    custom: async (api, arg) => showBrief(await api.agents.clusterBrief(arg), {
      title: 'Coding-agent brief',
      /* History is fetched with the brief: a cluster already handed over should say so
         before someone dispatches it a second time. */
      history: () => api.agents.dispatches().then(
        (all) => (all || []).filter((d) => d.cluster_id === arg)).catch(() => []),
      dispatch: () => api.agents.dispatchCluster(arg, {}),
    }),
  },

  /* --- observability writes that have an endpoint today ------------------- */

  routingRule: {
    title: 'New routing rule',
    submit: 'Create rule',
    success: 'Routing rule created.',
    fields: [
      { name: 'name', label: 'Rule name', required: true, width: 'half' },
      { name: 'team', label: 'Team', required: true, width: 'half',
        help: 'Who this rule pages.' },
      { name: 'severity', label: 'Severity', type: 'select', width: 'half',
        options: ['', 'critical', 'warning', 'info'] },
      { name: 'category', label: 'Category', width: 'half',
        placeholder: 'Leave blank to match any' },
      { name: 'source', label: 'Source', width: 'half',
        placeholder: 'Leave blank to match any' },
      { name: 'assignee', label: 'Assignee', width: 'half' },
      { name: 'escalation_minutes', label: 'Escalate after (minutes)', type: 'number',
        value: 15, width: 'half' },
      { name: 'priority', label: 'Priority', type: 'number', value: 1, width: 'half',
        help: 'Lower numbers are evaluated first.' },
      { name: 'notification_channels', label: 'Notification channels', type: 'icons',
        options: CHANNELS },
      { name: 'enabled', label: 'Enabled', type: 'checkbox' },
    ],
    run: (api, body) => api.alertManagement.createRoutingRule(body),
  },

  automationRule: {
    title: 'New automation rule',
    submit: 'Create rule',
    success: 'Automation rule created.',
    fields: [
      { name: 'name', label: 'Rule name', required: true, width: 'half' },
      { name: 'category', label: 'Category', value: 'Infrastructure', width: 'half' },
      { name: 'trigger', label: 'Trigger', placeholder: 'When p99 latency exceeds 2s for 5m' },
      { name: 'action', label: 'Action', placeholder: 'Scale the service to 6 replicas' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'ai_driven', label: 'AI-driven', type: 'checkbox', value: false },
      { name: 'enabled', label: 'Enabled', type: 'checkbox' },
    ],
    run: (api, body) => api.automation.createRule(body),
  },

  addDatabase: {
    title: 'Add database',
    submit: 'Register',
    success: 'Database registered.',
    fields: [
      { name: 'name', label: 'Display name', required: true },
      { name: 'dsn', label: 'Connection string', required: true,
        placeholder: 'postgresql://user:pass@host:5432/dbname',
        help: 'Stored server-side; never returned by the API once saved.' },
    ],
    aux: { label: 'Test connection', run: (api, body) => testDsn(api, body.dsn) },
    run: (api, body) => api.databases.add(body),
  },

  connectTalend: {
    title: 'Connect Talend',
    submit: 'Save configuration',
    success: 'Talend configured — monitoring started.',
    /* Reopening the form shows what is already saved. GET returns the non-secret
       fields only, so the token box stays empty and an unchanged save does not
       overwrite a server-held credential with a blank. */
    prefill: (api) => api.etl.config('talend').then((s) => (s && s.fields) || {}).catch(() => ({})),
    fields: (current = {}) => [
      { name: 'base_url', label: 'API base URL', width: 'half',
        value: current.base_url || 'https://api.us.cloud.talend.com' },
      { name: 'environment_id', label: 'Environment ID', width: 'half',
        value: current.environment_id },
      { name: 'workspace_id', label: 'Workspace ID', width: 'half',
        value: current.workspace_id },
      { name: 'last_days', label: 'Look back (days)', value: current.last_days || '1', width: 'half' },
      { name: 'bearer_token', label: 'Bearer token', type: 'password',
        help: 'Optional here — the backend can supply it from its secret store instead.' },
    ],
    run: (api, body) => api.etl.saveConfig('talend', body),
  },

  connectBoomi: {
    title: 'Connect Boomi',
    submit: 'Save configuration',
    success: 'Boomi configured — monitoring started.',
    prefill: (api) => api.etl.config('boomi').then((s) => (s && s.fields) || {}).catch(() => ({})),
    fields: (current = {}) => [
      { name: 'account_id', label: 'Account ID', required: true, width: 'half',
        value: current.account_id },
      { name: 'username', label: 'Username', required: true, width: 'half',
        value: current.username },
      { name: 'token', label: 'API token', type: 'password', required: true },
      { name: 'base_url', label: 'API base URL',
        value: current.base_url || 'https://api.boomi.com/api/rest/v1' },
      { name: 'atom_id', label: 'Atom ID', width: 'half', value: current.atom_id },
      { name: 'environment_id', label: 'Environment ID', width: 'half',
        value: current.environment_id },
      { name: 'hours_back', label: 'Look back (hours)', type: 'number',
        value: current.hours_back || 24, width: 'half' },
    ],
    run: (api, body) => api.etl.saveConfig('boomi', body),
  },

  /**
   * "Export traces" saves every stored trace, spans included.
   *
   * There is no server-side export endpoint, and none is needed: /observability/traces
   * lists the traces and /observability/traces/{id} returns each one's spans, so the
   * file is assembled from the two reads the page already makes and handed to the
   * browser. JSON rather than CSV — a span tree does not flatten into rows without
   * losing the parentage that makes it a trace.
   */
  exportTraces: {
    title: 'Export traces',
    direct: true,
    refresh: false,
    run: async (api) => {
      const traces = await api.observability.traces({ limit: 200 });
      if (!(traces || []).length) {
        throw new Error('No traces stored yet — send an agent telemetry batch first.');
      }
      /* ponytail: spans are fetched 8 at a time. /traces/{id} has no bulk form, and 200
         parallel GETs is how you get rate-limited by your own gateway. Raise the width,
         or add a bulk endpoint, if exports start feeling slow. */
      const detailed = [];
      for (let i = 0; i < traces.length; i += 8) {
        detailed.push(...await Promise.all(traces.slice(i, i + 8).map(async (t) => ({
          ...t,
          spans: await api.observability.trace(t.trace_id).catch(() => []),
        }))));
      }
      const spans = detailed.reduce((n, t) => n + t.spans.length, 0);
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '-');
      download(`traces-${stamp}.json`,
        JSON.stringify({ exported_at: new Date().toISOString(), traces: detailed }, null, 2));
      return `Exported ${detailed.length} trace(s) — ${spans} span(s).`;
    },
  },

  /**
   * "Run scan" scans the tables the page is already watching.
   *
   * /data-observability/scan validates `tables` as 1–50 names rather than defaulting to
   * everything the tenant owns, so a bodyless POST is a 422 before it reaches Databricks.
   * The names are resolved the same way live-data.js resolves them for the table below —
   * first catalog, its tables — so the button scans what the operator can see.
   */
  runScan: {
    title: 'Run data quality scan',
    direct: true,
    success: 'Scan complete.',
    run: async (api) => {
      const catalogs = await api.databricks.catalogs();
      const catalog = (catalogs || [])[0];
      const tables = catalog ? await api.dataObservability.tables({ catalog }) : [];
      const names = (tables || []).map((t) => t.full_name || t.name).filter(Boolean).slice(0, 50);
      if (!names.length) {
        throw new Error('No tables to scan — connect Databricks and load a catalog first.');
      }
      const results = await api.dataObservability.scan({ tables: names });
      const findings = (results || []).reduce((n, r) => n + (r.findings || []).length, 0);
      return `Scanned ${(results || []).length} table(s) — ${findings} finding(s).`;
    },
  },

  recorrelate: {
    title: 'Recorrelate',
    direct: true,
    // Correlation is computed per request, so re-reading the tables is the recorrelate.
    run: async (api) => { await hydrate(api); return 'Recorrelated.'; },
    refresh: false,
  },

  runHealthChecks: {
    title: 'Run all checks',
    direct: true,
    run: async (api) => {
      const [core, store] = await Promise.all([api.health(), api.storeHealth()]);
      const ok = (core && core.status === 'ok') && (store && store.status !== 'error');
      return ok ? 'All checks passed.' : 'Checks completed with warnings — see the panels.';
    },
  },

  connectEtl: {
    title: 'Connect ETL tool',
    choices: [
      { label: 'Talend', action: 'connectTalend', help: 'Talend Cloud — environment or workspace scope.' },
      { label: 'Boomi', action: 'connectBoomi', help: 'AtomSphere account, username and API token.' },
      { label: 'Databricks', action: 'connectDatabricks', help: 'Shared with Data Observability.' },
    ],
  },

  connectDatabricks: {
    title: 'Connect Databricks',
    submit: 'Save configuration',
    success: 'Databricks configured.',
    fields: [
      { name: 'host', label: 'Workspace host', required: true,
        placeholder: 'https://dbc-1234.cloud.databricks.com' },
      { name: 'warehouse_id', label: 'SQL warehouse ID', required: true, width: 'half' },
      { name: 'token', label: 'Personal access token', type: 'password', width: 'half',
        help: 'Optional — the backend can read it from Secrets Manager instead.' },
    ],
    run: (api, body) => api.databricks.saveConfig(body),
  },

  /**
   * Gateway configs are provider-shaped: the backend validates `fields` against its
   * catalog rather than a fixed model, so the form is built from that catalog instead
   * of being hardcoded here. One entry covers every provider it ever adds.
   */
  connectGateway: {
    title: 'Connect gateway',
    custom: async (api) => {
      const catalog = await api.gateways.catalog();
      const providers = Array.isArray(catalog) ? catalog : (catalog.providers || []);
      if (!providers.length) throw new Error('The gateway catalog is empty.');

      const body = document.createElement('div');
      const picker = document.createElement('div');
      picker.className = 'row g-3 mb-3';
      picker.appendChild(field({
        name: 'provider', label: 'Provider', type: 'select',
        options: providers.map((p) => ({ value: p.id || p.provider || p, label: p.name || p.id || p })),
      }));
      const fieldsWrap = document.createElement('form');
      fieldsWrap.className = 'row g-3';
      fieldsWrap.noValidate = true;
      const error = document.createElement('div');
      error.className = 'alert alert-danger mt-3 mb-0 d-none fs-9';
      body.append(picker, fieldsWrap, error);

      const select = picker.querySelector('select');
      let specs = [];
      const draw = () => {
        const chosen = providers.find((p) => (p.id || p.provider || p) === select.value) || {};
        specs = (chosen.fields || []).map((f) => ({
          name: f.name || f.key || f,
          label: f.label || f.name || f.key || f,
          type: f.secret ? 'password' : (f.type === 'number' ? 'number' : 'text'),
          placeholder: f.placeholder,
          required: f.required !== false,
          help: f.help,
        }));
        fieldsWrap.replaceChildren(...specs.map(field));
      };
      select.addEventListener('change', draw);
      draw();

      const cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.className = 'btn btn-phoenix-secondary btn-sm';
      cancel.textContent = 'Cancel';
      const submit = document.createElement('button');
      submit.type = 'button';
      submit.className = 'btn btn-primary btn-sm';
      submit.textContent = 'Connect';
      const footer = document.createElement('div');
      footer.className = 'd-flex gap-2';
      footer.append(cancel, submit);

      const close = open('Connect gateway', body, footer);
      cancel.addEventListener('click', close);
      submit.addEventListener('click', async () => {
        if (!fieldsWrap.reportValidity()) return;
        submit.disabled = true;
        error.classList.add('d-none');
        try {
          await api.gateways.saveConfig({ provider: select.value, fields: values(fieldsWrap, specs) });
          close();
          toast('Gateway connected.');
          hydrate(api);
        } catch (err) {
          error.textContent = explain(err);
          error.classList.remove('d-none');
        } finally {
          submit.disabled = false;
        }
      });
    },
  },

  /**
   * Onboard a customer-hosted gateway.
   *
   * The other half of `connectGateway`: that one scrapes a gateway the customer already
   * runs, this one puts *ours* in front of their API. Two steps in one dialog, because
   * the enrollment token is minted by the first call and is the only thing the second
   * step needs — sending them to a different screen to find it loses the token, which
   * is one-time and expires in 24h.
   */
  onboardGateway: {
    title: 'Install our gateway',
    custom: async (api) => {
      const form = document.createElement('form');
      form.className = 'row g-3';
      form.noValidate = true;
      const specs = [
        { name: 'name', label: 'Gateway name', required: true, width: 'half',
          placeholder: 'Production API' },
        { name: 'deployment_type', label: 'Where it runs', type: 'select', width: 'half',
          options: ['kubernetes', 'docker', 'aws', 'azure'] },
        { name: 'public_hostname', label: 'Public API hostname', required: true,
          placeholder: 'api.customer.com',
          help: 'The hostname your callers already use. It does not change — only what sits behind it.' },
        { name: 'scheme', label: 'Origin scheme', type: 'select', width: 'half',
          options: ['https', 'http'] },
        { name: 'port', label: 'Origin port', type: 'number', width: 'half', value: 443 },
        { name: 'hostname', label: 'Origin hostname', required: true,
          placeholder: 'internal-alb-123.us-east-1.elb.amazonaws.com',
          help: 'Where the gateway forwards to. Must differ from the public hostname.' },
        { name: 'host_header', label: 'Host header sent to the origin', width: 'half',
          help: 'Defaults to the public hostname.' },
      ];
      for (const spec of specs) form.appendChild(field(spec));

      const error = document.createElement('div');
      error.className = 'alert alert-danger mt-3 mb-0 d-none fs-9';
      const body = document.createElement('div');
      body.append(form, error);

      const cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.className = 'btn btn-phoenix-secondary btn-sm';
      cancel.textContent = 'Cancel';
      const submit = document.createElement('button');
      submit.type = 'button';
      submit.className = 'btn btn-primary btn-sm';
      submit.textContent = 'Create gateway';
      const footer = document.createElement('div');
      footer.className = 'd-flex gap-2';
      footer.append(cancel, submit);

      const close = open('Install our gateway', body, footer);
      cancel.addEventListener('click', close);

      submit.addEventListener('click', async () => {
        if (!form.reportValidity()) return;
        submit.disabled = true;
        submit.textContent = 'Working…';
        error.classList.add('d-none');
        try {
          const v = values(form, specs);
          const created = await api.gateways.createCustomer({
            name: v.name,
            public_hostname: v.public_hostname,
            deployment_type: v.deployment_type,
            origin: {
              scheme: v.scheme,
              hostname: v.hostname,
              port: v.port,
              host_header: v.host_header
            }
          });
          close();
          showEnrollment(api, created);
        } catch (err) {
          error.textContent = explain(err);
          error.classList.remove('d-none');
        } finally {
          submit.disabled = false;
          submit.textContent = 'Create gateway';
        }
      });
    },
  },

  addIntegration: {
    title: 'Add integration',
    choices: [
      { label: 'API gateway', action: 'connectGateway', help: 'Kong, Apigee, AWS API Gateway and friends.' },
      { label: 'Install our gateway', action: 'onboardGateway', help: 'Run APISIX in front of your API and report from it.' },
      { label: 'ETL tool', action: 'connectEtl', help: 'Talend, Boomi or Databricks.' },
      { label: 'Database', action: 'addDatabase', help: 'Register by connection string.' },
      { label: 'AWS account', action: 'connectAwsAccount', help: 'Lambda and CloudWatch collection.' },
      { label: 'AI tool agent', action: 'connectAiTool', help: 'Registers the agent that pushes AI telemetry, and mints its key.' },
    ],
  },

  inviteMember: {
    title: 'Invite member',
    submit: 'Send invite',
    success: 'Invite created.',
    fields: [
      { name: 'email', label: 'Email', type: 'email', required: true, width: 'half' },
      { name: 'role', label: 'Role', type: 'select', width: 'half',
        options: ['user', 'org_admin'] },
    ],
    // The invite endpoint is org-scoped; /tenant resolves which org this host belongs to
    // so the caller does not have to paste an org id into the form.
    run: async (api, body) => {
      const tenant = await api.tenant();
      const orgId = tenant && (tenant.org_id || tenant.orgId);
      if (!orgId) throw new Error('Could not resolve this organization from the current host.');
      return api.admin.invite(orgId, body);
    },
  },

  changePassword: {
    title: 'Change password',
    submit: 'Change password',
    success: 'Password changed.',
    refresh: false,
    fields: [
      { name: 'old_password', label: 'Current password', type: 'password', required: true },
      { name: 'new_password', label: 'New password', type: 'password', required: true },
      { name: 'confirm', label: 'Confirm new password', type: 'password', required: true },
    ],
    /* The confirm box is checked here and never sent: the API has no use for it, and a
       mistyped confirmation should say so before it costs a round trip. */
    run: async (api, body) => {
      if (body.new_password !== body.confirm) throw new Error('The new passwords do not match.');
      await api.auth.changePassword({
        old_password: body.old_password,
        new_password: body.new_password,
      });
      return 'Password changed.';
    },
  },

  /**
   * Hand the organization to another of its members.
   *
   * The new owner has to be someone already in the organization — the endpoint refuses
   * anyone else, because an organization owned by an address that cannot sign in is an
   * organization nobody can administer. The list is fetched so the choice is a pick,
   * not a retyped address with a typo in it.
   */
  transferOwnership: {
    title: 'Transfer ownership',
    submit: 'Transfer',
    success: 'Ownership transferred.',
    prefill: async (api) => {
      const org = await api.admin.myOrganization();
      const members = await api.admin.organizationUsers(org.org_id || org.id).catch(() => []);
      return { org, members };
    },
    fields: ({ org, members } = {}) => {
      const owner = (org && org.owner_email || '').toLowerCase();
      const others = (members || [])
        .map((m) => m.email)
        .filter((email) => email && email.toLowerCase() !== owner);
      return others.length
        ? [{ name: 'new_owner_email', label: 'New owner', type: 'select', required: true,
             options: others,
             help: 'They become an admin and the owner. You keep your admin access.' }]
        : [{ name: 'new_owner_email', label: 'New owner', required: true,
             placeholder: 'them@company.com',
             help: 'Nobody else has joined yet — invite them first, then transfer.' }];
    },
    run: async (api, body, _arg) => {
      const org = await api.admin.myOrganization();
      await api.admin.transferOwnership(org.org_id || org.id, body);
      return `${body.new_owner_email} now owns ${org.name || 'this organization'}.`;
    },
  },

  adminCreateOrganization: {
    title: 'Create organization',
    submit: 'Create',
    success: 'Organization created.',
    fields: [
      { name: 'name', label: 'Organization name', required: true, width: 'half' },
      { name: 'slug', label: 'Slug', required: true, width: 'half' },
      { name: 'plan', label: 'Plan', type: 'select', width: 'half',
        options: ['trial', 'business', 'enterprise'] },
      { name: 'admin_email', label: 'Admin email', type: 'email', width: 'half' },
    ],
    run: (api, body) => api.admin.createOrganization(body),
  },

  /**
   * Re-read every live table on the page.
   *
   * These tables load once on page load. Route traffic and traces are derived from
   * spans as they arrive, so the useful question after sending a telemetry batch is
   * "did it land?" — which otherwise needs a full page reload.
   */
  refreshData: {
    direct: true,
    refresh: false,
    run: async (api) => {
      await hydrate(api);
      return 'Refreshed.';
    },
  },

  /* --- spend budgets ------------------------------------------------------ */

  /**
   * The two budget buttons are one form with the scope pinned.
   *
   * A budget is keyed by (scope, target), so setting the same target twice corrects the
   * number instead of stacking a second ceiling on it — which is what an operator
   * pressing this a second time means.
   */
  addBudget: {
    title: 'Cloud budget',
    submit: 'Save budget',
    success: 'Budget saved.',
    fields: [
      { name: 'target', label: 'Account or provider', width: 'half', value: '*',
        help: 'Leave * to cover every account without a budget of its own.' },
      { name: 'name', label: 'Label', width: 'half', placeholder: 'Production AWS' },
      { name: 'monthly_limit', label: 'Monthly limit', type: 'number', step: 'any',
        required: true, width: 'half' },
      { name: 'currency', label: 'Currency', width: 'half', value: 'USD' },
    ],
    run: (api, body) => api.finops.saveBudget({ ...body, scope: 'cloud' }),
  },

  setAiBudget: {
    title: 'AI budget',
    submit: 'Save budget',
    success: 'Budget saved.',
    fields: [
      { name: 'target', label: 'Tool or model', width: 'half', value: '*',
        help: 'Match the name in the table, or leave * for every AI tool.' },
      { name: 'name', label: 'Label', width: 'half', placeholder: 'Support copilot' },
      { name: 'monthly_limit', label: 'Monthly limit', type: 'number', step: 'any',
        required: true, width: 'half' },
      { name: 'currency', label: 'Currency', width: 'half', value: 'USD' },
    ],
    run: (api, body) => api.finops.saveBudget({ ...body, scope: 'ai' }),
  },

  deleteBudget: {
    direct: true,
    confirm: 'Remove this budget? Spend keeps being reported, it just stops being compared.',
    run: async (api, id) => { await api.finops.deleteBudget(id); return 'Budget removed.'; },
  },

  /* --- custom AI models --------------------------------------------------- */

  /**
   * Declare a model the platform cannot see on its own.
   *
   * Rows on this page are derived from reported inferences, so a model that is deployed
   * but not yet instrumented looks exactly like one nobody set up. Registering puts the
   * row there immediately, awaiting data.
   */
  registerModel: {
    title: 'Register model',
    submit: 'Register',
    success: 'Model registered — its row appears until inferences arrive.',
    fields: [
      { name: 'model', label: 'Model id', required: true, width: 'half',
        placeholder: 'fraud-classifier-v3',
        help: 'Must match the `model` field your inferences report.' },
      { name: 'name', label: 'Display name', width: 'half' },
      { name: 'provider', label: 'Provider', width: 'half', value: 'self-hosted' },
      { name: 'task', label: 'Task', width: 'half', placeholder: 'classification' },
      { name: 'version', label: 'Version', width: 'half', placeholder: 'v3.1.0' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    run: (api, body) => api.aiModels.register(body),
  },

  unregisterModel: {
    direct: true,
    confirm: 'Stop declaring this model? Recorded inferences are kept.',
    run: async (api, model) => { await api.aiModels.unregister(model); return 'Model unregistered.'; },
  },

  /* --- cloud monitoring: the same AWS credentials, reached from the cloud page --- */

  /**
   * "Connect AWS account" on Cloud Monitoring.
   *
   * There is one AWS connection per tenant — /integrations/aws/lambda/config — and both
   * pages configure it, so this shares the orchestrator's fields rather than opening a
   * second, competing form that would overwrite whatever the other one saved.
   */
  connectAwsAccount: {
    title: 'Connect AWS account',
    submit: 'Save connection',
    success: 'AWS connected — inventory and anomalies appear on the next sweep.',
    prefill: (api) => api.awsLambda.config().then((s) => (s && s.fields) || {}).catch(() => ({})),
    fields: (current = {}) => AWS_FIELDS(current),
    run: (api, body) => api.awsLambda.saveConfig(body),
  },

  /**
   * "Save search" keeps the logs filter bar's current state under a name.
   *
   * ponytail: localStorage, not an endpoint — a saved search is three strings and no
   * backend route exists for them. Move it to a record_store stream when someone needs
   * the same searches on a second machine.
   */
  saveSearch: {
    title: 'Saved searches',
    custom: async (api) => showSavedSearches(api),
  },


  /* --- database monitoring ------------------------------------------------ */

  /**
   * Probe a connection string without saving it.
   *
   * Registering a database that cannot be reached produces a row that reports
   * "unknown" forever, and nothing in the UI says why. The backend's /databases/test
   * route exists for exactly this, and had no caller.
   */
  /* --- AI monitoring: register the agent that reports a tool ------------- */

  /**
   * "Connect AI tool" registers a collector agent and mints its key.
   *
   * The AI monitoring tables are fed by `POST /observability/agents/telemetry`, which
   * only accepts calls carrying an agent key — so connecting a tool means registering
   * the agent that will push for it. The key is returned exactly once by the create
   * call, which is why this ends in a dialog rather than a toast.
   */
  connectAiTool: {
    title: 'Connect AI tool',
    custom: (api) => formThen('Connect AI tool', [
      { name: 'name', label: 'Tool or agent name', required: true, width: 'half',
        placeholder: 'Support copilot' },
      { name: 'agent_type', label: 'Type', type: 'select', width: 'half',
        options: ['AI Agent', 'Monitoring Agent', 'ETL Agent'] },
      { name: 'environment', label: 'Environment', type: 'select', width: 'half',
        options: ['Production', 'Staging', 'Development'] },
      { name: 'description', label: 'Description', width: 'half' },
      { name: 'endpoints', label: 'Endpoints', type: 'list',
        help: 'Comma separated. The URLs this tool calls, for per-endpoint breakdowns.' },
      { name: 'capabilities', label: 'Capabilities', type: 'list',
        help: 'Comma separated, e.g. chat, embeddings, rerank.' },
    ], 'Register agent', async (body) => {
      const created = await api.automation.createAgent(body);
      return showAgentKey(api, created);
    }),
  },

  /* --- ETL: test and poll the connectors already configured -------------- */

  testEtlConfig: {
    direct: true,
    run: async (api, platform) => {
      const result = await api.etl.testConfig(platform);
      return (result && result.message) || `${platform} connection verified.`;
    },
  },

  pollEtl: {
    direct: true,
    run: async (api, platform) => {
      const result = await api.etl.poll(platform);
      const count = result && (result.executions ?? result.count ?? (result.events || []).length);
      return count === undefined ? `${platform} polled.` : `${platform} polled — ${count} execution(s) pulled.`;
    },
  },

  /* --- AI models: the thresholds every status badge is derived from ------- */

  /**
   * The keys are fixed by the backend, which rejects anything it does not know rather
   * than silently storing a typo — so the form names them rather than offering a
   * free-text key/value editor that could only ever produce a 400.
   */
  editThresholds: {
    title: 'Model thresholds',
    submit: 'Save thresholds',
    success: 'Thresholds saved.',
    prefill: (api) => api.aiModels.thresholds(),
    fields: (current = {}) => [
      { name: 'error_rate_warn', label: 'Error rate — warn', type: 'number', step: 'any', width: 'half',
        value: current.error_rate_warn, help: 'Fraction, e.g. 0.02 for 2%.' },
      { name: 'error_rate_crit', label: 'Error rate — critical', type: 'number', step: 'any', width: 'half',
        value: current.error_rate_crit },
      { name: 'p95_latency_ms_warn', label: 'p95 latency warn (ms)', type: 'number', width: 'half',
        value: current.p95_latency_ms_warn },
      { name: 'p95_latency_ms_crit', label: 'p95 latency critical (ms)', type: 'number', width: 'half',
        value: current.p95_latency_ms_crit },
      { name: 'drift_warn', label: 'Drift — warn', type: 'number', step: 'any', width: 'half',
        value: current.drift_warn, help: 'PSI bands by convention: 0.10 warn, 0.25 critical.' },
      { name: 'drift_crit', label: 'Drift — critical', type: 'number', step: 'any', width: 'half',
        value: current.drift_crit },
      { name: 'accuracy_warn', label: 'Accuracy — warn', type: 'number', step: 'any', width: 'half',
        value: current.accuracy_warn },
      { name: 'accuracy_crit', label: 'Accuracy — critical', type: 'number', step: 'any', width: 'half',
        value: current.accuracy_crit },
    ],
    run: (api, body) => api.aiModels.saveThresholds({ thresholds: body }),
  },

  /* --- platform admin: organizations, users, approvals ------------------- */

  /**
   * Edit an organization.
   *
   * `fields` is a function so the form can be prefilled from the row the operator
   * clicked; without that, saving a plan change would blank the name.
   */
  editOrganization: {
    title: 'Edit organization',
    submit: 'Save',
    success: 'Organization updated.',
    prefill: (api, id) => api.admin.organization(id),
    fields: (current = {}) => [
      { name: 'name', label: 'Organization name', required: true, width: 'half',
        value: current.name },
      { name: 'plan', label: 'Plan', type: 'select', width: 'half',
        options: ['trial', 'business', 'enterprise'], value: current.plan },
      { name: 'status', label: 'Status', type: 'select', width: 'half',
        options: ['active', 'suspended'], value: current.status },
    ],
    run: (api, body, id) => api.admin.updateOrganization(id, body),
  },

  deleteOrganization: {
    direct: true,
    confirm: 'Delete this organization? Its users and connectors go with it.',
    run: async (api, id) => { await api.admin.deleteOrganization(id); return 'Organization deleted.'; },
  },

  adminCreateUser: {
    title: 'Create user',
    submit: 'Create',
    success: 'User created.',
    fields: [
      { name: 'email', label: 'Email', type: 'email', required: true, width: 'half' },
      { name: 'name', label: 'Name', width: 'half' },
      { name: 'role', label: 'Role', type: 'select', width: 'half',
        options: ['user', 'org_admin', 'platform_admin'] },
      { name: 'org_id', label: 'Organization id', width: 'half',
        help: 'Leave empty for a user with no organization.' },
      { name: 'password', label: 'Temporary password', type: 'password', required: true },
    ],
    run: (api, body) => api.admin.createUser(body),
  },

  editAdminUser: {
    title: 'Edit user',
    submit: 'Save',
    success: 'User updated.',
    prefill: (api, email) => api.admin.user(email),
    fields: (current = {}) => [
      /* `roles[0]`, not `role`: the serializer's `role` is a display label ("member"),
         which matches no option and would open the select blank — then saving would
         send an empty role. `roles` carries the value the API expects. */
      { name: 'role', label: 'Role', type: 'select', width: 'half',
        options: ['user', 'org_admin', 'platform_admin'],
        value: (current.roles || [])[0] || current.role },
      { name: 'status', label: 'Status', type: 'select', width: 'half',
        options: ['active', 'pending_admin', 'suspended'], value: current.status },
      { name: 'org_id', label: 'Organization id', value: current.org_id || current.orgId },
    ],
    run: (api, body, email) => api.admin.updateUser(email, body),
  },

  approveUser: {
    direct: true,
    run: async (api, email) => { await api.admin.approveUser(email); return `${email} approved.`; },
  },

  denyUser: {
    direct: true,
    confirm: 'Deny this account? They will not be able to sign in.',
    run: async (api, email) => { await api.admin.denyUser(email); return `${email} denied.`; },
  },

  /* Join requests are org-scoped, so the row packs "org_id:email" into the one arg a
     row button carries. Split on the first colon only — an email cannot contain one,
     but an org id could. */
  approveJoinRequest: {
    direct: true,
    run: async (api, arg) => {
      const [orgId, email] = splitPair(arg);
      await api.admin.decideJoinRequest(orgId, email, { action: 'approve' });
      return `${email} approved for ${orgId}.`;
    },
  },

  denyJoinRequest: {
    direct: true,
    confirm: 'Deny this request?',
    run: async (api, arg) => {
      const [orgId, email] = splitPair(arg);
      await api.admin.decideJoinRequest(orgId, email, { action: 'deny' });
      return `${email} denied.`;
    },
  },

  /* --- organization members (org-scoped, resolved from /tenant) ----------- */

  editMember: {
    title: 'Edit member',
    submit: 'Save',
    success: 'Member updated.',
    fields: [
      { name: 'role', label: 'Role', type: 'select', width: 'half',
        options: ['user', 'org_admin'] },
      { name: 'status', label: 'Status', type: 'select', width: 'half',
        options: ['active', 'suspended'] },
    ],
    run: async (api, body, email) => api.admin.updateOrganizationUser(await orgId(api), email, body),
  },

  removeMember: {
    direct: true,
    confirm: 'Remove this member from the organization?',
    run: async (api, email) => {
      await api.admin.removeOrganizationUser(await orgId(api), email);
      return `${email} removed.`;
    },
  },

  /* --- per-row actions on the live tables -------------------------------- */

  runAutomationRule: {
    direct: true,
    run: async (api, id) => {
      const result = await api.automation.runRule(id);
      return (result && (result.message || result.status)) || 'Rule run queued.';
    },
  },

  testRoutingRule: {
    direct: true,
    run: async (api, id) => {
      const result = await api.alertManagement.testRoutingRule(id, {});
      const matched = result && (result.matched ?? result.matches);
      return matched === undefined
        ? 'Rule tested.'
        : `Rule matches ${matched} of the recent alerts.`;
    },
  },

  /* The two halves of /automation/insights/{id}/{decision}. */
  approveInsight: {
    direct: true,
    confirm: 'Approve this proposal? The automation engine will carry it out.',
    run: async (api, id) => {
      await api.automation.decideInsight(id, 'approve');
      return 'Approved — the automation engine will carry it out.';
    },
  },

  rejectInsight: {
    direct: true,
    run: async (api, id) => {
      await api.automation.decideInsight(id, 'reject');
      return 'Rejected.';
    },
  },

  disconnectDatabricks: {
    direct: true,
    confirm: 'Disconnect Databricks? Data Observability and the ETL connector both stop collecting.',
    run: async (api) => { await api.databricks.deleteConfig(); return 'Databricks disconnected.'; },
  },

  /** Run the console's SQL and draw the result set under it. */
  runDatabricksQuery: {
    custom: async (api) => {
      const input = document.getElementById('dbx-query');
      const host = document.querySelector('[data-lhb-query-results]');
      if (!input || !host) throw new Error('The query console is not on this page.');
      const statement = input.value.trim();
      if (!statement) throw new Error('Enter a query first.');

      host.textContent = 'Running…';
      const result = await api.databricks.query({ statement });
      const columns = result.columns || result.schema || [];
      const rows = result.rows || result.data || [];
      if (!rows.length) {
        host.textContent = 'No rows.';
        return;
      }

      const table = document.createElement('table');
      table.className = 'table table-sm fs-10 mb-0';
      const head = table.createTHead().insertRow();
      for (const col of columns) {
        const th = document.createElement('th');
        th.className = 'text-uppercase';
        th.textContent = typeof col === 'string' ? col : col.name;
        head.appendChild(th);
      }
      const body = table.createTBody();
      for (const row of rows.slice(0, 100)) {
        const tr = body.insertRow();
        const cells = Array.isArray(row) ? row : columns.map((c) => row[typeof c === 'string' ? c : c.name]);
        for (const cell of cells) tr.insertCell().textContent = cell == null ? '—' : String(cell);
      }
      host.replaceChildren(table);
    },
  },

  retrainModel: {
    direct: true,
    run: async (api, id) => {
      const result = await api.automation.retrainModel(id);
      return (result && result.message) || 'Retraining queued.';
    },
  },

  rotateAgentKey: {
    direct: true,
    confirm: 'Rotate this agent\'s key? The agent stops reporting until it is restarted with the new one.',
    run: async (api, id) => {
      const result = await api.automation.rotateAgentKey(id);
      return result && result.key
        ? 'Key rotated — copy it from the agent install page before leaving.'
        : 'Key rotated.';
    },
  },

  startMaintenanceWindow: {
    direct: true,
    run: async (api, id) => {
      await api.alertManagement.maintenanceWindowAction(id, 'start');
      return 'Window started — matching alerts are suppressed.';
    },
  },

  endMaintenanceWindow: {
    direct: true,
    confirm: 'End this window now? Suppressed alerts resume routing immediately.',
    run: async (api, id) => {
      await api.alertManagement.maintenanceWindowAction(id, 'end');
      return 'Window ended.';
    },
  },

  retryEtlExecution: {
    direct: true,
    run: async (api, id) => {
      const result = await api.etl.retry(id);
      return `Retry queued — execution is ${(result && result.status) || 'running'}.`;
    },
  },

  removeAdminUser: {
    direct: true,
    confirm: 'Remove this user from the platform? They lose access to every organization.',
    run: async (api, email) => { await api.admin.deleteUser(email); return 'User removed.'; },
  },

  removeDatabase: {
    direct: true,
    // Deleting a registration drops the credential with it, so this one asks first.
    confirm: 'Remove this database registration? Its stored credential is deleted with it.',
    run: async (api, id) => { await api.databases.remove(id); return 'Database removed.'; },
  },

  /* Platform-admin only. The public POST /organizations it used to call was a stub
     that returned "pending" and wrote nothing, so every org created here vanished. */
  createOrganization: {
    title: 'Create organization',
    submit: 'Create',
    success: 'Organization created.',
    fields: [
      { name: 'name', label: 'Organization name', required: true, width: 'half',
        help: 'The slug — <slug>.loveheartbeat.com — is derived from this.' },
      { name: 'owner_email', label: 'Owner email', type: 'email', required: true, width: 'half' },
      { name: 'plan', label: 'Plan', type: 'select', width: 'half',
        options: ['free', 'trial', 'business', 'enterprise'] },
      { name: 'seats', label: 'Seats', type: 'number', width: 'half' },
    ],
    run: (api, body) => api.admin.createOrganization(body),
  },
};

/* Buttons whose endpoint does not exist yet. Listed rather than omitted so the gap is
 * visible in one place instead of being rediscovered page by page. */
export const UNSUPPORTED = {
  connectGcp: 'No GCP collector yet — the backend collects AWS (Lambda, CloudWatch) and reads Apigee if you connect it as your API gateway.',
  connectAzure: 'No Azure collector yet — Azure API Management is readable as an API gateway, but there is no subscription-wide collector.',
  addAiRoute: 'AI gateway routes come from the APISIX config, not the API — edit infrastructure/apisix/apisix.yaml.',
  rebaseline: 'No drift rebaseline endpoint yet.',
  defineSlo: 'No SLO definition endpoint yet — slo is read-only.',
  acknowledgeAll: 'No bulk acknowledge endpoint yet.',
  saveAuthSettings: 'No organization authentication-settings endpoint yet — Cognito policy is set in the stack.',
  escalationPath: 'No escalation-path endpoint yet — routing rules in Alert Management carry the first timeout.',
  rebuildTopology: 'No topology rebuild endpoint yet — the graph is derived from spans on every read.',
};

/* --------------------------------------------------------------------- bind */

/**
 * Wire every `data-lhb-action` control on the page. Delegated from the document, so
 * controls rendered later by live-data.js work without rebinding.
 */
export function bind(api) {
  if (document.documentElement.dataset.lhbActionsBound === '1') return;
  document.documentElement.dataset.lhbActionsBound = '1';

  // Disabled-with-a-reason, rather than a button that appears to work.
  for (const el of document.querySelectorAll('[data-lhb-action]')) {
    const reason = UNSUPPORTED[el.dataset.lhbAction];
    if (!reason) continue;
    el.disabled = true;
    el.title = reason;
    el.classList.add('disabled');
  }

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-lhb-action]');
    if (!trigger) return;
    const entry = ACTIONS[trigger.dataset.lhbAction];
    if (!entry) return;
    event.preventDefault();
    const arg = trigger.dataset.lhbArg;
    if (entry.choices) runChoice(api, entry);
    else if (entry.custom) entry.custom(api, arg).catch((err) => toast(explain(err), 'danger'));
    else if (entry.direct) runDirect(api, entry, arg, trigger);
    else runForm(api, entry, arg);
  });
}
