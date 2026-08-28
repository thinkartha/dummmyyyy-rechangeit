/**
 * Frontend ↔ backend integration (multi-tenant SaaS).
 *
 * Tenant resolution:
 *   production → https://<slug>.loveheartbeat.com (Host header)
 *   local/dev  → set window.__TENANT_SLUG__ or X-Tenant-Slug
 *
 * Every method below maps to a route the Lambda backend actually serves; see
 * `backend/handlers/routers/` and the sample events in `backend/events/`.
 */

const API_BASE_URL =
  (typeof window !== 'undefined' && window.__API_BASE_URL__) ||
  'http://localhost:8000';

const TENANT_BASE_DOMAIN =
  (typeof window !== 'undefined' && window.__TENANT_BASE_DOMAIN__) ||
  'loveheartbeat.com';

const API_PREFIX = '/api/v1';
const TOKEN_KEY = 'lhb_access_token';
const REFRESH_KEY = 'lhb_refresh_token';
/* Cached copy of who the token says you are. Cleared with the token, never trusted on
   its own: the backend re-derives the principal from the bearer token on every call. */
const SESSION_KEY = 'lhb_session';

/* Environment selector for the shared API domain.
 *
 * app.loveheartbeat.com fronts three isolated backends (dev, qa, prod). The router
 * behind it picks one by matching this opaque HMAC token, which the frontend deploy
 * writes into runtime-config.js per stage. It selects an origin and nothing more —
 * authentication is still the selected backend's job — so it is not a credential,
 * but it is stage-specific and must not be hardcoded here.
 *
 * Empty when talking straight to a backend (local dev, or a per-stage API URL), in
 * which case no env parameter is sent at all. */
const ENV_TOKEN =
  (typeof window !== 'undefined' && window.__ENV_TOKEN__) || '';

function slugFromHostname(hostname = '') {
  const host = hostname.toLowerCase().split(':')[0];
  const suffix = `.${TENANT_BASE_DOMAIN}`;
  if (host.endsWith(suffix)) {
    const slug = host.slice(0, -suffix.length);
    return slug.includes('.') ? null : slug;
  }
  if (host.endsWith('.localhost')) {
    return host.slice(0, -'.localhost'.length);
  }
  return null;
}

function currentTenantSlug() {
  if (typeof window === 'undefined') return null;
  return (
    window.__TENANT_SLUG__ ||
    slugFromHostname(window.location.hostname) ||
    localStorage.getItem('lhb_tenant_slug') ||
    'rootvyana'
  );
}

function tenantUrl(slug) {
  return `https://${slug}.${TENANT_BASE_DOMAIN}`;
}

/* Session token. Stored so a reload keeps the user signed in; the backend still
   re-verifies it on every request, so this is a convenience, not a trust boundary. */
function read(key) {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key, value) {
  if (typeof window === 'undefined') return;
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {
    /* private mode, quota — a session that cannot be cached still works for this tab */
  }
}

function getToken() {
  if (typeof window === 'undefined') return null;
  return window.__API_TOKEN__ || read(TOKEN_KEY);
}

function setToken(token) {
  write(TOKEN_KEY, token);
}

function getRefreshToken() {
  return read(REFRESH_KEY);
}

function setRefreshToken(token) {
  write(REFRESH_KEY, token);
}

/** Who the current token belongs to, as the API last reported it. Null when signed out. */
function getSession() {
  const raw = read(SESSION_KEY);
  if (!raw || !getToken()) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setSession(session) {
  write(SESSION_KEY, session ? JSON.stringify(session) : null);
}

/** The one role the UI branches on, collapsed from the backend's role list. */
function roleOf(roles = []) {
  if (roles.includes('platform_admin')) return 'platform_admin';
  if (roles.includes('org_admin')) return 'org_admin';
  return 'member';
}

/** Drop every trace of the session. After this the password is the only way back in. */
function clearSession() {
  setToken(null);
  setRefreshToken(null);
  setSession(null);
}

/* One refresh at a time. A dashboard fires a dozen calls at once and an expired token
 * 401s all of them; without this they would race a dozen /auth/refresh calls, each
 * overwriting the last and all but one of the rotated refresh tokens being spent. */
let refreshInFlight = null;

/**
 * Trade the refresh token for a fresh access token.
 *
 * Returns the new token, or why there isn't one. The distinction matters: `expired`
 * ends the session, `unavailable` must not — a 503 or a cold Lambda is not a reason to
 * throw someone back to the sign-in page.
 *
 * Deliberately a bare fetch: a 401 from this call must not recurse into refresh again.
 */
function refreshAccessToken() {
  if (refreshInFlight) return refreshInFlight;

  const refresh_token = getRefreshToken();
  if (!refresh_token) return Promise.resolve({ reason: 'expired' });

  refreshInFlight = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}${API_PREFIX}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(withEnv({ refresh_token }))
      });
      if (response.status === 401) return { reason: 'expired' };
      if (!response.ok) return { reason: 'unavailable' };
      const payload = await response.json().catch(() => null);
      if (!payload || !payload.access_token) return { reason: 'unavailable' };
      setToken(payload.access_token);
      if (payload.refresh_token) setRefreshToken(payload.refresh_token);
      return { token: payload.access_token };
    } catch {
      return { reason: 'unavailable' };
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

function query(params = {}) {
  const pairs = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== null && value !== ''
  );
  if (ENV_TOKEN) pairs.push(['env', ENV_TOKEN]);
  return pairs.length ? `?${new URLSearchParams(pairs)}` : '';
}

