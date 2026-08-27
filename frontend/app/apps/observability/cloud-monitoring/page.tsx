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
            Cloud Monitoring
          </li>
        </ol>
      </nav>
      <div className="mb-6">
        <div className="row align-items-center g-3">
          <div className="col">
            <h2 className="mb-2">
              Cloud Monitoring
            </h2>
            <h5 className="text-body-tertiary fw-semibold mb-0">
              Health and inventory across AWS, GCP, and Azure — accounts are connected under Orchestration, and their functions and anomalies surface here
            </h5>
          </div>
          <div className="col-auto">
            <button className="btn btn-primary" type="button" data-lhb-action="refreshData">
              Refresh
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
                    Linked accounts
                  </h6>
                  <h3 className="mb-0">
                    18
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-info">
                  3 clouds
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
                    Resources watched
                  </h6>
                  <h3 className="mb-0">
                    12.4k
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-success">
                  +320
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
                    Open cloud alerts
                  </h6>
                  <h3 className="mb-0">
                    7
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-danger">
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
                    Regions
                  </h6>
                  <h3 className="mb-0">
                    26
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-primary">
                  global
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="card mb-4">
        <div className="card-header border-bottom border-translucent py-3">
          <div className="row align-items-center">
            <div className="col">
              <h4 className="mb-0">
                Configure cloud accounts
              </h4>
              <p className="text-body-tertiary fs-9 mb-0">
                Connect multiple AWS / GCP / Azure accounts; LoveHeartBeat monitors all of them in one place.
              </p>
            </div>
            <div className="col-auto">
              <button className="btn btn-sm btn-primary" type="button">
                Connect AWS account
              </button>
              <button className="btn btn-sm btn-phoenix-secondary ms-2" type="button">
                Connect GCP
              </button>
              <button className="btn btn-sm btn-phoenix-secondary ms-2" type="button">
                Connect Azure
              </button>
            </div>
          </div>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <div className="border border-translucent rounded-3 p-3 h-100">
                <h6 className="mb-2">
                  AWS
                </h6>
                <p className="text-body-tertiary fs-9 mb-2">
                  Cross-account IAM role or Organizations linkage. Monitor every member account under the org OU.
                </p>
                <ul className="fs-9 mb-0">
                  <li>
                    CloudWatch metrics & alarms
                  </li>
                  <li>
                    GuardDuty / Config findings
                  </li>
                  <li>
                    Multi-account inventory
                  </li>
                </ul>
              </div>
            </div>
            <div className="col-md-4">
              <div className="border border-translucent rounded-3 p-3 h-100">
                <h6 className="mb-2">
                  Google Cloud
                </h6>
                <p className="text-body-tertiary fs-9 mb-2">
                  Service account or folder-level access across projects in the org.
                </p>
                <ul className="fs-9 mb-0">
                  <li>
                    Cloud Monitoring metrics
                  </li>
                  <li>
                    Logging / Error Reporting
                  </li>
                  <li>
                    Project & folder hierarchy
                  </li>
                </ul>
              </div>
            </div>
            <div className="col-md-4">
              <div className="border border-translucent rounded-3 p-3 h-100">
                <h6 className="mb-2">
                  Microsoft Azure
                </h6>
                <p className="text-body-tertiary fs-9 mb-2">
                  App registration / management group scope for subscriptions.
                </p>
                <ul className="fs-9 mb-0">
                  <li>
                    Azure Monitor metrics
                  </li>
                  <li>
                    Activity Log alerts
                  </li>
                  <li>
                    Subscription rollups
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="obs-list-root" data-list={"{\"valueNames\":[\"col0\",\"col1\",\"col2\",\"col3\",\"col4\",\"col5\"],\"page\":5,\"filter\":{\"key\":\"col5\"}}"} data-live-table="cloudLambda">
        <div className="card">
          <div className="card-header border-bottom border-translucent py-3">
            <div className="row align-items-center g-2 mb-3">
              <div className="col">
                <h4 className="mb-0">
                  Linked accounts
                </h4>
                <p className="text-body-tertiary fs-9 mb-0">
                  All environments monitored together
                </p>
              </div>
            </div>
            <div className="row align-items-center g-2">
              <div className="col-12 col-md">
                <div className="search-box w-100">
                  <form className="position-relative">
                    <input className="form-control search-input search form-control-sm" type="search" placeholder="Search accounts" aria-label="Search" />
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
                </select>
              </div>
              <div className="col-6 col-md-auto">
                <select className="form-select form-select-sm" aria-label="Sort by" data-obs-sort="data-obs-sort">
                  <option value="">
                    Sort by
                  </option>
                  <option value="col0">
                    Account
                  </option>
                  <option value="col1">
                    Cloud
                  </option>
                  <option value="col2">
                    Type
                  </option>
                  <option value="col3">
                    Resources
                  </option>
                  <option value="col4">
                    Alerts
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
                      Account
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col1">
                      Cloud
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col2">
                      Type
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col3">
                      Resources
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col4">
                      Alerts
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
                        <span className="me-2 fa-brands fa-aws text-warning"></span>
                        <div>
                          <h6 className="mb-0">
                            prod-root (org)
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            111122223333
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      AWS
                    </td>
                    <td className="align-middle col2">
                      Organizations
                    </td>
                    <td className="align-middle col3">
                      4,820
                    </td>
                    <td className="align-middle col4">
                      3
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
                            prod-workloads
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            444455556666
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      AWS
                    </td>
                    <td className="align-middle col2">
                      Member account
                    </td>
                    <td className="align-middle col3">
                      2,140
                    </td>
                    <td className="align-middle col4">
                      2
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
                        <span className="me-2 fa-brands fa-aws text-warning"></span>
                        <div>
                          <h6 className="mb-0">
                            dev-sandbox
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            777788889999
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      AWS
                    </td>
                    <td className="align-middle col2">
                      Member account
                    </td>
                    <td className="align-middle col3">
                      680
                    </td>
                    <td className="align-middle col4">
                      0
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
                            data-platform
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            121212121212
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      AWS
                    </td>
                    <td className="align-middle col2">
                      Member account
                    </td>
                    <td className="align-middle col3">
                      910
                    </td>
                    <td className="align-middle col4">
                      1
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
                        <span className="me-2 fa-brands fa-google text-danger"></span>
                        <div>
                          <h6 className="mb-0">
                            acme-prod
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            acme-prod
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      GCP
                    </td>
                    <td className="align-middle col2">
                      Project
                    </td>
                    <td className="align-middle col3">
                      1,250
                    </td>
                    <td className="align-middle col4">
                      1
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
                        <span className="me-2 fa-brands fa-google text-danger"></span>
                        <div>
                          <h6 className="mb-0">
                            acme-analytics
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            acme-analytics
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      GCP
                    </td>
                    <td className="align-middle col2">
                      Project
                    </td>
                    <td className="align-middle col3">
                      540
                    </td>
                    <td className="align-middle col4">
                      0
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
                            Contoso Prod
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            sub-prod
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Azure
                    </td>
                    <td className="align-middle col2">
                      Subscription
                    </td>
                    <td className="align-middle col3">
                      1,480
                    </td>
                    <td className="align-middle col4">
                      0
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
                            Contoso Shared
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            sub-shared
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Azure
                    </td>
                    <td className="align-middle col2">
                      Subscription
                    </td>
                    <td className="align-middle col3">
                      620
                    </td>
                    <td className="align-middle col4">
                      0
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
