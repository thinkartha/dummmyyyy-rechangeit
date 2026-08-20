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
function getToken() {
  if (typeof window === 'undefined') return null;
  return window.__API_TOKEN__ || localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

function query(params = {}) {
  const pairs = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== null && value !== ''
  );
  return pairs.length ? `?${new URLSearchParams(pairs)}` : '';
}

async function request(path, options = {}) {
  const slug = currentTenantSlug();
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(slug ? { 'X-Tenant-Slug': slug } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    ...options
  });

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
    body: JSON.stringify(body || {})
  });
const put = (path, body) =>
  request(`${API_PREFIX}${path}`, { method: 'PUT', body: JSON.stringify(body || {}) });
const patch = (path, body) =>
  request(`${API_PREFIX}${path}`, { method: 'PATCH', body: JSON.stringify(body || {}) });
const del = (path) => request(`${API_PREFIX}${path}`, { method: 'DELETE' });

export const api = {
  /* Platform + tenant */
  health: () => request('/health'),
  storeHealth: () => request('/health/store'),
  tenant: () => get('/tenant'),
  organizations: () => get('/organizations'),
  onboardOrganization: (body) => post('/organizations', body),

  /* Auth — login stores the token so later calls carry it automatically */
  auth: {
    login: async (email, password) => {
      const session = await post('/auth/login', { email, password });
      if (session && session.access_token) setToken(session.access_token);
      return session;
    },
    register: (body) => post('/auth/register', body),
    confirm: (body) => post('/auth/confirm', body),
    forgotPassword: (email) => post('/auth/forgot-password', { email }),
    resetPassword: (body) => post('/auth/reset-password', body),
    refresh: (body) => post('/auth/refresh', body),
    me: () => get('/auth/me'),
    adminCheck: () => get('/auth/admin-check'),
    logout: () => setToken(null)
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
    enroll: (body) => post('/gateways/enroll', body),
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
    retrainModel: (id) => post(`/automation/models/${id}/retrain`),
    trainingRuns: () => get('/automation/training-runs'),
    agents: () => get('/automation/agents'),
    createAgent: (body) => post('/automation/agents', body),
    deleteAgent: (id) => del(`/automation/agents/${id}`),
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
    query: (body) => post('/databricks/query', body)
  },

  /* Cloud cost + reliability */
  finops: { recommendations: () => get('/finops/recommendations') },
  slo: { list: () => get('/slo') },
  drift: { list: () => get('/drift') },
  correlation: { incidents: (params) => get('/correlated-incidents', params) },
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
  TENANT_BASE_DOMAIN,
  currentTenantSlug,
  getToken,
  setToken,
  tenantUrl,
  request
};
