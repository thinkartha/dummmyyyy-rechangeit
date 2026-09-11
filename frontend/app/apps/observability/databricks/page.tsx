import AppLayout from '@/components/app-layout'

export default function Page() {
  return (
    <AppLayout scripts={[
        {
          "code": "\n                  (function() {\n                    document.querySelectorAll('[data-obs-sort]').forEach(function(select) {\n                      if (select.dataset.bound === '1') return;\n                      select.dataset.bound = '1';\n                      select.addEventListener('change', function() {\n                        var key = select.value;\n                        if (!key) return;\n                        var root = select.closest('[data-list]');\n                        if (!root) return;\n                        var header = root.querySelector('th[data-sort=\"' + key + '\"]');\n                        if (header) header.click();\n                      });\n                    });\n                  })();\n                "
        },
        {
          "code": "\n                  (function() {\n                    document.querySelectorAll('[data-obs-sort]').forEach(function(select) {\n                      if (select.dataset.bound === '1') return;\n                      select.dataset.bound = '1';\n                      select.addEventListener('change', function() {\n                        var key = select.value;\n                        if (!key) return;\n                        var root = select.closest('[data-list]');\n                        if (!root) return;\n                        var header = root.querySelector('th[data-sort=\"' + key + '\"]');\n                        if (header) header.click();\n                      });\n                    });\n                  })();\n                "
        },
        {
          "code": "\n              (function() {\n                document.querySelectorAll('[data-obs-sort]').forEach(function(select) {\n                  if (select.dataset.bound === '1') return;\n                  select.dataset.bound = '1';\n                  select.addEventListener('change', function() {\n                    var key = select.value;\n                    if (!key) return;\n                    var root = select.closest('[data-list]');\n                    if (!root) return;\n                    var header = root.querySelector('th[data-sort=\"' + key + '\"]');\n                    if (header) header.click();\n                  });\n                });\n              })();\n            "
        },
        {
          "code": "\n              (function() {\n                document.querySelectorAll('[data-obs-sort]').forEach(function(select) {\n                  if (select.dataset.bound === '1') return;\n                  select.dataset.bound = '1';\n                  select.addEventListener('change', function() {\n                    var key = select.value;\n                    if (!key) return;\n                    var root = select.closest('[data-list]');\n                    if (!root) return;\n                    var header = root.querySelector('th[data-sort=\"' + key + '\"]');\n                    if (header) header.click();\n                  });\n                });\n              })();\n            "
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
              Consumption, query health and clusters for the connected workspace — read from system tables, not from an agent
            </h5>
          </div>
          <div className="col-auto d-flex gap-2">
            <button className="btn btn-phoenix-secondary" type="button" data-lhb-action="pollEtl" data-lhb-arg="databricks">
              Poll now
            </button>
            <button className="btn btn-primary" type="button" data-lhb-action="runEtlJob">
              Run job
            </button>
          </div>
        </div>
      </div>
      <div className="alert alert-subtle-info d-flex align-items-start gap-2 mb-4" role="alert" data-mock-empty="data-mock-empty">
        <span className="fa-solid fa-circle-info mt-1"></span>
        <div>
          <strong className="d-block">
            Cost and query panels need Databricks system tables.
          </strong>
          <span className="fs-9">
            They are opt-in per metastore. Enable the
            <code>
              system
            </code>
            schemas and grant the connected token SELECT on
            <code>
              system.billing
            </code>
            and
            <code>
              system.query
            </code>
            . Clusters and job runs work without them.
          </span>
        </div>
      </div>
      <div className="obs-kpi-row d-flex gap-3 mb-4 pb-1" style={{ overflowX: "auto", scrollbarWidth: "thin" }}>
        <div className="card flex-shrink-0" style={{ minWidth: "11.5rem", flex: "1 1 0" }}>
          <div className="card-body py-3 px-3">
            <div className="d-flex align-items-center gap-1 mb-2">
              <h6 className="text-body-tertiary text-uppercase fs-10 fw-semibold mb-0 lh-1" style={{ letterSpacing: ".04em" }}>
                List cost
              </h6>
              <span className="text-body-quaternary fs-10" data-bs-toggle="tooltip" data-bs-placement="top" title="Databricks list price on the DBUs consumed. It excludes committed-use discounts and the cloud provider's own compute charge, so it will not equal the invoice — it is the number that moves when a workload changes.">
                <span className="fa-solid fa-circle-info"></span>
              </span>
            </div>
            <div className="d-flex align-items-baseline gap-2" style={{ minWidth: "0" }}>
              <h2 className="mb-0 fw-semibold lh-1" data-obs-stat="data-obs-stat" data-obs-stat-key="dbxCost">
                0
              </h2>
              <span className="badge badge-phoenix fs-10 text-truncate badge-phoenix-primary" style={{ maxWidth: "60%", textTransform: "none" }} title="last 30 days" data-obs-stat-delta="data-obs-stat-delta" data-obs-stat-delta-key="dbxCost">
                last 30 days
              </span>
            </div>
          </div>
        </div>
        <div className="card flex-shrink-0" style={{ minWidth: "11.5rem", flex: "1 1 0" }}>
          <div className="card-body py-3 px-3">
            <div className="d-flex align-items-center gap-1 mb-2">
              <h6 className="text-body-tertiary text-uppercase fs-10 fw-semibold mb-0 lh-1" style={{ letterSpacing: ".04em" }}>
                DBUs
              </h6>
              <span className="text-body-quaternary fs-10" data-bs-toggle="tooltip" data-bs-placement="top" title="The billable unit itself, independent of price. Watch this rather than cost when a discount or a region change would otherwise look like a workload change.">
                <span className="fa-solid fa-circle-info"></span>
              </span>
            </div>
            <div className="d-flex align-items-baseline gap-2" style={{ minWidth: "0" }}>
              <h2 className="mb-0 fw-semibold lh-1" data-obs-stat="data-obs-stat" data-obs-stat-key="dbxDbus">
                0
              </h2>
              <span className="badge badge-phoenix fs-10 text-truncate badge-phoenix-info" style={{ maxWidth: "60%", textTransform: "none" }} title="last 30 days" data-obs-stat-delta="data-obs-stat-delta" data-obs-stat-delta-key="dbxDbus">
                last 30 days
              </span>
            </div>
          </div>
        </div>
        <div className="card flex-shrink-0" style={{ minWidth: "11.5rem", flex: "1 1 0" }}>
          <div className="card-body py-3 px-3">
            <div className="d-flex align-items-center gap-1 mb-2">
              <h6 className="text-body-tertiary text-uppercase fs-10 fw-semibold mb-0 lh-1" style={{ letterSpacing: ".04em" }}>
                Queries
              </h6>
              <span className="text-body-quaternary fs-10" data-bs-toggle="tooltip" data-bs-placement="top" title="Statements recorded in system.query.history across every warehouse and cluster.">
                <span className="fa-solid fa-circle-info"></span>
              </span>
            </div>
            <div className="d-flex align-items-baseline gap-2" style={{ minWidth: "0" }}>
              <h2 className="mb-0 fw-semibold lh-1" data-obs-stat="data-obs-stat" data-obs-stat-key="dbxQueries">
                0
              </h2>
              <span className="badge badge-phoenix fs-10 text-truncate badge-phoenix-info" style={{ maxWidth: "60%", textTransform: "none" }} title="last 24h" data-obs-stat-delta="data-obs-stat-delta" data-obs-stat-delta-key="dbxQueries">
                last 24h
              </span>
            </div>
          </div>
        </div>
        <div className="card flex-shrink-0" style={{ minWidth: "11.5rem", flex: "1 1 0" }}>
          <div className="card-body py-3 px-3">
            <div className="d-flex align-items-center gap-1 mb-2">
              <h6 className="text-body-tertiary text-uppercase fs-10 fw-semibold mb-0 lh-1" style={{ letterSpacing: ".04em" }}>
                Query failures
              </h6>
              <span className="text-body-quaternary fs-10" data-bs-toggle="tooltip" data-bs-placement="top" title="Anything that did not finish: errors, cancellations and timeouts alike. A cancelled query is still a person who did not get an answer.">
                <span className="fa-solid fa-circle-info"></span>
              </span>
            </div>
            <div className="d-flex align-items-baseline gap-2" style={{ minWidth: "0" }}>
              <h2 className="mb-0 fw-semibold lh-1" data-obs-stat="data-obs-stat" data-obs-stat-key="dbxQueryFailures">
                0
              </h2>
              <span className="badge badge-phoenix fs-10 text-truncate badge-phoenix-warning" style={{ maxWidth: "60%", textTransform: "none" }} title="0 failed" data-obs-stat-delta="data-obs-stat-delta" data-obs-stat-delta-key="dbxQueryFailures">
                0 failed
              </span>
            </div>
          </div>
        </div>
        <div className="card flex-shrink-0" style={{ minWidth: "11.5rem", flex: "1 1 0" }}>
          <div className="card-body py-3 px-3">
            <div className="d-flex align-items-center gap-1 mb-2">
              <h6 className="text-body-tertiary text-uppercase fs-10 fw-semibold mb-0 lh-1" style={{ letterSpacing: ".04em" }}>
                Slowest p99
              </h6>
              <span className="text-body-quaternary fs-10" data-bs-toggle="tooltip" data-bs-placement="top" title="The worst compute's p99, named beside it. Percentiles do not recombine, so there is no honest fleet-wide number.">
                <span className="fa-solid fa-circle-info"></span>
              </span>
            </div>
            <div className="d-flex align-items-baseline gap-2" style={{ minWidth: "0" }}>
              <h2 className="mb-0 fw-semibold lh-1" data-obs-stat="data-obs-stat" data-obs-stat-key="dbxQueryP99">
                0
              </h2>
              <span className="badge badge-phoenix fs-10 text-truncate badge-phoenix-warning" style={{ maxWidth: "60%", textTransform: "none" }} title="worst compute" data-obs-stat-delta="data-obs-stat-delta" data-obs-stat-delta-key="dbxQueryP99">
                worst compute
              </span>
            </div>
          </div>
        </div>
        <div className="card flex-shrink-0" style={{ minWidth: "11.5rem", flex: "1 1 0" }}>
          <div className="card-body py-3 px-3">
            <div className="d-flex align-items-center gap-1 mb-2">
              <h6 className="text-body-tertiary text-uppercase fs-10 fw-semibold mb-0 lh-1" style={{ letterSpacing: ".04em" }}>
                Clusters running
              </h6>
              <span className="text-body-quaternary fs-10" data-bs-toggle="tooltip" data-bs-placement="top" title="Running or resizing. Job clusters are included — they are where most job DBUs are spent.">
                <span className="fa-solid fa-circle-info"></span>
              </span>
            </div>
            <div className="d-flex align-items-baseline gap-2" style={{ minWidth: "0" }}>
              <h2 className="mb-0 fw-semibold lh-1" data-obs-stat="data-obs-stat" data-obs-stat-key="dbxClustersRunning">
                0
              </h2>
              <span className="badge badge-phoenix fs-10 text-truncate badge-phoenix-success" style={{ maxWidth: "60%", textTransform: "none" }} title="running now" data-obs-stat-delta="data-obs-stat-delta" data-obs-stat-delta-key="dbxClustersRunning">
                running now
              </span>
            </div>
          </div>
        </div>
      </div>
      <ul className="nav nav-underline mb-4" role="tablist">
        <li className="nav-item" role="presentation">
          <button className="nav-link d-flex align-items-center gap-2 active" id="dbx-spend-tab" data-bs-toggle="tab" data-bs-target="#dbx-spend" type="button" role="tab" aria-controls="dbx-spend" aria-selected={true}>
            <span className="fa-solid fa-coins fs-10"></span>
            Spend
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button className="nav-link d-flex align-items-center gap-2" id="dbx-queries-tab" data-bs-toggle="tab" data-bs-target="#dbx-queries" type="button" role="tab" aria-controls="dbx-queries" aria-selected={false}>
            <span className="fa-solid fa-magnifying-glass-chart fs-10"></span>
            Queries
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button className="nav-link d-flex align-items-center gap-2" id="dbx-clusters-tab" data-bs-toggle="tab" data-bs-target="#dbx-clusters" type="button" role="tab" aria-controls="dbx-clusters" aria-selected={false}>
            <span className="fa-solid fa-server fs-10"></span>
            Clusters
          </button>
        </li>
      </ul>
      <div className="tab-content">
        <div className="tab-pane fade show active" id="dbx-spend" role="tabpanel" aria-labelledby="dbx-spend-tab">
          <div className="mb-4">
            <div className="card h-100">
              <div className="card-header border-bottom border-translucent py-3">
                <div className="d-flex align-items-center justify-content-between gap-2">
                  <div className="d-flex align-items-center gap-1">
                    <h6 className="text-body-tertiary text-uppercase fs-10 fw-semibold mb-0 lh-1" style={{ letterSpacing: ".04em" }}>
                      Daily list cost
                    </h6>
                    <span className="text-body-quaternary fs-10" data-bs-toggle="tooltip" data-bs-placement="top" title="Last 30 days. A month-to-date total only ever rises, so it cannot show whether spend is accelerating. DBUs are in the tooltip rather than on a second axis — two y-scales make their crossing point look meaningful when it is an artefact of the scales.">
                      <span className="fa-solid fa-circle-info"></span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="card-body">
                <div data-lhb-chart="databricksCost" style={{ height: "300px", width: "100%" }}></div>
              </div>
            </div>
          </div>
          <div className="row g-4">
            <div className="col-12 col-xl-6">
              <div className="obs-list-root" data-list={"{\"valueNames\":[\"col0\",\"col1\",\"col2\",\"col3\"],\"page\":8,\"filter\":{\"key\":\"col3\"}}"} data-live-table="databricksUsage">
                <div className="card">
                  <div className="card-header border-bottom border-translucent py-3">
                    <div className="row align-items-center g-2 mb-3">
                      <div className="col">
                        <h4 className="mb-0">
                          Cost by SKU
                        </h4>
                        <p className="text-body-tertiary fs-9 mb-0">
                          Which product the DBUs went to, over the last 30 days
                        </p>
                      </div>
                    </div>
                    <div className="row align-items-center g-2">
                      <div className="col-12 col-md">
                        <div className="search-box w-100">
                          <form className="position-relative">
                            <input className="form-control search-input search form-control-sm" type="search" placeholder="Search SKUs" aria-label="Search" />
                            <span className="fas fa-search search-box-icon"></span>
                          </form>
                        </div>
                      </div>
                      <div className="col-6 col-md-auto">
                        <select className="form-select form-select-sm" data-list-filter="data-list-filter" aria-label="Filter">
                          <option value="">
                            Filter: All
                          </option>
                          <option value="58.1%">
                            58.1%
                          </option>
                        </select>
                      </div>
                      <div className="col-6 col-md-auto">
                        <select className="form-select form-select-sm" aria-label="Sort by" data-obs-sort="data-obs-sort">
                          <option value="">
                            Sort by
                          </option>
                          <option value="col0">
                            SKU
                          </option>
                          <option value="col1">
                            DBUs
                          </option>
                          <option value="col2">
                            List cost
                          </option>
                          <option value="col3">
                            Share
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
                              SKU
                            </th>
                            <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col1">
                              DBUs
                            </th>
                            <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col2">
                              List cost
                            </th>
                            <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col3">
                              Share
                            </th>
                          </tr>
                        </thead>
                        <tbody className="list" data-sample-rows="data-sample-rows">
                          <tr>
                            <td className="align-middle ps-3 py-3 col0">
                              <div className="d-flex align-items-center">
                                <span className="me-2 fa-solid fa-cube text-info"></span>
                                <div>
                                  <h6 className="mb-0">
                                    PREMIUM_ALL_PURPOSE_COMPUTE
                                  </h6>
                                </div>
                              </div>
                            </td>
                            <td className="align-middle col1">
                              412.0
                            </td>
                            <td className="align-middle col2">
                              USD 226.60
                            </td>
                            <td className="align-middle col3">
                              58.1%
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
              <div className="obs-list-root" data-list={"{\"valueNames\":[\"col0\",\"col1\",\"col2\",\"col3\"],\"page\":8,\"filter\":{\"key\":\"col3\"}}"} data-live-table="databricksSpenders">
                <div className="card">
                  <div className="card-header border-bottom border-translucent py-3">
                    <div className="row align-items-center g-2 mb-3">
                      <div className="col">
                        <h4 className="mb-0">
                          Top spenders
                        </h4>
                        <p className="text-body-tertiary fs-9 mb-0">
                          Attributed to the job, warehouse or cluster that consumed the DBUs
                        </p>
                      </div>
                    </div>
                    <div className="row align-items-center g-2">
                      <div className="col-12 col-md">
                        <div className="search-box w-100">
                          <form className="position-relative">
                            <input className="form-control search-input search form-control-sm" type="search" placeholder="Search" aria-label="Search" />
                            <span className="fas fa-search search-box-icon"></span>
                          </form>
                        </div>
                      </div>
                      <div className="col-6 col-md-auto">
                        <select className="form-select form-select-sm" data-list-filter="data-list-filter" aria-label="Filter">
                          <option value="">
                            Filter: All
                          </option>
                          <option value="USD 101.20">
                            USD 101.20
                          </option>
                        </select>
                      </div>
                      <div className="col-6 col-md-auto">
                        <select className="form-select form-select-sm" aria-label="Sort by" data-obs-sort="data-obs-sort">
                          <option value="">
                            Sort by
                          </option>
                          <option value="col0">
                            Entity
                          </option>
                          <option value="col1">
                            Type
                          </option>
                          <option value="col2">
                            DBUs
                          </option>
                          <option value="col3">
                            List cost
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
                              Entity
                            </th>
                            <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col1">
                              Type
                            </th>
                            <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col2">
                              DBUs
                            </th>
                            <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col3">
                              List cost
                            </th>
                          </tr>
                        </thead>
                        <tbody className="list" data-sample-rows="data-sample-rows">
                          <tr>
                            <td className="align-middle ps-3 py-3 col0">
                              <div className="d-flex align-items-center">
                                <span className="me-2 fa-solid fa-diagram-project text-primary"></span>
                                <div>
                                  <h6 className="mb-0">
                                    nightly-load
                                  </h6>
                                </div>
                              </div>
                            </td>
                            <td className="align-middle col1">
                              job
                            </td>
                            <td className="align-middle col2">
                              184.0
                            </td>
                            <td className="align-middle col3">
                              USD 101.20
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
        </div>
        <div className="tab-pane fade" id="dbx-queries" role="tabpanel" aria-labelledby="dbx-queries-tab">
          <div className="obs-list-root" data-list={"{\"valueNames\":[\"col0\",\"col1\",\"col2\",\"col3\",\"col4\",\"col5\",\"col6\"],\"page\":10,\"filter\":{\"key\":\"col6\"}}"} data-live-table="databricksQueries">
            <div className="card">
              <div className="card-header border-bottom border-translucent py-3">
                <div className="row align-items-center g-2 mb-3">
                  <div className="col">
                    <h4 className="mb-0">
                      Query health by compute
                    </h4>
                    <p className="text-body-tertiary fs-9 mb-0">
                      Last 24 hours from system.query.history, busiest first
                    </p>
                  </div>
                </div>
                <div className="row align-items-center g-2">
                  <div className="col-12 col-md">
                    <div className="search-box w-100">
                      <form className="position-relative">
                        <input className="form-control search-input search form-control-sm" type="search" placeholder="Search warehouses and clusters" aria-label="Search" />
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
                        Compute
                      </option>
                      <option value="col1">
                        Queries
                      </option>
                      <option value="col2">
                        Failures
                      </option>
                      <option value="col3">
                        Failure rate
                      </option>
                      <option value="col4">
                        Avg
                      </option>
                      <option value="col5">
                        p99
                      </option>
                      <option value="col6">
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
                          Compute
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col1">
                          Queries
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col2">
                          Failures
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col3">
                          Failure rate
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col4">
                          Avg
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col5">
                          p99
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col6">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="list" data-sample-rows="data-sample-rows">
                      <tr>
                        <td className="align-middle ps-3 py-3 col0">
                          <div className="d-flex align-items-center">
                            <span className="me-2 fa-solid fa-magnifying-glass-chart text-success"></span>
                            <div>
                              <h6 className="mb-0">
                                a1b2c3d4e5f6
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                SELECT
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          1,204
                        </td>
                        <td className="align-middle col2">
                          3
                        </td>
                        <td className="align-middle col3">
                          0.25%
                        </td>
                        <td className="align-middle col4">
                          42ms
                        </td>
                        <td className="align-middle col5">
                          910ms
                        </td>
                        <td className="align-middle col6">
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
        <div className="tab-pane fade" id="dbx-clusters" role="tabpanel" aria-labelledby="dbx-clusters-tab">
          <div className="obs-list-root" data-list={"{\"valueNames\":[\"col0\",\"col1\",\"col2\",\"col3\",\"col4\",\"col5\"],\"page\":10,\"filter\":{\"key\":\"col5\"}}"} data-live-table="databricksClusters">
            <div className="card">
              <div className="card-header border-bottom border-translucent py-3">
                <div className="row align-items-center g-2 mb-3">
                  <div className="col">
                    <h4 className="mb-0">
                      Clusters
                    </h4>
                    <p className="text-body-tertiary fs-9 mb-0">
                      Running first. Job clusters included — hiding them would make this disagree with the spend attribution
                    </p>
                  </div>
                </div>
                <div className="row align-items-center g-2">
                  <div className="col-12 col-md">
                    <div className="search-box w-100">
                      <form className="position-relative">
                        <input className="form-control search-input search form-control-sm" type="search" placeholder="Search clusters" aria-label="Search" />
                        <span className="fas fa-search search-box-icon"></span>
                      </form>
                    </div>
                  </div>
                  <div className="col-6 col-md-auto">
                    <select className="form-select form-select-sm" data-list-filter="data-list-filter" aria-label="Filter">
                      <option value="">
                        Filter: All
                      </option>
                      <option value="30m">
                        30m
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
                        State
                      </option>
                      <option value="col2">
                        Source
                      </option>
                      <option value="col3">
                        Node type
                      </option>
                      <option value="col4">
                        Workers
                      </option>
                      <option value="col5">
                        Auto-terminate
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
                          State
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col2">
                          Source
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col3">
                          Node type
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col4">
                          Workers
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col5">
                          Auto-terminate
                        </th>
                      </tr>
                    </thead>
                    <tbody className="list" data-sample-rows="data-sample-rows">
                      <tr>
                        <td className="align-middle ps-3 py-3 col0">
                          <div className="d-flex align-items-center">
                            <span className="me-2 fa-solid fa-server text-success"></span>
                            <div>
                              <h6 className="mb-0">
                                analytics-shared
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                15.4.x-scala2.12
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          <span className="badge badge-phoenix badge-phoenix-success">
                            Running
                          </span>
                        </td>
                        <td className="align-middle col2">
                          UI
                        </td>
                        <td className="align-middle col3">
                          m5d.large
                        </td>
                        <td className="align-middle col4">
                          2–8
                        </td>
                        <td className="align-middle col5">
                          30m
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
    </AppLayout>
  )
}
