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
            Databricks
          </li>
        </ol>
      </nav>
      <div className="mb-6">
        <div className="row align-items-center g-3">
          <div className="col">
            <h2 className="mb-2">
              Databricks
            </h2>
            <h5 className="text-body-tertiary fw-semibold mb-0">
              One workspace connection, shared by Data Observability and the ETL connector — the catalog browser and query console that sit behind both
            </h5>
          </div>
          <div className="col-auto">
            <button className="btn btn-primary" type="button" data-lhb-action="connectDatabricks">
              Connect Databricks
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
                    Catalogs
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat">
                    4
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-info" data-obs-stat-delta="data-obs-stat-delta">
                  Unity Catalog
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
                    Watched tables
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat">
                    86
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-primary" data-obs-stat-delta="data-obs-stat-delta">
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
                    SQL warehouse
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat">
                    Serverless
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-success" data-obs-stat-delta="data-obs-stat-delta">
                  auto-stop 10m
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
                    Credential
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat">
                    PAT
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-warning" data-obs-stat-delta="data-obs-stat-delta">
                  12d left
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="alert alert-subtle-warning d-flex align-items-center mb-4" role="alert">
        <span className="fa-solid fa-key me-2"></span>
        <div>
          <strong>
            The personal access token expires in 12 days.
          </strong>
          <span className="ms-1">
            Rotate it before it lapses — table scans and ETL polling both stop silently when it does, and neither raises an alert of its own.
          </span>
        </div>
      </div>
      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-5">
          <div className="card h-100">
            <div className="card-body">
              <h4 className="mb-3">
                Connection
              </h4>
              <p className="text-body-tertiary fs-9">
                Stored server-side as a secret reference under this organization's id. The token is never returned to the browser once saved, so the field below is write-only.
              </p>
              <div className="table-responsive">
                <table className="table table-sm fs-9 mb-3">
                  <tbody>
                    <tr>
                      <td className="text-body-tertiary">
                        Workspace host
                      </td>
                      <td className="text-end font-monospace fs-10">
                        dbc-1a2b3c4d.cloud.databricks.com
                      </td>
                    </tr>
                    <tr>
                      <td className="text-body-tertiary">
                        SQL warehouse
                      </td>
                      <td className="text-end font-monospace fs-10">
                        a1b2c3d4e5f6
                      </td>
                    </tr>
                    <tr>
                      <td className="text-body-tertiary">
                        Auth
                      </td>
                      <td className="text-end">
                        <span className="badge badge-phoenix badge-phoenix-warning">
                          PAT · expiring
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="text-body-tertiary">
                        Last successful query
                      </td>
                      <td className="text-end">
                        9m ago
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-phoenix-primary btn-sm" type="button" data-lhb-action="connectDatabricks">
                  Update connection
                </button>
                <button className="btn btn-phoenix-danger btn-sm" type="button" data-lhb-action="disconnectDatabricks">
                  Disconnect
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-7">
          <div className="card h-100">
            <div className="card-header border-bottom border-translucent py-3">
              <h4 className="mb-0">
                Query console
              </h4>
              <p className="text-body-tertiary fs-9 mb-0">
                Runs against the configured SQL warehouse, scoped to this organization
              </p>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label fs-9" htmlFor="dbx-query">
                  SQL
                </label>
                <textarea className="form-control form-control-sm font-monospace" id="dbx-query" rows={4} spellCheck="false" defaultValue={"SELECT table_name, row_count, last_altered\nFROM system.information_schema.tables\nWHERE table_catalog = 'main'\nORDER BY last_altered DESC\nLIMIT 20"} />
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <p className="text-body-tertiary fs-10 mb-0">
                  Read-only. The warehouse's own permissions decide what this can see.
                </p>
                <button className="btn btn-primary btn-sm" type="button" data-lhb-action="runDatabricksQuery">
                  Run query
                </button>
              </div>
              <div className="table-responsive scrollbar mt-3" data-lhb-query-results="data-lhb-query-results"></div>
            </div>
          </div>
        </div>
      </div>
      <div className="obs-list-root" data-list={"{\"valueNames\":[\"col0\",\"col1\",\"col2\",\"col3\",\"col4\",\"col5\"],\"page\":8,\"filter\":{\"key\":\"col5\"}}"} data-live-table="dataTables">
        <div className="card">
          <div className="card-header border-bottom border-translucent py-3">
            <div className="row align-items-center g-2 mb-3">
              <div className="col">
                <h4 className="mb-0">
                  Catalog browser
                </h4>
                <p className="text-body-tertiary fs-9 mb-0">
                  Unity Catalog tables in the first catalog this workspace exposes, most recently altered first
                </p>
              </div>
            </div>
            <div className="row align-items-center g-2">
              <div className="col-12 col-md">
                <div className="search-box w-100">
                  <form className="position-relative">
                    <input className="form-control search-input search form-control-sm" type="search" placeholder="Search catalogs, schemas, or tables" aria-label="Search" />
                    <span className="fas fa-search search-box-icon"></span>
                  </form>
                </div>
              </div>
              <div className="col-6 col-md-auto">
                <select className="form-select form-select-sm" data-list-filter="data-list-filter" aria-label="Filter">
                  <option value="">
                    Filter: All
                  </option>
                  <option value="Fresh">
                    Fresh
                  </option>
                  <option value="Stale">
                    Stale
                  </option>
                </select>
              </div>
              <div className="col-6 col-md-auto">
                <select className="form-select form-select-sm" aria-label="Sort by" data-obs-sort="data-obs-sort">
                  <option value="">
                    Sort by
                  </option>
                  <option value="col0">
                    Table
                  </option>
                  <option value="col1">
                    Catalog
                  </option>
                  <option value="col2">
                    Rows
                  </option>
                  <option value="col3">
                    Freshness
                  </option>
                  <option value="col4">
                    Null rate
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
                      Table
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col1">
                      Catalog
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col2">
                      Rows
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col3">
                      Freshness
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col4">
                      Null rate
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
                        <span className="me-2 fa-solid fa-table text-success"></span>
                        <div>
                          <h6 className="mb-0">
                            main.sales.orders
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            sales
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      main
                    </td>
                    <td className="align-middle col2">
                      48.2M
                    </td>
                    <td className="align-middle col3">
                      9m ago
                    </td>
                    <td className="align-middle col4">
                      0.02%
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Fresh
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-table text-success"></span>
                        <div>
                          <h6 className="mb-0">
                            main.sales.order_items
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            sales
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      main
                    </td>
                    <td className="align-middle col2">
                      211.4M
                    </td>
                    <td className="align-middle col3">
                      9m ago
                    </td>
                    <td className="align-middle col4">
                      0.01%
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Fresh
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-table text-warning"></span>
                        <div>
                          <h6 className="mb-0">
                            main.crm.customers
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            crm
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      main
                    </td>
                    <td className="align-middle col2">
                      3.1M
                    </td>
                    <td className="align-middle col3">
                      4h ago
                    </td>
                    <td className="align-middle col4">
                      1.80%
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-warning">
                        Stale
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-table text-success"></span>
                        <div>
                          <h6 className="mb-0">
                            main.crm.contacts
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            crm
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      main
                    </td>
                    <td className="align-middle col2">
                      5.9M
                    </td>
                    <td className="align-middle col3">
                      22m ago
                    </td>
                    <td className="align-middle col4">
                      0.40%
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Fresh
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-table text-danger"></span>
                        <div>
                          <h6 className="mb-0">
                            main.finance.ledger
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            finance
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      main
                    </td>
                    <td className="align-middle col2">
                      12.7M
                    </td>
                    <td className="align-middle col3">
                      2d ago
                    </td>
                    <td className="align-middle col4">
                      0.00%
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-danger">
                        Stale
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-table text-success"></span>
                        <div>
                          <h6 className="mb-0">
                            main.product.events
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            product
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      main
                    </td>
                    <td className="align-middle col2">
                      904.6M
                    </td>
                    <td className="align-middle col3">
                      2m ago
                    </td>
                    <td className="align-middle col4">
                      0.09%
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Fresh
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-table text-success"></span>
                        <div>
                          <h6 className="mb-0">
                            main.product.catalog
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            product
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      main
                    </td>
                    <td className="align-middle col2">
                      184K
                    </td>
                    <td className="align-middle col3">
                      1h ago
                    </td>
                    <td className="align-middle col4">
                      0.30%
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Fresh
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-table text-warning"></span>
                        <div>
                          <h6 className="mb-0">
                            main.staging.nightly_load
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            staging
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      main
                    </td>
                    <td className="align-middle col2">
                      4.2M
                    </td>
                    <td className="align-middle col3">
                      6h ago
                    </td>
                    <td className="align-middle col4">
                      2.10%
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-warning">
                        Stale
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
