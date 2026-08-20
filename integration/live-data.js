/**
 * Live data binding for the observability pages.
 *
 * Each Pug page ships a static table as its markup. That markup is the fallback, not
 * decoration: if the API is unreachable, the user is not signed in, or the integration
 * behind a panel was never connected, the page still renders and says why instead of
 * collapsing into an empty shell.
 *
 * A page opts in with one attribute — `data-live-table="slo"` — and the source named
 * there decides what to call and how to shape rows. Adding a page means adding one
 * entry to SOURCES, not writing another fetch-and-render loop.
 */

const BADGES = {
  healthy: 'success', ok: 'success', passing: 'success', online: 'success',
  active: 'success', succeeded: 'success', enabled: 'success', up: 'success',
  serving: 'success', resolved: 'success', connected: 'success', 'on track': 'success',
  warning: 'warning', degraded: 'warning', watch: 'warning', stale: 'warning',
  retrying: 'warning', 'at risk': 'warning', expiring: 'warning', slow: 'warning',
  pending: 'warning', queued: 'info', info: 'info', trial: 'info',
  critical: 'danger', down: 'danger', failed: 'danger', breached: 'danger',
  error: 'danger', offline: 'danger', denied: 'danger', suspended: 'danger',
};

/** A status cell the table renderer will draw as a Phoenix badge. */
function badge(text) {
  const label = String(text ?? '—');
  return { text: label, badge: BADGES[label.toLowerCase()] || 'secondary' };
}

const num = (v, digits = 0) =>
  v === null || v === undefined || Number.isNaN(Number(v))
    ? '—'
    : Number(v).toLocaleString(undefined, { maximumFractionDigits: digits });

const pct = (v, digits = 1) =>
  v === null || v === undefined ? '—' : `${Number(v).toFixed(digits)}%`;

/**
 * Registry: key -> how to load it and how to turn the payload into table rows.
 *
 * `rows` returns objects in the same shape the Pug mixin emits statically
 * ({ icon, iconColor, meta, cells }), so the renderer below is the only place that
 * knows about the DOM.
 */
