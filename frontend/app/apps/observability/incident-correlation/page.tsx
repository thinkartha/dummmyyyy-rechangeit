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
            Correlation & RCA
          </li>
        </ol>
      </nav>
      <div className="mb-6">
        <div className="row align-items-center g-3">
          <div className="col">
            <h2 className="mb-2">
              Correlation & Root Cause
            </h2>
            <h5 className="text-body-tertiary fw-semibold mb-0">
              Alerts that fired together, collapsed into one incident with a probable cause and the evidence behind it
            </h5>
          </div>
          <div className="col-auto">
            <button className="btn btn-primary" type="button" data-lhb-action="recorrelate">
              Recorrelate
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
                    Raw alerts (24h)
                  </h6>
                  <h3 className="mb-0">
                    1,904
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-info">
                  +212
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
                    Correlated incidents
                  </h6>
                  <h3 className="mb-0">
                    46
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-success">
                  97.6% reduction
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
                    Open incidents
                  </h6>
                  <h3 className="mb-0">
                    7
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-warning">
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
                    Mean time to RCA
                  </h6>
                  <h3 className="mb-0">
                    6m
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-success">
                  -4m
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="card mb-4">
        <div className="card-header border-bottom border-translucent py-3">
          <h4 className="mb-0">
            INC-4821 · Checkout failures across three services
          </h4>
          <p className="text-body-tertiary fs-9 mb-0">
            Correlated from 34 alerts spanning 11 minutes
          </p>
        </div>
        <div className="card-body">
          <div className="row g-4">
            <div className="col-12 col-lg-7">
              <h6 className="mb-3">
                Signal timeline
              </h6>
              <div className="border-start border-2 border-translucent ps-3">
                <div className="mb-3">
                  <span className="badge badge-phoenix badge-phoenix-danger">
                    14:02:10
                  </span>
                  <p className="mb-0 mt-1">
                    <strong>
                      payments-db replication lag 14.8s
                    </strong>
                    <span className="text-body-tertiary d-block fs-9">
                      database · orders (MySQL 8.0) — first signal
                    </span>
                  </p>
                </div>
                <div className="mb-3">
                  <span className="badge badge-phoenix badge-phoenix-warning">
                    14:03:44
                  </span>
                  <p className="mb-0 mt-1">
                    <strong>
                      checkout-api p99 latency 4.2s
                    </strong>
                    <span className="text-body-tertiary d-block fs-9">
                      api · 22 alerts collapsed
                    </span>
                  </p>
                </div>
                <div className="mb-3">
                  <span className="badge badge-phoenix badge-phoenix-warning">
                    14:05:02
                  </span>
                  <p className="mb-0 mt-1">
                    <strong>
                      AWS API Gateway 5xx rate 6.1%
                    </strong>
                    <span className="text-body-tertiary d-block fs-9">
                      gateway · api-prod-us-east-1
                    </span>
                  </p>
                </div>
                <div className="mb-0">
                  <span className="badge badge-phoenix badge-phoenix-info">
                    14:13:20
                  </span>
                  <p className="mb-0 mt-1">
                    <strong>
                      Replication recovered, latency normal
                    </strong>
                    <span className="text-body-tertiary d-block fs-9">
                      auto-resolved
                    </span>
                  </p>
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-5">
              <h6 className="mb-3">
                Probable root cause
              </h6>
              <div className="bg-body-emphasis border border-translucent rounded-3 p-3 mb-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <strong className="fs-9">
                    Replication lag on orders
                  </strong>
                  <span className="badge badge-phoenix badge-phoenix-success">
                    0.86 confidence
                  </span>
                </div>
                <p className="fs-9 text-body-tertiary mb-0">
                  The orders replica fell behind during a bulk backfill. Checkout reads served from the replica timed out, and the gateway surfaced them as 5xx. Latency and error rate both recovered within 90s of replication catching up.
                </p>
              </div>
              <h6 className="mb-2">
                Evidence
              </h6>
              <ul className="fs-9 mb-0">
                <li>
                  Lag rose before any API alert fired
                </li>
                <li>
                  Backfill job
                  <code className="mx-1">
                    nightly-customer-load
                  </code>
                  overlapped the window
                </li>
                <li>
                  No deploy, config change, or scaling event in the window
                </li>
                <li>
                  Recovery order matched the failure order in reverse
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div className="obs-list-root" data-list={"{\"valueNames\":[\"col0\",\"col1\",\"col2\",\"col3\",\"col4\",\"col5\"],\"page\":6,\"filter\":{\"key\":\"col5\"}}"} data-live-table="clusters">
        <div className="card">
          <div className="card-header border-bottom border-translucent py-3">
            <div className="row align-items-center g-2 mb-3">
              <div className="col">
                <h4 className="mb-0">
                  Alert clusters
                </h4>
                <p className="text-body-tertiary fs-9 mb-0">
                  Near-identical alerts collapsed by message template — open a brief to hand one to a coding agent
                </p>
              </div>
            </div>
            <div className="row align-items-center g-2">
              <div className="col-12 col-md">
                <div className="search-box w-100">
                  <form className="position-relative">
                    <input className="form-control search-input search form-control-sm" type="search" placeholder="Search clusters or services" aria-label="Search" />
                    <span className="fas fa-search search-box-icon"></span>
                  </form>
                </div>
              </div>
              <div className="col-6 col-md-auto">
                <select className="form-select form-select-sm" data-list-filter="data-list-filter" aria-label="Filter">
                  <option value="">
                    Filter: All
                  </option>
                  <option value="firing">
                    firing
                  </option>
                  <option value="resolved">
                    resolved
                  </option>
                </select>
              </div>
              <div className="col-6 col-md-auto">
                <select className="form-select form-select-sm" aria-label="Sort by" data-obs-sort="data-obs-sort">
                  <option value="">
                    Sort by
                  </option>
                  <option value="col0">
                    Cluster
                  </option>
                  <option value="col1">
                    Severity
                  </option>
                  <option value="col2">
                    Alerts
                  </option>
                  <option value="col3">
                    Services
                  </option>
                  <option value="col4">
                    Last seen
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
                      Cluster
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col1">
                      Severity
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col2">
                      Alerts
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col3">
                      Services
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col4">
                      Last seen
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
                        <span className="me-2 fa-solid fa-layer-group text-danger"></span>
                        <div>
                          <h6 className="mb-0">
                            Connection pool exhausted on &lt;host&gt;
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            clu-sample-1
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      <span className="badge badge-phoenix badge-phoenix-danger">
                        critical
                      </span>
                    </td>
                    <td className="align-middle col2">
                      86
                    </td>
                    <td className="align-middle col3">
                      checkout-api, orders-db
                    </td>
                    <td className="align-middle col4">
                      14:11:02
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-danger">
                        firing
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
                            Upstream timeout after &lt;ms&gt;ms
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            clu-sample-2
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      <span className="badge badge-phoenix badge-phoenix-warning">
                        warning
                      </span>
                    </td>
                    <td className="align-middle col2">
                      41
                    </td>
                    <td className="align-middle col3">
                      gateway-edge
                    </td>
                    <td className="align-middle col4">
                      14:09:37
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-danger">
                        firing
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
                            Talend job &lt;job&gt; exited non-zero
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            clu-sample-3
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      <span className="badge badge-phoenix badge-phoenix-warning">
                        warning
                      </span>
                    </td>
                    <td className="align-middle col2">
                      12
                    </td>
                    <td className="align-middle col3">
                      etl-nightly
                    </td>
                    <td className="align-middle col4">
                      13:58:14
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        resolved
                      </span>
                    </td>
                    <td className="align-middle pe-3"></td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-layer-group text-info"></span>
                        <div>
                          <h6 className="mb-0">
                            Cache miss ratio above &lt;pct&gt;%
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            clu-sample-4
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      <span className="badge badge-phoenix badge-phoenix-info">
                        info
                      </span>
                    </td>
                    <td className="align-middle col2">
                      9
                    </td>
                    <td className="align-middle col3">
                      search-api
                    </td>
                    <td className="align-middle col4">
                      13:44:51
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        resolved
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
      <div className="obs-list-root" data-list={"{\"valueNames\":[\"col0\",\"col1\",\"col2\",\"col3\",\"col4\",\"col5\"],\"page\":8,\"filter\":{\"key\":\"col5\"}}"} data-live-table="correlation">
        <div className="card">
          <div className="card-header border-bottom border-translucent py-3">
            <div className="row align-items-center g-2 mb-3">
              <div className="col">
                <h4 className="mb-0">
                  Correlated incidents
                </h4>
                <p className="text-body-tertiary fs-9 mb-0">
                  Alerts grouped by shared service, time proximity, and dependency edges in the service graph
                </p>
              </div>
            </div>
            <div className="row align-items-center g-2">
              <div className="col-12 col-md">
                <div className="search-box w-100">
                  <form className="position-relative">
                    <input className="form-control search-input search form-control-sm" type="search" placeholder="Search incidents or services" aria-label="Search" />
                    <span className="fas fa-search search-box-icon"></span>
                  </form>
                </div>
              </div>
              <div className="col-6 col-md-auto">
                <select className="form-select form-select-sm" data-list-filter="data-list-filter" aria-label="Filter">
                  <option value="">
                    Filter: All
                  </option>
                  <option value="Resolved">
                    Resolved
                  </option>
                  <option value="Open">
                    Open
                  </option>
                  <option value="Suppressed">
                    Suppressed
                  </option>
                </select>
              </div>
              <div className="col-6 col-md-auto">
                <select className="form-select form-select-sm" aria-label="Sort by" data-obs-sort="data-obs-sort">
                  <option value="">
                    Sort by
                  </option>
                  <option value="col0">
                    Incident
                  </option>
                  <option value="col1">
                    Root cause
                  </option>
                  <option value="col2">
                    Alerts
                  </option>
                  <option value="col3">
                    Services
                  </option>
                  <option value="col4">
                    Duration
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
                      Incident
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col1">
                      Root cause
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col2">
                      Alerts
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col3">
                      Services
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col4">
                      Duration
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
                        <span className="me-2 fa-solid fa-code-merge text-danger"></span>
                        <div>
                          <h6 className="mb-0">
                            Checkout failures
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            INC-4821
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      DB replication lag
                    </td>
                    <td className="align-middle col2">
                      34
                    </td>
                    <td className="align-middle col3">
                      3
                    </td>
                    <td className="align-middle col4">
                      11m
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Resolved
                      </span>
                    </td>
                    <td className="align-middle pe-3"></td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-code-merge text-danger"></span>
                        <div>
                          <h6 className="mb-0">
                            Partner API timeouts
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            INC-4819
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Upstream vendor outage
                    </td>
                    <td className="align-middle col2">
                      58
                    </td>
                    <td className="align-middle col3">
                      2
                    </td>
                    <td className="align-middle col4">
                      2h 14m
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-danger">
                        Open
                      </span>
                    </td>
                    <td className="align-middle pe-3"></td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-code-merge text-warning"></span>
                        <div>
                          <h6 className="mb-0">
                            Nightly load failure
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            INC-4816
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Talend engine OOM
                    </td>
                    <td className="align-middle col2">
                      12
                    </td>
                    <td className="align-middle col3">
                      1
                    </td>
                    <td className="align-middle col4">
                      46m
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-warning">
                        Open
                      </span>
                    </td>
                    <td className="align-middle pe-3"></td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-code-merge text-warning"></span>
                        <div>
                          <h6 className="mb-0">
                            AI gateway throttling
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            INC-4812
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Provider rate limit
                    </td>
                    <td className="align-middle col2">
                      27
                    </td>
                    <td className="align-middle col3">
                      2
                    </td>
                    <td className="align-middle col4">
                      38m
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Resolved
                      </span>
                    </td>
                    <td className="align-middle pe-3"></td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-code-merge text-info"></span>
                        <div>
                          <h6 className="mb-0">
                            Search latency spike
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            INC-4808
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Cache eviction storm
                    </td>
                    <td className="align-middle col2">
                      19
                    </td>
                    <td className="align-middle col3">
                      2
                    </td>
                    <td className="align-middle col4">
                      22m
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Resolved
                      </span>
                    </td>
                    <td className="align-middle pe-3"></td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-code-merge text-info"></span>
                        <div>
                          <h6 className="mb-0">
                            Identity 5xx burst
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            INC-4803
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Cert rotation restart
                    </td>
                    <td className="align-middle col2">
                      9
                    </td>
                    <td className="align-middle col3">
                      1
                    </td>
                    <td className="align-middle col4">
                      6m
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Resolved
                      </span>
                    </td>
                    <td className="align-middle pe-3"></td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-code-merge text-warning"></span>
                        <div>
                          <h6 className="mb-0">
                            Ledger freshness miss
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            INC-4799
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      dbt run queued behind backfill
                    </td>
                    <td className="align-middle col2">
                      7
                    </td>
                    <td className="align-middle col3">
                      1
                    </td>
                    <td className="align-middle col4">
                      3h 02m
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-warning">
                        Open
                      </span>
                    </td>
                    <td className="align-middle pe-3"></td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-code-merge text-secondary"></span>
                        <div>
                          <h6 className="mb-0">
                            Stage deploy noise
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            INC-4791
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Rolling restart
                    </td>
                    <td className="align-middle col2">
                      104
                    </td>
                    <td className="align-middle col3">
                      6
                    </td>
                    <td className="align-middle col4">
                      14m
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-secondary">
                        Suppressed
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
    </AppLayout>
  )
}
