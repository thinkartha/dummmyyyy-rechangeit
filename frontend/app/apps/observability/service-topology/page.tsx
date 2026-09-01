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
            Service Topology
          </li>
        </ol>
      </nav>
      <div className="mb-6">
        <div className="row align-items-center g-3">
          <div className="col">
            <h2 className="mb-2">
              Service Topology & Dependencies
            </h2>
            <h5 className="text-body-tertiary fw-semibold mb-0">
              What calls what, inferred from span parentage rather than from a diagram somebody drew once and stopped updating
            </h5>
          </div>
          <div className="col-auto">
            <button className="btn btn-primary" type="button" data-lhb-action="rebuildTopology">
              Rebuild graph
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
                    Services
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat">
                    38
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-info" data-obs-stat-delta="data-obs-stat-delta">
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
                    Dependencies
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat">
                    112
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-primary" data-obs-stat-delta="data-obs-stat-delta">
                  edges
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
                    Unhealthy edges
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat">
                    5
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
                    Single points of failure
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat">
                    3
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-warning" data-obs-stat-delta="data-obs-stat-delta">
                  no fallback
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-7">
          <div className="card h-100" data-mock-block="data-mock-block">
            <div className="card-header border-bottom border-translucent py-3">
              <h4 className="mb-0">
                Critical paths
              </h4>
              <p className="text-body-tertiary fs-9 mb-0">
                The chains a single failure takes the most services down with
              </p>
            </div>
            <div className="card-body">
              <div className="border border-translucent rounded-3 p-3 mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0">
                    Checkout
                  </h6>
                  <span className="badge badge-phoenix badge-phoenix-danger">
                    4 hops
                  </span>
                </div>
                <div className="d-flex flex-wrap align-items-center gap-1 fs-10 mb-2">
                  <span className="badge bg-body-secondary text-body-emphasis fw-normal">
                    edge
                  </span>
                  <span className="fa-solid fa-arrow-right text-body-quaternary mx-1"></span>
                  <span className="badge bg-body-secondary text-body-emphasis fw-normal">
                    api-gateway
                  </span>
                  <span className="fa-solid fa-arrow-right text-body-quaternary mx-1"></span>
                  <span className="badge bg-body-secondary text-body-emphasis fw-normal">
                    checkout-api
                  </span>
                  <span className="fa-solid fa-arrow-right text-body-quaternary mx-1"></span>
                  <span className="badge bg-body-secondary text-body-emphasis fw-normal">
                    orders-db
                  </span>
                </div>
                <p className="text-body-tertiary fs-10 mb-0">
                  orders-db has no read replica in the write path
                </p>
              </div>
              <div className="border border-translucent rounded-3 p-3 mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0">
                    Sign-in
                  </h6>
                  <span className="badge badge-phoenix badge-phoenix-warning">
                    5 hops
                  </span>
                </div>
                <div className="d-flex flex-wrap align-items-center gap-1 fs-10 mb-2">
                  <span className="badge bg-body-secondary text-body-emphasis fw-normal">
                    edge
                  </span>
                  <span className="fa-solid fa-arrow-right text-body-quaternary mx-1"></span>
                  <span className="badge bg-body-secondary text-body-emphasis fw-normal">
                    api-gateway
                  </span>
                  <span className="fa-solid fa-arrow-right text-body-quaternary mx-1"></span>
                  <span className="badge bg-body-secondary text-body-emphasis fw-normal">
                    auth-service
                  </span>
                  <span className="fa-solid fa-arrow-right text-body-quaternary mx-1"></span>
                  <span className="badge bg-body-secondary text-body-emphasis fw-normal">
                    user-service
                  </span>
                  <span className="fa-solid fa-arrow-right text-body-quaternary mx-1"></span>
                  <span className="badge bg-body-secondary text-body-emphasis fw-normal">
                    sessions-cache
                  </span>
                </div>
                <p className="text-body-tertiary fs-10 mb-0">
                  sessions-cache is single-node
                </p>
              </div>
              <div className="border border-translucent rounded-3 p-3 mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0">
                    Nightly load
                  </h6>
                  <span className="badge badge-phoenix badge-phoenix-warning">
                    4 hops
                  </span>
                </div>
                <div className="d-flex flex-wrap align-items-center gap-1 fs-10 mb-2">
                  <span className="badge bg-body-secondary text-body-emphasis fw-normal">
                    talend
                  </span>
                  <span className="fa-solid fa-arrow-right text-body-quaternary mx-1"></span>
                  <span className="badge bg-body-secondary text-body-emphasis fw-normal">
                    staging-s3
                  </span>
                  <span className="fa-solid fa-arrow-right text-body-quaternary mx-1"></span>
                  <span className="badge bg-body-secondary text-body-emphasis fw-normal">
                    databricks
                  </span>
                  <span className="fa-solid fa-arrow-right text-body-quaternary mx-1"></span>
                  <span className="badge bg-body-secondary text-body-emphasis fw-normal">
                    warehouse
                  </span>
                </div>
                <p className="text-body-tertiary fs-10 mb-0">
                  no retry between staging and Databricks
                </p>
              </div>
              <div className="border border-translucent rounded-3 p-3 mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0">
                    Search
                  </h6>
                  <span className="badge badge-phoenix badge-phoenix-success">
                    4 hops
                  </span>
                </div>
                <div className="d-flex flex-wrap align-items-center gap-1 fs-10 mb-2">
                  <span className="badge bg-body-secondary text-body-emphasis fw-normal">
                    edge
                  </span>
                  <span className="fa-solid fa-arrow-right text-body-quaternary mx-1"></span>
                  <span className="badge bg-body-secondary text-body-emphasis fw-normal">
                    api-gateway
                  </span>
                  <span className="fa-solid fa-arrow-right text-body-quaternary mx-1"></span>
                  <span className="badge bg-body-secondary text-body-emphasis fw-normal">
                    search-api
                  </span>
                  <span className="fa-solid fa-arrow-right text-body-quaternary mx-1"></span>
                  <span className="badge bg-body-secondary text-body-emphasis fw-normal">
                    elasticsearch
                  </span>
                </div>
                <p className="text-body-tertiary fs-10 mb-0">
                  three replicas, degrades to cached results
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-5">
          <div className="card h-100" data-mock-block="data-mock-block">
            <div className="card-header border-bottom border-translucent py-3">
              <h4 className="mb-0">
                Most depended on
              </h4>
              <p className="text-body-tertiary fs-9 mb-0">
                Fan-in: how many services break if this one does
              </p>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive scrollbar">
                <table className="table table-sm fs-9 mb-0">
                  <thead>
                    <tr>
                      <th className="ps-3 text-uppercase">
                        Service
                      </th>
                      <th className="text-uppercase">
                        Callers
                      </th>
                      <th className="text-uppercase">
                        Calls (1h)
                      </th>
                      <th className="text-uppercase">
                        Health
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="ps-3">
                        api-gateway
                      </td>
                      <td>
                        14
                      </td>
                      <td>
                        2.4M
                      </td>
                      <td>
                        <span className="badge badge-phoenix badge-phoenix-success">
                          99%
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="ps-3">
                        auth-service
                      </td>
                      <td>
                        11
                      </td>
                      <td>
                        840K
                      </td>
                      <td>
                        <span className="badge badge-phoenix badge-phoenix-success">
                          99%
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="ps-3">
                        orders-db
                      </td>
                      <td>
                        7
                      </td>
                      <td>
                        612K
                      </td>
                      <td>
                        <span className="badge badge-phoenix badge-phoenix-warning">
                          82%
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="ps-3">
                        user-service
                      </td>
                      <td>
                        6
                      </td>
                      <td>
                        431K
                      </td>
                      <td>
                        <span className="badge badge-phoenix badge-phoenix-success">
                          98%
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="ps-3">
                        sessions-cache
                      </td>
                      <td>
                        5
                      </td>
                      <td>
                        1.1M
                      </td>
                      <td>
                        <span className="badge badge-phoenix badge-phoenix-warning">
                          91%
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="ps-3">
                        notifications
                      </td>
                      <td>
                        4
                      </td>
                      <td>
                        96K
                      </td>
                      <td>
                        <span className="badge badge-phoenix badge-phoenix-success">
                          97%
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="card-footer border-top border-translucent">
              <p className="fs-9 text-body-tertiary mb-0">
                Edges come from the same spans as
                <a className="mx-1" href="/apps/observability/traces/">
                  Traces
                </a>
                — a service missing here is a service that is not instrumented, not one with no callers.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="obs-list-root" data-list={"{\"valueNames\":[\"col0\",\"col1\",\"col2\",\"col3\",\"col4\",\"col5\"],\"page\":8,\"filter\":{\"key\":\"col5\"}}"} data-live-table="traces">
        <div className="card">
          <div className="card-header border-bottom border-translucent py-3">
            <div className="row align-items-center g-2 mb-3">
              <div className="col">
                <h4 className="mb-0">
                  Dependency edges
                </h4>
                <p className="text-body-tertiary fs-9 mb-0">
                  Caller → callee, with the volume and error rate of that specific pair
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
                  <option value="Watch">
                    Watch
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
                        <span className="me-2 fa-solid fa-sitemap text-danger"></span>
                        <div>
                          <h6 className="mb-0">
                            checkout-api
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            synchronous
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      orders-db
                    </td>
                    <td className="align-middle col2">
                      612K
                    </td>
                    <td className="align-middle col3">
                      2.9s
                    </td>
                    <td className="align-middle col4">
                      4.10%
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
                        <span className="me-2 fa-solid fa-sitemap text-warning"></span>
                        <div>
                          <h6 className="mb-0">
                            api-gateway
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            synchronous
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      checkout-api
                    </td>
                    <td className="align-middle col2">
                      418K
                    </td>
                    <td className="align-middle col3">
                      1.4s
                    </td>
                    <td className="align-middle col4">
                      1.80%
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-warning">
                        Watch
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-sitemap text-success"></span>
                        <div>
                          <h6 className="mb-0">
                            api-gateway
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            synchronous
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      auth-service
                    </td>
                    <td className="align-middle col2">
                      840K
                    </td>
                    <td className="align-middle col3">
                      86ms
                    </td>
                    <td className="align-middle col4">
                      0.04%
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
                        <span className="me-2 fa-solid fa-sitemap text-warning"></span>
                        <div>
                          <h6 className="mb-0">
                            auth-service
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            cache
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      sessions-cache
                    </td>
                    <td className="align-middle col2">
                      1.1M
                    </td>
                    <td className="align-middle col3">
                      310ms
                    </td>
                    <td className="align-middle col4">
                      0.90%
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-warning">
                        Watch
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-sitemap text-success"></span>
                        <div>
                          <h6 className="mb-0">
                            auth-service
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            synchronous
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      user-service
                    </td>
                    <td className="align-middle col2">
                      431K
                    </td>
                    <td className="align-middle col3">
                      54ms
                    </td>
                    <td className="align-middle col4">
                      0.02%
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
                        <span className="me-2 fa-solid fa-sitemap text-success"></span>
                        <div>
                          <h6 className="mb-0">
                            orders-worker
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            asynchronous
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      notifications
                    </td>
                    <td className="align-middle col2">
                      96K
                    </td>
                    <td className="align-middle col3">
                      120ms
                    </td>
                    <td className="align-middle col4">
                      0.10%
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
                        <span className="me-2 fa-solid fa-sitemap text-success"></span>
                        <div>
                          <h6 className="mb-0">
                            search-api
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            synchronous
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      elasticsearch
                    </td>
                    <td className="align-middle col2">
                      288K
                    </td>
                    <td className="align-middle col3">
                      71ms
                    </td>
                    <td className="align-middle col4">
                      0.03%
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
                        <span className="me-2 fa-solid fa-sitemap text-secondary"></span>
                        <div>
                          <h6 className="mb-0">
                            databricks
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            batch
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      warehouse
                    </td>
                    <td className="align-middle col2">
                      1.2K
                    </td>
                    <td className="align-middle col3">
                      18s
                    </td>
                    <td className="align-middle col4">
                      0.00%
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
