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
          "code": "\n      import {\n        api,\n        currentTenantSlug,\n        tenantUrl,\n        getToken,\n        setToken\n      } from '/assets/js/integration/api-client.js';\n      import {\n        hydrate\n      } from '/assets/js/integration/live-data.js';\n      import {\n        bind\n      } from '/assets/js/integration/actions.js';\n      import {\n        init as initAuth\n      } from '/assets/js/integration/auth.js';\n      window.lhb = {\n        api,\n        currentTenantSlug,\n        tenantUrl,\n        getToken,\n        setToken\n      };\n      window.__lhbResolve(window.lhb);\n      //- The guard runs first: a page about to redirect a signed-out visitor should not\n      //- spend a round trip per table finding out it had no session.\n      //- .catch, not .then alone: a guard that throws must not take the page's data with\n      //- it — an unhydrated dashboard is a silent one.\n      initAuth().catch(() => {}).then(() => {\n        hydrate(api);\n        bind(api);\n      });\n    ",
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
              Platform
            </a>
          </li>
          <li className="breadcrumb-item active">
            Command Center
          </li>
        </ol>
      </nav>
      <div className="mb-6">
        <div className="row align-items-center g-3">
          <div className="col">
            <h2 className="mb-2">
              Command Center
            </h2>
            <h5 className="text-body-tertiary fw-semibold mb-0">
              Every signal this organization produces, on one page — with a way into whichever area is on fire
            </h5>
          </div>
          <div className="col-auto">
            <button className="btn btn-primary" type="button" data-lhb-action="acknowledgeAll">
              Acknowledge all
            </button>
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
                    Open incidents
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat">
                    7
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-danger" data-obs-stat-delta="data-obs-stat-delta">
                  2 critical
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
                    Services healthy
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat">
                    61 / 68
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-success" data-obs-stat-delta="data-obs-stat-delta">
                  89.7%
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
                    Signals (24h)
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat">
                    2.1M
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-info" data-obs-stat-delta="data-obs-stat-delta">
                  +6.4%
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
                    Spend today
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat">
                    $4,182
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-warning" data-obs-stat-delta="data-obs-stat-delta">
                  +$310
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="row g-4 mb-4">
        <div className="col-12 col-xl-8">
          <div className="card h-100" data-live-table="commandCenter">
            <div className="card-header border-bottom border-translucent py-3">
              <h4 className="mb-0">
                Needs attention now
              </h4>
              <p className="text-body-tertiary fs-9 mb-0">
                Ranked by blast radius, then by how long it has been open
              </p>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive scrollbar">
                <table className="table table-sm fs-9 mb-0">
                  <thead>
                    <tr>
                      <th className="ps-3 text-uppercase">
                        Incident
                      </th>
                      <th className="text-uppercase">
                        Area
                      </th>
                      <th className="text-uppercase">
                        Impact
                      </th>
                      <th className="text-uppercase">
                        Open
                      </th>
                      <th className="text-uppercase">
                        Severity
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="ps-3">
                        <h6 className="mb-0">
                          Partner API timeouts
                        </h6>
                        <p className="text-body-tertiary fs-10 mb-0">
                          INC-4819 · upstream vendor outage
                        </p>
                      </td>
                      <td>
                        API Gateway
                      </td>
                      <td>
                        2 services · 118K calls
                      </td>
                      <td>
                        2h 14m
                      </td>
                      <td>
                        <span className="badge badge-phoenix badge-phoenix-danger">
                          Critical
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="ps-3">
                        <h6 className="mb-0">
                          image-tagger inference failures
                        </h6>
                        <p className="text-body-tertiary fs-10 mb-0">
                          6.2% failure rate · CUDA OOM
                        </p>
                      </td>
                      <td>
                        Custom AI Models
                      </td>
                      <td>
                        92K requests
                      </td>
                      <td>
                        48m
                      </td>
                      <td>
                        <span className="badge badge-phoenix badge-phoenix-danger">
                          Critical
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="ps-3">
                        <h6 className="mb-0">
                          Nightly load failure
                        </h6>
                        <p className="text-body-tertiary fs-10 mb-0">
                          INC-4816 · Talend engine OOM
                        </p>
                      </td>
                      <td>
                        ETL Monitoring
                      </td>
                      <td>
                        1 pipeline · 7 downstream
                      </td>
                      <td>
                        46m
                      </td>
                      <td>
                        <span className="badge badge-phoenix badge-phoenix-warning">
                          High
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="ps-3">
                        <h6 className="mb-0">
                          orders replication lag
                        </h6>
                        <p className="text-body-tertiary fs-10 mb-0">
                          14.8s behind primary
                        </p>
                      </td>
                      <td>
                        Database Monitoring
                      </td>
                      <td>
                        1 database
                      </td>
                      <td>
                        32m
                      </td>
                      <td>
                        <span className="badge badge-phoenix badge-phoenix-warning">
                          High
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="ps-3">
                        <h6 className="mb-0">
                          partner-api error budget exhausted
                        </h6>
                        <p className="text-body-tertiary fs-10 mb-0">
                          4.1x burn · 30d window
                        </p>
                      </td>
                      <td>
                        SLO
                      </td>
                      <td>
                        1 objective
                      </td>
                      <td>
                        1d 4h
                      </td>
                      <td>
                        <span className="badge badge-phoenix badge-phoenix-warning">
                          High
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-xl-4">
          <div className="card h-100" data-mock-block="data-mock-block">
            <div className="card-header border-bottom border-translucent py-3">
              <h4 className="mb-0">
                Area health
              </h4>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center fs-9 mb-1">
                  <a className="text-body-emphasis text-decoration-none fw-semibold" href="/apps/observability/api-monitoring/">
                    API Monitoring
                  </a>
                  <span className="text-body-tertiary">
                    96%
                  </span>
                </div>
                <div className="progress" style={{ height: "5px" }}>
                  <div className="progress-bar bg-success" style={{ width: "96%" }} role="progressbar" aria-valuenow={96} aria-valuemin={0} aria-valuemax={100}></div>
                </div>
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center fs-9 mb-1">
                  <a className="text-body-emphasis text-decoration-none fw-semibold" href="/apps/observability/api-gateway/">
                    API Gateway
                  </a>
                  <span className="text-body-tertiary">
                    78%
                  </span>
                </div>
                <div className="progress" style={{ height: "5px" }}>
                  <div className="progress-bar bg-warning" style={{ width: "78%" }} role="progressbar" aria-valuenow={78} aria-valuemin={0} aria-valuemax={100}></div>
                </div>
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center fs-9 mb-1">
                  <a className="text-body-emphasis text-decoration-none fw-semibold" href="/apps/observability/ai-monitoring/">
                    AI Monitoring
                  </a>
                  <span className="text-body-tertiary">
                    99%
                  </span>
                </div>
                <div className="progress" style={{ height: "5px" }}>
                  <div className="progress-bar bg-success" style={{ width: "99%" }} role="progressbar" aria-valuenow={99} aria-valuemin={0} aria-valuemax={100}></div>
                </div>
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center fs-9 mb-1">
                  <a className="text-body-emphasis text-decoration-none fw-semibold" href="/apps/observability/etl-monitoring/">
                    ETL Monitoring
                  </a>
                  <span className="text-body-tertiary">
                    84%
                  </span>
                </div>
                <div className="progress" style={{ height: "5px" }}>
                  <div className="progress-bar bg-warning" style={{ width: "84%" }} role="progressbar" aria-valuenow={84} aria-valuemin={0} aria-valuemax={100}></div>
                </div>
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center fs-9 mb-1">
                  <a className="text-body-emphasis text-decoration-none fw-semibold" href="/apps/observability/orchestration-monitoring/">
                    Orchestration
                  </a>
                  <span className="text-body-tertiary">
                    92%
                  </span>
                </div>
                <div className="progress" style={{ height: "5px" }}>
                  <div className="progress-bar bg-success" style={{ width: "92%" }} role="progressbar" aria-valuenow={92} aria-valuemin={0} aria-valuemax={100}></div>
                </div>
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center fs-9 mb-1">
                  <a className="text-body-emphasis text-decoration-none fw-semibold" href="/apps/observability/database-monitoring/">
                    Database Monitoring
                  </a>
                  <span className="text-body-tertiary">
                    90%
                  </span>
                </div>
                <div className="progress" style={{ height: "5px" }}>
                  <div className="progress-bar bg-success" style={{ width: "90%" }} role="progressbar" aria-valuenow={90} aria-valuemin={0} aria-valuemax={100}></div>
                </div>
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center fs-9 mb-1">
                  <a className="text-body-emphasis text-decoration-none fw-semibold" href="/apps/observability/data-observability/">
                    Data Observability
                  </a>
                  <span className="text-body-tertiary">
                    94%
                  </span>
                </div>
                <div className="progress" style={{ height: "5px" }}>
                  <div className="progress-bar bg-success" style={{ width: "94%" }} role="progressbar" aria-valuenow={94} aria-valuemin={0} aria-valuemax={100}></div>
                </div>
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center fs-9 mb-1">
                  <a className="text-body-emphasis text-decoration-none fw-semibold" href="/apps/observability/cloud-monitoring/">
                    Cloud Monitoring
                  </a>
                  <span className="text-body-tertiary">
                    97%
                  </span>
                </div>
                <div className="progress" style={{ height: "5px" }}>
                  <div className="progress-bar bg-success" style={{ width: "97%" }} role="progressbar" aria-valuenow={97} aria-valuemin={0} aria-valuemax={100}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-header border-bottom border-translucent py-3">
          <h4 className="mb-0">
            Jump to
          </h4>
          <p className="text-body-tertiary fs-9 mb-0">
            Every product area for this organization
          </p>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-6 col-md-4 col-xl-3">
              <a className="d-block text-decoration-none border border-translucent rounded-3 p-3 h-100" href="/apps/observability/api-monitoring/">
                <span className="fa-solid text-primary mb-2 d-block fa-server"></span>
                <h6 className="mb-0 text-body-emphasis">
                  API Monitoring
                </h6>
              </a>
            </div>
            <div className="col-6 col-md-4 col-xl-3">
              <a className="d-block text-decoration-none border border-translucent rounded-3 p-3 h-100" href="/apps/observability/api-gateway/">
                <span className="fa-solid text-primary mb-2 d-block fa-cloud"></span>
                <h6 className="mb-0 text-body-emphasis">
                  API Gateway
                </h6>
              </a>
            </div>
            <div className="col-6 col-md-4 col-xl-3">
              <a className="d-block text-decoration-none border border-translucent rounded-3 p-3 h-100" href="/apps/observability/ai-monitoring/">
                <span className="fa-solid text-primary mb-2 d-block fa-robot"></span>
                <h6 className="mb-0 text-body-emphasis">
                  AI Monitoring
                </h6>
              </a>
            </div>
            <div className="col-6 col-md-4 col-xl-3">
              <a className="d-block text-decoration-none border border-translucent rounded-3 p-3 h-100" href="/apps/observability/ai-gateway/">
                <span className="fa-solid text-primary mb-2 d-block fa-network-wired"></span>
                <h6 className="mb-0 text-body-emphasis">
                  AI Gateway
                </h6>
              </a>
            </div>
            <div className="col-6 col-md-4 col-xl-3">
              <a className="d-block text-decoration-none border border-translucent rounded-3 p-3 h-100" href="/apps/observability/ai-models/">
                <span className="fa-solid text-primary mb-2 d-block fa-microchip"></span>
                <h6 className="mb-0 text-body-emphasis">
                  Custom AI Models
                </h6>
              </a>
            </div>
            <div className="col-6 col-md-4 col-xl-3">
              <a className="d-block text-decoration-none border border-translucent rounded-3 p-3 h-100" href="/apps/observability/etl-monitoring/">
                <span className="fa-solid text-primary mb-2 d-block fa-diagram-project"></span>
                <h6 className="mb-0 text-body-emphasis">
                  ETL Monitoring
                </h6>
              </a>
            </div>
            <div className="col-6 col-md-4 col-xl-3">
              <a className="d-block text-decoration-none border border-translucent rounded-3 p-3 h-100" href="/apps/observability/orchestration-monitoring/">
                <span className="fa-solid text-primary mb-2 d-block fa-wind"></span>
                <h6 className="mb-0 text-body-emphasis">
                  Orchestration
                </h6>
              </a>
            </div>
            <div className="col-6 col-md-4 col-xl-3">
              <a className="d-block text-decoration-none border border-translucent rounded-3 p-3 h-100" href="/apps/observability/data-observability/">
                <span className="fa-solid text-primary mb-2 d-block fa-table"></span>
                <h6 className="mb-0 text-body-emphasis">
                  Data Observability
                </h6>
              </a>
            </div>
            <div className="col-6 col-md-4 col-xl-3">
              <a className="d-block text-decoration-none border border-translucent rounded-3 p-3 h-100" href="/apps/observability/database-monitoring/">
                <span className="fa-solid text-primary mb-2 d-block fa-database"></span>
                <h6 className="mb-0 text-body-emphasis">
                  Database Monitoring
                </h6>
              </a>
            </div>
            <div className="col-6 col-md-4 col-xl-3">
              <a className="d-block text-decoration-none border border-translucent rounded-3 p-3 h-100" href="/apps/observability/traces/">
                <span className="fa-solid text-primary mb-2 d-block fa-sitemap"></span>
                <h6 className="mb-0 text-body-emphasis">
                  Traces & Topology
                </h6>
              </a>
            </div>
            <div className="col-6 col-md-4 col-xl-3">
              <a className="d-block text-decoration-none border border-translucent rounded-3 p-3 h-100" href="/apps/observability/logs/">
                <span className="fa-solid text-primary mb-2 d-block fa-file-lines"></span>
                <h6 className="mb-0 text-body-emphasis">
                  Logs
                </h6>
              </a>
            </div>
            <div className="col-6 col-md-4 col-xl-3">
              <a className="d-block text-decoration-none border border-translucent rounded-3 p-3 h-100" href="/apps/observability/alerts/">
                <span className="fa-solid text-primary mb-2 d-block fa-bell"></span>
                <h6 className="mb-0 text-body-emphasis">
                  Alerts
                </h6>
              </a>
            </div>
            <div className="col-6 col-md-4 col-xl-3">
              <a className="d-block text-decoration-none border border-translucent rounded-3 p-3 h-100" href="/apps/observability/alert-management/">
                <span className="fa-solid text-primary mb-2 d-block fa-route"></span>
                <h6 className="mb-0 text-body-emphasis">
                  Alert Management
                </h6>
              </a>
            </div>
            <div className="col-6 col-md-4 col-xl-3">
              <a className="d-block text-decoration-none border border-translucent rounded-3 p-3 h-100" href="/apps/observability/incident-correlation/">
                <span className="fa-solid text-primary mb-2 d-block fa-code-merge"></span>
                <h6 className="mb-0 text-body-emphasis">
                  Correlation & RCA
                </h6>
              </a>
            </div>
            <div className="col-6 col-md-4 col-xl-3">
              <a className="d-block text-decoration-none border border-translucent rounded-3 p-3 h-100" href="/apps/observability/automation/">
                <span className="fa-solid text-primary mb-2 d-block fa-bolt"></span>
                <h6 className="mb-0 text-body-emphasis">
                  AI Automation
                </h6>
              </a>
            </div>
            <div className="col-6 col-md-4 col-xl-3">
              <a className="d-block text-decoration-none border border-translucent rounded-3 p-3 h-100" href="/apps/observability/slo/">
                <span className="fa-solid text-primary mb-2 d-block fa-bullseye"></span>
                <h6 className="mb-0 text-body-emphasis">
                  SLO & Budgets
                </h6>
              </a>
            </div>
            <div className="col-6 col-md-4 col-xl-3">
              <a className="d-block text-decoration-none border border-translucent rounded-3 p-3 h-100" href="/apps/observability/drift/">
                <span className="fa-solid text-primary mb-2 d-block fa-wave-square"></span>
                <h6 className="mb-0 text-body-emphasis">
                  Drift Detection
                </h6>
              </a>
            </div>
            <div className="col-6 col-md-4 col-xl-3">
              <a className="d-block text-decoration-none border border-translucent rounded-3 p-3 h-100" href="/apps/observability/cloud-monitoring/">
                <span className="fa-solid text-primary mb-2 d-block fa-cloud-arrow-up"></span>
                <h6 className="mb-0 text-body-emphasis">
                  Cloud Monitoring
                </h6>
              </a>
            </div>
            <div className="col-6 col-md-4 col-xl-3">
              <a className="d-block text-decoration-none border border-translucent rounded-3 p-3 h-100" href="/apps/observability/cloud-cost/">
                <span className="fa-solid text-primary mb-2 d-block fa-coins"></span>
                <h6 className="mb-0 text-body-emphasis">
                  Cloud Cost
                </h6>
              </a>
            </div>
            <div className="col-6 col-md-4 col-xl-3">
              <a className="d-block text-decoration-none border border-translucent rounded-3 p-3 h-100" href="/apps/observability/ai-cost-usage/">
                <span className="fa-solid text-primary mb-2 d-block fa-sack-dollar"></span>
                <h6 className="mb-0 text-body-emphasis">
                  AI Cost & Usage
                </h6>
              </a>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
