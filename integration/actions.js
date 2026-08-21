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

/* ------------------------------------------------------------------- runners */

async function runForm(api, entry, arg) {
  const form = document.createElement('form');
  form.className = 'row g-3';
  form.noValidate = true;
  const specs = typeof entry.fields === 'function' ? entry.fields(arg) : entry.fields;
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
  submit.textContent = entry.submit || 'Save';

  const footer = document.createElement('div');
  footer.className = 'd-flex gap-2';
  footer.append(cancel, submit);

  const close = open(entry.title, body, footer);
  cancel.addEventListener('click', close);

  submit.addEventListener('click', async () => {
    if (!form.reportValidity()) return;
    submit.disabled = true;
    submit.textContent = 'Working…';
    error.classList.add('d-none');
    try {
      await entry.run(api, values(form, specs), arg);
      close();
      toast(entry.success || 'Saved.');
      if (entry.refresh !== false) hydrate(api);
    } catch (err) {
      error.textContent = err.message || String(err);
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
    toast(err.message || String(err), 'danger');
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
      if (next.custom) next.custom(api).catch((err) => toast(err.message || String(err), 'danger'));
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

export const ACTIONS = {
  /* --- alert clustering + coding-agent handoff ---------------------------- */

  /**
   * The brief the backend assembles for a coding agent: facts, deduplicated logs,
   * and a ready-to-send prompt. Nothing is dispatched from here — the prompt is
   * copied and pasted into whichever agent you run.
   */
  clusterBrief: {
    title: 'Agent brief',
    custom: async (api, arg) => {
      const brief = await api.alerts.brief(arg);

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

      const ph = document.createElement('h6');
      ph.className = 'fs-9 mb-2';
      ph.textContent = 'Prompt for your coding agent';
      const pre = document.createElement('pre');
      pre.className = 'bg-body-emphasis border border-translucent rounded-3 p-3 fs-10 mb-0';
      pre.style.maxHeight = '18rem';
      pre.style.overflow = 'auto';
      pre.style.whiteSpace = 'pre-wrap';
      pre.textContent = brief.prompt || '';
      body.append(ph, pre);

      const copy = document.createElement('button');
      copy.type = 'button';
      copy.className = 'btn btn-primary btn-sm';
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

      const close = open(`Agent brief · ${brief.title}`, body, footer);
      done.addEventListener('click', close);
    },
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
      { name: 'notification_channels', label: 'Notification channels', type: 'list',
        placeholder: 'slack-sre, pagerduty' },
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
    run: (api, body) => api.databases.add(body),
  },

  connectTalend: {
    title: 'Connect Talend',
    submit: 'Save configuration',
    success: 'Talend configured — monitoring started.',
    fields: [
      { name: 'base_url', label: 'API base URL', width: 'half',
        value: 'https://api.us.cloud.talend.com' },
      { name: 'environment_id', label: 'Environment ID', width: 'half' },
      { name: 'workspace_id', label: 'Workspace ID', width: 'half' },
      { name: 'last_days', label: 'Look back (days)', value: '1', width: 'half' },
      { name: 'bearer_token', label: 'Bearer token', type: 'password',
        help: 'Optional here — the backend can supply it from its secret store instead.' },
    ],
    run: (api, body) => api.etl.saveConfig('talend', body),
  },

  connectBoomi: {
    title: 'Connect Boomi',
    submit: 'Save configuration',
    success: 'Boomi configured — monitoring started.',
    fields: [
      { name: 'account_id', label: 'Account ID', required: true, width: 'half' },
      { name: 'username', label: 'Username', required: true, width: 'half' },
      { name: 'token', label: 'API token', type: 'password', required: true },
      { name: 'base_url', label: 'API base URL', value: 'https://api.boomi.com/api/rest/v1' },
      { name: 'atom_id', label: 'Atom ID', width: 'half' },
      { name: 'environment_id', label: 'Environment ID', width: 'half' },
      { name: 'hours_back', label: 'Look back (hours)', type: 'number', value: 24, width: 'half' },
    ],
    run: (api, body) => api.etl.saveConfig('boomi', body),
  },

  runScan: {
    title: 'Run data quality scan',
    direct: true,
    success: 'Scan started.',
    run: async (api) => {
      const result = await api.dataObservability.scan();
      return result && result.message ? result.message : 'Scan started.';
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
          error.textContent = err.message || String(err);
          error.classList.remove('d-none');
        } finally {
          submit.disabled = false;
        }
      });
    },
  },

  addIntegration: {
    title: 'Add integration',
    choices: [
      { label: 'API gateway', action: 'connectGateway', help: 'Kong, Apigee, AWS API Gateway and friends.' },
      { label: 'ETL tool', action: 'connectEtl', help: 'Talend, Boomi or Databricks.' },
      { label: 'Database', action: 'addDatabase', help: 'Register by connection string.' },
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

  createOrganization: {
    title: 'Create organization',
    submit: 'Create',
    success: 'Organization created.',
    fields: [
      { name: 'name', label: 'Organization name', required: true, width: 'half' },
      { name: 'slug', label: 'Slug', required: true, width: 'half',
        help: 'Becomes <slug>.loveheartbeat.com.' },
      { name: 'plan', label: 'Plan', type: 'select', width: 'half',
        options: ['trial', 'business', 'enterprise'] },
      { name: 'admin_email', label: 'Admin email', type: 'email', width: 'half' },
    ],
    run: (api, body) => api.onboardOrganization(body),
  },
};

/* Buttons whose endpoint does not exist yet. Listed rather than omitted so the gap is
 * visible in one place instead of being rediscovered page by page. */
export const UNSUPPORTED = {
  setAiBudget: 'No AI budget endpoint yet — finops is read-only.',
  addAiRoute: 'No AI route endpoint yet.',
  registerModel: 'No model registration endpoint yet — ai_models exposes inferences and thresholds only.',
  connectAiTool: 'No AI tool connector endpoint yet.',
  createAlertRule: 'No alert rule endpoint yet — alert-management covers routing, SLA and maintenance windows.',
  addApi: 'No API registration endpoint yet.',
  addBudget: 'No cost budget endpoint yet — finops is read-only.',
  addCloudAccount: 'No cloud account endpoint yet.',
  rebaseline: 'No drift rebaseline endpoint yet.',
  saveSearch: 'No saved search endpoint yet.',
  connectOrchestrator: 'No orchestrator connector endpoint yet.',
  defineSlo: 'No SLO definition endpoint yet — slo is read-only.',
  exportTraces: 'No trace export endpoint yet.',
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
    else if (entry.custom) entry.custom(api, arg).catch((err) => toast(err.message || String(err), 'danger'));
    else if (entry.direct) runDirect(api, entry, arg, trigger);
    else runForm(api, entry, arg);
  });
}
