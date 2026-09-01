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

/* Mock data is off unless the deployment says otherwise — same switch as the backend's
   PINGHOLD_MOCK_DATA, written into runtime-config.js by the frontend deploy. With it
   off the sample rows every page ships as markup are cleared before the first paint, so
   nothing fabricated is ever on screen: a tenant with no data sees an empty state. */
const MOCK_DATA =
  typeof window !== 'undefined' && String(window.__MOCK_DATA__ || '0') === '1';

const BADGES = {
  healthy: 'success', ok: 'success', passing: 'success', online: 'success',
  active: 'success', succeeded: 'success', enabled: 'success', up: 'success',
  serving: 'success', resolved: 'success', connected: 'success', 'on track': 'success',
  warning: 'warning', degraded: 'warning', watch: 'warning', stale: 'warning',
  retrying: 'warning', 'at risk': 'warning', expiring: 'warning', slow: 'warning',
  pending: 'warning', queued: 'info', info: 'info', trial: 'info',
  'awaiting data': 'info', 'within budget': 'success', 'over budget': 'danger',
  tracked: 'info', unmetered: 'secondary',
  critical: 'danger', down: 'danger', failed: 'danger', breached: 'danger',
  error: 'danger', offline: 'danger', denied: 'danger', suspended: 'danger',
};

/** A status cell the table renderer will draw as a Phoenix badge. */
function badge(text) {
  const label = String(text ?? '—');
  return { text: label, badge: BADGES[label.toLowerCase()] || 'secondary' };
}

/* /summary answers with display names ("Dell Boomi"), while every write route is keyed
   by slug ("boomi"). Lowercasing the name is not enough for that one. */
const ETL_SLUGS = { 'dell boomi': 'boomi', boomi: 'boomi', talend: 'talend', databricks: 'databricks' };
/* Which form configures each ETL platform. Anything unmapped falls back to the chooser. */
const ETL_CONFIG = { talend: 'connectTalend', boomi: 'connectBoomi', databricks: 'connectDatabricks' };

/* What each catalog finding is called on screen, and the glyph that carries it. Keyed
   by the `kind` the inspector emits, so a new check needs one entry, not a new table. */
const FINDING_LABELS = {
  schema_drift: 'Schema drift',
  volume_drop: 'Volume drop',
  duplicate_index: 'Duplicate index',
  redundant_index: 'Redundant index',
  unused_index: 'Unused index',
  duplicate_rows: 'Duplicate rows',
  no_primary_key: 'No primary key',
};

const FINDING_ICONS = {
  schema_drift: 'fa-code-branch',
  volume_drop: 'fa-arrow-trend-down',
  duplicate_index: 'fa-clone',
  redundant_index: 'fa-clone',
  unused_index: 'fa-layer-group',
  duplicate_rows: 'fa-copy',
  no_primary_key: 'fa-key',
};

const etlPlatform = (name) => ETL_SLUGS[String(name || '').toLowerCase()] || String(name || '').toLowerCase();

const num = (v, digits = 0) =>
  v === null || v === undefined || Number.isNaN(Number(v))
    ? '—'
    : Number(v).toLocaleString(undefined, { maximumFractionDigits: digits });

/**
 * One vocabulary for ETL run status.
 *
 * Every vendor spells it differently — Talend says COMPLETE, Boomi says ERROR,
 * Databricks says TERMINATING, and this app's own executions say dry_run_started. The
 * table has one Status column, so they are collapsed to four words here rather than
 * shown raw, where "TIMEDOUT" and "launch_failed" would read as two different outcomes.
 */
const ETL_STATUS = {
  COMPLETE: 'Success', SUCCESS: 'Success', execution_success: 'Success', succeeded: 'Success',
  ERROR: 'Failed', FAILED: 'Failed', TIMEDOUT: 'Failed', INTERNAL_ERROR: 'Failed',
  CANCELED: 'Failed', CANCELLED: 'Failed', execution_failed: 'Failed', launch_failed: 'Failed',
  RUNNING: 'Running', TERMINATING: 'Running', BLOCKED: 'Running', WAITING_FOR_RETRY: 'Running',
  running: 'Running', started: 'Running', execution_running: 'Running', dry_run_started: 'Running',
  QUEUED: 'Queued', PENDING: 'Queued', queued: 'Queued', execution_queued: 'Queued',
  submitted: 'Queued',
};

const ETL_EVENT_STATUS = {
  'etl.job.succeeded': 'Success',
  'etl.job.failed': 'Failed',
  'etl.job.warning': 'Failed',
  'etl.job.running': 'Running',
  'etl.job.started': 'Running',
};

/* The event type is the fallback, not the first choice: a poller that reports a run as
   etl.job.running while the payload already says COMPLETE is describing the sweep, not
   the run. */
const etlStatus = (data, type) => {
  const raw = String(data.status ?? data.result_state ?? data.life_cycle_state ?? '');
  return ETL_STATUS[raw] || ETL_EVENT_STATUS[type] || raw || 'Unknown';
};

