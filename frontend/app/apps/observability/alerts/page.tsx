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
            Alerts
          </li>
        </ol>
      </nav>
      <div className="mb-6">
        <div className="row align-items-center g-3">
          <div className="col">
            <h2 className="mb-2">
              Alerts Monitoring
            </h2>
            <h5 className="text-body-tertiary fw-semibold mb-0">
              Unified alerts from APIs, AI tools, ETL jobs, and multi-cloud accounts
            </h5>
          </div>
          <div className="col-auto">
            <button className="btn btn-primary" type="button" data-lhb-action="createAlertRule">
              Create alert rule
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
                    Open alerts
                  </h6>
                  <h3 className="mb-0">
                    27
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-danger">
                  12 critical
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
                    Acknowledged
                  </h6>
                  <h3 className="mb-0">
                    9
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-info">
                  today
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
                    Resolved (24h)
                  </h6>
                  <h3 className="mb-0">
                    41
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-success">
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
                    MTTR
                  </h6>
                  <h3 className="mb-0">
                    34m
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-success">
                  -8m
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="obs-list-root" data-list={"{\"valueNames\":[\"col0\",\"col1\",\"col2\",\"col3\",\"col4\",\"col5\"],\"page\":5,\"filter\":{\"key\":\"col5\"}}"} data-live-table="alerts">
        <div className="card">
          <div className="card-header border-bottom border-translucent py-3">
            <div className="row align-items-center g-2 mb-3">
              <div className="col">
                <h4 className="mb-0">
                  Active alerts
                </h4>
                <p className="text-body-tertiary fs-9 mb-0">
                  Cross-domain signal stream
                </p>
              </div>
            </div>
            <div className="row align-items-center g-2">
              <div className="col-12 col-md">
                <div className="search-box w-100">
                  <form className="position-relative">
                    <input className="form-control search-input search form-control-sm" type="search" placeholder="Search alerts" aria-label="Search" />
                    <span className="fas fa-search search-box-icon"></span>
                  </form>
                </div>
              </div>
              <div className="col-6 col-md-auto">
                <select className="form-select form-select-sm" data-list-filter="data-list-filter" aria-label="Filter">
                  <option value="">
                    Filter: All
                  </option>
                  <option value="Open">
                    Open
                  </option>
                  <option value="Ack">
                    Ack
                  </option>
                </select>
              </div>
              <div className="col-6 col-md-auto">
                <select className="form-select form-select-sm" aria-label="Sort by" data-obs-sort="data-obs-sort">
                  <option value="">
                    Sort by
                  </option>
                  <option value="col0">
                    Alert
                  </option>
                  <option value="col1">
                    Source
                  </option>
                  <option value="col2">
                    Severity
                  </option>
                  <option value="col3">
                    Owner
                  </option>
                  <option value="col4">
                    Age
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
                      Alert
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col1">
                      Source
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col2">
                      Severity
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col3">
                      Owner
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col4">
                      Age
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
                        <span className="me-2 fa-solid fa-triangle-exclamation text-danger"></span>
                        <div>
                          <h6 className="mb-0">
                            p99 latency spike
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            /v1/checkout
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      API Monitoring
                    </td>
                    <td className="align-middle col2">
                      <span className="badge badge-phoenix badge-phoenix-danger">
                        Critical
                      </span>
                    </td>
                    <td className="align-middle col3">
                      Platform SRE
                    </td>
                    <td className="align-middle col4">
                      12m
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-warning">
                        Open
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-robot text-warning"></span>
                        <div>
                          <h6 className="mb-0">
                            ChatGPT spend threshold
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            openai org
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      AI Monitoring
                    </td>
                    <td className="align-middle col2">
                      <span className="badge badge-phoenix badge-phoenix-warning">
                        Warning
                      </span>
                    </td>
                    <td className="align-middle col3">
                      FinOps
                    </td>
                    <td className="align-middle col4">
                      28m
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-warning">
                        Open
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-shuffle text-info"></span>
                        <div>
                          <h6 className="mb-0">
                            Apigee rate-limit storm
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            apigee-x
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      AI Gateway
                    </td>
                    <td className="align-middle col2">
                      <span className="badge badge-phoenix badge-phoenix-warning">
                        Warning
                      </span>
                    </td>
                    <td className="align-middle col3">
                      API Platform
                    </td>
                    <td className="align-middle col4">
                      41m
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-info">
                        Ack
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-diagram-project text-danger"></span>
                        <div>
                          <h6 className="mb-0">
                            Glue job failed
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            customer_sync
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      ETL Monitoring
                    </td>
                    <td className="align-middle col2">
                      <span className="badge badge-phoenix badge-phoenix-danger">
                        Critical
                      </span>
                    </td>
                    <td className="align-middle col3">
                      Data Eng
                    </td>
                    <td className="align-middle col4">
                      1h
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-warning">
                        Open
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-cloud text-warning"></span>
                        <div>
                          <h6 className="mb-0">
                            EC2 cost anomaly
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            aws-prod-042
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Cloud Cost
                    </td>
                    <td className="align-middle col2">
                      <span className="badge badge-phoenix badge-phoenix-warning">
                        Warning
                      </span>
                    </td>
                    <td className="align-middle col3">
                      Cloud Ops
                    </td>
                    <td className="align-middle col4">
                      2h
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-warning">
                        Open
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
      <div className="obs-list-root" data-list={"{\"valueNames\":[\"col0\",\"col1\",\"col2\",\"col3\",\"col4\",\"col5\"],\"page\":5,\"filter\":{\"key\":\"col5\"}}"} data-live-table="clusters">
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
                  <option value="Firing">
                    Firing
                  </option>
                  <option value="Resolved">
                    Resolved
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
                  </tr>
                </thead>
                <tbody className="list">
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-layer-group text-danger"></span>
                        <div>
                          <h6 className="mb-0">
                            Upstream timeout on &lt;route&gt;
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            cluster-checkout-timeout
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      <span className="badge badge-phoenix badge-phoenix-danger">
                        Critical
                      </span>
                    </td>
                    <td className="align-middle col2">
                      38
                    </td>
                    <td className="align-middle col3">
                      checkout-api, payments
                    </td>
                    <td className="align-middle col4">
                      3m ago
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-danger">
                        Firing
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-layer-group text-warning"></span>
                        <div>
                          <h6 className="mb-0">
                            Rate limit exceeded for &lt;consumer&gt;
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            cluster-rate-limit
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      <span className="badge badge-phoenix badge-phoenix-warning">
                        Warning
                      </span>
                    </td>
                    <td className="align-middle col2">
                      17
                    </td>
                    <td className="align-middle col3">
                      partner-api
                    </td>
                    <td className="align-middle col4">
                      11m ago
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-danger">
                        Firing
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-layer-group text-info"></span>
                        <div>
                          <h6 className="mb-0">
                            Job &lt;name&gt; retried
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            cluster-glue-retry
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      <span className="badge badge-phoenix badge-phoenix-info">
                        Info
                      </span>
                    </td>
                    <td className="align-middle col2">
                      9
                    </td>
                    <td className="align-middle col3">
                      customer_sync
                    </td>
                    <td className="align-middle col4">
                      46m ago
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Resolved
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
      <div className="obs-list-root" data-list={"{\"valueNames\":[\"col0\",\"col1\",\"col2\",\"col3\",\"col4\",\"col5\"],\"page\":5,\"filter\":{\"key\":\"col5\"}}"} data-live-table="agentIncidentClusters">
        <div className="card">
          <div className="card-header border-bottom border-translucent py-3">
            <div className="row align-items-center g-2 mb-3">
              <div className="col">
                <h4 className="mb-0">
                  Agent incident clusters
                </h4>
                <p className="text-body-tertiary fs-9 mb-0">
                  Failures the AI agents reported, clustered the same way — these can be dispatched to a coding agent, not just copied
                </p>
              </div>
            </div>
            <div className="row align-items-center g-2">
              <div className="col-12 col-md">
                <div className="search-box w-100">
                  <form className="position-relative">
                    <input className="form-control search-input search form-control-sm" type="search" placeholder="Search agent incidents" aria-label="Search" />
                    <span className="fas fa-search search-box-icon"></span>
                  </form>
                </div>
              </div>
              <div className="col-6 col-md-auto">
                <select className="form-select form-select-sm" data-list-filter="data-list-filter" aria-label="Filter">
                  <option value="">
                    Filter: All
                  </option>
                  <option value="Firing">
                    Firing
                  </option>
                  <option value="Resolved">
                    Resolved
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
                    Failures
                  </option>
                  <option value="col3">
                    Agents
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
                      Failures
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col3">
                      Agents
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col4">
                      Last seen
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
                        <span className="me-2 fa-solid fa-robot text-danger"></span>
                        <div>
                          <h6 className="mb-0">
                            Tool call &lt;tool&gt; timed out
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            agent-tool-timeout
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      <span className="badge badge-phoenix badge-phoenix-danger">
                        Critical
                      </span>
                    </td>
                    <td className="align-middle col2">
                      24
                    </td>
                    <td className="align-middle col3">
                      support-copilot
                    </td>
                    <td className="align-middle col4">
                      5m ago
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-danger">
                        Firing
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-robot text-warning"></span>
                        <div>
                          <h6 className="mb-0">
                            Context window exceeded on &lt;model&gt;
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            agent-context-overflow
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      <span className="badge badge-phoenix badge-phoenix-warning">
                        Warning
                      </span>
                    </td>
                    <td className="align-middle col2">
                      12
                    </td>
                    <td className="align-middle col3">
                      research-agent
                    </td>
                    <td className="align-middle col4">
                      22m ago
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-danger">
                        Firing
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-robot text-info"></span>
                        <div>
                          <h6 className="mb-0">
                            Evaluation &lt;name&gt; below threshold
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            agent-eval-regression
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      <span className="badge badge-phoenix badge-phoenix-info">
                        Info
                      </span>
                    </td>
                    <td className="align-middle col2">
                      6
                    </td>
                    <td className="align-middle col3">
                      summarizer
                    </td>
                    <td className="align-middle col4">
                      1h ago
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Resolved
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
