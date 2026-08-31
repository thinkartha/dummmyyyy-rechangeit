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
            Database Monitoring
          </li>
        </ol>
      </nav>
      <div className="mb-6">
        <div className="row align-items-center g-3">
          <div className="col">
            <h2 className="mb-2">
              Database Monitoring
            </h2>
            <h5 className="text-body-tertiary fw-semibold mb-0">
              Connection health, replication lag, and slow queries across every engine an org has registered
            </h5>
          </div>
          <div className="col-auto">
            <a className="btn btn-phoenix-primary" href="/apps/platform/integrations/databases/">
              Configure in Integrations
            </a>
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
                    Databases
                  </h6>
                  <h3 className="mb-0">
                    48
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-info">
                  +6
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
                    Healthy
                  </h6>
                  <h3 className="mb-0">
                    43
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-success">
                  89.6%
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
                    Degraded
                  </h6>
                  <h3 className="mb-0">
                    4
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-warning">
                  replication lag
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
                    Down
                  </h6>
                  <h3 className="mb-0">
                    1
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-danger">
                  connect refused
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="obs-list-root" data-list={"{\"valueNames\":[\"col0\",\"col1\",\"col2\",\"col3\",\"col4\",\"col5\"],\"page\":8,\"filter\":{\"key\":\"col5\"}}"} data-live-table="databases">
        <div className="card">
          <div className="card-header border-bottom border-translucent py-3">
            <div className="row align-items-center g-2 mb-3">
              <div className="col">
                <h4 className="mb-0">
                  Registered databases
                </h4>
                <p className="text-body-tertiary fs-9 mb-0">
                  PostgreSQL · MySQL / MariaDB · SQL Server · Oracle · Aurora · Redshift — credentials stored per organization
                </p>
              </div>
            </div>
            <div className="row align-items-center g-2">
              <div className="col-12 col-md">
                <div className="search-box w-100">
                  <form className="position-relative">
                    <input className="form-control search-input search form-control-sm" type="search" placeholder="Search databases or hosts" aria-label="Search" />
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
                  <option value="Degraded">
                    Degraded
                  </option>
                  <option value="Down">
                    Down
                  </option>
                  <option value="Watch">
                    Watch
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
                    <th className="align-middle text-end pe-3" scope="col"></th>
                  </tr>
                </thead>
                <tbody className="list">
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-database text-info"></span>
                        <div>
                          <h6 className="mb-0">
                            payments
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            payments-prod.cluster-us-east-1
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      PostgreSQL 15
                    </td>
                    <td className="align-middle col2">
                      prod
                    </td>
                    <td className="align-middle col3">
                      184 / 400
                    </td>
                    <td className="align-middle col4">
                      0.4s
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Healthy
                      </span>
                    </td>
                    <td className="align-middle pe-3"></td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-database text-info"></span>
                        <div>
                          <h6 className="mb-0">
                            identity
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            identity-prod.cluster-us-east-1
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      PostgreSQL 15
                    </td>
                    <td className="align-middle col2">
                      prod
                    </td>
                    <td className="align-middle col3">
                      96 / 300
                    </td>
                    <td className="align-middle col4">
                      0.2s
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Healthy
                      </span>
                    </td>
                    <td className="align-middle pe-3"></td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-database text-warning"></span>
                        <div>
                          <h6 className="mb-0">
                            orders
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            orders-prod.mysql.internal
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      MySQL 8.0
                    </td>
                    <td className="align-middle col2">
                      prod
                    </td>
                    <td className="align-middle col3">
                      271 / 300
                    </td>
                    <td className="align-middle col4">
                      14.8s
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-warning">
                        Degraded
                      </span>
                    </td>
                    <td className="align-middle pe-3"></td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-database text-warning"></span>
                        <div>
                          <h6 className="mb-0">
                            catalog
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            catalog.mariadb.internal
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      MariaDB 11
                    </td>
                    <td className="align-middle col2">
                      prod
                    </td>
                    <td className="align-middle col3">
                      48 / 200
                    </td>
                    <td className="align-middle col4">
                      0.9s
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Healthy
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
                            legacy-billing
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            legacy-billing.sqlserver.internal
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      SQL Server 2019
                    </td>
                    <td className="align-middle col2">
                      prod
                    </td>
                    <td className="align-middle col3">
                      0 / 150
                    </td>
                    <td className="align-middle col4">
                      —
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-danger">
                        Down
                      </span>
                    </td>
                    <td className="align-middle pe-3"></td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-database text-primary"></span>
                        <div>
                          <h6 className="mb-0">
                            analytics
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            analytics.redshift.us-east-1
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Redshift
                    </td>
                    <td className="align-middle col2">
                      prod
                    </td>
                    <td className="align-middle col3">
                      22 / 100
                    </td>
                    <td className="align-middle col4">
                      2m
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-info">
                        Watch
                      </span>
                    </td>
                    <td className="align-middle pe-3"></td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-database text-secondary"></span>
                        <div>
                          <h6 className="mb-0">
                            reporting
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            reporting.oracle.internal
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Oracle 19c
                    </td>
                    <td className="align-middle col2">
                      stage
                    </td>
                    <td className="align-middle col3">
                      11 / 80
                    </td>
                    <td className="align-middle col4">
                      1.1s
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Healthy
                      </span>
                    </td>
                    <td className="align-middle pe-3"></td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-database text-info"></span>
                        <div>
                          <h6 className="mb-0">
                            sessions
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            sessions-stage.cluster-eu-west-1
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Aurora PostgreSQL
                    </td>
                    <td className="align-middle col2">
                      stage
                    </td>
                    <td className="align-middle col3">
                      30 / 200
                    </td>
                    <td className="align-middle col4">
                      0.3s
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Healthy
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
      <div className="row g-4">
        <div className="col-12 col-lg-6">
          <div className="card h-100">
            <div className="card-body">
              <h4 className="mb-3">
                Slowest queries (24h)
              </h4>
              <div className="table-responsive scrollbar">
                <table className="table table-sm fs-9 mb-0">
                  <thead>
                    <tr>
                      <th className="text-uppercase">
                        Query
                      </th>
                      <th className="text-uppercase">
                        Database
                      </th>
                      <th className="text-uppercase">
                        Calls
                      </th>
                      <th className="text-uppercase">
                        Mean
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="font-monospace fs-10">
                        SELECT … FROM order_items JOIN orders …
                      </td>
                      <td>
                        orders
                      </td>
                      <td>
                        18,402
                      </td>
                      <td className="text-warning">
                        2.9s
                      </td>
                    </tr>
                    <tr>
                      <td className="font-monospace fs-10">
                        UPDATE inventory SET qty = qty - $1 …
                      </td>
                      <td>
                        catalog
                      </td>
                      <td>
                        9,117
                      </td>
                      <td className="text-warning">
                        1.4s
                      </td>
                    </tr>
                    <tr>
                      <td className="font-monospace fs-10">
                        SELECT … FROM ledger_entries WHERE …
                      </td>
                      <td>
                        payments
                      </td>
                      <td>
                        42,880
                      </td>
                      <td>
                        0.6s
                      </td>
                    </tr>
                    <tr>
                      <td className="font-monospace fs-10">
                        SELECT count(*) FROM sessions WHERE …
                      </td>
                      <td>
                        sessions
                      </td>
                      <td>
                        61,204
                      </td>
                      <td>
                        0.2s
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
                How database checks run
              </h4>
              <p className="text-body-tertiary">
                Each database an organization registers is probed on its own schedule. Credentials are held as secret references under
                <code className="mx-1">
                  org_id
                </code>
                , never in the browser.
              </p>
              <ul className="mb-0">
                <li>
                  <strong>
                    Connectivity
                  </strong>
                  — driver-level connect with a short timeout
                </li>
                <li>
                  <strong>
                    Replication
                  </strong>
                  — lag measured against the primary's LSN / GTID
                </li>
                <li>
                  <strong>
                    Saturation
                  </strong>
                  — open connections against the configured pool ceiling
                </li>
                <li>
                  <strong>
                    Slow queries
                  </strong>
                  — sampled from the engine's own statement statistics
                </li>
              </ul>
              <p className="text-body-tertiary fs-9 mb-0 mt-3">
                A failed probe raises an event into the same alert pipeline as API and ETL signals, so database incidents cluster with whatever else broke at the same moment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