export const SOURCES = {
  slo: {
    load: (api) => api.slo.list(),
    rows: (data) =>
      (data || []).map((s) => ({
        icon: 'fa-bullseye',
        iconColor: s.burn_rate > 2 ? 'danger' : s.burn_rate > 1 ? 'warning' : 'success',
        meta: s.slo_id,
        cells: [
          s.name,
          pct(s.error_budget_remaining_pct, 0),
          pct(s.target, 2),
          pct(s.reliability, 3),
          `${num(s.burn_rate, 2)}x`,
          badge(s.burn_rate > 2 ? 'At risk' : s.burn_rate > 1 ? 'Watch' : 'On track'),
        ],
      })),
  },

  drift: {
    // The drift endpoint splits numeric (KS) from categorical (PSI); the table shows
    // both, because "which test" is a property of the feature, not of the page.
    load: (api) => api.drift.list(),
    rows: (data) => {
      const numeric = (data?.numeric || []).map((d) => ({
        icon: 'fa-wave-square',
        iconColor: d.drift ? 'danger' : 'success',
        meta: 'numeric',
        cells: [d.feature, 'metric', 'KS', num(d.ks_statistic, 3),
                num(d.critical, 3), badge(d.drift ? 'Drifting' : 'Stable')],
      }));
      const categorical = (data?.categorical || []).map((d) => ({
        icon: 'fa-chart-simple',
        iconColor: d.drift ? 'danger' : 'success',
        meta: 'categorical',
        cells: [d.feature, 'category mix', 'PSI', num(d.psi, 3),
                num(d.critical ?? 0.25, 3), badge(d.drift ? 'Drifting' : 'Stable')],
      }));
      return numeric.concat(categorical);
    },
  },

  finops: {
    load: (api) => api.finops.recommendations(),
    rows: (data) =>
      (data?.recommendations || []).map((r) => ({
        icon: 'fa-coins',
        iconColor: 'warning',
        meta: r.type ? `${r.type} · ${r.id}` : r.id,
        cells: [r.description || 'Recommendation', r.component_name || '—',
                r.namespace || '—',
                r.estimated_monthly_savings != null ? `$${num(r.estimated_monthly_savings, 2)}/mo` : '—',
                r.confidence != null ? pct(r.confidence * 100, 0) : '—',
                badge(r.confidence >= 0.8 ? 'High confidence' : 'Review')],
      })),
  },

  automationRules: {
    load: (api) => api.automation.rules(),
    rows: (data) =>
      (data || []).map((r) => ({
        icon: 'fa-bolt',
        iconColor: r.enabled ? 'success' : 'secondary',
        meta: r.category || (r.ai_driven ? 'AI-driven' : 'rule'),
        cells: [r.name, r.trigger || '—', r.action || '—', num(r.execution_count),
                r.ai_driven ? 'AI' : 'Rule',
                badge(r.enabled ? 'Enabled' : 'Disabled')],
      })),
  },

  aiModels: {
    load: (api) => api.aiModels.list(),
    rows: (data) =>
      (data?.models || data || []).map((m) => ({
        icon: 'fa-microchip',
        iconColor: m.status === 'down' ? 'danger' : m.status === 'degraded' ? 'warning' : 'success',
        meta: m.version ? `${m.version} · ${m.provider || 'self-hosted'}` : m.provider || '—',
        cells: [m.name || m.model_id, m.task || '—', num(m.requests),
                m.p95_latency_ms != null ? `${num(m.p95_latency_ms)}ms` : '—',
                pct(m.failure_rate, 2), badge(m.status || 'unknown')],
      })),
  },

  databases: {
    load: (api) => api.databases.list(),
    rows: (data) =>
      (data?.databases || data || []).map((d) => ({
        icon: 'fa-database',
        iconColor: d.status === 'down' ? 'danger' : d.status === 'degraded' ? 'warning' : 'info',
        meta: d.host || d.database_id,
        cells: [d.name || d.database_id, d.engine || '—', d.environment || '—',
                d.connections != null ? num(d.connections) : '—',
                d.replication_lag_seconds != null ? `${num(d.replication_lag_seconds, 1)}s` : '—',
                badge(d.status || 'unknown')],
      })),
  },

  etl: {
    load: (api) => api.etl.summary(),
    rows: (data) =>
      (data || []).map((p) => ({
        icon: 'fa-diagram-project',
        iconColor: p.status === 'ok' ? 'success' : p.status === 'not_configured' ? 'secondary' : 'warning',
        meta: p.mode || '—',
        cells: [p.name, p.category || 'ETL', num(p.jobsPerDay),
                p.lastRun || '—', pct(p.successRate, 1),
                badge(p.status === 'not_configured' ? 'Not connected' : p.status || 'unknown')],
      })),
  },

  correlation: {
    load: (api) => api.correlation.incidents(),
    rows: (data) =>
      (data?.incidents || []).map((i) => ({
        icon: 'fa-code-merge',
        iconColor: i.severity === 'critical' ? 'danger' : 'warning',
        meta: i.incident_id || i.id,
        cells: [i.title || 'Incident', i.root_cause || '—', num(i.alert_count),
                num(i.service_count), i.duration || '—', badge(i.status || 'Open')],
      })),
  },

  alertManagement: {
    load: (api) => api.alertManagement.routingRules(),
    rows: (data) =>
      (data || []).map((r) => ({
        icon: 'fa-route',
        iconColor: r.enabled ? 'success' : 'secondary',
        meta: r.priority != null ? `priority ${r.priority}` : 'draft',
        cells: [r.name, r.category || r.source || 'any',
                (r.notification_channels || []).join(', ') || '—',
                r.severity || '—',
                r.escalation_minutes != null ? `${num(r.escalation_minutes)}m` : '—',
                badge(r.enabled ? 'Enabled' : 'Disabled')],
      })),
  },

  organizations: {
    // Public route — renders live even before sign-in, which makes it the quickest
    // confirmation that the page is really talking to the API.
    load: (api) => api.organizations(),
    rows: (data) =>
      (data?.organizations || []).map((o) => ({
        icon: 'fa-building',
        iconColor: 'primary',
        meta: `${o.slug}.loveheartbeat.com`,
        cells: [o.name, `${o.slug}.loveheartbeat.com`, o.plan, o.org_id, o.slug,
                badge('Active')],
      })),
  },
};

