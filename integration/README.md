# Frontend ↔ backend integration

`api-client.js` is the browser's only route to the backend. Lambda lives in `../backend`;
ETL jobs live in `../middleware`.

## Configure

```html
<script>
  window.__API_BASE_URL__ = 'https://api.loveheartbeat.com';
  window.__TENANT_SLUG__ = 'rootvyana';        // local only — production uses the hostname
  window.__TENANT_BASE_DOMAIN__ = 'loveheartbeat.com';
</script>
```

Every request carries `X-Tenant-Slug` when a slug is known, so the backend can resolve
`org_id` without relying on wildcard DNS in local and preview environments.

## Use

```js
import { api, currentTenantSlug, tenantUrl } from './integration/api-client.js';

await api.tenant();                         // which organization am I?
await api.auth.login(email, password);      // stores the token for later calls
await api.observability.status();
await api.gateways.summary();
await api.etl.summary();
await api.alerts.clusters({ window: '24h' });
await api.automation.rules();
await api.databases.health();
```

| Namespace | Covers |
|-----------|--------|
| `api.auth` | Login, register, confirm, password reset, current principal |
| `api.observability` | API monitoring — status, routes, traces |
| `api.agents` | AI monitoring — agents, tokens, workflows, evals, AI gateway |
| `api.gateways` | API gateways — catalog, routes, enrollment, cutover |
| `api.etl` | ETL platforms — summary, executions, incidents, connector config |
| `api.alerts` / `api.alertManagement` | Clustering; routing rules, SLA, maintenance windows |
| `api.automation` | Rules, insights, ML models, remediation agents |
| `api.aiModels` | Custom model inference health and thresholds |
| `api.databases` / `api.dataObservability` / `api.databricks` | Database and data quality monitoring |
| `api.finops` / `api.slo` / `api.drift` / `api.correlation` / `api.rca` | Cost, error budgets, drift, incident correlation |
| `api.awsLambda` / `api.elk` / `api.ingest` | Lambda integration, log/metric/trace search, event ingest |
| `api.admin` | Platform administration — organizations, users, join requests |

`api.list` / `api.get` / `api.create` remain as escape hatches for routes not wrapped above.

## Auth

`api.auth.login()` stores the access token in `localStorage` and every later call sends it
as a bearer token. `api.auth.logout()` clears it. The backend re-verifies on every request,
so this is convenience, not a trust boundary.
