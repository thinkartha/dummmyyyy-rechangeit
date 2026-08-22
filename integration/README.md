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

`auth.js` owns the six auth screens, the route guard, and the signed-in user in the navbar.
It follows the same rule as the other two modules: markup opts in with an attribute, and a
registry entry says what that attribute means.

```pug
+LayoutBasic()(data-lhb-auth='signin')
  input#email.form-control(type='text' name='email')
  input#password.form-control(type='password' name='password')
  button.btn.btn-primary(type='button' data-lhb-auth-submit) Sign In
```

| Flow | Calls | Ends at |
|------|-------|---------|
| `signin` | `/auth/login` | `?next=`, or the command center |
| `signup` | `/auth/register` | the code form, or a "waiting on approval" message |
| `confirm` | `/auth/confirm` | sign-in |
| `forgot` | `/auth/forgot-password` | the reset form |
| `reset` | `/auth/reset-password` | sign-in |
| `signout` | — | clears the session where it stands |

Sign-up covers all four registration intents (`solo`, `create_org`, `join_org`,
`accept_invite`); the picker shows only the extra field the chosen one needs.

### Tokens

`api.auth.login()` stores the access token **and** the refresh token. When a call 401s,
`request()` spends the refresh token once and retries — access tokens last an hour, and
without this every dashboard silently died after one. Only a refresh the *server rejected*
ends the session; a 5xx or a timeout leaves the tokens alone and the next call tries again.
When the session really is over, api-client fires `lhb:session-expired` and the guard turns
that into a redirect. The backend re-verifies every request, so stored tokens are
convenience, not a trust boundary.

### Guard

Pages under `/apps/observability/`, `/apps/platform/` and `/apps/organization/` show one
tenant's data and redirect signed-out visitors to sign-in, remembering where they were
going. The rest of the site is theme demonstration and stays open.

Local builds (`npm start`, output `public/`) emit `window.__LHB_REQUIRE_AUTH__ = false` so
you can browse without a backend to sign in against. The production build (`npm run build`,
`MODE=PROD`, output `build/`) does not, so the guard is on where it matters. Publishing a
public API-less demo? Set the same flag in `runtime-config.js`, or the guard bounces every
visitor to a sign-in page with nothing behind it.

### Session in the UI

| Attribute | Effect |
|-----------|--------|
| `data-lhb-user` / `data-lhb-role` | filled with the signed-in email and role |
| `data-lhb-signed-in` / `data-lhb-signed-out` | shown only in that state |
| `data-lhb-requires-role="platform_admin"` | hidden unless the role matches |
| `data-lhb-signout` | clears the session and returns to sign-in |
