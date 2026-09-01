import AppLayout from '@/components/app-layout'

export default function Page() {
  return (
    <AppLayout scripts={[
        {
          "code": "\n          (function() {\n            document.querySelectorAll('[data-obs-sort]').forEach(function(select) {\n              if (select.dataset.bound === '1') return;\n              select.dataset.bound = '1';\n              select.addEventListener('change', function() {\n                var key = select.value;\n                if (!key) return;\n                var root = select.closest('[data-list]');\n                if (!root) return;\n                var header = root.querySelector('th[data-sort=\"' + key + '\"]');\n                if (header) header.click();\n              });\n            });\n          })();\n        "
        },
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
            Integrations
          </li>
        </ol>
      </nav>
      <div className="mb-6">
        <div className="row align-items-center g-3">
          <div className="col">
            <h2 className="mb-2">
              Integrations & Config Management
            </h2>
            <h5 className="text-body-tertiary fw-semibold mb-0">
              Every source this organization has connected, what it is feeding, and whether its credentials still work
            </h5>
          </div>
          <div className="col-auto">
            <button className="btn btn-primary" type="button" data-lhb-action="addIntegration">
              Add integration
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
                    Connected
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat">
                    27
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-success" data-obs-stat-delta="data-obs-stat-delta">
                  +4
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
                    Needs attention
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat">
                    3
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-warning" data-obs-stat-delta="data-obs-stat-delta">
                  auth or quota
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
                    Credentials expiring
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat">
                    2
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-danger" data-obs-stat-delta="data-obs-stat-delta">
                  within 30d
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
                    Available
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat">
                    41
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-info" data-obs-stat-delta="data-obs-stat-delta">
                  in catalog
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="alert alert-subtle-warning d-flex align-items-center mb-4" role="alert">
        <span className="fa-solid fa-triangle-exclamation me-2"></span>
        <div>
          <strong>
            Two credentials expire within 30 days.
          </strong>
          <span className="ms-1">
            Rotate the Databricks PAT and the Okta client secret before they lapse — collection stops silently when they do.
          </span>
        </div>
      </div>
      <div className="obs-list-root" data-list={"{\"valueNames\":[\"col0\",\"col1\",\"col2\",\"col3\",\"col4\",\"col5\"],\"page\":10,\"filter\":{\"key\":\"col5\"}}"} data-live-table="integrations">
        <div className="card">
          <div className="card-header border-bottom border-translucent py-3">
            <div className="row align-items-center g-2 mb-3">
              <div className="col">
                <h4 className="mb-0">
                  Connected integrations
                </h4>
                <p className="text-body-tertiary fs-9 mb-0">
                  Credentials are stored as secret references under org_id and never returned to the browser
                </p>
              </div>
            </div>
            <div className="row align-items-center g-2">
              <div className="col-12 col-md">
                <div className="search-box w-100">
                  <form className="position-relative">
                    <input className="form-control search-input search form-control-sm" type="search" placeholder="Search integrations" aria-label="Search" />
                    <span className="fas fa-search search-box-icon"></span>
                  </form>
                </div>
              </div>
              <div className="col-6 col-md-auto">
                <select className="form-select form-select-sm" data-list-filter="data-list-filter" aria-label="Filter">
                  <option value="">
                    Filter: All
                  </option>
                  <option value="Connected">
                    Connected
                  </option>
                  <option value="Expiring">
                    Expiring
                  </option>
                  <option value="Auth failed">
                    Auth failed
                  </option>
                  <option value="Not connected">
                    Not connected
                  </option>
                </select>
              </div>
              <div className="col-6 col-md-auto">
                <select className="form-select form-select-sm" aria-label="Sort by" data-obs-sort="data-obs-sort">
                  <option value="">
                    Sort by
                  </option>
                  <option value="col0">
                    Integration
                  </option>
                  <option value="col1">
                    Category
                  </option>
                  <option value="col2">
                    Feeds
                  </option>
                  <option value="col3">
                    Last sync
                  </option>
                  <option value="col4">
                    Credential
                  </option>
                  <option value="col5">
                    Status
                  </option>
                </select>
              </div>
            </div>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive scrollbar">
              <table className="table table-sm fs-9 mb-0">
                <thead>
                  <tr>
                    <th className="sort align-middle white-space-nowrap text-uppercase ps-3" scope="col" data-sort="col0">
                      Integration
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col1">
                      Category
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col2">
                      Feeds
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col3">
                      Last sync
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col4">
                      Credential
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col5">
                      Status
                    </th>
                    <th className="align-middle text-end pe-3" scope="col"></th>
                  </tr>
                </thead>
                <tbody className="list">
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-brands fa-aws text-warning"></span>
                        <div>
                          <h6 className="mb-0">
                            AWS CloudWatch
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            4 accounts
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Cloud
                    </td>
                    <td className="align-middle col2">
                      Cloud Monitoring, Cost
                    </td>
                    <td className="align-middle col3">
                      2m ago
                    </td>
                    <td className="align-middle col4">
                      IAM role
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Connected
                      </span>
                    </td>
                    <td className="align-middle pe-3"></td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-brands fa-microsoft text-info"></span>
                        <div>
                          <h6 className="mb-0">
                            Azure Monitor
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            2 subscriptions
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Cloud
                    </td>
                    <td className="align-middle col2">
                      Cloud Monitoring, Cost
                    </td>
                    <td className="align-middle col3">
                      4m ago
                    </td>
                    <td className="align-middle col4">
                      Service principal
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Connected
                      </span>
                    </td>
                    <td className="align-middle pe-3"></td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-brands fa-google text-danger"></span>
                        <div>
                          <h6 className="mb-0">
                            Google Cloud Operations
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            3 projects
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Cloud
                    </td>
                    <td className="align-middle col2">
                      Cloud Monitoring, Cost
                    </td>
                    <td className="align-middle col3">
                      6m ago
                    </td>
                    <td className="align-middle col4">
                      Service account
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Connected
                      </span>
                    </td>
                    <td className="align-middle pe-3"></td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-cloud text-warning"></span>
                        <div>
                          <h6 className="mb-0">
                            AWS API Gateway
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            api-prod-us-east-1
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Gateway
                    </td>
                    <td className="align-middle col2">
                      API Gateway, Traces
                    </td>
                    <td className="align-middle col3">
                      1m ago
                    </td>
                    <td className="align-middle col4">
                      IAM role
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Connected
                      </span>
                    </td>
                    <td className="align-middle pe-3"></td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-satellite-dish text-primary"></span>
                        <div>
                          <h6 className="mb-0">
                            OpenTelemetry
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            OTLP collector
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Telemetry
                    </td>
                    <td className="align-middle col2">
                      Traces, Logs, Metrics
                    </td>
                    <td className="align-middle col3">
                      streaming
                    </td>
                    <td className="align-middle col4">
                      Ingest key
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Connected
                      </span>
                    </td>
                    <td className="align-middle pe-3"></td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-diagram-project text-primary"></span>
                        <div>
                          <h6 className="mb-0">
                            Talend
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            cloud + studio
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      ETL
                    </td>
                    <td className="align-middle col2">
                      ETL Monitoring
                    </td>
                    <td className="align-middle col3">
                      12m ago
                    </td>
                    <td className="align-middle col4">
                      OAuth client
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Connected
                      </span>
                    </td>
                    <td className="align-middle pe-3"></td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-plug text-info"></span>
                        <div>
                          <h6 className="mb-0">
                            Dell Boomi
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            atom spheres
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      ETL
                    </td>
                    <td className="align-middle col2">
                      ETL Monitoring
                    </td>
                    <td className="align-middle col3">
                      28m ago
                    </td>
                    <td className="align-middle col4">
                      Basic auth
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Connected
                      </span>
                    </td>
                    <td className="align-middle pe-3"></td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-database text-danger"></span>
                        <div>
                          <h6 className="mb-0">
                            Databricks
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            unity catalog
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Data
                    </td>
                    <td className="align-middle col2">
                      Data Observability, ETL
                    </td>
                    <td className="align-middle col3">
                      9m ago
                    </td>
                    <td className="align-middle col4">
                      PAT · 12d left
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-warning">
                        Expiring
                      </span>
                    </td>
                    <td className="align-middle pe-3"></td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-wind text-success"></span>
                        <div>
                          <h6 className="mb-0">
                            Apache Airflow
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            MWAA us-east-1
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Orchestration
                    </td>
                    <td className="align-middle col2">
                      Orchestration Monitoring
                    </td>
                    <td className="align-middle col3">
                      2m ago
                    </td>
                    <td className="align-middle col4">
                      API token
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Connected
                      </span>
                    </td>
                    <td className="align-middle pe-3"></td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-shield-halved text-primary"></span>
                        <div>
                          <h6 className="mb-0">
                            Okta
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            rootvyana.okta.com
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Identity
                    </td>
                    <td className="align-middle col2">
                      SSO, Members
                    </td>
                    <td className="align-middle col3">
                      1h ago
                    </td>
                    <td className="align-middle col4">
                      Client secret · 21d left
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-warning">
                        Expiring
                      </span>
                    </td>
                    <td className="align-middle pe-3"></td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-bell text-success"></span>
                        <div>
                          <h6 className="mb-0">
                            PagerDuty
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            payments-oncall
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Notification
                    </td>
                    <td className="align-middle col2">
                      Alert routing
                    </td>
                    <td className="align-middle col3">
                      5m ago
                    </td>
                    <td className="align-middle col4">
                      Integration key
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Connected
                      </span>
                    </td>
                    <td className="align-middle pe-3"></td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-brands fa-slack text-success"></span>
                        <div>
                          <h6 className="mb-0">
                            Slack
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            6 channels
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Notification
                    </td>
                    <td className="align-middle col2">
                      Alert routing
                    </td>
                    <td className="align-middle col3">
                      3m ago
                    </td>
                    <td className="align-middle col4">
                      Bot token
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Connected
                      </span>
                    </td>
                    <td className="align-middle pe-3"></td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-ticket text-info"></span>
                        <div>
                          <h6 className="mb-0">
                            ServiceNow
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            L2 queue
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Notification
                    </td>
                    <td className="align-middle col2">
                      Alert routing, Incidents
                    </td>
                    <td className="align-middle col3">
                      22m ago
                    </td>
                    <td className="align-middle col4">
                      OAuth client
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Connected
                      </span>
                    </td>
                    <td className="align-middle pe-3"></td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-chart-line text-secondary"></span>
                        <div>
                          <h6 className="mb-0">
                            AppDynamics
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            controller
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      APM
                    </td>
                    <td className="align-middle col2">
                      API Monitoring
                    </td>
                    <td className="align-middle col3">
                      3h ago
                    </td>
                    <td className="align-middle col4">
                      API client
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-danger">
                        Auth failed
                      </span>
                    </td>
                    <td className="align-middle pe-3"></td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-layer-group text-warning"></span>
                        <div>
                          <h6 className="mb-0">
                            BigPanda
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            alert correlation
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Alerting
                    </td>
                    <td className="align-middle col2">
                      Correlation
                    </td>
                    <td className="align-middle col3">
                      —
                    </td>
                    <td className="align-middle col4">
                      API key
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-secondary">
                        Not connected
                      </span>
                    </td>
                    <td className="align-middle pe-3"></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="text-center p-3 fallback d-none">
              <p className="mb-0 text-body-tertiary">
                No matching results
              </p>
            </div>
          </div>
          <div className="card-footer border-top border-translucent">
            <div className="row align-items-center g-2">
              <div className="pagination d-none"></div>
              <div className="col d-flex fs-9 flex-wrap">
                <p className="mb-0 d-none d-sm-block me-3 fw-semibold text-body" data-list-info="data-list-info"></p>
                <a className="fw-semibold" href="#!" data-list-view="*">
                  View all
                  <span className="fas fa-angle-right ms-1" data-fa-transform="down-1"></span>
                </a>
                <a className="fw-semibold d-none" href="#!" data-list-view="less">
                  View less
                </a>
              </div>
              <div className="col-auto d-flex">
                <button className="btn btn-link px-1 me-1" type="button" title="Previous" data-list-pagination="prev">
                  <span className="fas fa-chevron-left me-2"></span>
                  Previous
                </button>
                <button className="btn btn-link px-1 ms-1" type="button" title="Next" data-list-pagination="next">
                  Next
                  <span className="fas fa-chevron-right ms-2"></span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="card mt-4 mb-4">
        <div className="card-header border-bottom border-translucent py-3">
          <h4 className="mb-0">
            Connect something
          </h4>
          <p className="text-body-tertiary fs-9 mb-0">
            Every integration that needs credentials or an install, each on its own page
          </p>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-12 col-md-6 col-xl-4">
              <a className="text-decoration-none text-body-emphasis" href="/apps/platform/integrations/api-gateway/">
                <div className="border border-translucent rounded-3 p-3 h-100 d-flex flex-column">
                  <div className="d-flex align-items-center mb-2">
                    <span className="fa-solid me-2 fa-plug text-primary"></span>
                    <h6 className="mb-0">
                      API gateway
                    </h6>
                  </div>
                  <p className="text-body-tertiary fs-9 mb-2">
                    Connect Kong, APISIX, Tyk, Traefik, KrakenD, AWS API Gateway, Azure APIM or Apigee — or install ours in front of your API.
                  </p>
                  <div className="mt-auto d-flex align-items-center justify-content-between">
                    <span className="text-body-tertiary fs-10">
                      API Gateway · API Monitoring · Traces
                    </span>
                    <span className="fa-solid fa-arrow-right text-body-quaternary"></span>
                  </div>
                </div>
              </a>
            </div>
            <div className="col-12 col-md-6 col-xl-4">
              <a className="text-decoration-none text-body-emphasis" href="/apps/platform/integrations/cloud/">
                <div className="border border-translucent rounded-3 p-3 h-100 d-flex flex-column">
                  <div className="d-flex align-items-center mb-2">
                    <span className="fa-solid me-2 fa-cloud text-warning"></span>
                    <h6 className="mb-0">
                      Cloud accounts
                    </h6>
                  </div>
                  <p className="text-body-tertiary fs-9 mb-2">
                    AWS credentials, function prefixes and anomaly thresholds. GCP and Azure have no collector yet.
                  </p>
                  <div className="mt-auto d-flex align-items-center justify-content-between">
                    <span className="text-body-tertiary fs-10">
                      Cloud Monitoring · Orchestration · Cloud Cost
                    </span>
                    <span className="fa-solid fa-arrow-right text-body-quaternary"></span>
                  </div>
                </div>
              </a>
            </div>
            <div className="col-12 col-md-6 col-xl-4">
              <a className="text-decoration-none text-body-emphasis" href="/apps/platform/integrations/etl/">
                <div className="border border-translucent rounded-3 p-3 h-100 d-flex flex-column">
                  <div className="d-flex align-items-center mb-2">
                    <span className="fa-solid me-2 fa-diagram-project text-info"></span>
                    <h6 className="mb-0">
                      ETL tools
                    </h6>
                  </div>
                  <p className="text-body-tertiary fs-9 mb-2">
                    Talend, Boomi and Databricks credentials, each testable from its own card.
                  </p>
                  <div className="mt-auto d-flex align-items-center justify-content-between">
                    <span className="text-body-tertiary fs-10">
                      ETL Monitoring · Orchestration
                    </span>
                    <span className="fa-solid fa-arrow-right text-body-quaternary"></span>
                  </div>
                </div>
              </a>
            </div>
            <div className="col-12 col-md-6 col-xl-4">
              <a className="text-decoration-none text-body-emphasis" href="/apps/platform/integrations/databases/">
                <div className="border border-translucent rounded-3 p-3 h-100 d-flex flex-column">
                  <div className="d-flex align-items-center mb-2">
                    <span className="fa-solid me-2 fa-database text-danger"></span>
                    <h6 className="mb-0">
                      Databases
                    </h6>
                  </div>
                  <p className="text-body-tertiary fs-9 mb-2">
                    Register a database by connection string, tested before it is saved.
                  </p>
                  <div className="mt-auto d-flex align-items-center justify-content-between">
                    <span className="text-body-tertiary fs-10">
                      Database Monitoring
                    </span>
                    <span className="fa-solid fa-arrow-right text-body-quaternary"></span>
                  </div>
                </div>
              </a>
            </div>
            <div className="col-12 col-md-6 col-xl-4">
              <a className="text-decoration-none text-body-emphasis" href="/apps/platform/integrations/ai-tools/">
                <div className="border border-translucent rounded-3 p-3 h-100 d-flex flex-column">
                  <div className="d-flex align-items-center mb-2">
                    <span className="fa-solid me-2 fa-robot text-success"></span>
                    <h6 className="mb-0">
                      AI tools
                    </h6>
                  </div>
                  <p className="text-body-tertiary fs-9 mb-2">
                    Register the collector agent that pushes AI telemetry, and mint its key.
                  </p>
                  <div className="mt-auto d-flex align-items-center justify-content-between">
                    <span className="text-body-tertiary fs-10">
                      AI Monitoring · AI Cost and Usage
                    </span>
                    <span className="fa-solid fa-arrow-right text-body-quaternary"></span>
                  </div>
                </div>
              </a>
            </div>
            <div className="col-12 col-md-6 col-xl-4">
              <a className="text-decoration-none text-body-emphasis" href="/apps/platform/databricks/">
                <div className="border border-translucent rounded-3 p-3 h-100 d-flex flex-column">
                  <div className="d-flex align-items-center mb-2">
                    <span className="fa-solid me-2 fa-table text-secondary"></span>
                    <h6 className="mb-0">
                      Databricks
                    </h6>
                  </div>
                  <p className="text-body-tertiary fs-9 mb-2">
                    Workspace host, SQL warehouse and token — the same connection backs table health and job runs.
                  </p>
                  <div className="mt-auto d-flex align-items-center justify-content-between">
                    <span className="text-body-tertiary fs-10">
                      Data Observability · ETL Monitoring
                    </span>
                    <span className="fa-solid fa-arrow-right text-body-quaternary"></span>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-header border-bottom border-translucent py-3">
          <h4 className="mb-0">
            Other settings
          </h4>
          <p className="text-body-tertiary fs-9 mb-0">
            Thresholds, budgets and rules — configuration for sources that are already connected
          </p>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-12 col-md-6 col-xl-4">
              <div className="border border-translucent rounded-3 p-3 h-100 d-flex flex-column">
                <h6 className="mb-1">
                  Register a model
                </h6>
                <p className="text-body-tertiary fs-9 mb-2">
                  Track a custom or hosted model alongside the providers.
                </p>
                <div className="mt-auto d-flex align-items-center justify-content-between">
                  <span className="badge badge-phoenix badge-phoenix-secondary fs-10">
                    AI Models
                  </span>
                  <button className="btn btn-phoenix-primary btn-sm" type="button" data-lhb-action="registerModel">
                    Configure
                  </button>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-6 col-xl-4">
              <div className="border border-translucent rounded-3 p-3 h-100 d-flex flex-column">
                <h6 className="mb-1">
                  Model thresholds
                </h6>
                <p className="text-body-tertiary fs-9 mb-2">
                  Error-rate and latency limits every model status badge is derived from.
                </p>
                <div className="mt-auto d-flex align-items-center justify-content-between">
                  <span className="badge badge-phoenix badge-phoenix-secondary fs-10">
                    AI Models
                  </span>
                  <button className="btn btn-phoenix-primary btn-sm" type="button" data-lhb-action="editThresholds">
                    Configure
                  </button>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-6 col-xl-4">
              <div className="border border-translucent rounded-3 p-3 h-100 d-flex flex-column">
                <h6 className="mb-1">
                  AI budget
                </h6>
                <p className="text-body-tertiary fs-9 mb-2">
                  Monthly spend ceiling and who to warn as it is approached.
                </p>
                <div className="mt-auto d-flex align-items-center justify-content-between">
                  <span className="badge badge-phoenix badge-phoenix-secondary fs-10">
                    AI Cost and Usage
                  </span>
                  <button className="btn btn-phoenix-primary btn-sm" type="button" data-lhb-action="setAiBudget">
                    Configure
                  </button>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-6 col-xl-4">
              <div className="border border-translucent rounded-3 p-3 h-100 d-flex flex-column">
                <h6 className="mb-1">
                  Cloud budget
                </h6>
                <p className="text-body-tertiary fs-9 mb-2">
                  Per-account budget and the threshold that raises an alert.
                </p>
                <div className="mt-auto d-flex align-items-center justify-content-between">
                  <span className="badge badge-phoenix badge-phoenix-secondary fs-10">
                    Cloud Cost
                  </span>
                  <button className="btn btn-phoenix-primary btn-sm" type="button" data-lhb-action="addBudget">
                    Configure
                  </button>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-6 col-xl-4">
              <div className="border border-translucent rounded-3 p-3 h-100 d-flex flex-column">
                <h6 className="mb-1">
                  Routing rule
                </h6>
                <p className="text-body-tertiary fs-9 mb-2">
                  Which team a matching alert pages, on which channels, and when it escalates.
                </p>
                <div className="mt-auto d-flex align-items-center justify-content-between">
                  <span className="badge badge-phoenix badge-phoenix-secondary fs-10">
                    Alert Management
                  </span>
                  <button className="btn btn-phoenix-primary btn-sm" type="button" data-lhb-action="routingRule">
                    Configure
                  </button>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-6 col-xl-4">
              <div className="border border-translucent rounded-3 p-3 h-100 d-flex flex-column">
                <h6 className="mb-1">
                  Automation rule
                </h6>
                <p className="text-body-tertiary fs-9 mb-2">
                  Trigger and action for a remediation the platform runs itself.
                </p>
                <div className="mt-auto d-flex align-items-center justify-content-between">
                  <span className="badge badge-phoenix badge-phoenix-secondary fs-10">
                    Automation
                  </span>
                  <button className="btn btn-phoenix-primary btn-sm" type="button" data-lhb-action="automationRule">
                    Configure
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
