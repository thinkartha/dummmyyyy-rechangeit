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
        action: { key: 'removeDatabase', arg: d.id || d.database_id, label: 'Remove' },
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
    // Columns: Service · Provider · Env · p99 · Errors · Status. The backend derives
    // these from stored spans, so "provider" is the operation's own gateway label when
    // the span carried one and blank when it did not.
    load: (api) => api.observability.routes(),
    rows: (data) =>
      (data || []).map((r) => ({
        icon: 'fa-route',
        iconColor: r.error_rate > 0.05 ? 'danger' : r.error_rate > 0.01 ? 'warning' : 'success',
        meta: Object.entries(r.by_code || {}).map(([code, n]) => `${code}×${n}`).join(' ') || null,
        cells: [r.route, r.provider || 'instrumented', r.environment || '—',
                r.p99_ms != null ? `${num(r.p99_ms)}ms` : '—',
                pct((r.error_rate || 0) * 100, 2),
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
    load: (api) => api.elk.searchLogs({ size: 50 }),
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
    // Columns: Tool · Vendor · Tokens MTD · Spend MTD · Budget · Status. There is no
    // budget endpoint (see UNSUPPORTED.setAiBudget), so that column stays honest.
    load: (api) => api.agents.list(),
    rows: (data) =>
      (data || []).map((a) => ({
        icon: 'fa-coins',
        iconColor: a.cost == null ? 'secondary' : 'warning',
        meta: `${num(a.tokens_in)} in · ${num(a.tokens_out)} out`,
        cells: [a.name, (a.providers || []).join(', ') || '—', num(a.tokens_total),
                a.cost != null ? `$${num(a.cost, 2)}` : 'not reported',
                'no budget set',
                badge(a.cost == null ? 'Unmetered' : 'Tracked')],
      })),
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
      return [{
        icon: 'fa-plug',
        iconColor: data.reachable ? 'success' : 'danger',
        meta: data.error || null,
        cells: [data.label || data.provider, data.provider || '—',
                data.account || data.project || '—', data.region || '—',
                num(data.routes),
                badge(data.reachable ? 'Connected' : 'Unreachable')],
      }];
    },
  },

  cloudLambda: {
    // Columns: Account · Cloud · Type · Resources · Alerts · Status. Lambda is the one
    // cloud integration the backend actually collects, so it is the one row shown live.
    load: (api) => api.awsLambda.overview(),
    rows: (data) => {
      if (!data) return [];
      return [{
        icon: 'fa-aws',
        iconSet: 'fa-brands',
        iconColor: data.errorRate > 0.05 ? 'danger' : 'warning',
        meta: `${data.source} · ${num(data.invocationsPerMinute)} inv/min`,
        cells: [`AWS Lambda · ${data.region}`, 'AWS', 'Serverless',
                num(data.functions), num(data.activeAlarms),
                badge(!data.configured ? 'Not connected'
                  : data.errorRate > 0.05 ? 'Degraded' : 'Healthy')],
      }];
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
      const tenant = await api.tenant();
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
      const rows = (data.probed || []).map((p) => ({
        icon: 'fa-plug',
        iconColor: p.configured ? 'success' : 'secondary',
        meta: p.error ? String(p.error).slice(0, 80) : null,
        cells: [p.name, p.category, p.feeds || p.category, p.last_sync || '—',
                p.credential || (p.configured ? 'stored' : 'none'),
                badge(p.configured ? (p.reachable === false ? 'Auth failed' : 'Connected') : 'Not connected')],
      }));
      for (const e of data.etl || []) {
        rows.push({
          icon: 'fa-diagram-project',
          iconColor: e.configured ? 'success' : 'secondary',
          meta: e.mode || null,
          cells: [e.name || e.platform, 'ETL', 'ETL Monitoring', e.last_checked || '—',
                  e.configured ? 'stored' : 'none',
                  badge(e.status || (e.configured ? 'Connected' : 'Not connected'))],
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
  const keys = Array.from(root.querySelectorAll('thead th[data-sort]')).map((th) => th.dataset.sort);
  tbody.innerHTML = rows
    .map((row) => '<tr>' +
      row.cells.map((c, i) => cellHtml(c, keys[i] || `col${i}`, i, row, plain)).join('') +
      actionHtml(row) +
      '</tr>')
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
      render(root, rows, source.plain);
      mark(root, 'Live', 'success');
    } catch (err) {
      const status = /API (\d{3})/.exec(err.message)?.[1];
      if (status === '401' || status === '403') mark(root, 'Sign in for live data', 'warning');
      else if (status === '501' || status === '503') mark(root, 'Not connected', 'secondary');
      else mark(root, 'Sample data — API unreachable', 'warning');
    }
  }));
}
