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
              Observability
            </a>
          </li>
          <li className="breadcrumb-item active">
            Traces & Topology
          </li>
        </ol>
      </nav>
      <div className="mb-6">
        <div className="row align-items-center g-3">
          <div className="col">
            <h2 className="mb-2">
              Traces & Service Topology
            </h2>
            <h5 className="text-body-tertiary fw-semibold mb-0">
              OpenTelemetry spans and the dependency graph derived from them — which service called what, and where the time went
            </h5>
          </div>
          <div className="col-auto">
            <button className="btn btn-primary" type="button" data-lhb-action="exportTraces">
              Export traces
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
                    Spans (1h)
                  </h6>
                  <h3 className="mb-0">
                    42.7M
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-info">
                  +3.1%
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
                    Services
                  </h6>
                  <h3 className="mb-0">
                    68
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-primary">
                  +2
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
                    Error spans
                  </h6>
                  <h3 className="mb-0">
                    0.61%
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-warning">
                  +0.08%
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
                    p99 trace
                  </h6>
                  <h3 className="mb-0">
                    2.4s
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-warning">
                  +310ms
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="card mb-4">
        <div className="card-header border-bottom border-translucent py-3">
          <h4 className="mb-0">
            Slowest trace · checkout POST /v1/orders
          </h4>
          <p className="text-body-tertiary fs-9 mb-0">
            trace 8f21c4de · 4.19s total · 14 spans across 5 services
          </p>
        </div>
        <div className="card-body">
          <div className="fs-9">
            <div className="mb-2">
              <div className="d-flex justify-content-between mb-1">
                <span>
                  api-gateway
                </span>
                <span className="text-body-tertiary">
                  4.19s
                </span>
              </div>
              <div className="progress" style={{ height: "8px" }}>
                <div className="progress-bar bg-primary" style={{ width: "100%" }} role="progressbar" aria-valuenow={100} aria-valuemin={0} aria-valuemax={100}></div>
              </div>
            </div>
            <div className="mb-2 ps-3">
              <div className="d-flex justify-content-between mb-1">
                <span>
                  checkout-api
                </span>
                <span className="text-body-tertiary">
                  4.02s
                </span>
              </div>
              <div className="progress" style={{ height: "8px" }}>
                <div className="progress-bar bg-info" style={{ width: "96%" }} role="progressbar" aria-valuenow={96} aria-valuemin={0} aria-valuemax={100}></div>
              </div>
            </div>
            <div className="mb-2 ps-5">
              <div className="d-flex justify-content-between mb-1">
                <span>
                  identity-api · validate token
                </span>
                <span className="text-body-tertiary">
                  84ms
                </span>
              </div>
              <div className="progress" style={{ height: "8px" }}>
                <div className="progress-bar bg-success" style={{ width: "2%" }} role="progressbar" aria-valuenow={2} aria-valuemin={0} aria-valuemax={100}></div>
              </div>
            </div>
            <div className="mb-2 ps-5">
              <div className="d-flex justify-content-between mb-1">
                <span>
                  orders-db · SELECT order_items
                </span>
                <span className="text-body-tertiary">
                  3.61s
                </span>
              </div>
              <div className="progress" style={{ height: "8px" }}>
                <div className="progress-bar bg-danger" style={{ width: "86%" }} role="progressbar" aria-valuenow={86} aria-valuemin={0} aria-valuemax={100}></div>
              </div>
            </div>
            <div className="mb-0 ps-5">
              <div className="d-flex justify-content-between mb-1">
                <span>
                  payments-api · authorize
                </span>
                <span className="text-body-tertiary">
                  210ms
                </span>
              </div>
              <div className="progress" style={{ height: "8px" }}>
                <div className="progress-bar bg-success" style={{ width: "5%" }} role="progressbar" aria-valuenow={5} aria-valuemin={0} aria-valuemax={100}></div>
              </div>
            </div>
          </div>
          <p className="text-body-tertiary fs-9 mb-0 mt-3">
            86% of this trace is one query against
            <code className="mx-1">
              orders
            </code>
            . The gateway and auth hops are noise by comparison.
          </p>
        </div>
      </div>
      <div className="obs-list-root" data-list={"{\"valueNames\":[\"col0\",\"col1\",\"col2\",\"col3\",\"col4\",\"col5\"],\"page\":8,\"filter\":{\"key\":\"col5\"}}"} data-live-table="traces">
        <div className="card">
          <div className="card-header border-bottom border-translucent py-3">
            <div className="row align-items-center g-2 mb-3">
              <div className="col">
                <h4 className="mb-0">
                  Service dependencies
                </h4>
                <p className="text-body-tertiary fs-9 mb-0">
                  Edges inferred from span parentage — call volume, error rate, and latency per caller → callee pair
                </p>
              </div>
            </div>
            <div className="row align-items-center g-2">
              <div className="col-12 col-md">
                <div className="search-box w-100">
                  <form className="position-relative">
                    <input className="form-control search-input search form-control-sm" type="search" placeholder="Search services or dependencies" aria-label="Search" />
                    <span className="fas fa-search search-box-icon"></span>
                  </form>
                </div>
              </div>
              <div className="col-6 col-md-auto">
                <select className="form-select form-select-sm" data-list-filter="data-list-filter" aria-label="Filter">
                  <option value="">
                    Filter: All
                  </option>
                  <option value="Degraded">
                    Degraded
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
                    Service
                  </option>
                  <option value="col1">
                    Depends on
                  </option>
                  <option value="col2">
                    Calls (1h)
                  </option>
                  <option value="col3">
                    p99
                  </option>
                  <option value="col4">
                    Error rate
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
                      Service
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col1">
                      Depends on
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col2">
                      Calls (1h)
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col3">
                      p99
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col4">
                      Error rate
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col5">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="list">
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-diagram-project text-primary"></span>
                        <div>
                          <h6 className="mb-0">
                            api-gateway
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            entrypoint
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      checkout-api
                    </td>
                    <td className="align-middle col2">
                      1.8M
                    </td>
                    <td className="align-middle col3">
                      4.2s
                    </td>
                    <td className="align-middle col4">
                      0.9%
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-warning">
                        Degraded
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-diagram-project text-danger"></span>
                        <div>
                          <h6 className="mb-0">
                            checkout-api
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            read path
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      orders-db
                    </td>
                    <td className="align-middle col2">
                      3.4M
                    </td>
                    <td className="align-middle col3">
                      3.6s
                    </td>
                    <td className="align-middle col4">
                      1.4%
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-warning">
                        Degraded
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-diagram-project text-success"></span>
                        <div>
                          <h6 className="mb-0">
                            checkout-api
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            auth
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      identity-api
                    </td>
                    <td className="align-middle col2">
                      1.8M
                    </td>
                    <td className="align-middle col3">
                      96ms
                    </td>
                    <td className="align-middle col4">
                      0.0%
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Healthy
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-diagram-project text-success"></span>
                        <div>
                          <h6 className="mb-0">
                            checkout-api
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            sync
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      payments-api
                    </td>
                    <td className="align-middle col2">
                      842K
                    </td>
                    <td className="align-middle col3">
                      240ms
                    </td>
                    <td className="align-middle col4">
                      0.1%
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Healthy
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-diagram-project text-success"></span>
                        <div>
                          <h6 className="mb-0">
                            payments-api
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            ledger write
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      payments-db
                    </td>
                    <td className="align-middle col2">
                      842K
                    </td>
                    <td className="align-middle col3">
                      38ms
                    </td>
                    <td className="align-middle col4">
                      0.0%
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Healthy
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-diagram-project text-warning"></span>
                        <div>
                          <h6 className="mb-0">
                            payments-api
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            external
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      partner-api
                    </td>
                    <td className="align-middle col2">
                      118K
                    </td>
                    <td className="align-middle col3">
                      8.1s
                    </td>
                    <td className="align-middle col4">
                      4.2%
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-danger">
                        Degraded
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-diagram-project text-success"></span>
                        <div>
                          <h6 className="mb-0">
                            search-api
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            cache
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      search-cache
                    </td>
                    <td className="align-middle col2">
                      2.2M
                    </td>
                    <td className="align-middle col3">
                      4ms
                    </td>
                    <td className="align-middle col4">
                      0.0%
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Healthy
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-diagram-project text-success"></span>
                        <div>
                          <h6 className="mb-0">
                            inventory-api
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            async
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      events.raw
                    </td>
                    <td className="align-middle col2">
                      640K
                    </td>
                    <td className="align-middle col3">
                      12ms
                    </td>
                    <td className="align-middle col4">
                      0.0%
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
    </AppLayout>
  )
}