/* Writes carry the selector in the JSON body: the router reads `env` from the body
 * for POST/PUT/PATCH so it never lands in access logs or browser history. */
function withEnv(body) {
  const payload = body || {};
  return ENV_TOKEN ? { ...payload, env: ENV_TOKEN } : payload;
}

async function request(path, options = {}) {
  const slug = currentTenantSlug();

  const send = (token) =>
    fetch(`${API_BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(slug ? { 'X-Tenant-Slug': slug } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      },
      ...options
    });

  const token = getToken();
  let response = await send(token);

  /* Access tokens last an hour. Rather than surfacing that to every panel as an auth
     error, spend the refresh token and retry once. Only a refresh the server actually
     rejected ends the session; an unreachable auth service leaves the tokens alone so
     the next attempt can try again. */
  if (response.status === 401 && token) {
    const fresh = await refreshAccessToken();
    if (fresh.token) {
      response = await send(fresh.token);
    } else if (fresh.reason === 'expired') {
      clearSession();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('lhb:session-expired'));
      }
    }
  }

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`API ${response.status}: ${detail || response.statusText}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

const get = (path, params) => request(`${API_PREFIX}${path}${query(params)}`);
const post = (path, body) =>
  request(`${API_PREFIX}${path}`, {
    method: 'POST',
    body: JSON.stringify(withEnv(body))
  });
const put = (path, body) =>
  request(`${API_PREFIX}${path}`, { method: 'PUT', body: JSON.stringify(withEnv(body)) });
const patch = (path, body) =>
  request(`${API_PREFIX}${path}`, { method: 'PATCH', body: JSON.stringify(withEnv(body)) });
const del = (path) => request(`${API_PREFIX}${path}${query()}`, { method: 'DELETE' });

export const api = {
  /* Platform + tenant */
  //- Unprefixed paths, but still routed: through app.loveheartbeat.com the env
  //- selector decides which stage answers, so it has to ride along here too.
  health: () => request(`/health${query()}`),
  storeHealth: () => request(`/health/store${query()}`),
  tenant: () => get('/tenant'),
  organizations: () => get('/organizations'),
  onboardOrganization: (body) => post('/organizations', body),

  /* Auth — login stores the tokens so later calls carry them automatically */
  auth: {
    /**
     * Exchange credentials for a session.
     *
     * Returns the raw token response. A Cognito account that has not confirmed its
     * email comes back with no access_token; the caller sends that user to /confirm
     * rather than treating it as a failure.
     */
    login: async (email, password) => {
      const result = await post('/auth/login', { email, password });
      if (result && result.access_token) {
        setToken(result.access_token);
        setRefreshToken(result.refresh_token || null);
        /* Roles come from /auth/me — the token's own claims, verified server-side —
           rather than from whatever login happened to echo back. If that call fails the
           token is still good, so fall back to the login payload. */
        let roles = result.roles || [];
        let orgId = result.org_id || null;
        try {
          const me = await get('/auth/me');
          roles = me.roles || roles;
          orgId = me.org_id ?? orgId;
        } catch {
          /* keep what login returned */
        }
        setSession({ email: result.sub || email, sub: result.sub || email, roles, orgId, role: roleOf(roles) });
      }
      return result;
    },
    register: (body) => post('/auth/register', body),
    confirm: (body) => post('/auth/confirm', body),
    forgotPassword: (email) => post('/auth/forgot-password', { email }),
    resetPassword: (body) => post('/auth/reset-password', body),
    refresh: (body) => post('/auth/refresh', body),
    apiKeyToken: (apiKey) => post('/auth/token', { api_key: apiKey }),
    me: () => get('/auth/me'),
    adminCheck: () => get('/auth/admin-check'),
    session: getSession,
    logout: clearSession
  },

  /* API monitoring */
  observability: {
    status: () => get('/observability/status'),
    routes: () => get('/observability/routes'),
    traces: (params) => get('/observability/traces', params),
    trace: (id) => get(`/observability/traces/${id}`)
  },

  /* AI monitoring — agents, tokens, evaluations */
  agents: {
    summary: () => get('/observability/agents/summary'),
    list: () => get('/observability/agents'),
    providers: () => get('/observability/agents/providers'),
    tokens: (params) => get('/observability/agents/tokens', params),
    workflows: () => get('/observability/agents/workflows'),
    evaluations: () => get('/observability/agents/evaluations'),
    logs: (params) => get('/observability/agents/logs', params),
    gateway: () => get('/observability/agents/gateway'),
    incidents: (params) => get('/observability/agents/incidents', params),
    incidentClusters: () => get('/observability/agents/incidents/clusters'),
    clusterBrief: (id) => get(`/observability/agents/incidents/clusters/${id}/brief`),
    dispatchCluster: (id, body) =>
      post(`/observability/agents/incidents/clusters/${id}/dispatch`, body),
    dispatches: () => get('/observability/agents/incidents/dispatches'),
    telemetry: (body) => post('/observability/agents/telemetry', body)
  },

  /* API gateway (AWS API Gateway, Azure APIM, Apigee, APISIX) */
  gateways: {
    summary: () => get('/gateways/summary'),
    status: () => get('/gateways/status'),
    catalog: () => get('/gateways/catalog'),
    routes: () => get('/gateways/routes'),
    config: () => get('/gateways/config'),
    saveConfig: (body) => put('/gateways/config', body),
    deleteConfig: () => del('/gateways/config'),
    createCustomer: (body) => post('/gateways/customer', body),
    customer: (id) => get(`/gateways/customer/${id}`),
    validateCutover: (id, body) => post(`/gateways/${id}/validate-cutover`, body)
  },

  /* ETL / ELT monitoring */
  etl: {
    summary: () => get('/integrations/etl/summary'),
    health: () => get('/integrations/etl/health'),
    events: (params) => get('/integrations/etl/events', params),
    executions: (params) => get('/integrations/etl/executions', params),
    incidents: (params) => get('/integrations/etl/incidents', params),
    retry: (id) => post(`/integrations/etl/executions/${id}/retry`),
    poll: (platform) => post(`/integrations/etl/${platform}/poll`),
    /* Push one execution event in, for platforms that webhook rather than being polled. */
    event: (platform, body) => post(`/integrations/etl/${platform}`, body),
    execute: (platform, body) => post(`/integrations/etl/${platform}/execute`, body),
    /* platform is 'talend' | 'boomi' | 'databricks'. Databricks keeps its
       connection config under api.databricks.* — it is shared with Data
       Observability rather than owned by the ETL connector. */
    config: (platform) => get(`/integrations/etl/${platform}/config`),
    saveConfig: (platform, body) => put(`/integrations/etl/${platform}/config`, body),
    testConfig: (platform, body) => post(`/integrations/etl/${platform}/config/test`, body),
    demoSeed: () => post('/integrations/etl/demo-seed')
  },

  /* Alerts — clustering and noise reduction */
  alerts: {
    clusters: (params) => get('/alerts/clusters', params),
    cluster: (body) => post('/alerts/clusters', body),
    brief: (id) => get(`/alerts/clusters/${id}/brief`)
  },

  /* Alert management — routing, maintenance windows, SLA */
  alertManagement: {
    alerts: (params) => get('/alert-management/alerts', params),
    routingRules: () => get('/alert-management/routing-rules'),
    createRoutingRule: (body) => post('/alert-management/routing-rules', body),
    updateRoutingRule: (id, body) => patch(`/alert-management/routing-rules/${id}`, body),
    deleteRoutingRule: (id) => del(`/alert-management/routing-rules/${id}`),
    testRoutingRule: (id, body) => post(`/alert-management/routing-rules/${id}/test`, body),
    maintenanceWindows: () => get('/alert-management/maintenance-windows'),
    createMaintenanceWindow: (body) => post('/alert-management/maintenance-windows', body),
    updateMaintenanceWindow: (id, body) =>
      patch(`/alert-management/maintenance-windows/${id}`, body),
    deleteMaintenanceWindow: (id) => del(`/alert-management/maintenance-windows/${id}`),
    /* action is 'start' | 'end' | 'cancel' — the backend validates which it accepts. */
    maintenanceWindowAction: (id, action) =>
      post(`/alert-management/maintenance-windows/${id}/${action}`),
    sla: () => get('/alert-management/sla'),
    createSlaRule: (body) => post('/alert-management/sla/rules', body),
    updateSlaRule: (id, body) => patch(`/alert-management/sla/rules/${id}`, body),
    deleteSlaRule: (id) => del(`/alert-management/sla/rules/${id}`)
  },

  /* Automation — rules, ML models, remediation agents */
  automation: {
    summary: () => get('/automation/summary'),
    settings: () => get('/automation/settings'),
    saveSettings: (body) => put('/automation/settings', body),
    rules: () => get('/automation/rules'),
    createRule: (body) => post('/automation/rules', body),
    updateRule: (id, body) => patch(`/automation/rules/${id}`, body),
    deleteRule: (id) => del(`/automation/rules/${id}`),
    runRule: (id) => post(`/automation/rules/${id}/run`),
    executions: (params) => get('/automation/executions', params),
    insights: () => get('/automation/insights'),
    decideInsight: (id, decision) => post(`/automation/insights/${id}/${decision}`),
    models: () => get('/automation/models'),
    model: (id) => get(`/automation/models/${id}`),
    updateModel: (id, body) => patch(`/automation/models/${id}`, body),
    retrainModel: (id) => post(`/automation/models/${id}/retrain`),
    trainingRuns: () => get('/automation/training-runs'),
    agents: () => get('/automation/agents'),
    createAgent: (body) => post('/automation/agents', body),
    updateAgent: (id, body) => patch(`/automation/agents/${id}`, body),
    deleteAgent: (id) => del(`/automation/agents/${id}`),
    agentHeartbeat: (id, body) => post(`/automation/agents/${id}/heartbeat`, body),
    agentInstall: (id) => get(`/automation/agents/${id}/install`),
    rotateAgentKey: (id) => post(`/automation/agents/${id}/rotate-key`)
  },

  /* Custom AI models */
  aiModels: {
    summary: () => get('/ai-models/summary'),
    list: () => get('/ai-models'),
    failures: (params) => get('/ai-models/failures', params),
    timeseries: (params) => get('/ai-models/timeseries', params),
    thresholds: () => get('/ai-models/thresholds'),
    saveThresholds: (body) => put('/ai-models/thresholds', body),
    /* Declaring a model gives it a row before its first inference lands — otherwise a
       deployed-but-silent model is indistinguishable from one nobody set up. */
    register: (body) => post('/ai-models', body),
    unregister: (model) => del(`/ai-models/${encodeURIComponent(model)}`),
    recordInference: (body) => post('/ai-models/inferences', body),
    recordInferences: (body) => post('/ai-models/inferences/batch', body)
  },

  /* Database monitoring */
  databases: {
    summary: () => get('/databases/summary'),
    list: () => get('/databases'),
    engines: () => get('/databases/engines'),
    health: () => get('/databases/health'),
    databaseHealth: (id) => get(`/databases/${id}/health`),
    add: (body) => post('/databases', body),
    test: (body) => post('/databases/test', body),
    remove: (id) => del(`/databases/${id}`)
  },

  /* Data observability (Databricks / Unity Catalog) */
  dataObservability: {
    status: () => get('/data-observability/status'),
    tables: (params) => get('/data-observability/tables', params),
    table: (fullName) => get(`/data-observability/tables/${fullName}`),
    scan: (body) => post('/data-observability/scan', body)
  },

  databricks: {
    status: () => get('/databricks/status'),
    config: () => get('/databricks/config'),
    saveConfig: (body) => put('/databricks/config', body),
    deleteConfig: () => del('/databricks/config'),
    catalogs: () => get('/databricks/catalogs'),
    schemas: (params) => get('/databricks/schemas', params),
    tables: (params) => get('/databricks/tables', params),
    table: (fullName) => get(`/databricks/tables/${fullName}`),
    query: (body) => post('/databricks/query', body)
  },

  /* Cloud cost + reliability */
  finops: {
    recommendations: () => get('/finops/recommendations'),
    /* Monthly ceilings. `scope` is 'cloud' or 'ai'; the Budget column on both cost
       pages is this joined against the spend they already report. */
    budgets: (params) => get('/finops/budgets', params),
    saveBudget: (body) => post('/finops/budgets', body),
    deleteBudget: (id) => del(`/finops/budgets/${id}`)
  },
  slo: { list: () => get('/slo') },
  drift: { list: () => get('/drift') },
  correlation: {
    incidents: (params) => get('/correlated-incidents', params),
    /* Same correlation, recomputed from the live event spine rather than the store. */
    stream: () => get('/stream/incidents')
  },
  rca: { forIncident: (id) => get(`/incidents/${id}/rca`) },

  /* AWS Lambda integration */
  awsLambda: {
    overview: () => get('/integrations/aws/lambda/overview'),
    config: () => get('/integrations/aws/lambda/config'),
    saveConfig: (body) => put('/integrations/aws/lambda/config', body),
    invocations: (params) => get('/integrations/aws/lambda/invocations', params),
    invoke: (body) => post('/integrations/aws/lambda/invoke', body),
    retry: (id) => post(`/integrations/aws/lambda/invocations/${id}/retry`),
    poll: () => post('/integrations/aws/lambda/poll')
  },

  /* ELK — logs, metrics, traces */
  elk: {
    esHealth: () => get('/health/es'),
    searchLogs: (params) => get('/logs/search', params),
    searchMetrics: (params) => get('/metrics/search', params),
    searchTraces: (params) => get('/traces/search', params),
    ingestLog: (body) => post('/logs/ingest', body),
    ingestMetric: (body) => post('/metrics/ingest', body),
    ingestTrace: (body) => post('/traces/ingest', body),
    ingestLogs: (body) => post('/logs/ingest-batch', body),
    ingestMetrics: (body) => post('/metrics/ingest-batch', body),
    ingestTraces: (body) => post('/traces/ingest-batch', body)
  },

  /* Event ingest */
  ingest: {
    event: (body) => post('/ingest/events', body),
    pagerduty: (body) => post('/ingest/pagerduty', body),
    servicenow: (body) => post('/ingest/servicenow', body),
    recent: (params) => get('/events', params)
  },

  /* Platform + org administration */
  admin: {
    analytics: () => get('/admin/analytics'),
    users: (params) => get('/admin/users', params),
    createUser: (body) => post('/admin/users', body),
    user: (email) => get(`/admin/users/${email}`),
    updateUser: (email, body) => put(`/admin/users/${email}`, body),
    deleteUser: (email) => del(`/admin/users/${email}`),
    approveUser: (email) => post(`/admin/users/${email}/approve`),
    denyUser: (email) => post(`/admin/users/${email}/deny`),
    pendingApprovals: () => get('/admin/pending-approvals'),
    organizations: () => get('/admin/organizations'),
    createOrganization: (body) => post('/admin/organizations', body),
    organization: (id) => get(`/admin/organizations/${id}`),
    updateOrganization: (id, body) => put(`/admin/organizations/${id}`, body),
    deleteOrganization: (id) => del(`/admin/organizations/${id}`),
    organizationUsers: (id) => get(`/admin/organizations/${id}/users`),
    updateOrganizationUser: (id, email, body) =>
      put(`/admin/organizations/${id}/users/${email}`, body),
    removeOrganizationUser: (id, email) => del(`/admin/organizations/${id}/users/${email}`),
    invite: (id, body) => post(`/admin/organizations/${id}/invite`, body),
    joinRequests: () => get('/admin/join-requests'),
    organizationJoinRequests: (id) => get(`/admin/organizations/${id}/join-requests`),
    decideJoinRequest: (id, email, body) =>
      post(`/admin/organizations/${id}/join-requests/${email}`, body)
  },

  /* Generic escape hatches for routes not wrapped above */
  list: (resource, params) => get(`/${resource}`, params),
  get: (resource, id) => get(`/${resource}/${id}`),
  create: (resource, body) => post(`/${resource}`, body)
};

export {
  API_BASE_URL,
  API_PREFIX,
  ENV_TOKEN,
  TENANT_BASE_DOMAIN,
  currentTenantSlug,
  clearSession,
  getSession,
  getToken,
  refreshAccessToken,
  roleOf,
  setSession,
  setToken,
  tenantUrl,
  request
};