/** Duration from whichever pair of fields the vendor happened to send. */
const etlDuration = (data) => {
  let ms = [data.duration_ms, data.run_duration, data.execution_duration]
    .find((v) => typeof v === 'number' && Number.isFinite(v));
  if (ms == null && data.started_at && data.ended_at) {
    ms = Date.parse(String(data.ended_at)) - Date.parse(String(data.started_at));
  }
  if (ms == null && data.start_time && data.finish_time) {
    ms = Date.parse(String(data.finish_time)) - Date.parse(String(data.start_time));
  }
  if (ms == null || !Number.isFinite(ms) || ms < 0) return '—';
  const s = Math.floor(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
};

/** What the logs page's filter bar is asking for, in /logs/search's own parameters. */
function logFilters() {
  const val = (id) => {
    const el = document.getElementById(id);
    return el && el.value ? el.value.trim() : '';
  };
  const params = { limit: 50 };
  const q = val('log-query');
  const service = val('log-service');
  const level = val('log-level');
  if (q) params.q = q;
  if (service) params.service = service;
  if (level) params.level = level;
  return params;
}

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
        action: { key: 'runAutomationRule', arg: r.id, label: 'Run' },
      })),
  },

  aiModels: {
    load: (api) => api.aiModels.list(),
    rows: (data) =>
      (data?.models || data || []).map((m) => ({
        icon: 'fa-microchip',
        iconColor: m.status === 'down' ? 'danger' : m.status === 'degraded' ? 'warning' : 'success',
        meta: m.version ? `${m.version} · ${m.provider || 'self-hosted'}` : m.provider || '—',
        cells: [m.name || m.model || m.model_id, m.task || (m.tasks || [])[0] || '—',
                num(m.requests),
                m.p95_latency_ms != null ? `${num(m.p95_latency_ms)}ms` : '—',
                pct((m.error_rate != null ? m.error_rate * 100 : m.failure_rate), 2),
                // A declared model with nothing reported yet is neither healthy nor
                // broken, and saying "unknown" hides that someone is expecting data.
                badge(m.status === 'awaiting_data' ? 'Awaiting data' : m.status || 'unknown')],
        actions: m.registered
          ? [{ key: 'unregisterModel', arg: m.model || m.model_id, label: 'Unregister' }]
          : [],
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
        action: { key: 'removeDatabase', arg: d.id || d.database_id, label: 'Remove' },
      })),
  },

  /* One row per catalog finding, flattened across every registered database, worst
     first — the API already sorts within a database, so only the outer list is joined
     here. An engine with no inspector still gets a row saying so, because a page that
     lists only the Postgres entries reads as "the rest are clean". */
  databaseFindings: {
    load: (api) => api.databases.findings(),
    rows: (data) =>
      (data || []).flatMap((db) => {
        const where = db.name || db.host || db.database;
        if (db.unsupported || db.error) {
          return [{
            icon: 'fa-circle-question',
            iconColor: 'secondary',
            meta: where,
            cells: [where, 'Not inspected', '—', db.unsupported || db.error,
                    badge('Unknown')],
          }];
        }
        return (db.findings || []).map((f) => ({
          icon: FINDING_ICONS[f.kind] || 'fa-triangle-exclamation',
          iconColor: f.severity === 'critical' ? 'danger'
            : f.severity === 'warning' ? 'warning' : 'info',
          meta: where,
          cells: [f.object, FINDING_LABELS[f.kind] || f.kind, where, f.summary,
                  badge(f.severity)],
        }));
      }),
  },

  etl: {
    /* The cards above the table, from the same /summary response. Success rate is
       weighted by job count rather than averaged across platforms: three platforms at
       100%, 100% and 50% is not "83% of runs succeeded" unless they ran equal numbers,
       and they never do. */
    stats: (data) => {
      const rows = (data || []).filter((p) => p.status !== 'not_configured');
      const jobs = rows.reduce((t, p) => t + (Number(p.totalJobs) || 0), 0);
      const succeeded = rows.reduce((t, p) => t + (Number(p.totalJobs) || 0) * (Number(p.successRate) || 0), 0);
      const failed = rows.reduce((t, p) => t + Math.round((Number(p.jobsPerDay) || 0) * (Number(p.failureRate) || 0) / 100), 0);
      return {
        pipelines: {
          value: num(rows.reduce((t, p) => t + (Number(p.jobsPerDay) || 0), 0)),
          delta: `${num(rows.length)} connected`,
        },
        successRate: {
          value: jobs ? pct(succeeded / jobs, 1) : '—',
          delta: jobs ? `${num(jobs)} runs` : 'no runs yet',
        },
        failedRuns: { value: num(failed), delta: 'last 24h' },
      };
    },
    load: (api) => api.etl.summary(),
    rows: (data) =>
      (data || []).map((p) => ({
        icon: 'fa-diagram-project',
        iconColor: p.status === 'ok' ? 'success' : p.status === 'not_configured' ? 'secondary' : 'warning',
        meta: p.mode || '—',
        cells: [p.name, p.category || 'ETL', num(p.jobsPerDay),
                p.lastRun || '—', pct(p.successRate, 1),
                badge(p.status === 'not_configured' ? 'Not connected' : p.status || 'unknown')],
        /* Saving a connector config proves nothing — the credentials are only exercised
           when something calls the vendor. Test does that on demand; Poll pulls runs in
           without waiting for the next scheduled sweep. Both are per-connector, so they
           belong on the row rather than in the page header. */
        actions: [
          { key: 'testEtlConfig', arg: etlPlatform(p.name), label: 'Test' },
          { key: 'pollEtl', arg: etlPlatform(p.name), label: 'Poll now' },
        ],
      })),
  },

  /**
   * Columns: Job · Platform · Environment · Status · Duration · Records · Last run.
   *
   * The ETL page could say which *platforms* were connected and nothing about what they
   * had actually run — /events, /executions and /incidents were all served by the
   * backend and called by nobody. This is the run-level table those endpoints exist for.
   *
   * Built from /events rather than /executions on purpose: an execution row is only
   * created for a job this app launched, while an event arrives for every run the
   * pollers pick up, including the ones scheduled inside Talend or Databricks. Runs
   * started elsewhere are most of what a monitoring page is for.
   */
  etlJobs: {
    load: (api) => api.etl.events({ limit: 200 }),
    rows: (data) => {
      /* One row per execution, not per event. A run emits started → running → succeeded,
         and /events is newest-first, so the first sighting of an execution id is its
         current state — keeping all three would trip-count every job and show it as
         still running long after it finished. */
      const seen = new Set();
      return (data || []).filter((e) => {
        const key = String(e.data?.execution_id ?? e.correlationid ?? e.id);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).map((e) => {
        const d = e.data || {};
        const status = etlStatus(d, e.type);
        const failed = status === 'Failed';
        return {
          icon: 'fa-diagram-project',
          iconColor: failed ? 'danger' : status === 'Running' ? 'info' : status === 'Queued' ? 'secondary' : 'success',
          /* The error is the reason somebody opened this page; it goes under the job
             name rather than into a column nothing else would fill. */
          meta: d.error_message || d.state_message || d.message || null,
          cells: [
            String(d.job_name ?? d.artifact_name ?? d.process_name ?? d.run_name ?? d.job_id ?? 'unnamed job'),
            e.source || d.platform || '—',
            String(d.environment ?? d.environment_id ?? d.atom_name ?? '—'),
            badge(status),
            etlDuration(d),
            d.records_processed != null ? num(d.records_processed) : '—',
            e.timestamp || '—',
          ],
          /* Retry only makes sense on a run that failed, and only this app's executions
             can be relaunched — a run polled out of Talend has no execution record here
             to retry against. */
          actions: failed && d.execution_id
            ? [{ key: 'retryEtlExecution', arg: String(d.execution_id), label: 'Retry' }]
            : [],
        };
      });
    },
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
        /* /incidents/{id}/rca is computed per incident; this is the only way into it. */
        action: { key: 'incidentRca', arg: i.incident_id || i.id, label: 'Root cause' },
      })),
  },

  /**
   * Alert clusters: a storm collapsed into a handful of rows. Each row carries a
   * Brief button that opens the coding-agent handoff for that cluster.
   */
  clusters: {
    load: (api) => api.alerts.clusters(),
    rows: (data) =>
      (data?.clusters || []).map((c) => ({
        icon: 'fa-layer-group',
        iconColor: c.severity === 'critical' ? 'danger' : c.severity === 'warning' ? 'warning' : 'info',
        meta: c.id,
        cells: [c.title, badge(c.severity), num(c.count),
                (c.services || []).join(', ') || '—',
                c.last_seen || '—', badge(c.status)],
        action: { key: 'clusterBrief', arg: c.id, label: 'Brief' },
      })),
  },

  /**
   * Agent incidents, clustered.
   *
   * Same clustering as `clusters`, over failures the AI agents reported rather than
   * alerts from the collector — and the only side with a dispatch endpoint, so its row
   * action can hand the brief to a coding agent instead of only showing it.
   */
  agentIncidentClusters: {
    load: (api) => api.agents.incidentClusters(),
    rows: (data) =>
      (data?.clusters || []).map((c) => ({
        icon: 'fa-robot',
        iconColor: c.severity === 'critical' ? 'danger' : c.severity === 'warning' ? 'warning' : 'info',
        meta: c.id,
        cells: [c.title, badge(c.severity), num(c.count),
                (c.services || []).join(', ') || '—',
                c.last_seen || '—', badge(c.status)],
        action: { key: 'agentIncidentBrief', arg: c.id, label: 'Brief & dispatch', tone: 'primary' },
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
        action: { key: 'testRoutingRule', arg: r.id, label: 'Test' },
      })),
  },

  /* --- API monitoring ---------------------------------------------------- */

  apiRoutes: {
    // Columns: Route · Requests · 5xx · Error rate · Status codes · Status, which is
    // every field /observability/routes returns. `errors` counts 5xx and spans the
    // exporter marked ERROR — a 4xx is the caller's mistake, not the route's, and
    // folding it in here would make a healthy route look broken.
    /* The four cards above the table are this same response rolled up, so they are
       published from here rather than fetched again. p99 is the slowest route's, named
       after it: percentiles do not recombine, so there is no honest way to turn per-route
       p99s into one fleet number. */
    stats: (data) => {
      const rows = data || [];
      const requests = rows.reduce((t, r) => t + (Number(r.requests) || 0), 0);
      const errors = rows.reduce((t, r) => t + (Number(r.errors) || 0), 0);
      const slowest = rows.reduce(
        (worst, r) => ((Number(r.p99_latency_ms) || 0) > (Number(worst?.p99_latency_ms) || 0) ? r : worst),
        null);
      return {
        requests: { value: num(requests), delta: `${num(rows.length)} routes` },
        errorRate: {
          value: requests ? pct((errors / requests) * 100, 2) : '—',
          delta: `${num(errors)} 5xx`,
        },
        p99Latency: {
          value: slowest ? `${num(slowest.p99_latency_ms, 1)}ms` : '—',
          delta: slowest ? slowest.route : 'no data',
        },
        routes: { value: num(rows.length), delta: 'from stored spans' },
      };
    },
    load: (api) => api.observability.routes(),
    rows: (data) =>
      (data || []).map((r) => ({
        icon: 'fa-route',
        iconColor: r.error_rate > 0.05 ? 'danger' : r.error_rate > 0.01 ? 'warning' : 'success',
        meta: Object.entries(r.by_code || {}).map(([code, n]) => `${code}×${n}`).join(' ') || null,
        cells: [r.route, num(r.requests), num(r.errors),
                pct((r.error_rate || 0) * 100, 2),
                Object.keys(r.by_code || {}).sort().join(', ') || '—',
                badge(r.error_rate > 0.05 ? 'Down' : r.error_rate > 0.01 ? 'Degraded' : 'Healthy')],
      })),
  },

  traces: {
    load: (api) => api.observability.traces({ limit: 50 }),
    rows: (data) =>
      (data || []).map((t) => ({
        icon: 'fa-diagram-project',
        iconColor: t.errors ? 'danger' : 'info',
        meta: t.trace_id,
        cells: [t.root_name || t.trace_id, num(t.span_count), num(t.errors),
                t.duration_ms != null ? `${num(t.duration_ms, 1)}ms` : '—',
                t.start_time || '—',
                badge(t.errors ? 'Failed' : 'OK')],
      })),
  },

  logs: {
    // The log page's table is hand-rolled and 4 columns wide: time, level, service, line.
    plain: true,
    /* The filter bar above the table used to be decoration: this read `size`, which
       /logs/search does not declare, and never looked at the query, service or level
       the operator had typed. Search re-hydrates, so reading them here is the whole
       wiring. */
    load: (api) => api.elk.searchLogs(logFilters()),
    rows: (data) =>
      (data?.hits || []).map((hit) => {
        const doc = hit._source || hit;
        const level = String(doc.level || doc.severity || 'info').toLowerCase();
        return {
          cells: [doc['@timestamp'] || doc.timestamp || '—', badge(level),
                  doc.service || doc.source || '—',
                  doc.message || doc.msg || '(no message)'],
        };
      }),
  },

  /* --- AI monitoring ------------------------------------------------------ */

  aiAgents: {
    load: (api) => api.agents.list(),
    rows: (data) =>
      (data || []).map((a) => ({
        icon: 'fa-robot',
        iconColor: a.status === 'down' ? 'danger' : a.status === 'degraded' ? 'warning' : 'success',
        meta: (a.models || []).join(', ') || null,
        cells: [a.name, (a.providers || []).join(', ') || '—', num(a.requests),
                num(a.tokens_total),
                // null cost is "nothing reported one", which is not the same as $0.
                a.cost != null ? `$${num(a.cost, 2)}` : 'not reported',
                badge(a.status || 'unknown')],
      })),
  },

  aiCost: {
    // Columns: Tool · Vendor · Tokens MTD · Spend MTD · Budget · Status. Spend comes
    // from the agents, the ceiling from /finops/budgets; joining them is what lets the
    // status say over or under rather than just "tracked".
    load: async (api) => ({
      tools: await api.agents.list(),
      // A tenant with no budgets is the normal case, not an error — the column falls
      // back to "no budget set" exactly as before.
      budgets: await api.finops.budgets({ scope: 'ai' }).catch(() => []),
    }),
    rows: ({ tools, budgets }) =>
      (tools || []).map((a) => {
        const budget = (budgets || []).find((b) => b.target === a.name)
          || (budgets || []).find((b) => b.target === '*');
        const limit = budget ? Number(budget.monthly_limit) : null;
        const over = limit != null && a.cost != null && a.cost > limit;
        return {
          icon: 'fa-coins',
          iconColor: over ? 'danger' : a.cost == null ? 'secondary' : 'warning',
          meta: `${num(a.tokens_in)} in · ${num(a.tokens_out)} out`,
          cells: [a.name, (a.providers || []).join(', ') || '—', num(a.tokens_total),
                  a.cost != null ? `$${num(a.cost, 2)}` : 'not reported',
                  limit != null ? `${budget.currency || 'USD'} ${num(limit, 2)}/mo` : 'no budget set',
                  badge(limit == null ? (a.cost == null ? 'Unmetered' : 'Tracked')
                        : over ? 'Over budget' : 'Within budget')],
          actions: budget ? [{ key: 'deleteBudget', arg: budget.id, label: 'Clear budget' }] : [],
        };
      }),
  },

  /* --- cloud cost --------------------------------------------------------- */

  /**
   * Columns: Account · Cloud · MTD · Budget · Variance · Status.
   *
   * Spend comes from Cost Explorer, the ceiling from /finops/budgets — the same split
   * as the AI cost table above, and the same reason for it: a tenant with no budgets is
   * the normal case, so a missing ceiling is a column that says so rather than an error.
   *
   * Variance is signed against the budget, which is the number the operator actually
   * acts on: "+7.6%" means over by that much, and with no budget there is nothing to be
   * over, so it stays a dash instead of being computed against zero.
   */
  cloudCost: {
    /* The four cards above this table are the same three numbers rolled up, so they are
       published from here rather than fetched again. `accountsOverBudget` needs the
       budgets too, which is the other reason the join lives on this side. */
    stats: ({ cost, budgets }) => {
      const currency = (cost && cost.currency) || 'USD';
      const money = (v) => (v == null ? '—' : `${currency} ${num(v, 2)}`);
      const over = ((cost && cost.accounts) || []).filter((a) => {
        const budget = (budgets || []).find((b) => b.target === a.account)
          || (budgets || []).find((b) => b.target === '*');
        return budget && a.mtd > Number(budget.monthly_limit);
      }).length;
      const total = cost && cost.mtd_total;
      const forecast = cost && cost.forecast_month_end;
      return {
        mtdSpend: { value: money(total), delta: cost?.period_start ? `since ${cost.period_start}` : 'no data' },
        forecastEom: {
          value: money(forecast),
          // Cost Explorer declines to forecast a new account or the last day of a
          // month. That is an answer, and it should not read as $0.
          delta: forecast == null ? 'not enough history'
            : total ? `${forecast > total ? '+' : ''}${pct(((forecast - total) / total) * 100, 0)} vs MTD`
            : 'projected',
        },
        accountsOverBudget: {
          value: num(over),
          delta: `of ${num(((cost && cost.accounts) || []).length)}`,
        },
      };
    },
    load: async (api) => ({
      cost: await api.finops.cloudCost(),
      budgets: await api.finops.budgets({ scope: 'cloud' }).catch(() => []),
    }),
    rows: ({ cost, budgets }) => {
      /* An account Cost Explorer refused is one row saying why. Returning [] here would
         render "Nothing here yet", which reads as a $0 bill rather than a missing
         permission — and `ce:GetCostAndUsage` missing from the role is the single most
         likely reason this table is empty. */
      if (cost && cost.error) {
        return [{
          icon: 'fa-triangle-exclamation',
          iconColor: 'danger',
          meta: cost.error,
          cells: ['AWS Cost Explorer', 'AWS', '—', '—', '—',
                  badge('Unavailable')],
        }];
      }
      const currency = (cost && cost.currency) || 'USD';
      return ((cost && cost.accounts) || []).map((a) => {
        const budget = (budgets || []).find((b) => b.target === a.account)
          || (budgets || []).find((b) => b.target === '*');
        const limit = budget ? Number(budget.monthly_limit) : null;
        const variance = limit ? ((a.mtd - limit) / limit) * 100 : null;
        const over = variance != null && variance > 0;
        return {
          iconSet: 'fa-brands',
          icon: 'fa-aws',
          iconColor: over ? 'danger' : 'warning',
          meta: a.account,
          cells: [a.account, a.cloud || 'AWS',
                  `${currency} ${num(a.mtd, 2)}`,
                  limit != null ? `${budget.currency || currency} ${num(limit, 2)}/mo` : 'no budget set',
                  variance != null ? `${variance > 0 ? '+' : ''}${pct(variance, 1)}` : '—',
                  badge(limit == null ? 'Untracked' : over ? 'Over' : 'On track')],
          actions: budget ? [{ key: 'deleteBudget', arg: budget.id, label: 'Clear budget' }] : [],
        };
      });
    },
  },

  aiGateway: {
    load: (api) => api.agents.gateway(),
    rows: (data) =>
      (data?.models || []).map((m) => ({
        icon: 'fa-network-wired',
        iconColor: 'primary',
        meta: (m.consumers || []).join(', ') || null,
        cells: [(m.routes || [])[0] || m.model, m.provider || '—', m.model,
                (m.routes || []).slice(1).join(', ') || 'none',
                num(m.requests),
                badge(m.requests ? 'Serving' : 'Idle')],
      })),
  },

  /* --- gateways, cloud, data --------------------------------------------- */

  agentWorkflows: {
    load: (api) => api.agents.workflows({ limit: 50 }),
    rows: (data) =>
      (data || []).map((w) => ({
        icon: 'fa-code-branch',
        iconColor: w.status === 'failed' ? 'danger' : 'success',
        meta: w.id,
        cells: [w.name, num(w.agents), `${num(w.completed_steps)} / ${num(w.steps)}`,
                w.duration_ms != null ? `${num(w.duration_ms, 1)}ms` : '—',
                w.started_at || '—', badge(w.status || 'unknown')],
      })),
  },

  agentEvaluations: {
    // The per-metric rollup rather than the raw annotations: "is faithfulness passing"
    // is the question this table exists to answer.
    load: (api) => api.agents.evaluations(),
    rows: (data) =>
      (data?.summary?.by_metric || []).map((m) => ({
        icon: 'fa-flask',
        iconColor: m.pass_rate == null ? 'secondary' : m.pass_rate < 0.9 ? 'warning' : 'success',
        meta: `${num(m.count)} annotations`,
        cells: [m.name, num(m.count),
                m.avg_score != null ? num(m.avg_score, 3) : 'not scored',
                m.pass_rate != null ? pct(m.pass_rate * 100, 1) : '—',
                num(data.summary.evaluated_spans),
                badge(m.pass_rate == null ? 'Unscored' : m.pass_rate < 0.9 ? 'Below target' : 'Passing')],
      })),
  },

  gateways: {
    // /gateways/status describes the one gateway this organization connected — one row,
    // or none, which is the truthful answer before anybody connects one.
    load: (api) => api.gateways.status(),
    rows: (data) => {
      if (!data || !data.configured) return [];
      /* masked_config() nests the connection form under `fields`; reading account and
         region off the top level (as this did) found nothing and printed two dashes on
         a working connection. Which field answers "which account" differs per provider
         — Apigee has an org, Azure a resource id, AWS only a region and an API name —
         so each column takes the first field of its provider that answers it. */
      const fields = data.fields || {};
      const account = fields.org || fields.resource_id || fields.api_name || fields.metrics_url || '—';
      const region = fields.region || fields.environment || '—';
      return [{
        icon: 'fa-plug',
        iconColor: data.reachable ? 'success' : 'danger',
        meta: data.error || null,
        cells: [data.label || data.provider, data.provider || '—',
                account, region,
                num(data.routes),
                badge(data.reachable ? 'Connected' : 'Unreachable')],
      }];
    },
  },

  /**
   * Columns: Account · Cloud · Type · Resources · Alerts · Status.
   *
   * Two things tie a tenant to a cloud, and the page only ever showed one of them: the
   * Lambda connector, and the API gateway they connected under API Gateway. A managed
   * gateway *is* a cloud account in use — AWS API Gateway, Azure API Management, Apigee
   * on GCP — so it gets its own row here instead of that fact living on one tab only.
   */
  cloudLambda: {
    load: async (api) => ({
      lambda: await api.awsLambda.overview().catch(() => null),
      gateway: await api.gateways.status().catch(() => null),
    }),
    rows: ({ lambda, gateway }) => {
      const rows = [];
      /* An account whose credentials AWS rejected is the case this row kept getting
         wrong: it counted zero functions and still said Healthy. `error` is why the
         numbers are zero, and it belongs in front of the operator who just saved the
         connection — that is the only way "connected but nothing is updating" is
         distinguishable from "connected and quiet". */
      if (lambda) {
        const failed = Boolean(lambda.error);
        rows.push({
          icon: 'fa-aws',
          iconSet: 'fa-brands',
          iconColor: failed || lambda.errorRate > 0.05 ? 'danger' : 'warning',
          meta: lambda.error
            || `${lambda.source} · ${num(lambda.invocationsPerMinute)} inv/min`,
          cells: [`AWS Lambda · ${lambda.region}`, 'AWS', 'Serverless',
                  num(lambda.functions), num(lambda.activeAlarms),
                  badge(!lambda.configured ? 'Not connected'
                    : failed ? 'Auth failed'
                    : lambda.errorRate > 0.05 ? 'Degraded' : 'Healthy')],
        });
      }
      /* Only the managed gateways say anything about a cloud account. A self-hosted
         Kong or APISIX runs wherever the tenant put it, so it is not a cloud row. */
      const CLOUD_OF = { aws: ['AWS', 'fa-aws'], azure: ['Azure', 'fa-microsoft'],
                         apigee: ['GCP', 'fa-google'] };
      const cloud = gateway && gateway.configured && CLOUD_OF[gateway.provider];
      if (cloud) {
        rows.push({
          icon: cloud[1],
          iconSet: 'fa-brands',
          iconColor: gateway.reachable ? 'success' : 'danger',
          meta: gateway.error || 'API gateway connected under API Gateway',
          cells: [gateway.label || gateway.provider, cloud[0], 'API gateway',
                  num(gateway.routes), '—',
                  badge(gateway.reachable ? 'Connected' : 'Unreachable')],
        });
      }
      return rows;
    },
  },

  dataTables: {
    /* /data-observability/tables needs a catalog, and which catalogs exist is itself an
       API answer — so ask Databricks first and watch the first one. Picking a catalog
       belongs in a selector on the page; until there is one, first is the useful default. */
    load: async (api) => {
      const catalogs = await api.databricks.catalogs();
      const catalog = (catalogs || [])[0];
      if (!catalog) return [];
      return api.dataObservability.tables({ catalog });
    },
    rows: (data) =>
      (data || []).map((t) => ({
        icon: 'fa-table',
        iconColor: t.status === 'stale' ? 'warning' : t.status === 'failed' ? 'danger' : 'success',
        meta: t.schema || t.schema_name || null,
        cells: [t.full_name || t.name, t.catalog || '—',
                t.row_count != null ? num(t.row_count) : '—',
                t.last_altered || t.freshness || '—',
                t.null_rate != null ? pct(t.null_rate * 100, 2) : '—',
                badge(t.status || 'Watching')],
      })),
  },

  orchestration: {
    // Orchestration and ETL share one connector surface in the backend; this table is
    // the execution stream rather than the per-platform rollup on `etl`.
    load: (api) => api.etl.executions({ limit: 50 }),
    rows: (data) =>
      (data || []).map((e) => ({
        icon: 'fa-wind',
        iconColor: e.status === 'failed' ? 'danger' : e.status === 'running' ? 'info' : 'success',
        meta: e.platform || null,
        cells: [e.job_name || e.name || e.execution_id, num(e.records ?? e.rows),
                e.duration_seconds != null ? `${num(e.duration_seconds, 1)}s` : '—',
                e.error || '—', e.started_at || e.finished_at || '—',
                badge(e.status || 'unknown')],
        action: e.status === 'failed' ? { key: 'retryEtlExecution', arg: e.execution_id || e.id, label: 'Retry' } : undefined,
      })),
  },

  /* --- alerts, platform, org --------------------------------------------- */

  alerts: {
    load: (api) => api.alertManagement.alerts({ limit: 50 }),
    rows: (data) =>
      (data || []).map((e) => {
        const d = e.data || {};
        const severity = String(d.severity || 'info').toLowerCase();
        return {
          icon: 'fa-bell',
          iconColor: severity === 'critical' ? 'danger' : severity === 'warning' ? 'warning' : 'info',
          meta: e.id,
          cells: [d.title || d.message || e.type, e.source || '—', badge(severity),
                  d.owner || d.team || 'unassigned', e.timestamp || '—',
                  badge(d.status || 'Open')],
        };
      }),
  },

  sla: {
    // /alert-management/sla returns the whole dashboard; `metrics` is the per-rule view,
    // which is what a policy table is.
    load: (api) => api.alertManagement.sla(),
    rows: (data) =>
      (data?.metrics || []).map((m) => ({
        icon: 'fa-stopwatch',
        iconColor: m.compliance_pct < 95 ? 'danger' : m.compliance_pct < 99 ? 'warning' : 'info',
        meta: m.escalate_to ? `escalates to ${m.escalate_to}` : 'no escalation',
        cells: [m.name || `${m.priority} response`, m.priority || '—',
                m.ack_minutes != null ? `${num(m.ack_minutes)}m` : '—',
                m.target_minutes != null ? `${num(m.target_minutes)}m` : '—',
                pct(m.compliance_pct, 0),
                badge(m.breaches ? 'At risk' : 'Meeting')],
      })),
  },

  maintenanceWindows: {
    load: (api) => api.alertManagement.maintenanceWindows(),
    rows: (data) =>
      (data || []).map((w) => ({
        icon: 'fa-wrench',
        iconColor: w.status === 'active' ? 'warning' : 'secondary',
        meta: w.recurrence || 'one-off',
        cells: [w.name || w.id,
                (w.affected_services || []).join(', ') || 'all services',
                w.start_time || '—', w.end_time || '—',
                num(w.suppressed_alerts),
                badge(w.status || 'scheduled')],
        // Which action a window offers depends on where it is in its own life.
        action: w.status === 'active'
          ? { key: 'endMaintenanceWindow', arg: w.id, label: 'End' }
          : w.status === 'scheduled'
            ? { key: 'startMaintenanceWindow', arg: w.id, label: 'Start' }
            : undefined,
      })),
  },

  automationModels: {
    /* One table, two kinds of thing: the models that score signals and the agents that
       carry out what those scores trigger. They share the table because operationally
       they are one fleet — a stale agent breaks a healthy model's remediation. */
    load: async (api) => {
      const [models, agents] = await Promise.all([
        api.automation.models().catch(() => []),
        api.automation.agents().catch(() => []),
      ]);
      return { models: models || [], agents: agents || [] };
    },
    rows: (data) => {
      const models = (data.models || []).map((m) => ({
        icon: 'fa-brain',
        iconColor: m.status === 'retrain_due' ? 'warning' : 'primary',
        meta: m.task || m.category || null,
        cells: [m.name || m.id, 'Model', m.version || '—',
                m.accuracy != null ? pct(m.accuracy * 100, 1) : '—',
                m.last_trained_at || m.last_trained || '—',
                badge(m.status || 'serving')],
        action: { key: 'retrainModel', arg: m.id, label: 'Retrain' },
      }));
      const agents = (data.agents || []).map((a) => ({
        icon: 'fa-robot',
        iconColor: a.status === 'online' ? 'success' : 'warning',
        meta: [a.region, a.environment].filter(Boolean).join(' · ') || null,
        cells: [a.name || a.id, 'Agent', a.version || '—', '—',
                a.last_heartbeat ? `heartbeat ${a.last_heartbeat}` : 'no heartbeat',
                badge(a.status || 'unknown')],
        action: { key: 'rotateAgentKey', arg: a.id, label: 'Rotate key' },
      }));
      return models.concat(agents);
    },
  },

  pendingApprovals: {
    /* The automation engine's predictive insights are the approval queue: it proposes an
       action and holds. Approve/Reject POST to /automation/insights/{id}/{decision}. */
    load: (api) => api.automation.insights(),
    rows: (data) =>
      (data || []).map((i) => ({
        icon: 'fa-user-check',
        iconColor: i.priority === 'high' ? 'danger' : i.priority === 'low' ? 'info' : 'warning',
        meta: i.category || i.workflow || null,
        cells: [i.title || i.recommendation || i.description || 'Proposed action',
                i.source || 'Automation engine',
                i.confidence != null ? pct(i.confidence * 100, 0) : '—',
                i.impact || (i.affected_services || []).join(', ') || '—',
                i.age || i.created_at || '—',
                badge(i.priority || 'medium')],
        actions: [
          { key: 'approveInsight', arg: i.id, label: 'Approve', tone: 'primary' },
          { key: 'rejectInsight', arg: i.id, label: 'Reject' },
        ],
      })),
  },

  commandCenter: {
    // Five columns, hand-rolled: incident, area, impact, how long it has been open,
    // severity. Correlated incidents are exactly that list, already ranked.
    plain: true,
    load: (api) => api.correlation.incidents(),
    rows: (data) =>
      (data?.incidents || []).map((i) => ({
        cells: [i.title || i.key || 'Incident', i.root_cause || i.area || '—',
                `${num(i.service_count ?? (i.services || []).length)} services · ${num(i.alert_count ?? i.event_count)} alerts`,
                i.duration || '—',
                badge(i.severity || 'info')],
      })),
  },

  adminOrganizations: {
    load: (api) => api.admin.organizations(),
    rows: (data) =>
      (data || []).map((o) => ({
        icon: 'fa-building',
        iconColor: 'primary',
        meta: o.slug ? `${o.slug}.loveheartbeat.com` : o.id,
        cells: [o.name, o.plan || '—', num(o.seats), num(o.connectors),
                o.auth || 'password', badge(o.status || 'Active')],
        actions: [
          { key: 'editOrganization', arg: o.id || o.org_id, label: 'Edit' },
          { key: 'deleteOrganization', arg: o.id || o.org_id, label: 'Delete', tone: 'danger' },
        ],
      })),
  },

  adminUsers: {
    load: (api) => api.admin.users(),
    rows: (data) =>
      (data || []).map((u) => ({
        icon: 'fa-user',
        iconColor: u.role === 'super_admin' ? 'danger' : u.role === 'org_admin' ? 'warning' : 'info',
        meta: u.orgId || 'no organization',
        cells: [u.name || u.email, u.email, u.role || '—',
                (u.roles || []).join(', ') || '—', u.lastActive || '—',
                badge(u.status || 'active')],
        actions: [
          { key: 'editAdminUser', arg: u.email, label: 'Edit' },
          { key: 'removeAdminUser', arg: u.email, label: 'Remove', tone: 'danger' },
        ],
      })),
  },

  members: {
    /* Members are org-scoped, and which org this host is belongs to /tenant — so resolve
       it rather than asking the operator to paste an org id into the page. */
    load: async (api) => {
      /* /tenant answers { tenant: {...}, url } — reading org_id off the envelope
         instead of the org inside it made this table empty for everyone. */
      const { tenant } = (await api.tenant()) || {};
      const orgId = tenant && (tenant.org_id || tenant.orgId);
      if (!orgId) return [];
      return api.admin.organizationUsers(orgId);
    },
    rows: (data) =>
      (data || []).map((u) => ({
        icon: 'fa-user',
        iconColor: u.role === 'org_admin' ? 'warning' : 'info',
        meta: u.orgId || null,
        cells: [u.name || u.email, u.email, u.role || '—',
                u.auth || 'password', u.lastActive || '—',
                badge(u.status || 'active')],
        actions: [
          { key: 'editMember', arg: u.email, label: 'Edit' },
          { key: 'removeMember', arg: u.email, label: 'Remove', tone: 'danger' },
        ],
      })),
  },

  /**
   * Everyone waiting on a platform admin.
   *
   * Two different queues that both end in "this person cannot sign in yet", kept apart
   * because they are resolved by different endpoints: `pending_admin` users need a
   * global approval, join requests need one scoped to the organization they asked for.
   */
  adminApprovals: {
    load: (api) => api.admin.pendingApprovals(),
    rows: (data) =>
      (data || []).map((u) => ({
        icon: 'fa-user-clock',
        iconColor: 'warning',
        meta: u.org_id || u.orgId || 'no organization',
        cells: [u.name || u.email, u.email, u.role || (u.roles || []).join(', ') || '—',
                u.intent || '—', u.created_at || '—', badge(u.status || 'pending')],
        actions: [
          { key: 'approveUser', arg: u.email, label: 'Approve', tone: 'primary' },
          { key: 'denyUser', arg: u.email, label: 'Deny', tone: 'danger' },
        ],
      })),
  },

  adminJoinRequests: {
    load: (api) => api.admin.joinRequests(),
    /* Approve/deny need both the org and the email, and a row action carries one arg —
       so the pair rides in the arg as "org_id:email" and the action splits it. */
    rows: (data) =>
      (data || []).map((r) => ({
        icon: 'fa-user-plus',
        iconColor: 'warning',
        meta: r.org_id || null,
        cells: [r.name || r.email, r.org_name || r.org_id || '—',
                r.requested_role || r.role || 'user',
                r.domain_match === undefined ? '—' : (r.domain_match ? 'Yes' : 'No'),
                r.requested_at || r.created_at || '—',
                badge(r.status || 'pending')],
        actions: [
          { key: 'approveJoinRequest', arg: `${r.org_id}:${r.email}`, label: 'Approve', tone: 'primary' },
          { key: 'denyJoinRequest', arg: `${r.org_id}:${r.email}`, label: 'Deny', tone: 'danger' },
        ],
      })),
  },

  integrations: {
    /* One row per connector the backend can actually report on. Each answers separately,
       and a rejection is a row saying "not connected" rather than a missing line — a
       connector that is down and a connector that was never set up look identical when
       both are simply absent. */
    load: async (api) => {
      const probes = [
        ['AWS Lambda', 'Cloud', () => api.awsLambda.config()],
        ['API gateway', 'Gateway', () => api.gateways.status()],
        ['Databricks', 'Data', () => api.databricks.status()],
        ['Elasticsearch', 'Telemetry', () => api.elk.esHealth()],
      ];
      const etl = await api.etl.health().catch(() => []);
      const probed = await Promise.all(probes.map(async ([name, category, call]) => {
        try {
          const payload = await call();
          /* Only some of these report a `configured` flag. For the rest — Elasticsearch
             answering its health route, say — the call returning at all is the answer,
             so default to connected and let an explicit false override it. */
          return { name, category, configured: payload?.configured !== false, ...payload };
        } catch (err) {
          return { name, category, configured: false, error: err.message };
        }
      }));
      return { probed, etl: etl || [] };
    },
    rows: (data) => {
      /* Each row opens the same form its own page opens — the settings catalogue below
         the table lists them all, this is the shortcut from the row that is broken. */
      const CONFIGURE = {
        'AWS Lambda': 'connectAwsAccount',
        'API gateway': 'connectGateway',
        Databricks: 'connectDatabricks',
      };
      const rows = (data.probed || []).map((p) => ({
        icon: 'fa-plug',
        iconColor: p.configured ? 'success' : 'secondary',
        meta: p.error ? String(p.error).slice(0, 80) : null,
        cells: [p.name, p.category, p.feeds || p.category, p.last_sync || '—',
                p.credential || (p.configured ? 'stored' : 'none'),
                badge(p.configured ? (p.reachable === false ? 'Auth failed' : 'Connected') : 'Not connected')],
        action: CONFIGURE[p.name]
          ? { key: CONFIGURE[p.name], arg: '', label: p.configured ? 'Configure' : 'Connect' }
          : undefined,
      }));
      for (const e of data.etl || []) {
        rows.push({
          icon: 'fa-diagram-project',
          iconColor: e.configured ? 'success' : 'secondary',
          meta: e.mode || null,
          cells: [e.name || e.platform, 'ETL', 'ETL Monitoring', e.last_checked || '—',
                  e.configured ? 'stored' : 'none',
                  badge(e.status || (e.configured ? 'Connected' : 'Not connected'))],
          action: { key: ETL_CONFIG[etlPlatform(e.name || e.platform)] || 'connectEtl',
                    arg: '', label: e.configured ? 'Configure' : 'Connect' },
        });
      }
      return rows;
    },
  },

  healthEndpoints: {
    /* The three checks the platform can genuinely run against itself. Everything the
       static table lists beyond these is a customer endpoint nobody has registered. */
    load: async (api) => {
      const probe = async (name, check, call) => {
        const started = Date.now();
        try {
          const result = await call();
          return { name, check, rtt: Date.now() - started, ok: true, result };
        } catch (err) {
          return { name, check, rtt: Date.now() - started, ok: false, error: err.message };
        }
      };
      return Promise.all([
        probe('API', 'HTTP 200', () => api.health()),
        probe('Record store', 'Store reachable', () => api.storeHealth()),
        probe('Elasticsearch', 'Cluster health', () => api.elk.esHealth()),
      ]);
    },
    rows: (data) =>
      (data || []).map((p) => ({
        icon: 'fa-heart-pulse',
        iconColor: p.ok ? 'success' : 'danger',
        meta: p.error ? String(p.error).slice(0, 80) : null,
        cells: [p.name, p.check, (p.result && p.result.environment) || 'this stage',
                `${num(p.rtt)}ms`, '—',
                badge(p.ok ? ((p.result && p.result.status) || 'ok') : 'Failed')],
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

function cellHtml(cell, colKey, index, row, plain) {
  /* Hand-rolled tables (the log stream, the command-center incident list) have no icon
     column, so the avatar-style first cell the Obs mixin uses would look wrong there. */
  if (index === 0 && !plain) {
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

/**
 * Per-row buttons, when the source asks for them. Clicks are handled by the delegated
 * listener in actions.js, so nothing needs rebinding after a re-render.
 *
 * A row can ask for more than one — an approval queue needs Approve *and* Reject, and
 * a single button that decided both by whether you pressed OK or Cancel would make
 * "Cancel" mean "reject", which is the opposite of what Cancel means everywhere else.
 */
function actionHtml(row) {
  const actions = row.actions || (row.action ? [row.action] : []);
  if (!actions.length) return '';
  const buttons = actions.map((a) =>
    `<button type="button" class="btn btn-phoenix-${a.tone || 'secondary'} btn-sm" ` +
    `data-lhb-action="${esc(a.key)}" data-lhb-arg="${esc(a.arg)}">${esc(a.label)}</button>`
  ).join(' ');
  return `<td class="align-middle text-end pe-3"><div class="d-flex gap-1 justify-content-end">${buttons}</div></td>`;
}

function esc(value) {
  return String(value ?? '—').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/**
 * Replace a table's rows in place, keeping the header, search, and pagination markup.
 *
 * `tbody.list` and `th[data-sort]` are what the Obs mixin emits — List.js needs them.
 * A page that wrote its table by hand has neither, so fall back to the plain tbody and
 * positional column keys rather than refusing to hydrate it.
 */
function render(root, rows, plain) {
  const tbody = root.querySelector('tbody.list') || root.querySelector('tbody');
  if (!tbody) return;
  /* These rows are real, so they are no longer what the pre-paint rule hides. */
  tbody.removeAttribute('data-sample-rows');
  const keys = Array.from(root.querySelectorAll('thead th[data-sort]')).map((th) => th.dataset.sort);
  tbody.innerHTML = rows
    .map((row) => '<tr>' +
      row.cells.map((c, i) => cellHtml(c, keys[i] || `col${i}`, i, row, plain)).join('') +
      actionHtml(row) +
      '</tr>')
    .join('');
}

/** Remove a block and close the gap it leaves in the grid around it. */
function dropWithLayout(el) {
  const column = el.closest('[class*="col-"]');
  /* Only take the column when the block was all it held — a column with a second card
     in it still has something to show. */
  const target = column && column.children.length === 1 ? column : el;
  const row = target.parentElement;
  target.remove();
  if (!row || !row.classList.contains('row')) return;
  const survivors = Array.from(row.children);
  if (!survivors.length) {
    row.remove();
    return;
  }
  if (survivors.length === 1 && /(^|\s)col-/.test(survivors[0].className)) {
    const kept = survivors[0].className
      .replace(/(^|\s)col(-(sm|md|lg|xl|xxl))?(-\d+)?(?=\s|$)/g, ' ')
      .trim();
    survivors[0].className = kept ? `${kept} col-12` : 'col-12';
  }
}

/**
 * Wipe the sample rows a page ships as markup and say the table is empty.
 *
 * The samples were the fallback for an unreachable API. With mock data off they are the
 * wrong fallback: eight realistic rows read as real no matter what the badge says.
 */
function clearSamples(root) {
  const tbody = root.querySelector('tbody.list') || root.querySelector('tbody');
  if (!tbody || tbody.dataset.lhbCleared === '1') return;
  tbody.dataset.lhbCleared = '1';
  showEmpty(root);
}

/** Replace whatever a table is holding with a single "nothing here" row. */
function showEmpty(root) {
  const tbody = root.querySelector('tbody.list') || root.querySelector('tbody');
  if (!tbody) return;
  tbody.removeAttribute('data-sample-rows');
  const columns = root.querySelectorAll('thead th').length || 1;
  const cell = document.createElement('td');
  cell.className = 'text-center text-body-tertiary fs-9 py-4';
  cell.colSpan = columns;
  cell.textContent = 'Nothing here yet.';
  const row = document.createElement('tr');
  row.appendChild(cell);
  tbody.replaceChildren(row);
}

/**
 * Is somebody mid-way through reading this table?
 *
 * Either they have typed into its search box, or the focus is inside it — sorting,
 * paging, or about to press a row action. Both are reasons a background refresh should
 * wait for the next tick rather than pulling the rows out from under them.
 */
function isFiltering(root) {
  /* Checked by element rather than by one comma-joined selector: querySelector returns
     whichever matches first in document order, so a single query would answer for the
     search box on one table and the category select on the next. */
  const search = root.querySelector('input[type="search"]');
  if (search && search.value.trim()) return true;
  const filter = root.querySelector('[data-list-filter]');
  if (filter && filter.value) return true;
  return Boolean(document.activeElement) && root.contains(document.activeElement);
}

/**
 * Fill the stat cards a live source measured, by key.
 *
 * The blanking pass above has already set every card to "—", so this only ever writes
 * over a dash: a card whose key nothing publishes stays blank rather than keeping the
 * number that was typed into the template.
 */
function publishStats(stats) {
  for (const [key, stat] of Object.entries(stats || {})) {
    const value = document.querySelector(`[data-obs-stat-key="${key}"]`);
    if (value) value.textContent = stat.value;
    const delta = document.querySelector(`[data-obs-stat-delta-key="${key}"]`);
    if (delta && stat.delta != null) delta.textContent = stat.delta;
  }
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

/** How often a page re-reads every live table. */
const POLL_MS = 10_000;

let pollTimer = null;
let sweeping = false;
/* The one-time DOM work — blanking stat cards, dropping mock blocks, wiping sample
   rows — is done after the first sweep. Repeating it every ten seconds would be pure
   waste, and re-blanking a stat card the previous sweep had just measured would make
   every published number flash back to a dash. */
let primed = false;

/**
 * Re-read every live table on a fixed interval.
 *
 * Started by the first hydrate and never started twice: hydrate is also what a form
 * submit and the Refresh button call, and each of those spawning its own timer is how
 * a page ends up making six requests per tick by mid-session.
 */
function startPolling(api) {
  if (pollTimer || typeof window === 'undefined') return;
  pollTimer = window.setInterval(() => {
    /* A hidden tab is not being read, and every tick still costs the tenant a request
       per table. Browsers throttle background timers but do not stop them. */
    if (document.hidden || sweeping) return;
    sweep(api, true);
  }, POLL_MS);
}

/**
 * Hydrate every opted-in table on the page, and keep them hydrated.
 *
 * Failure is reported, never silent: an unreachable API or an expired session leaves
 * the sample rows visible and labels them, so nobody mistakes placeholder numbers for
 * live ones — which is the whole reason this badge exists.
 */
export async function hydrate(api) {
  startPolling(api);
  return sweep(api, false);
}

/**
 * One pass over every live table.
 *
 * `polled` separates the timer's pass from one somebody asked for: a poll leaves a
 * table the operator is filtering alone and does not flash "Loading…" over numbers that
 * are already on screen, where an explicit Refresh does both.
 */
async function sweep(api, polled) {
  sweeping = true;
  try {
    await sweepTables(api, polled);
  } finally {
    sweeping = false;
  }
}

async function sweepTables(api, polled) {
  /* Stat cards are markup, not measurements — nothing loads them. With mock data off
     they would be the last fabricated numbers left on the page, so blank them. */
  if (!MOCK_DATA && !primed) {
    /* Blank, then drop the attribute: the same attribute is what the stylesheet in
       <head> hides on, so removing it is what makes the dash visible. Without that the
       invented number is painted for one frame before this runs — which is exactly the
       flash of demo data this pair of rules exists to prevent. */
    for (const el of document.querySelectorAll('[data-obs-stat]')) {
      el.textContent = '—';
      el.removeAttribute('data-obs-stat');
    }
    for (const el of document.querySelectorAll('[data-obs-stat-delta]')) {
      el.textContent = 'no data';
      el.removeAttribute('data-obs-stat-delta');
    }
    /* Cards written by hand from invented rows — a trace waterfall, a critical-path
       list, "recent failures". Nothing loads them, so with mock data off they are
       removed rather than emptied: an always-blank card is its own kind of lie.
       Taking the card alone leaves its grid column standing, which is why the pages
       had a third of a row of nothing where one used to be — so the column goes with
       it, an emptied row goes too, and a lone survivor widens to fill the row. */
    for (const el of document.querySelectorAll('[data-mock-block]')) dropWithLayout(el);
  }
  /* Every sample table goes, not just the ones with a live source behind them. Two
     tables — "Spend by account" and "Orchestration platforms" — were never wired to an
     endpoint, so nothing ever cleared their invented rows and they read as real. */
  if (!MOCK_DATA && !primed) {
    for (const tbody of document.querySelectorAll('tbody[data-sample-rows]')) {
      const root = tbody.closest('.obs-list-root') || tbody.closest('.card') || tbody;
      clearSamples(root === tbody ? tbody.parentElement : root);
    }
  }
  const roots = document.querySelectorAll('[data-live-table]');
  primed = true;
  await Promise.all(Array.from(roots).map(async (root) => {
    const source = SOURCES[root.dataset.liveTable];
    if (!source) return;
    /* Re-rendering the tbody underneath somebody who has typed a filter throws away
       what they were looking at. A poll skips those tables; an explicit Refresh is a
       request to redraw and does not. */
    if (polled && isFiltering(root)) return;
    if (!MOCK_DATA) clearSamples(root);
    // Only an asked-for pass says "Loading…": a badge blinking every ten seconds reads
    // as instability, and the numbers beside it have not gone anywhere.
    if (!polled) mark(root, 'Loading…', 'info');
    try {
      const payload = await source.load(api);
      const rows = source.rows(payload);
      if (!rows.length) {
        // The call succeeded and the tenant genuinely has nothing registered yet. On a
        // repeat pass the table may still be holding the previous rows, so it is
        // emptied rather than left showing data the API no longer reports.
        if (!MOCK_DATA) showEmpty(root);
        mark(root, MOCK_DATA ? 'Sample data — none registered yet' : 'No data yet',
             MOCK_DATA ? 'warning' : 'secondary');
        return;
      }
      render(root, rows, source.plain);
      if (source.stats) publishStats(source.stats(payload));
      mark(root, 'Live', 'success');
    } catch (err) {
      const status = /API (\d{3})/.exec(err.message)?.[1];
      if (status === '401' || status === '403') mark(root, 'Sign in for live data', 'warning');
      else if (status === '501' || status === '503') mark(root, 'Not connected', 'secondary');
      else mark(root, MOCK_DATA ? 'Sample data — API unreachable' : 'API unreachable', 'warning');
    }
  }));
}
