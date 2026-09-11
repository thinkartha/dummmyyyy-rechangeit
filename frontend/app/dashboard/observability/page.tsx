import AppLayout from '@/components/app-layout'

export default function Page() {
  return (
    <AppLayout scripts={[
        {
          "code": "\n          (function() {\n            document.querySelectorAll('[data-obs-sort]').forEach(function(select) {\n              if (select.dataset.bound === '1') return;\n              select.dataset.bound = '1';\n              select.addEventListener('change', function() {\n                var key = select.value;\n                if (!key) return;\n                var root = select.closest('[data-list]');\n                if (!root) return;\n                var header = root.querySelector('th[data-sort=\"' + key + '\"]');\n                if (header) header.click();\n              });\n            });\n          })();\n        "
        },
        {
          "code": "\n              (function() {\n                document.querySelectorAll('[data-obs-sort]').forEach(function(select) {\n                  if (select.dataset.bound === '1') return;\n                  select.dataset.bound = '1';\n                  select.addEventListener('change', function() {\n                    var key = select.value;\n                    if (!key) return;\n                    var root = select.closest('[data-list]');\n                    if (!root) return;\n                    var header = root.querySelector('th[data-sort=\"' + key + '\"]');\n                    if (header) header.click();\n                  });\n                });\n              })();\n            "
        },
        {
          "code": "\n              (function() {\n                document.querySelectorAll('[data-obs-sort]').forEach(function(select) {\n                  if (select.dataset.bound === '1') return;\n                  select.dataset.bound = '1';\n                  select.addEventListener('change', function() {\n                    var key = select.value;\n                    if (!key) return;\n                    var root = select.closest('[data-list]');\n                    if (!root) return;\n                    var header = root.querySelector('th[data-sort=\"' + key + '\"]');\n                    if (header) header.click();\n                  });\n                });\n              })();\n            "
        },
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
      <div className="mb-5">
        <h2 className="mb-2">
          Observability Dashboard
        </h2>
        <p className="text-body-tertiary mb-0">
          LoveHeartBeat — APIs, AI tools, ETL, alerts and multi-cloud cost in one place.
        </p>
      </div>
      <div className="obs-kpi-row d-flex gap-3 mb-4 pb-1" style={{ overflowX: "auto", scrollbarWidth: "thin" }}>
        <div className="card flex-shrink-0" style={{ minWidth: "11.5rem", flex: "1 1 0" }}>
          <div className="card-body py-3 px-3">
            <div className="d-flex align-items-center gap-1 mb-2">
              <h6 className="text-body-tertiary text-uppercase fs-10 fw-semibold mb-0 lh-1" style={{ letterSpacing: ".04em" }}>
                Requests
              </h6>
              <span className="text-body-quaternary fs-10" data-bs-toggle="tooltip" data-bs-placement="top" title="Requests across every route the collector has spans for, in the stored window.">
                <span className="fa-solid fa-circle-info"></span>
              </span>
            </div>
            <div className="d-flex align-items-baseline gap-2 flex-wrap">
              <h2 className="mb-0 fw-semibold lh-1" data-obs-stat="data-obs-stat" data-obs-stat-key="requests">
                0
              </h2>
              <span className="badge badge-phoenix fs-10 badge-phoenix-info" data-obs-stat-delta="data-obs-stat-delta" data-obs-stat-delta-key="requests">
                from stored spans
              </span>
            </div>
          </div>
        </div>
        <div className="card flex-shrink-0" style={{ minWidth: "11.5rem", flex: "1 1 0" }}>
          <div className="card-body py-3 px-3">
            <div className="d-flex align-items-center gap-1 mb-2">
              <h6 className="text-body-tertiary text-uppercase fs-10 fw-semibold mb-0 lh-1" style={{ letterSpacing: ".04em" }}>
                Error rate
              </h6>
              <span className="text-body-quaternary fs-10" data-bs-toggle="tooltip" data-bs-placement="top" title="5xx only. A 4xx is the caller's mistake, not the route's, and folding it in here would make a healthy route look broken.">
                <span className="fa-solid fa-circle-info"></span>
              </span>
            </div>
            <div className="d-flex align-items-baseline gap-2 flex-wrap">
              <h2 className="mb-0 fw-semibold lh-1" data-obs-stat="data-obs-stat" data-obs-stat-key="errorRate">
                0
              </h2>
              <span className="badge badge-phoenix fs-10 badge-phoenix-success" data-obs-stat-delta="data-obs-stat-delta" data-obs-stat-delta-key="errorRate">
                0 5xx
              </span>
            </div>
          </div>
        </div>
        <div className="card flex-shrink-0" style={{ minWidth: "11.5rem", flex: "1 1 0" }}>
          <div className="card-body py-3 px-3">
            <div className="d-flex align-items-center gap-1 mb-2">
              <h6 className="text-body-tertiary text-uppercase fs-10 fw-semibold mb-0 lh-1" style={{ letterSpacing: ".04em" }}>
                p99 latency
              </h6>
              <span className="text-body-quaternary fs-10" data-bs-toggle="tooltip" data-bs-placement="top" title="The slowest route's p99, named beside it. Percentiles do not recombine, so there is no honest fleet-wide number.">
                <span className="fa-solid fa-circle-info"></span>
              </span>
            </div>
            <div className="d-flex align-items-baseline gap-2 flex-wrap">
              <h2 className="mb-0 fw-semibold lh-1" data-obs-stat="data-obs-stat" data-obs-stat-key="p99Latency">
                0
              </h2>
              <span className="badge badge-phoenix fs-10 badge-phoenix-warning" data-obs-stat-delta="data-obs-stat-delta" data-obs-stat-delta-key="p99Latency">
                slowest route
              </span>
            </div>
          </div>
        </div>
        <div className="card flex-shrink-0" style={{ minWidth: "11.5rem", flex: "1 1 0" }}>
          <div className="card-body py-3 px-3">
            <div className="d-flex align-items-center gap-1 mb-2">
              <h6 className="text-body-tertiary text-uppercase fs-10 fw-semibold mb-0 lh-1" style={{ letterSpacing: ".04em" }}>
                Routes
              </h6>
              <span className="text-body-quaternary fs-10" data-bs-toggle="tooltip" data-bs-placement="top" title="Distinct routes seen. Nothing is registered — these are the routes traffic actually reached.">
                <span className="fa-solid fa-circle-info"></span>
              </span>
            </div>
            <div className="d-flex align-items-baseline gap-2 flex-wrap">
              <h2 className="mb-0 fw-semibold lh-1" data-obs-stat="data-obs-stat" data-obs-stat-key="routes">
                0
              </h2>
              <span className="badge badge-phoenix fs-10 badge-phoenix-primary" data-obs-stat-delta="data-obs-stat-delta" data-obs-stat-delta-key="routes">
                from stored spans
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="obs-list-root" data-list={"{\"valueNames\":[\"col0\",\"col1\",\"col2\",\"col3\",\"col4\",\"col5\"],\"page\":6,\"filter\":{\"key\":\"col5\"}}"} data-live-table="apiRoutes">
        <div className="card">
          <div className="card-header border-bottom border-translucent py-3">
            <div className="row align-items-center g-2 mb-3">
              <div className="col">
                <h4 className="mb-0">
                  API routes
                </h4>
                <p className="text-body-tertiary fs-9 mb-0">
                  Per-route traffic from stored spans — the same response the cards above are rolled up from
                </p>
              </div>
            </div>
            <div className="row align-items-center g-2">
              <div className="col-12 col-md">
                <div className="search-box w-100">
                  <form className="position-relative">
                    <input className="form-control search-input search form-control-sm" type="search" placeholder="Search routes" aria-label="Search" />
                    <span className="fas fa-search search-box-icon"></span>
                  </form>
                </div>
              </div>
              <div className="col-6 col-md-auto">
                <select className="form-select form-select-sm" data-list-filter="data-list-filter" aria-label="Filter">
                  <option value="">
                    Filter: All
                  </option>
                  <option value="Healthy">
                    Healthy
                  </option>
                </select>
              </div>
              <div className="col-6 col-md-auto">
                <select className="form-select form-select-sm" aria-label="Sort by" data-obs-sort="data-obs-sort">
                  <option value="">
                    Sort by
                  </option>
                  <option value="col0">
                    Route
                  </option>
                  <option value="col1">
                    Requests
                  </option>
                  <option value="col2">
                    5xx
                  </option>
                  <option value="col3">
                    Error rate
                  </option>
                  <option value="col4">
                    Status codes
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
                      Route
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col1">
                      Requests
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col2">
                      5xx
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col3">
                      Error rate
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col4">
                      Status codes
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
                        <span className="me-2 fa-solid fa-route text-success"></span>
                        <div>
                          <h6 className="mb-0">
                            GET /api/v1/orders
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            200×1204
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      1,204
                    </td>
                    <td className="align-middle col2">
                      0
                    </td>
                    <td className="align-middle col3">
                      0.00%
                    </td>
                    <td className="align-middle col4">
                      200
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Healthy
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
      <div className="row g-4 mb-4">
        <div className="col-12 col-xl-6">
          <div className="obs-list-root" data-list={"{\"valueNames\":[\"col0\",\"col1\",\"col2\",\"col3\",\"col4\",\"col5\"],\"page\":5,\"filter\":{\"key\":\"col5\"}}"} data-live-table="alerts">
            <div className="card">
              <div className="card-header border-bottom border-translucent py-3">
                <div className="row align-items-center g-2 mb-3">
                  <div className="col">
                    <h4 className="mb-0">
                      Open alerts
                    </h4>
                    <p className="text-body-tertiary fs-9 mb-0">
                      Newest first, across every signal that feeds the collector
                    </p>
                  </div>
                </div>
                <div className="row align-items-center g-2">
                  <div className="col-12 col-md">
                    <div className="search-box w-100">
                      <form className="position-relative">
                        <input className="form-control search-input search form-control-sm" type="search" placeholder="Search alerts" aria-label="Search" />
                        <span className="fas fa-search search-box-icon"></span>
                      </form>
                    </div>
                  </div>
                  <div className="col-6 col-md-auto">
                    <select className="form-select form-select-sm" data-list-filter="data-list-filter" aria-label="Filter">
                      <option value="">
                        Filter: All
                      </option>
                      <option value="Open">
                        Open
                      </option>
                    </select>
                  </div>
                  <div className="col-6 col-md-auto">
                    <select className="form-select form-select-sm" aria-label="Sort by" data-obs-sort="data-obs-sort">
                      <option value="">
                        Sort by
                      </option>
                      <option value="col0">
                        Alert
                      </option>
                      <option value="col1">
                        Source
                      </option>
                      <option value="col2">
                        Severity
                      </option>
                      <option value="col3">
                        Owner
                      </option>
                      <option value="col4">
                        Age
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
                          Alert
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col1">
                          Source
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col2">
                          Severity
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col3">
                          Owner
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col4">
                          Age
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
                            <span className="me-2 fa-solid fa-bell text-danger"></span>
                            <div>
                              <h6 className="mb-0">
                                Error rate above 5%
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                checkout-api
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          api
                        </td>
                        <td className="align-middle col2">
                          <span className="badge badge-phoenix badge-phoenix-danger">
                            critical
                          </span>
                        </td>
                        <td className="align-middle col3">
                          unassigned
                        </td>
                        <td className="align-middle col4">
                          2026-09-10T09:40:00Z
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-danger">
                            Open
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
        </div>
        <div className="col-12 col-xl-6">
          <div className="obs-list-root" data-list={"{\"valueNames\":[\"col0\",\"col1\",\"col2\",\"col3\",\"col4\",\"col5\"],\"page\":5,\"filter\":{\"key\":\"col5\"}}"} data-live-table="databases">
            <div className="card">
              <div className="card-header border-bottom border-translucent py-3">
                <div className="row align-items-center g-2 mb-3">
                  <div className="col">
                    <h4 className="mb-0">
                      Databases
                    </h4>
                    <p className="text-body-tertiary fs-9 mb-0">
                      Registered databases and what the last probe found
                    </p>
                  </div>
                </div>
                <div className="row align-items-center g-2">
                  <div className="col-12 col-md">
                    <div className="search-box w-100">
                      <form className="position-relative">
                        <input className="form-control search-input search form-control-sm" type="search" placeholder="Search databases" aria-label="Search" />
                        <span className="fas fa-search search-box-icon"></span>
                      </form>
                    </div>
                  </div>
                  <div className="col-6 col-md-auto">
                    <select className="form-select form-select-sm" data-list-filter="data-list-filter" aria-label="Filter">
                      <option value="">
                        Filter: All
                      </option>
                      <option value="Healthy">
                        Healthy
                      </option>
                    </select>
                  </div>
                  <div className="col-6 col-md-auto">
                    <select className="form-select form-select-sm" aria-label="Sort by" data-obs-sort="data-obs-sort">
                      <option value="">
                        Sort by
                      </option>
                      <option value="col0">
                        Database
                      </option>
                      <option value="col1">
                        Engine
                      </option>
                      <option value="col2">
                        Env
                      </option>
                      <option value="col3">
                        Connections
                      </option>
                      <option value="col4">
                        Replication lag
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
                          Database
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col1">
                          Engine
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col2">
                          Env
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col3">
                          Connections
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col4">
                          Replication lag
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
                            <span className="me-2 fa-solid fa-database text-info"></span>
                            <div>
                              <h6 className="mb-0">
                                commerce
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                db.internal
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          PostgreSQL
                        </td>
                        <td className="align-middle col2">
                          prod
                        </td>
                        <td className="align-middle col3">
                          42
                        </td>
                        <td className="align-middle col4">
                          0.2s
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-success">
                            Healthy
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
        </div>
      </div>
      <div className="obs-list-root" data-list={"{\"valueNames\":[\"col0\",\"col1\",\"col2\",\"col3\",\"col4\",\"col5\",\"col6\"],\"page\":6,\"filter\":{\"key\":\"col6\"}}"} data-live-table="etlJobs">
        <div className="card">
          <div className="card-header border-bottom border-translucent py-3">
            <div className="row align-items-center g-2 mb-3">
              <div className="col">
                <h4 className="mb-0">
                  Recent ETL runs
                </h4>
                <p className="text-body-tertiary fs-9 mb-0">
                  One row per run, newest first — from both the pollers and anything pushed to the ingest endpoints
                </p>
              </div>
            </div>
            <div className="row align-items-center g-2">
              <div className="col-12 col-md">
                <div className="search-box w-100">
                  <form className="position-relative">
                    <input className="form-control search-input search form-control-sm" type="search" placeholder="Search jobs" aria-label="Search" />
                    <span className="fas fa-search search-box-icon"></span>
                  </form>
                </div>
              </div>
              <div className="col-6 col-md-auto">
                <select className="form-select form-select-sm" data-list-filter="data-list-filter" aria-label="Filter">
                  <option value="">
                    Filter: All
                  </option>
                  <option value="2026-09-10T02:00:00Z">
                    2026-09-10T02:00:00Z
                  </option>
                </select>
              </div>
              <div className="col-6 col-md-auto">
                <select className="form-select form-select-sm" aria-label="Sort by" data-obs-sort="data-obs-sort">
                  <option value="">
                    Sort by
                  </option>
                  <option value="col0">
                    Job
                  </option>
                  <option value="col1">
                    Platform
                  </option>
                  <option value="col2">
                    Environment
                  </option>
                  <option value="col3">
                    Status
                  </option>
                  <option value="col4">
                    Duration
                  </option>
                  <option value="col5">
                    Records
                  </option>
                  <option value="col6">
                    Last run
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
                      Job
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col1">
                      Platform
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col2">
                      Environment
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col3">
                      Status
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col4">
                      Duration
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col5">
                      Records
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col6">
                      Last run
                    </th>
                  </tr>
                </thead>
                <tbody className="list" data-sample-rows="data-sample-rows">
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-diagram-project text-success"></span>
                        <div>
                          <h6 className="mb-0">
                            nightly-load
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            talend
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Talend
                    </td>
                    <td className="align-middle col2">
                      prod
                    </td>
                    <td className="align-middle col3">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Success
                      </span>
                    </td>
                    <td className="align-middle col4">
                      4m 12s
                    </td>
                    <td className="align-middle col5">
                      1,204
                    </td>
                    <td className="align-middle col6">
                      2026-09-10T02:00:00Z
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
