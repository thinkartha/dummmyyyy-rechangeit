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
              Observability
            </a>
          </li>
          <li className="breadcrumb-item active">
            Logs
          </li>
        </ol>
      </nav>
      <div className="mb-6">
        <div className="row align-items-center g-3">
          <div className="col">
            <h2 className="mb-2">
              Logs
            </h2>
            <h5 className="text-body-tertiary fw-semibold mb-0">
              Search across every service, gateway, and pipeline — indexed per organization in Elasticsearch
            </h5>
          </div>
          <div className="col-auto">
            <button className="btn btn-primary" type="button" data-lhb-action="saveSearch">
              Save search
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
                    Ingested (24h)
                  </h6>
                  <h3 className="mb-0">
                    918M
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-info">
                  +4.2%
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
                    Error lines
                  </h6>
                  <h3 className="mb-0">
                    1.4M
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-warning">
                  +18%
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
                    Indices
                  </h6>
                  <h3 className="mb-0">
                    31
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-primary">
                  7d hot · 30d warm
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
                    Index lag
                  </h6>
                  <h3 className="mb-0">
                    2.1s
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-success">
                  -0.4s
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-2 align-items-end">
            <div className="col-12 col-lg-5">
              <label className="form-label fs-9" htmlFor="log-query">
                Query
              </label>
              <input className="form-control form-control-sm font-monospace" id="log-query" type="search" defaultValue="level:error AND service:checkout-api" aria-label="Log search query" />
            </div>
            <div className="col-6 col-lg-2">
              <label className="form-label fs-9" htmlFor="log-service">
                Service
              </label>
              <select className="form-select form-select-sm" id="log-service" aria-label="Filter by service">
                <option value="">
                  All services
                </option>
                <option value="checkout-api">
                  checkout-api
                </option>
                <option value="payments-api">
                  payments-api
                </option>
                <option value="identity-api">
                  identity-api
                </option>
                <option value="etl-nightly">
                  etl-nightly
                </option>
              </select>
            </div>
            <div className="col-6 col-lg-2">
              <label className="form-label fs-9" htmlFor="log-level">
                Level
              </label>
              <select className="form-select form-select-sm" id="log-level" aria-label="Filter by level">
                <option value="">
                  All levels
                </option>
                <option value="error">
                  error
                </option>
                <option value="warn">
                  warn
                </option>
                <option value="info">
                  info
                </option>
                <option value="debug">
                  debug
                </option>
              </select>
            </div>
            <div className="col-6 col-lg-2">
              <label className="form-label fs-9" htmlFor="log-range">
                Range
              </label>
              <select className="form-select form-select-sm" id="log-range" aria-label="Time range">
                <option value="15m">
                  Last 15 minutes
                </option>
                <option value="1h">
                  Last hour
                </option>
                <option value="24h">
                  Last 24 hours
                </option>
                <option value="7d">
                  Last 7 days
                </option>
              </select>
            </div>
            <div className="col-6 col-lg-1">
              <button className="btn btn-primary btn-sm w-100" type="button" data-lhb-action="refreshData">
                Search
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="card" data-live-table="logs">
        <div className="card-header border-bottom border-translucent py-3">
          <h4 className="mb-0">
            Matching lines
          </h4>
          <p className="text-body-tertiary fs-9 mb-0">
            1,482 hits · newest first
          </p>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive scrollbar">
            <table className="table table-sm fs-10 mb-0">
              <thead>
                <tr>
                  <th className="ps-3 text-uppercase">
                    Timestamp
                  </th>
                  <th className="text-uppercase">
                    Level
                  </th>
                  <th className="text-uppercase">
                    Service
                  </th>
                  <th className="text-uppercase">
                    Message
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="ps-3 font-monospace white-space-nowrap">
                    14:03:44.812
                  </td>
                  <td>
                    <span className="badge badge-phoenix badge-phoenix-danger">
                      error
                    </span>
                  </td>
                  <td>
                    checkout-api
                  </td>
                  <td className="font-monospace">
                    timeout waiting for connection from pool "orders" after 3000ms
                  </td>
                </tr>
                <tr>
                  <td className="ps-3 font-monospace white-space-nowrap">
                    14:03:44.109
                  </td>
                  <td>
                    <span className="badge badge-phoenix badge-phoenix-danger">
                      error
                    </span>
                  </td>
                  <td>
                    checkout-api
                  </td>
                  <td className="font-monospace">
                    query cancelled: statement_timeout exceeded (SELECT … FROM order_items)
                  </td>
                </tr>
                <tr>
                  <td className="ps-3 font-monospace white-space-nowrap">
                    14:03:41.556
                  </td>
                  <td>
                    <span className="badge badge-phoenix badge-phoenix-warning">
                      warn
                    </span>
                  </td>
                  <td>
                    checkout-api
                  </td>
                  <td className="font-monospace">
                    replica lag 14.8s above threshold 5s, routing reads to primary
                  </td>
                </tr>
                <tr>
                  <td className="ps-3 font-monospace white-space-nowrap">
                    14:03:40.201
                  </td>
                  <td>
                    <span className="badge badge-phoenix badge-phoenix-danger">
                      error
                    </span>
                  </td>
                  <td>
                    api-gateway
                  </td>
                  <td className="font-monospace">
                    upstream returned 504 for POST /v1/orders (checkout-api)
                  </td>
                </tr>
                <tr>
                  <td className="ps-3 font-monospace white-space-nowrap">
                    14:02:10.004
                  </td>
                  <td>
                    <span className="badge badge-phoenix badge-phoenix-warning">
                      warn
                    </span>
                  </td>
                  <td>
                    orders-db
                  </td>
                  <td className="font-monospace">
                    seconds_behind_master=14 (backfill nightly-customer-load in progress)
                  </td>
                </tr>
                <tr>
                  <td className="ps-3 font-monospace white-space-nowrap">
                    14:01:58.774
                  </td>
                  <td>
                    <span className="badge badge-phoenix badge-phoenix-info">
                      info
                    </span>
                  </td>
                  <td>
                    etl-nightly
                  </td>
                  <td className="font-monospace">
                    talend task nightly-customer-load started, 4.2M rows queued
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="card-footer border-top border-translucent">
          <p className="fs-9 text-body-tertiary mb-0">
            Retention follows the organization's plan — hot 7 days, warm 30 days, then expired by index lifecycle policy.
          </p>
        </div>
      </div>
    </AppLayout>
  )
}
