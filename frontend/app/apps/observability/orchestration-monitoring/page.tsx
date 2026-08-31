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
            Orchestration Monitoring
          </li>
        </ol>
      </nav>
      <div className="mb-6">
        <div className="row align-items-center g-3">
          <div className="col">
            <h2 className="mb-2">
              Orchestration Monitoring
            </h2>
            <h5 className="text-body-tertiary fw-semibold mb-0">
              DAGs, workflows, and scheduled jobs — the layer that decides when your ETL actually runs
            </h5>
          </div>
          <div className="col-auto">
            <a className="btn btn-phoenix-primary" href="/apps/platform/integrations/cloud/">
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
                    Workflows
                  </h6>
                  <h3 className="mb-0">
                    164
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-info">
                  +9
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
                    Runs (24h)
                  </h6>
                  <h3 className="mb-0">
                    3,428
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-success">
                  +184
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
                    Failed runs
                  </h6>
                  <h3 className="mb-0">
                    27
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-warning">
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
                    Queued &gt; SLA
                  </h6>
                  <h3 className="mb-0">
                    4
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-danger">
                  waiting on slots
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="obs-list-root" data-list={"{\"valueNames\":[\"col0\",\"col1\",\"col2\",\"col3\",\"col4\",\"col5\"],\"page\":6,\"filter\":{\"key\":\"col5\"}}"}>
        <div className="card">
          <div className="card-header border-bottom border-translucent py-3">
            <div className="row align-items-center g-2 mb-3">
              <div className="col">
                <h4 className="mb-0">
                  Orchestration platforms
                </h4>
                <p className="text-body-tertiary fs-9 mb-0">
                  Apache Airflow · AWS Step Functions · Dagster · Prefect · Azure Data Factory · Control-M
                </p>
              </div>
            </div>
            <div className="row align-items-center g-2">
              <div className="col-12 col-md">
                <div className="search-box w-100">
                  <form className="position-relative">
                    <input className="form-control search-input search form-control-sm" type="search" placeholder="Search orchestrators" aria-label="Search" />
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
                </select>
              </div>
              <div className="col-6 col-md-auto">
                <select className="form-select form-select-sm" aria-label="Sort by" data-obs-sort="data-obs-sort">
                  <option value="">
                    Sort by
                  </option>
                  <option value="col0">
                    Platform
                  </option>
                  <option value="col1">
                    Workflows
                  </option>
                  <option value="col2">
                    Runs (24h)
                  </option>
                  <option value="col3">
                    Failures
                  </option>
                  <option value="col4">
                    Last run
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
                      Platform
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col1">
                      Workflows
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col2">
                      Runs (24h)
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col3">
                      Failures
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col4">
                      Last run
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
                        <span className="me-2 fa-solid fa-wind text-success"></span>
                        <div>
                          <h6 className="mb-0">
                            Apache Airflow
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            MWAA · us-east-1
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      82
                    </td>
                    <td className="align-middle col2">
                      1,904
                    </td>
                    <td className="align-middle col3">
                      11
                    </td>
                    <td className="align-middle col4">
                      2m ago
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
                        <span className="me-2 fa-brands fa-aws text-warning"></span>
                        <div>
                          <h6 className="mb-0">
                            AWS Step Functions
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            state machines
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      38
                    </td>
                    <td className="align-middle col2">
                      842
                    </td>
                    <td className="align-middle col3">
                      3
                    </td>
                    <td className="align-middle col4">
                      1m ago
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
                        <span className="me-2 fa-solid fa-diagram-project text-primary"></span>
                        <div>
                          <h6 className="mb-0">
                            Dagster
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            cloud
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      21
                    </td>
                    <td className="align-middle col2">
                      318
                    </td>
                    <td className="align-middle col3">
                      2
                    </td>
                    <td className="align-middle col4">
                      7m ago
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
                        <span className="me-2 fa-solid fa-water text-info"></span>
                        <div>
                          <h6 className="mb-0">
                            Prefect
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            prefect cloud
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      14
                    </td>
                    <td className="align-middle col2">
                      221
                    </td>
                    <td className="align-middle col3">
                      9
                    </td>
                    <td className="align-middle col4">
                      4m ago
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
                        <span className="me-2 fa-brands fa-microsoft text-info"></span>
                        <div>
                          <h6 className="mb-0">
                            Azure Data Factory
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            ADF pipelines
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      7
                    </td>
                    <td className="align-middle col2">
                      118
                    </td>
                    <td className="align-middle col3">
                      2
                    </td>
                    <td className="align-middle col4">
                      22m ago
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
                        <span className="me-2 fa-solid fa-calendar-days text-secondary"></span>
                        <div>
                          <h6 className="mb-0">
                            Control-M
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            on-prem scheduler
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      2
                    </td>
                    <td className="align-middle col2">
                      25
                    </td>
                    <td className="align-middle col3">
                      0
                    </td>
                    <td className="align-middle col4">
                      1h ago
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
      <div className="obs-list-root" data-list={"{\"valueNames\":[\"col0\",\"col1\",\"col2\",\"col3\",\"col4\",\"col5\"],\"page\":8,\"filter\":{\"key\":\"col5\"}}"} data-live-table="orchestration">
        <div className="card">
          <div className="card-header border-bottom border-translucent py-3">
            <div className="row align-items-center g-2 mb-3">
              <div className="col">
                <h4 className="mb-0">
                  Recent workflow runs
                </h4>
                <p className="text-body-tertiary fs-9 mb-0">
                  Newest first. A failed run raises an event into the same alert pipeline as API, ETL, and database signals.
                </p>
              </div>
            </div>
            <div className="row align-items-center g-2">
              <div className="col-12 col-md">
                <div className="search-box w-100">
                  <form className="position-relative">
                    <input className="form-control search-input search form-control-sm" type="search" placeholder="Search runs, DAGs, or owners" aria-label="Search" />
                    <span className="fas fa-search search-box-icon"></span>
                  </form>
                </div>
              </div>
              <div className="col-6 col-md-auto">
                <select className="form-select form-select-sm" data-list-filter="data-list-filter" aria-label="Filter">
                  <option value="">
                    Filter: All
                  </option>
                  <option value="Succeeded">
                    Succeeded
                  </option>
                  <option value="Failed">
                    Failed
                  </option>
                  <option value="Retrying">
                    Retrying
                  </option>
                  <option value="Queued">
                    Queued
                  </option>
                </select>
              </div>
              <div className="col-6 col-md-auto">
                <select className="form-select form-select-sm" aria-label="Sort by" data-obs-sort="data-obs-sort">
                  <option value="">
                    Sort by
                  </option>
                  <option value="col0">
                    Workflow
                  </option>
                  <option value="col1">
                    Platform
                  </option>
                  <option value="col2">
                    Started
                  </option>
                  <option value="col3">
                    Duration
                  </option>
                  <option value="col4">
                    Tasks
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
                      Workflow
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col1">
                      Platform
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col2">
                      Started
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col3">
                      Duration
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col4">
                      Tasks
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
                        <span className="me-2 fa-solid fa-play text-success"></span>
                        <div>
                          <h6 className="mb-0">
                            nightly_customer_load
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            run 20260820T0100
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Airflow
                    </td>
                    <td className="align-middle col2">
                      01:00 UTC
                    </td>
                    <td className="align-middle col3">
                      42m
                    </td>
                    <td className="align-middle col4">
                      18 / 18
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Succeeded
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-play text-danger"></span>
                        <div>
                          <h6 className="mb-0">
                            ledger_reconcile
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            run 20260820T0130
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Airflow
                    </td>
                    <td className="align-middle col2">
                      01:30 UTC
                    </td>
                    <td className="align-middle col3">
                      9m
                    </td>
                    <td className="align-middle col4">
                      4 / 7
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-danger">
                        Failed
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-play text-success"></span>
                        <div>
                          <h6 className="mb-0">
                            order-export-sfn
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            exec 9f2a…
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Step Functions
                    </td>
                    <td className="align-middle col2">
                      02:00 UTC
                    </td>
                    <td className="align-middle col3">
                      6m
                    </td>
                    <td className="align-middle col4">
                      9 / 9
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Succeeded
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-play text-warning"></span>
                        <div>
                          <h6 className="mb-0">
                            marketing_attribution
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            run 20260820T0200
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Dagster
                    </td>
                    <td className="align-middle col2">
                      02:00 UTC
                    </td>
                    <td className="align-middle col3">
                      1h 12m
                    </td>
                    <td className="align-middle col4">
                      11 / 12
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-warning">
                        Retrying
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-play text-success"></span>
                        <div>
                          <h6 className="mb-0">
                            inventory_sync
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            flow-run 4c81…
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Prefect
                    </td>
                    <td className="align-middle col2">
                      02:15 UTC
                    </td>
                    <td className="align-middle col3">
                      18m
                    </td>
                    <td className="align-middle col4">
                      6 / 6
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Succeeded
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-play text-danger"></span>
                        <div>
                          <h6 className="mb-0">
                            pricing_refresh
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            flow-run 4c82…
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Prefect
                    </td>
                    <td className="align-middle col2">
                      02:30 UTC
                    </td>
                    <td className="align-middle col3">
                      3m
                    </td>
                    <td className="align-middle col4">
                      1 / 5
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-danger">
                        Failed
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-play text-info"></span>
                        <div>
                          <h6 className="mb-0">
                            dbt_daily_models
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            run 20260820T0300
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Airflow
                    </td>
                    <td className="align-middle col2">
                      03:00 UTC
                    </td>
                    <td className="align-middle col3">
                      —
                    </td>
                    <td className="align-middle col4">
                      0 / 24
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-info">
                        Queued
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-play text-success"></span>
                        <div>
                          <h6 className="mb-0">
                            crm_ingest
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            pipeline 118
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Data Factory
                    </td>
                    <td className="align-middle col2">
                      03:10 UTC
                    </td>
                    <td className="align-middle col3">
                      11m
                    </td>
                    <td className="align-middle col4">
                      5 / 5
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Succeeded
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
