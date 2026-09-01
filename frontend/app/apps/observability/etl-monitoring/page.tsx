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
          <li className="breadcrumb-item active">
            ETL Monitoring
          </li>
        </ol>
      </nav>
      <div className="mb-6">
        <div className="row align-items-center g-3">
          <div className="col">
            <h2 className="mb-2">
              ETL / ELT Monitoring
            </h2>
            <h5 className="text-body-tertiary fw-semibold mb-0">
              Pipeline health across integration and analytics platforms
            </h5>
          </div>
          <div className="col-auto">
            <a className="btn btn-phoenix-primary" href="/apps/platform/integrations/etl/">
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
                    Pipelines
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat">
                    286
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-info" data-obs-stat-delta="data-obs-stat-delta">
                  +12
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
                    Success rate
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat">
                    96.4%
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-success" data-obs-stat-delta="data-obs-stat-delta">
                  +1.1%
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
                    Failed runs (24h)
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat">
                    14
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-success" data-obs-stat-delta="data-obs-stat-delta">
                  -3
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
                    Avg duration
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat">
                    18m
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-warning" data-obs-stat-delta="data-obs-stat-delta">
                  +2m
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="obs-list-root" data-list={"{\"valueNames\":[\"col0\",\"col1\",\"col2\",\"col3\",\"col4\",\"col5\"],\"page\":5,\"filter\":{\"key\":\"col5\"}}"} data-live-table="etl">
        <div className="card">
          <div className="card-header border-bottom border-translucent py-3">
            <div className="row align-items-center g-2 mb-3">
              <div className="col">
                <h4 className="mb-0">
                  ETL / ELT platforms
                </h4>
                <p className="text-body-tertiary fs-9 mb-0">
                  Talend · Dell Boomi · Jundago · Qlik · Informatica · Alteryx · dbt · SnapLogic · AWS Glue · Microsoft Fabric and more
                </p>
              </div>
            </div>
            <div className="row align-items-center g-2">
              <div className="col-12 col-md">
                <div className="search-box w-100">
                  <form className="position-relative">
                    <input className="form-control search-input search form-control-sm" type="search" placeholder="Search ETL tools" aria-label="Search" />
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
                  <option value="Watch">
                    Watch
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
                    Category
                  </option>
                  <option value="col2">
                    Jobs
                  </option>
                  <option value="col3">
                    Last run
                  </option>
                  <option value="col4">
                    SLA
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
                      Category
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col2">
                      Jobs
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col3">
                      Last run
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col4">
                      SLA
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
                        <span className="me-2 fa-solid fa-diagram-project text-primary"></span>
                        <div>
                          <h6 className="mb-0">
                            Talend
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            cloud + studio
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      iPaaS / ETL
                    </td>
                    <td className="align-middle col2">
                      42
                    </td>
                    <td className="align-middle col3">
                      12m ago
                    </td>
                    <td className="align-middle col4">
                      99%
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
                        <span className="me-2 fa-solid fa-plug text-info"></span>
                        <div>
                          <h6 className="mb-0">
                            Dell Boomi
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            atom spheres
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      iPaaS
                    </td>
                    <td className="align-middle col2">
                      31
                    </td>
                    <td className="align-middle col3">
                      28m ago
                    </td>
                    <td className="align-middle col4">
                      98%
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
                        <span className="me-2 fa-solid fa-network-wired text-secondary"></span>
                        <div>
                          <h6 className="mb-0">
                            Jundago
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            integration hub
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      iPaaS
                    </td>
                    <td className="align-middle col2">
                      9
                    </td>
                    <td className="align-middle col3">
                      1h ago
                    </td>
                    <td className="align-middle col4">
                      97%
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
                        <span className="me-2 fa-solid fa-chart-pie text-success"></span>
                        <div>
                          <h6 className="mb-0">
                            Qlik
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            data integration
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Analytics / ETL
                    </td>
                    <td className="align-middle col2">
                      22
                    </td>
                    <td className="align-middle col3">
                      45m ago
                    </td>
                    <td className="align-middle col4">
                      96%
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-info">
                        Watch
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-database text-danger"></span>
                        <div>
                          <h6 className="mb-0">
                            Informatica
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            IDMC / PowerCenter
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Enterprise ETL
                    </td>
                    <td className="align-middle col2">
                      37
                    </td>
                    <td className="align-middle col3">
                      9m ago
                    </td>
                    <td className="align-middle col4">
                      99%
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
                        <span className="me-2 fa-solid fa-chart-line text-warning"></span>
                        <div>
                          <h6 className="mb-0">
                            Alteryx
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            designer + server
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Analytics / ETL
                    </td>
                    <td className="align-middle col2">
                      15
                    </td>
                    <td className="align-middle col3">
                      2h ago
                    </td>
                    <td className="align-middle col4">
                      95%
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
                        <span className="me-2 fa-solid fa-cubes text-primary"></span>
                        <div>
                          <h6 className="mb-0">
                            dbt
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            core + cloud
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      ELT transform
                    </td>
                    <td className="align-middle col2">
                      58
                    </td>
                    <td className="align-middle col3">
                      6m ago
                    </td>
                    <td className="align-middle col4">
                      99%
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
                        <span className="me-2 fa-solid fa-link text-info"></span>
                        <div>
                          <h6 className="mb-0">
                            SnapLogic
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            pipelines
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      iPaaS
                    </td>
                    <td className="align-middle col2">
                      19
                    </td>
                    <td className="align-middle col3">
                      33m ago
                    </td>
                    <td className="align-middle col4">
                      97%
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
                            AWS Glue
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            spark jobs
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Cloud ETL
                    </td>
                    <td className="align-middle col2">
                      27
                    </td>
                    <td className="align-middle col3">
                      4m ago
                    </td>
                    <td className="align-middle col4">
                      98%
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
                        <span className="me-2 fa-brands fa-microsoft text-info"></span>
                        <div>
                          <h6 className="mb-0">
                            Microsoft Fabric
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            data factory + lakehouse
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Lakehouse / ETL
                    </td>
                    <td className="align-middle col2">
                      24
                    </td>
                    <td className="align-middle col3">
                      17m ago
                    </td>
                    <td className="align-middle col4">
                      97%
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
                        <span className="me-2 fa-solid fa-wind text-secondary"></span>
                        <div>
                          <h6 className="mb-0">
                            Apache Airflow
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            dags
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Orchestration
                    </td>
                    <td className="align-middle col2">
                      40
                    </td>
                    <td className="align-middle col3">
                      3m ago
                    </td>
                    <td className="align-middle col4">
                      99%
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
                        <span className="me-2 fa-solid fa-industry text-primary"></span>
                        <div>
                          <h6 className="mb-0">
                            Fivetran
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            fivetran syncs
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      ELT ingest
                    </td>
                    <td className="align-middle col2">
                      33
                    </td>
                    <td className="align-middle col3">
                      11m ago
                    </td>
                    <td className="align-middle col4">
                      99%
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
