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
              Platform
            </a>
          </li>
          <li className="breadcrumb-item active">
            Health & Connectivity
          </li>
        </ol>
      </nav>
      <div className="mb-6">
        <div className="row align-items-center g-3">
          <div className="col">
            <h2 className="mb-2">
              Health & Connectivity
            </h2>
            <h5 className="text-body-tertiary fw-semibold mb-0">
              Can we reach it, does it answer, and is the answer correct — the checks that run before you trust any other dashboard
            </h5>
          </div>
          <div className="col-auto">
            <button className="btn btn-primary" type="button" data-lhb-action="runHealthChecks">
              Run all checks
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
                    Endpoints checked
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat">
                    96
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-info" data-obs-stat-delta="data-obs-stat-delta">
                  +8
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
                    Reachable
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat">
                    92
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-success" data-obs-stat-delta="data-obs-stat-delta">
                  95.8%
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
                    Failing
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat">
                    4
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-danger" data-obs-stat-delta="data-obs-stat-delta">
                  1 platform
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
                    Median RTT
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat">
                    38ms
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-success" data-obs-stat-delta="data-obs-stat-delta">
                  -4ms
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
                Platform self-check
              </h4>
              <p className="text-body-tertiary fs-9">
                What the backend reports about its own dependencies. A store falling back to memory is the check worth watching — writes look successful and vanish on the next cold start.
              </p>
              <div className="table-responsive">
                <table className="table table-sm fs-9 mb-0">
                  <tbody>
                    <tr>
                      <td>
                        API
                      </td>
                      <td className="text-end">
                        <span className="badge badge-phoenix badge-phoenix-success">
                          ok
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        Record store (DynamoDB)
                      </td>
                      <td className="text-end">
                        <span className="badge badge-phoenix badge-phoenix-success">
                          persistent
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        User store (DynamoDB)
                      </td>
                      <td className="text-end">
                        <span className="badge badge-phoenix badge-phoenix-success">
                          persistent
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        Elasticsearch
                      </td>
                      <td className="text-end">
                        <span className="badge badge-phoenix badge-phoenix-success">
                          green
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        Kafka event spine
                      </td>
                      <td className="text-end">
                        <span className="badge badge-phoenix badge-phoenix-warning">
                          no broker
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        Service graph (Neo4j)
                      </td>
                      <td className="text-end">
                        <span className="badge badge-phoenix badge-phoenix-success">
                          connected
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-6">
          <div className="card h-100">
            <div className="card-body">
              <h4 className="mb-3">
                Ad-hoc probe
              </h4>
              <p className="text-body-tertiary fs-9">
                Run a one-off reachability check from the platform's network, not your laptop's — useful when a connector claims a host is unreachable.
              </p>
              <div className="mb-3">
                <label className="form-label fs-9" htmlFor="probe-target">
                  Target
                </label>
                <input className="form-control form-control-sm font-monospace" id="probe-target" type="text" defaultValue="payments-prod.cluster-us-east-1.rds.amazonaws.com:5432" aria-label="Probe target host and port" />
              </div>
              <div className="mb-3">
                <label className="form-label fs-9" htmlFor="probe-type">
                  Check type
                </label>
                <select className="form-select form-select-sm" id="probe-type" aria-label="Probe type">
                  <option value="tcp">
                    TCP connect
                  </option>
                  <option value="http">
                    HTTP health check
                  </option>
                  <option value="icmp">
                    ICMP ping
                  </option>
                  <option value="dns">
                    DNS resolve
                  </option>
                </select>
              </div>
              <button className="btn btn-primary btn-sm" type="button">
                Run probe
              </button>
              <div className="bg-body-emphasis border border-translucent rounded-3 p-3 mt-3 font-monospace fs-10">
                <div>
                  connect payments-prod.cluster-us-east-1.rds.amazonaws.com:5432
                </div>
                <div className="text-success">
                  resolved 10.42.8.19 in 4ms
                </div>
                <div className="text-success">
                  tcp established in 11ms
                </div>
                <div className="text-body-tertiary">
                  tls handshake 24ms · total 39ms
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="obs-list-root" data-list={"{\"valueNames\":[\"col0\",\"col1\",\"col2\",\"col3\",\"col4\",\"col5\"],\"page\":8,\"filter\":{\"key\":\"col5\"}}"} data-live-table="healthEndpoints">
        <div className="card">
          <div className="card-header border-bottom border-translucent py-3">
            <div className="row align-items-center g-2 mb-3">
              <div className="col">
                <h4 className="mb-0">
                  Monitored endpoints
                </h4>
                <p className="text-body-tertiary fs-9 mb-0">
                  Health checks and reachability probes across every environment this organization runs
                </p>
              </div>
            </div>
            <div className="row align-items-center g-2">
              <div className="col-12 col-md">
                <div className="search-box w-100">
                  <form className="position-relative">
                    <input className="form-control search-input search form-control-sm" type="search" placeholder="Search endpoints or hosts" aria-label="Search" />
                    <span className="fas fa-search search-box-icon"></span>
                  </form>
                </div>
              </div>
              <div className="col-6 col-md-auto">
                <select className="form-select form-select-sm" data-list-filter="data-list-filter" aria-label="Filter">
                  <option value="">
                    Filter: All
                  </option>
                  <option value="Up">
                    Up
                  </option>
                  <option value="Down">
                    Down
                  </option>
                  <option value="Slow">
                    Slow
                  </option>
                </select>
              </div>
              <div className="col-6 col-md-auto">
                <select className="form-select form-select-sm" aria-label="Sort by" data-obs-sort="data-obs-sort">
                  <option value="">
                    Sort by
                  </option>
                  <option value="col0">
                    Endpoint
                  </option>
                  <option value="col1">
                    Check
                  </option>
                  <option value="col2">
                    Env
                  </option>
                  <option value="col3">
                    RTT
                  </option>
                  <option value="col4">
                    Uptime (30d)
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
                      Endpoint
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col1">
                      Check
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col2">
                      Env
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col3">
                      RTT
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col4">
                      Uptime (30d)
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col5">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="list" data-sample-rows="data-sample-rows">
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-heart-pulse text-success"></span>
                        <div>
                          <h6 className="mb-0">
                            checkout-api
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            https://api.rootvyana.com/health
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      HTTP 200
                    </td>
                    <td className="align-middle col2">
                      prod
                    </td>
                    <td className="align-middle col3">
                      28ms
                    </td>
                    <td className="align-middle col4">
                      99.98%
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Up
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-heart-pulse text-success"></span>
                        <div>
                          <h6 className="mb-0">
                            identity-api
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            https://id.rootvyana.com/health
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      HTTP 200
                    </td>
                    <td className="align-middle col2">
                      prod
                    </td>
                    <td className="align-middle col3">
                      19ms
                    </td>
                    <td className="align-middle col4">
                      99.99%
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Up
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-heart-pulse text-danger"></span>
                        <div>
                          <h6 className="mb-0">
                            partner-api
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            https://partner.vendor.io/status
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      HTTP 504
                    </td>
                    <td className="align-middle col2">
                      prod
                    </td>
                    <td className="align-middle col3">
                      timeout
                    </td>
                    <td className="align-middle col4">
                      97.21%
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-danger">
                        Down
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-plug-circle-check text-success"></span>
                        <div>
                          <h6 className="mb-0">
                            payments-db
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            payments-prod:5432
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      TCP connect
                    </td>
                    <td className="align-middle col2">
                      prod
                    </td>
                    <td className="align-middle col3">
                      39ms
                    </td>
                    <td className="align-middle col4">
                      99.99%
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Up
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-plug-circle-check text-danger"></span>
                        <div>
                          <h6 className="mb-0">
                            legacy-billing-db
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            legacy-billing:1433
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      TCP connect
                    </td>
                    <td className="align-middle col2">
                      prod
                    </td>
                    <td className="align-middle col3">
                      refused
                    </td>
                    <td className="align-middle col4">
                      94.10%
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-danger">
                        Down
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-heart-pulse text-success"></span>
                        <div>
                          <h6 className="mb-0">
                            orders endpoint
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            https://api.rootvyana.com/v1/orders
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Synthetic POST
                    </td>
                    <td className="align-middle col2">
                      prod
                    </td>
                    <td className="align-middle col3">
                      412ms
                    </td>
                    <td className="align-middle col4">
                      99.87%
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Up
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-heart-pulse text-warning"></span>
                        <div>
                          <h6 className="mb-0">
                            airflow webserver
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            https://mwaa.us-east-1…/health
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      HTTP 200
                    </td>
                    <td className="align-middle col2">
                      prod
                    </td>
                    <td className="align-middle col3">
                      1.8s
                    </td>
                    <td className="align-middle col4">
                      99.42%
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-warning">
                        Slow
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-heart-pulse text-success"></span>
                        <div>
                          <h6 className="mb-0">
                            checkout-api
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            https://stage.rootvyana.com/health
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      HTTP 200
                    </td>
                    <td className="align-middle col2">
                      stage
                    </td>
                    <td className="align-middle col3">
                      34ms
                    </td>
                    <td className="align-middle col4">
                      99.10%
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Up
                      </span>
                    </td>
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
    </AppLayout>
  )
}
