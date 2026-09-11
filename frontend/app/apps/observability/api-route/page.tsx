import AppLayout from '@/components/app-layout'

export default function Page() {
  return (
    <AppLayout scripts={[
        {
          "code": "\n          (function() {\n            document.querySelectorAll('[data-obs-sort]').forEach(function(select) {\n              if (select.dataset.bound === '1') return;\n              select.dataset.bound = '1';\n              select.addEventListener('change', function() {\n                var key = select.value;\n                if (!key) return;\n                var root = select.closest('[data-list]');\n                if (!root) return;\n                var header = root.querySelector('th[data-sort=\"' + key + '\"]');\n                if (header) header.click();\n              });\n            });\n          })();\n        "
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
      <nav className="mb-3" aria-label="breadcrumb">
        <ol className="breadcrumb mb-0">
          <li className="breadcrumb-item">
            <a href="#!">
              Observability
            </a>
          </li>
          <li className="breadcrumb-item">
            <a href="/apps/observability/api-monitoring/">
              API Monitoring
            </a>
          </li>
          <li className="breadcrumb-item active">
            Route
          </li>
        </ol>
      </nav>
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-3" data-route-heading="data-route-heading">
        <div>
          <h2 className="mb-1 text-break" data-route-name="data-route-name">
            —
          </h2>
          <p className="text-body-tertiary fs-9 mb-0" data-route-meta="data-route-meta">
            Loading route…
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <a className="btn btn-phoenix-secondary btn-sm" href="/apps/observability/api-monitoring/">
            <span className="fa-solid fa-arrow-left me-2"></span>
            All routes
          </a>
          <button className="btn btn-phoenix-secondary btn-sm" type="button" data-lhb-action="refreshData">
            <span className="fa-solid fa-arrows-rotate me-2"></span>
            Update
          </button>
        </div>
      </div>
      <div className="obs-kpi-row d-flex gap-3 mb-4 pb-1" style={{ overflowX: "auto", scrollbarWidth: "thin" }}>
        <div className="card flex-shrink-0" style={{ minWidth: "11.5rem", flex: "1 1 0" }}>
          <div className="card-body py-3 px-3">
            <div className="d-flex align-items-center gap-1 mb-2">
              <h6 className="text-body-tertiary text-uppercase fs-10 fw-semibold mb-0 lh-1" style={{ letterSpacing: ".04em" }}>
                Requests
              </h6>
              <span className="text-body-quaternary fs-10" data-bs-toggle="tooltip" data-bs-placement="top" title="Every stored span for this route. There is no time window — spans are kept for the record retention period and all of them are counted.">
                <span className="fa-solid fa-circle-info"></span>
              </span>
            </div>
            <div className="d-flex align-items-baseline gap-2" style={{ minWidth: "0" }}>
              <h2 className="mb-0 fw-semibold lh-1" data-obs-stat="data-obs-stat" data-obs-stat-key="routeRequests">
                0
              </h2>
              <span className="badge badge-phoenix fs-10 text-truncate badge-phoenix-info" style={{ maxWidth: "60%", textTransform: "none" }} title="" data-obs-stat-delta="data-obs-stat-delta" data-obs-stat-delta-key="routeRequests"></span>
            </div>
          </div>
        </div>
        <div className="card flex-shrink-0" style={{ minWidth: "11.5rem", flex: "1 1 0" }}>
          <div className="card-body py-3 px-3">
            <div className="d-flex align-items-center gap-1 mb-2">
              <h6 className="text-body-tertiary text-uppercase fs-10 fw-semibold mb-0 lh-1" style={{ letterSpacing: ".04em" }}>
                5xx
              </h6>
              <span className="text-body-quaternary fs-10" data-bs-toggle="tooltip" data-bs-placement="top" title="Responses the server failed, plus spans the exporter marked ERROR. A 4xx is the caller's mistake and is not counted here.">
                <span className="fa-solid fa-circle-info"></span>
              </span>
            </div>
            <div className="d-flex align-items-baseline gap-2" style={{ minWidth: "0" }}>
              <h2 className="mb-0 fw-semibold lh-1" data-obs-stat="data-obs-stat" data-obs-stat-key="routeErrors">
                0
              </h2>
              <span className="badge badge-phoenix fs-10 text-truncate badge-phoenix-danger" style={{ maxWidth: "60%", textTransform: "none" }} title="" data-obs-stat-delta="data-obs-stat-delta" data-obs-stat-delta-key="routeErrors"></span>
            </div>
          </div>
        </div>
        <div className="card flex-shrink-0" style={{ minWidth: "11.5rem", flex: "1 1 0" }}>
          <div className="card-body py-3 px-3">
            <div className="d-flex align-items-center gap-1 mb-2">
              <h6 className="text-body-tertiary text-uppercase fs-10 fw-semibold mb-0 lh-1" style={{ letterSpacing: ".04em" }}>
                Error rate
              </h6>
              <span className="text-body-quaternary fs-10" data-bs-toggle="tooltip" data-bs-placement="top" title="5xx as a share of this route's requests.">
                <span className="fa-solid fa-circle-info"></span>
              </span>
            </div>
            <div className="d-flex align-items-baseline gap-2" style={{ minWidth: "0" }}>
              <h2 className="mb-0 fw-semibold lh-1" data-obs-stat="data-obs-stat" data-obs-stat-key="routeErrorRate">
                0
              </h2>
              <span className="badge badge-phoenix fs-10 text-truncate badge-phoenix-warning" style={{ maxWidth: "60%", textTransform: "none" }} title="" data-obs-stat-delta="data-obs-stat-delta" data-obs-stat-delta-key="routeErrorRate"></span>
            </div>
          </div>
        </div>
        <div className="card flex-shrink-0" style={{ minWidth: "11.5rem", flex: "1 1 0" }}>
          <div className="card-body py-3 px-3">
            <div className="d-flex align-items-center gap-1 mb-2">
              <h6 className="text-body-tertiary text-uppercase fs-10 fw-semibold mb-0 lh-1" style={{ letterSpacing: ".04em" }}>
                Average
              </h6>
              <span className="text-body-quaternary fs-10" data-bs-toggle="tooltip" data-bs-placement="top" title="Mean span duration for this route.">
                <span className="fa-solid fa-circle-info"></span>
              </span>
            </div>
            <div className="d-flex align-items-baseline gap-2" style={{ minWidth: "0" }}>
              <h2 className="mb-0 fw-semibold lh-1" data-obs-stat="data-obs-stat" data-obs-stat-key="routeAvgLatency">
                0
              </h2>
              <span className="badge badge-phoenix fs-10 text-truncate badge-phoenix-primary" style={{ maxWidth: "60%", textTransform: "none" }} title="" data-obs-stat-delta="data-obs-stat-delta" data-obs-stat-delta-key="routeAvgLatency"></span>
            </div>
          </div>
        </div>
        <div className="card flex-shrink-0" style={{ minWidth: "11.5rem", flex: "1 1 0" }}>
          <div className="card-body py-3 px-3">
            <div className="d-flex align-items-center gap-1 mb-2">
              <h6 className="text-body-tertiary text-uppercase fs-10 fw-semibold mb-0 lh-1" style={{ letterSpacing: ".04em" }}>
                p99
              </h6>
              <span className="text-body-quaternary fs-10" data-bs-toggle="tooltip" data-bs-placement="top" title="The slowest 1% of this route's requests start here. Read it next to the average: a gap between them is a tail problem, not a capacity one.">
                <span className="fa-solid fa-circle-info"></span>
              </span>
            </div>
            <div className="d-flex align-items-baseline gap-2" style={{ minWidth: "0" }}>
              <h2 className="mb-0 fw-semibold lh-1" data-obs-stat="data-obs-stat" data-obs-stat-key="routeP99Latency">
                0
              </h2>
              <span className="badge badge-phoenix fs-10 text-truncate badge-phoenix-secondary" style={{ maxWidth: "60%", textTransform: "none" }} title="" data-obs-stat-delta="data-obs-stat-delta" data-obs-stat-delta-key="routeP99Latency"></span>
            </div>
          </div>
        </div>
      </div>
      <div className="obs-list-root" data-list={"{\"valueNames\":[\"col0\",\"col1\",\"col2\",\"col3\"],\"page\":10,\"filter\":{\"key\":\"col3\"}}"} data-live-table="apiRouteCodes">
        <div className="card">
          <div className="card-header border-bottom border-translucent py-3">
            <div className="row align-items-center g-2 mb-3">
              <div className="col">
                <h4 className="mb-0">
                  Status codes
                </h4>
                <p className="text-body-tertiary fs-9 mb-0">
                  Every response code this route has returned, and how much of its traffic each one is
                </p>
              </div>
            </div>
            <div className="row align-items-center g-2">
              <div className="col-12 col-md">
                <div className="search-box w-100">
                  <form className="position-relative">
                    <input className="form-control search-input search form-control-sm" type="search" placeholder="Search codes" aria-label="Search" />
                    <span className="fas fa-search search-box-icon"></span>
                  </form>
                </div>
              </div>
              <div className="col-6 col-md-auto">
                <select className="form-select form-select-sm" data-list-filter="data-list-filter" aria-label="Filter">
                  <option value="">
                    Filter: All
                  </option>
                  <option value="No data">
                    No data
                  </option>
                </select>
              </div>
              <div className="col-6 col-md-auto">
                <select className="form-select form-select-sm" aria-label="Sort by" data-obs-sort="data-obs-sort">
                  <option value="">
                    Sort by
                  </option>
                  <option value="col0">
                    Code
                  </option>
                  <option value="col1">
                    Responses
                  </option>
                  <option value="col2">
                    Share
                  </option>
                  <option value="col3">
                    Class
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
                      Code
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col1">
                      Responses
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col2">
                      Share
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col3">
                      Class
                    </th>
                  </tr>
                </thead>
                <tbody className="list" data-sample-rows="data-sample-rows">
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-hashtag text-secondary"></span>
                        <div>
                          <h6 className="mb-0">
                            —
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            no traffic recorded yet
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      0
                    </td>
                    <td className="align-middle col2">
                      —
                    </td>
                    <td className="align-middle col3">
                      <span className="badge badge-phoenix badge-phoenix-secondary">
                        No data
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
      <div className="obs-list-root" data-list={"{\"valueNames\":[\"col0\",\"col1\",\"col2\",\"col3\",\"col4\",\"col5\"],\"page\":10,\"filter\":{\"key\":\"col5\"}}"} data-live-table="apiRouteTraces">
        <div className="card">
          <div className="card-header border-bottom border-translucent py-3">
            <div className="row align-items-center g-2 mb-3">
              <div className="col">
                <h4 className="mb-0">
                  Recent traces
                </h4>
                <p className="text-body-tertiary fs-9 mb-0">
                  Stored traces whose root span is this route — open one to see where the time went
                </p>
              </div>
            </div>
            <div className="row align-items-center g-2">
              <div className="col-12 col-md">
                <div className="search-box w-100">
                  <form className="position-relative">
                    <input className="form-control search-input search form-control-sm" type="search" placeholder="Search traces" aria-label="Search" />
                    <span className="fas fa-search search-box-icon"></span>
                  </form>
                </div>
              </div>
              <div className="col-6 col-md-auto">
                <select className="form-select form-select-sm" data-list-filter="data-list-filter" aria-label="Filter">
                  <option value="">
                    Filter: All
                  </option>
                  <option value="No data">
                    No data
                  </option>
                </select>
              </div>
              <div className="col-6 col-md-auto">
                <select className="form-select form-select-sm" aria-label="Sort by" data-obs-sort="data-obs-sort">
                  <option value="">
                    Sort by
                  </option>
                  <option value="col0">
                    Trace
                  </option>
                  <option value="col1">
                    Spans
                  </option>
                  <option value="col2">
                    Errors
                  </option>
                  <option value="col3">
                    Duration
                  </option>
                  <option value="col4">
                    Started
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
                      Trace
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col1">
                      Spans
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col2">
                      Errors
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col3">
                      Duration
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col4">
                      Started
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
                        <span className="me-2 fa-solid fa-diagram-project text-secondary"></span>
                        <div>
                          <h6 className="mb-0">
                            —
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            no traces for this route yet
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      0
                    </td>
                    <td className="align-middle col2">
                      0
                    </td>
                    <td className="align-middle col3">
                      —
                    </td>
                    <td className="align-middle col4">
                      —
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-secondary">
                        No data
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
