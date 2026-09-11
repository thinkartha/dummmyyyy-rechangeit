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
              Observability
            </a>
          </li>
          <li className="breadcrumb-item">
            <a href="/apps/observability/etl-monitoring/">
              ETL Monitoring
            </a>
          </li>
          <li className="breadcrumb-item active">
            Job run
          </li>
        </ol>
      </nav>
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-3" data-run-heading="data-run-heading">
        <div>
          <h2 className="mb-1 text-break" data-run-name="data-run-name">
            —
          </h2>
          <p className="text-body-tertiary fs-9 mb-0 text-break" data-run-meta="data-run-meta">
            Loading run…
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <a className="btn btn-phoenix-secondary btn-sm" href="/apps/observability/etl-monitoring/">
            <span className="fa-solid fa-arrow-left me-2"></span>
            All runs
          </a>
          <a className="btn btn-phoenix-secondary btn-sm d-none" data-run-link="data-run-link" href="#!" target="_blank" rel="noopener">
            <span className="fa-solid fa-arrow-up-right-from-square me-2"></span>
            Open in Databricks
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
                Result
              </h6>
              <span className="text-body-quaternary fs-10" data-bs-toggle="tooltip" data-bs-placement="top" title="The run's result state once it is terminal, or its lifecycle state while it is still going.">
                <span className="fa-solid fa-circle-info"></span>
              </span>
            </div>
            <div className="d-flex align-items-baseline gap-2" style={{ minWidth: "0" }}>
              <h2 className="mb-0 fw-semibold lh-1" data-obs-stat="data-obs-stat" data-obs-stat-key="runState">
                —
              </h2>
              <span className="badge badge-phoenix fs-10 text-truncate badge-phoenix-info" style={{ maxWidth: "60%", textTransform: "none" }} title="" data-obs-stat-delta="data-obs-stat-delta" data-obs-stat-delta-key="runState"></span>
            </div>
          </div>
        </div>
        <div className="card flex-shrink-0" style={{ minWidth: "11.5rem", flex: "1 1 0" }}>
          <div className="card-body py-3 px-3">
            <div className="d-flex align-items-center gap-1 mb-2">
              <h6 className="text-body-tertiary text-uppercase fs-10 fw-semibold mb-0 lh-1" style={{ letterSpacing: ".04em" }}>
                Duration
              </h6>
              <span className="text-body-quaternary fs-10" data-bs-toggle="tooltip" data-bs-placement="top" title="Wall clock for the whole run. Tasks that ran in parallel do not add up to this.">
                <span className="fa-solid fa-circle-info"></span>
              </span>
            </div>
            <div className="d-flex align-items-baseline gap-2" style={{ minWidth: "0" }}>
              <h2 className="mb-0 fw-semibold lh-1" data-obs-stat="data-obs-stat" data-obs-stat-key="runDuration">
                —
              </h2>
              <span className="badge badge-phoenix fs-10 text-truncate badge-phoenix-primary" style={{ maxWidth: "60%", textTransform: "none" }} title="" data-obs-stat-delta="data-obs-stat-delta" data-obs-stat-delta-key="runDuration"></span>
            </div>
          </div>
        </div>
        <div className="card flex-shrink-0" style={{ minWidth: "11.5rem", flex: "1 1 0" }}>
          <div className="card-body py-3 px-3">
            <div className="d-flex align-items-center gap-1 mb-2">
              <h6 className="text-body-tertiary text-uppercase fs-10 fw-semibold mb-0 lh-1" style={{ letterSpacing: ".04em" }}>
                Tasks
              </h6>
              <span className="text-body-quaternary fs-10" data-bs-toggle="tooltip" data-bs-placement="top" title="Every task in the run, including ones that were skipped because something they depend on failed.">
                <span className="fa-solid fa-circle-info"></span>
              </span>
            </div>
            <div className="d-flex align-items-baseline gap-2" style={{ minWidth: "0" }}>
              <h2 className="mb-0 fw-semibold lh-1" data-obs-stat="data-obs-stat" data-obs-stat-key="runTasks">
                0
              </h2>
              <span className="badge badge-phoenix fs-10 text-truncate badge-phoenix-secondary" style={{ maxWidth: "60%", textTransform: "none" }} title="" data-obs-stat-delta="data-obs-stat-delta" data-obs-stat-delta-key="runTasks"></span>
            </div>
          </div>
        </div>
        <div className="card flex-shrink-0" style={{ minWidth: "11.5rem", flex: "1 1 0" }}>
          <div className="card-body py-3 px-3">
            <div className="d-flex align-items-center gap-1 mb-2">
              <h6 className="text-body-tertiary text-uppercase fs-10 fw-semibold mb-0 lh-1" style={{ letterSpacing: ".04em" }}>
                Failed tasks
              </h6>
              <span className="text-body-quaternary fs-10" data-bs-toggle="tooltip" data-bs-placement="top" title="Tasks Databricks reported as FAILED. A skipped task is not a failed one — the fix is the task it depends on.">
                <span className="fa-solid fa-circle-info"></span>
              </span>
            </div>
            <div className="d-flex align-items-baseline gap-2" style={{ minWidth: "0" }}>
              <h2 className="mb-0 fw-semibold lh-1" data-obs-stat="data-obs-stat" data-obs-stat-key="runFailedTasks">
                0
              </h2>
              <span className="badge badge-phoenix fs-10 text-truncate badge-phoenix-danger" style={{ maxWidth: "60%", textTransform: "none" }} title="" data-obs-stat-delta="data-obs-stat-delta" data-obs-stat-delta-key="runFailedTasks"></span>
            </div>
          </div>
        </div>
      </div>
      <div className="obs-list-root" data-list={"{\"valueNames\":[\"col0\",\"col1\",\"col2\",\"col3\",\"col4\",\"col5\"],\"page\":20,\"filter\":{\"key\":\"col5\"}}"} data-live-table="databricksRun">
        <div className="card">
          <div className="card-header border-bottom border-translucent py-3">
            <div className="row align-items-center g-2 mb-3">
              <div className="col">
                <h4 className="mb-0">
                  Tasks
                </h4>
                <p className="text-body-tertiary fs-9 mb-0">
                  Every task in this run, in the order Databricks returned them — the message under a task is what it reported
                </p>
              </div>
            </div>
            <div className="row align-items-center g-2">
              <div className="col-12 col-md">
                <div className="search-box w-100">
                  <form className="position-relative">
                    <input className="form-control search-input search form-control-sm" type="search" placeholder="Search tasks" aria-label="Search" />
                    <span className="fas fa-search search-box-icon"></span>
                  </form>
                </div>
              </div>
              <div className="col-6 col-md-auto">
                <select className="form-select form-select-sm" data-list-filter="data-list-filter" aria-label="Filter">
                  <option value="">
                    Filter: All
                  </option>
                  <option value="No run selected">
                    No run selected
                  </option>
                </select>
              </div>
              <div className="col-6 col-md-auto">
                <select className="form-select form-select-sm" aria-label="Sort by" data-obs-sort="data-obs-sort">
                  <option value="">
                    Sort by
                  </option>
                  <option value="col0">
                    Task
                  </option>
                  <option value="col1">
                    Run
                  </option>
                  <option value="col2">
                    State
                  </option>
                  <option value="col3">
                    Duration
                  </option>
                  <option value="col4">
                    Depends on
                  </option>
                  <option value="col5">
                    Result
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
                      Task
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col1">
                      Run
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col2">
                      State
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col3">
                      Duration
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col4">
                      Depends on
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col5">
                      Result
                    </th>
                  </tr>
                </thead>
                <tbody className="list" data-sample-rows="data-sample-rows">
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-list-check text-secondary"></span>
                        <div>
                          <h6 className="mb-0">
                            —
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            open a Databricks run from ETL Monitoring
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      —
                    </td>
                    <td className="align-middle col2">
                      —
                    </td>
                    <td className="align-middle col3">
                      —
                    </td>
                    <td className="align-middle col4">
                      —
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-secondary">
                        No run selected
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
