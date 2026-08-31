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
          <li className="breadcrumb-item">
            <a href="/apps/platform/integrations/">
              Integrations
            </a>
          </li>
          <li className="breadcrumb-item active">
            ETL tools
          </li>
        </ol>
      </nav>
      <div className="mb-6">
        <div className="row align-items-center g-3">
          <div className="col">
            <h2 className="mb-2">
              ETL tools
            </h2>
            <h5 className="text-body-tertiary fw-semibold mb-0">
              Credentials for the pipeline platforms whose job executions feed ETL and Orchestration Monitoring
            </h5>
          </div>
          <div className="col-auto">
            <button className="btn btn-primary" type="button" data-lhb-action="connectEtl">
              Connect ETL tool
            </button>
          </div>
        </div>
      </div>
      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-body d-flex flex-column">
              <h6 className="mb-2">
                Talend
              </h6>
              <p className="text-body-tertiary fs-9">
                Talend Cloud — API base URL, environment or workspace, and how far back to look on each sweep.
              </p>
              <div className="mt-auto d-flex gap-2">
                <button className="btn btn-sm btn-primary" type="button" data-lhb-action="connectTalend">
                  Configure
                </button>
                <button className="btn btn-sm btn-phoenix-secondary" type="button" data-lhb-action="testEtlConfig" data-lhb-arg="talend">
                  Test
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-body d-flex flex-column">
              <h6 className="mb-2">
                Dell Boomi
              </h6>
              <p className="text-body-tertiary fs-9">
                AtomSphere account ID, username and API token. Executions are pulled per atom.
              </p>
              <div className="mt-auto d-flex gap-2">
                <button className="btn btn-sm btn-primary" type="button" data-lhb-action="connectBoomi">
                  Configure
                </button>
                <button className="btn btn-sm btn-phoenix-secondary" type="button" data-lhb-action="testEtlConfig" data-lhb-arg="boomi">
                  Test
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-body d-flex flex-column">
              <h6 className="mb-2">
                Databricks
              </h6>
              <p className="text-body-tertiary fs-9">
                Shared with Data Observability — the same workspace credentials serve job runs and table health.
              </p>
              <div className="mt-auto d-flex gap-2">
                <button className="btn btn-sm btn-primary" type="button" data-lhb-action="connectDatabricks">
                  Configure
                </button>
                <button className="btn btn-sm btn-phoenix-secondary" type="button" data-lhb-action="testEtlConfig" data-lhb-arg="databricks">
                  Test
                </button>
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
                  Connected platforms
                </h4>
                <p className="text-body-tertiary fs-9 mb-0">
                  Live from each platform’s own health check — a platform that was never configured says so rather than going missing
                </p>
              </div>
            </div>
            <div className="row align-items-center g-2">
              <div className="col-12 col-md">
                <div className="search-box w-100">
                  <form className="position-relative">
                    <input className="form-control search-input search form-control-sm" type="search" placeholder="Search platforms" aria-label="Search" />
                    <span className="fas fa-search search-box-icon"></span>
                  </form>
                </div>
              </div>
              <div className="col-6 col-md-auto">
                <select className="form-select form-select-sm" data-list-filter="data-list-filter" aria-label="Filter">
                  <option value="">
                    Filter: All
                  </option>
                  <option value="Not connected">
                    Not connected
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
                    Jobs
                  </option>
                  <option value="col2">
                    Failed
                  </option>
                  <option value="col3">
                    Records
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
                      Jobs
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col2">
                      Failed
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col3">
                      Records
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col4">
                      Last run
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
                        <span className="me-2 fa-solid fa-diagram-project text-secondary"></span>
                        <div>
                          <h6 className="mb-0">
                            —
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            nothing connected yet
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      0
                    </td>
                    <td className="align-middle col2">
                      0
                    </td>
                    <td className="align-middle col3">
                      —
                    </td>
                    <td className="align-middle col4">
                      —
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-secondary">
                        Not connected
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