/* ------------------------------------------------------------------ rendering */

function cellHtml(cell, colKey, index, row) {
  if (index === 0) {
    const icon = `${row.iconSet || 'fa-solid'} ${row.icon || 'fa-cube'} text-${row.iconColor || 'primary'}`;
    const meta = row.meta ? `<p class="text-body-tertiary fs-10 mb-0">${esc(row.meta)}</p>` : '';
    return `<td class="align-middle ps-3 py-3 ${colKey}"><div class="d-flex align-items-center">` +
           `<span class="me-2 ${icon}"></span><div><h6 class="mb-0">${esc(cell)}</h6>${meta}</div></div></td>`;
  }
  if (cell && cell.badge) {
    return `<td class="align-middle ${colKey}"><span class="badge badge-phoenix badge-phoenix-${cell.badge}">${esc(cell.text)}</span></td>`;
  }
  return `<td class="align-middle ${colKey}">${esc(cell)}</td>`;
}

function esc(value) {
  return String(value ?? '—').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** Replace a table's rows in place, keeping the header, search, and pagination markup. */
function render(root, rows) {
  const tbody = root.querySelector('tbody.list');
  if (!tbody) return;
  const keys = Array.from(root.querySelectorAll('thead th[data-sort]')).map((th) => th.dataset.sort);
  tbody.innerHTML = rows
    .map((row) => '<tr>' + row.cells.map((c, i) => cellHtml(c, keys[i] || `col${i}`, i, row)).join('') + '</tr>')
    .join('');
}

/** A small badge on the card header saying where the numbers came from. */
function mark(root, text, tone) {
  const header = root.querySelector('.card-header');
  if (!header) return;
  let el = header.querySelector('[data-live-status]');
  if (!el) {
    el = document.createElement('span');
    el.setAttribute('data-live-status', '');
    el.className = 'badge badge-phoenix ms-2 align-middle';
    const title = header.querySelector('h4');
    if (title) title.appendChild(el);
    else header.appendChild(el);
  }
  el.className = `badge badge-phoenix badge-phoenix-${tone} ms-2 align-middle`;
  el.textContent = text;
}

/**
 * Hydrate every opted-in table on the page.
 *
 * Failure is reported, never silent: an unreachable API or an expired session leaves
 * the sample rows visible and labels them, so nobody mistakes placeholder numbers for
 * live ones — which is the whole reason this badge exists.
 */
export async function hydrate(api) {
  const roots = document.querySelectorAll('[data-live-table]');
  await Promise.all(Array.from(roots).map(async (root) => {
    const source = SOURCES[root.dataset.liveTable];
    if (!source) return;
    mark(root, 'Loading…', 'info');
    try {
      const rows = source.rows(await source.load(api));
      if (!rows.length) {
        // The call succeeded and the tenant genuinely has nothing registered yet. The
        // sample rows stay so the page still shows its shape, but the badge has to say
        // so plainly — "No data" beside eight realistic-looking rows reads as live.
        mark(root, 'Sample data — none registered yet', 'warning');
        return;
      }
      render(root, rows);
      mark(root, 'Live', 'success');
    } catch (err) {
      const status = /API (\d{3})/.exec(err.message)?.[1];
      if (status === '401' || status === '403') mark(root, 'Sign in for live data', 'warning');
      else if (status === '501' || status === '503') mark(root, 'Not connected', 'secondary');
      else mark(root, 'Sample data — API unreachable', 'warning');
    }
  }));
}
