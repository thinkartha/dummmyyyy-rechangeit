import AppLayout from '@/components/app-layout'

export default function Page() {
  return (
    <AppLayout scripts={[
        {
          "code": "\n        var navbarTopStyle = window.config.config.phoenixNavbarTopStyle;\n        var navbarTop = document.querySelector('.navbar-top');\n        if (navbarTopStyle === 'darker') {\n          navbarTop.setAttribute('data-navbar-appearance', 'darker');\n        }\n\n        var navbarVerticalStyle = window.config.config.phoenixNavbarVerticalStyle;\n        var navbarVertical = document.querySelector('.navbar-vertical');\n        if (navbarVertical && navbarVerticalStyle === 'darker') {\n          navbarVertical.setAttribute('data-navbar-appearance', 'darker');\n        }\n      "
        },
        {
          "src": "/vendors/popper/popper.min.js"
        },
        {
          "src": "/vendors/bootstrap/bootstrap.min.js"
        },
        {
          "src": "/vendors/anchorjs/anchor.min.js"
        },
        {
          "src": "/vendors/is/is.min.js"
        },
        {
          "code": "\n      window.lhbReady = new Promise(function(resolve) {\n        window.__lhbResolve = resolve;\n      });\n    "
        },
        {
          "code": "\n      import {\n        api,\n        currentTenantSlug,\n        tenantUrl,\n        getToken,\n        setToken\n      } from '/assets/js/integration/api-client.js';\n      import {\n        hydrate\n      } from '/assets/js/integration/live-data.js';\n      import {\n        bind\n      } from '/assets/js/integration/actions.js';\n      import {\n        init as initAuth\n      } from '/assets/js/integration/auth.js';\n      import {\n        init as initAccount\n      } from '/assets/js/integration/account.js';\n      window.lhb = {\n        api,\n        currentTenantSlug,\n        tenantUrl,\n        getToken,\n        setToken\n      };\n      window.__lhbResolve(window.lhb);\n      //- The guard runs first: a page about to redirect a signed-out visitor should not\n      //- spend a round trip per table finding out it had no session.\n      //- .catch, not .then alone: a guard that throws must not take the page's data with\n      //- it — an unhydrated dashboard is a silent one.\n      initAuth().catch(() => {}).then(() => {\n        hydrate(api);\n        bind(api);\n        //- Paints the signed-in account onto any page that asks for it, and reveals the\n        //- owner-only block. Same .catch reasoning as the guard above.\n        initAccount().catch(() => {});\n      });\n    ",
          "module": true
        },
        {
          "src": "/vendors/fontawesome/all.min.js"
        },
        {
          "src": "/vendors/lodash/lodash.min.js"
        },
        {
          "src": "/vendors/list.js/list.min.js"
        },
        {
          "src": "/vendors/feather-icons/feather.min.js"
        },
        {
          "src": "/vendors/dayjs/dayjs.min.js"
        },
        {
          "src": "/assets/js/phoenix.js"
        }
      ]}>
      <nav className="mb-3" aria-label="breadcrumb">
        <ol className="breadcrumb mb-0">
          <li className="breadcrumb-item">
            <a href="#!">
              Organization
            </a>
          </li>
          <li className="breadcrumb-item active">
            Multi-tenant
          </li>
        </ol>
      </nav>
      <div className="mb-6">
        <div className="row align-items-center g-3">
          <div className="col">
            <h2 className="mb-2">
              Multi-tenant SaaS
            </h2>
            <h5 className="text-body-tertiary fw-semibold mb-0">
              LoveHeartBeat isolates every organization on its own slug subdomain — built for thousands of tenants
            </h5>
          </div>
        </div>
      </div>
      <div className="row g-3 mb-6">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="text-body-tertiary mb-2">
                    Design target
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat">
                    30k+
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-info" data-obs-stat-delta="data-obs-stat-delta">
                  orgs
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="text-body-tertiary mb-2">
                    URL model
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat">
                    slug
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-primary" data-obs-stat-delta="data-obs-stat-delta">
                  *.loveheartbeat.com
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="text-body-tertiary mb-2">
                    Plans
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat">
                    Trial → Ent
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-success" data-obs-stat-delta="data-obs-stat-delta">
                  self-serve + sales
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="text-body-tertiary mb-2">
                    Isolation
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat">
                    org_id
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-warning" data-obs-stat-delta="data-obs-stat-delta">
                  data + auth
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-6">
          <div className="card h-100">
            <div className="card-body">
              <h4 className="mb-3">
                Tenant URL model
              </h4>
              <p className="text-body-tertiary">
                Each organization gets a reserved slug that becomes its SaaS hostname:
              </p>
              <div className="bg-body-emphasis border border-translucent rounded-3 p-3 mb-3 font-monospace fs-9">
                https://&lt;organization-slug&gt;.loveheartbeat.com
              </div>
              <ul className="mb-0">
                <li>
                  <code>
                    rootvyana.loveheartbeat.com
                  </code>
                  <span className="text-body-tertiary">
                    — RootVyana
                  </span>
                </li>
                <li>
                  <code>
                    acme.loveheartbeat.com
                  </code>
                  <span className="text-body-tertiary">
                    — Acme Corp
                  </span>
                </li>
                <li>
                  <code>
                    contoso.loveheartbeat.com
                  </code>
                  <span className="text-body-tertiary">
                    — Contoso
                  </span>
                </li>
              </ul>
              <p className="text-body-tertiary fs-9 mb-0 mt-3">
                Apex
                <code className="mx-1">
                  loveheartbeat.com
                </code>
                handles marketing + login routing; subdomain resolves the tenant.
              </p>
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-6">
          <div className="card h-100">
            <div className="card-body">
              <h4 className="mb-3">
                Isolation model
              </h4>
              <p className="text-body-tertiary">
                Designed so trial startups and large enterprises share one platform safely:
              </p>
              <ul>
                <li>
                  <strong>
                    Auth
                  </strong>
                  — Okta/SSO or native login per org
                </li>
                <li>
                  <strong>
                    Data
                  </strong>
                  — every query scoped by
                  <code className="mx-1">
                    org_id
                  </code>
                </li>
                <li>
                  <strong>
                    Cloud / AI / ETL
                  </strong>
                  — connectors belong to the org
                </li>
                <li>
                  <strong>
                    Members
                  </strong>
                  — users invited into one or more orgs
                </li>
                <li>
                  <strong>
                    Limits
                  </strong>
                  — plan quotas (accounts, seats, AI spend)
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div className="card mb-4">
        <div className="card-header border-bottom border-translucent py-3">
          <h4 className="mb-0">
            Onboarding → production path
          </h4>
        </div>
        <div className="card-body">
          <div className="row g-3 text-center">
            <div className="col-6 col-md">
              <div className="border border-translucent rounded-3 p-3 h-100">
                <div className="fs-8 fw-bold text-primary mb-2">
                  1
                </div>
                <h6 className="mb-1">
                  Create org + slug
                </h6>
                <p className="fs-9 text-body-tertiary mb-0">
                  Reserve
                  <code className="mx-1">
                    slug.loveheartbeat.com
                  </code>
                </p>
              </div>
            </div>
            <div className="col-6 col-md">
              <div className="border border-translucent rounded-3 p-3 h-100">
                <div className="fs-8 fw-bold text-primary mb-2">
                  2
                </div>
                <h6 className="mb-1">
                  Auth mode
                </h6>
                <p className="fs-9 text-body-tertiary mb-0">
                  Okta/SSO or LoveHeartBeat passwords
                </p>
              </div>
            </div>
            <div className="col-6 col-md">
              <div className="border border-translucent rounded-3 p-3 h-100">
                <div className="fs-8 fw-bold text-primary mb-2">
                  3
                </div>
                <h6 className="mb-1">
                  Invite members
                </h6>
                <p className="fs-9 text-body-tertiary mb-0">
                  Roles under that org only
                </p>
              </div>
            </div>
            <div className="col-6 col-md">
              <div className="border border-translucent rounded-3 p-3 h-100">
                <div className="fs-8 fw-bold text-primary mb-2">
                  4
                </div>
                <h6 className="mb-1">
                  Connect sources
                </h6>
                <p className="fs-9 text-body-tertiary mb-0">
                  Multi-account AWS/GCP/Azure + AI + ETL
                </p>
              </div>
            </div>
            <div className="col-12 col-md">
              <div className="border border-translucent rounded-3 p-3 h-100">
                <div className="fs-8 fw-bold text-primary mb-2">
                  5
                </div>
                <h6 className="mb-1">
                  Observe
                </h6>
                <p className="fs-9 text-body-tertiary mb-0">
                  Dashboards, alerts, cost — tenant-scoped
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-header border-bottom border-translucent py-3">
          <h4 className="mb-0">
            Scale notes (~30,000 organizations)
          </h4>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <h6>
                Shared app, isolated data
              </h6>
              <p className="fs-9 text-body-tertiary mb-0">
                One LoveHeartBeat deployment; tenant resolved from Host header (
                <code>
                  slug.loveheartbeat.com
                </code>
                ).
              </p>
            </div>
            <div className="col-md-4">
              <h6>
                Stateless APIs
              </h6>
              <p className="fs-9 text-body-tertiary mb-0">
                Lambda/API handlers always require
                <code className="mx-1">
                  org_id
                </code>
                from subdomain + auth token claims.
              </p>
            </div>
            <div className="col-md-4">
              <h6>
                Tiered tenancy
              </h6>
              <p className="fs-9 text-body-tertiary mb-0">
                Trial/Business on shared pools; Enterprise can use dedicated queues, rate limits, and retention.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
