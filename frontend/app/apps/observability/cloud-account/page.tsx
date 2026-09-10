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
          "src": "/vendors/echarts/echarts.min.js"
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
            <a href="/apps/observability/cloud-monitoring/">
              Cloud Monitoring
            </a>
          </li>
          <li className="breadcrumb-item active">
            Account
          </li>
        </ol>
      </nav>
      <div className="mb-6">
        <div className="row align-items-center g-3">
          <div className="col">
            <h2 className="mb-2">
              Account detail
            </h2>
            <h5 className="text-body-tertiary fw-semibold mb-0">
              Everything this AWS account is reporting — alarms, streamed metrics, spend and changes
            </h5>
          </div>
          <div className="col-auto">
            <a className="btn btn-phoenix-primary" href="/apps/observability/cloud-monitoring/">
              All accounts
            </a>
          </div>
        </div>
      </div>
      <div className="mb-4" data-account-heading="data-account-heading">
        <h3 className="mb-1" data-account-name="data-account-name">
          —
        </h3>
        <p className="text-body-tertiary fs-9 mb-0" data-account-meta="data-account-meta">
          Loading account…
        </p>
      </div>
      <div className="row g-3 mb-6">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="text-body-tertiary mb-2">
                    Open alarms
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat" data-obs-stat-key="accountAlarms">
                    —
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-danger" data-obs-stat-delta="data-obs-stat-delta" data-obs-stat-delta-key="accountAlarms">
                  no data
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
                    Resources
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat" data-obs-stat-key="accountResources">
                    —
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-info" data-obs-stat-delta="data-obs-stat-delta" data-obs-stat-delta-key="accountResources">
                  no data
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
                    Streamed services
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat" data-obs-stat-key="accountServices">
                    —
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-success" data-obs-stat-delta="data-obs-stat-delta" data-obs-stat-delta-key="accountServices">
                  no data
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
                    Spend month to date
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat" data-obs-stat-key="accountSpend">
                    —
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-primary" data-obs-stat-delta="data-obs-stat-delta" data-obs-stat-delta-key="accountSpend">
                  no data
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="card mb-4">
        <div className="card-body py-3">
          <div className="row g-3 align-items-end">
            <div className="col-6 col-sm-3 col-lg-2">
              <label className="form-label fs-9 mb-1" htmlFor="account-range">
                Range
              </label>
              <select className="form-select form-select-sm" id="account-range" data-lhb-chart-control="data-lhb-chart-control" data-lhb-refresh="data-lhb-refresh" aria-label="Time range">
                <option value="3">
                  Last 3h
                </option>
                <option value="12">
                  Last 12h
                </option>
                <option value="24">
                  Last 24h
                </option>
                <option value="168">
                  Last 7d
                </option>
              </select>
            </div>
            <div className="col-12 col-sm-6 col-lg-4">
              <label className="form-label fs-9 mb-1" htmlFor="account-metric">
                Metric
              </label>
              <select className="form-select form-select-sm" id="account-metric" data-lhb-chart-control="data-lhb-chart-control" aria-label="Metric to chart"></select>
            </div>
            <div className="col text-sm-end">
              <span className="text-body-tertiary fs-10">
                Range scopes the metric chart and streamed resources. Alarms are current state; spend is month to date.
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="row g-4 mb-4">
        <div className="col-12 col-xl-7">
          <div className="card h-100">
            <div className="card-header border-bottom border-translucent py-3">
              <h4 className="mb-0">
                Metric over time
              </h4>
              <p className="text-body-tertiary fs-9 mb-0">
                One line per resource, the five highest by peak. Anything beyond folds into “Other” rather than being dropped.
              </p>
            </div>
            <div className="card-body">
              <div data-lhb-chart="accountMetric" style={{ height: "320px", width: "100%" }}></div>
            </div>
          </div>
        </div>
        <div className="col-12 col-xl-5">
          <div className="card h-100">
            <div className="card-header border-bottom border-translucent py-3">
              <h4 className="mb-0">
                Spend by service
              </h4>
              <p className="text-body-tertiary fs-9 mb-0">
                Month to date for this account, largest first. Every bar is labelled with its value.
              </p>
            </div>
            <div className="card-body">
              <div data-lhb-chart="accountSpend" style={{ height: "320px", width: "100%" }}></div>
            </div>
          </div>
        </div>
      </div>
      <div className="obs-list-root" data-list={"{\"valueNames\":[\"col0\",\"col1\",\"col2\",\"col3\",\"col4\"],\"page\":5,\"filter\":{\"key\":\"col4\"}}"} data-live-table="accountAlarms">
        <div className="card">
          <div className="card-header border-bottom border-translucent py-3">
            <div className="row align-items-center g-2 mb-3">
              <div className="col">
                <h4 className="mb-0">
                  Open alarms
                </h4>
                <p className="text-body-tertiary fs-9 mb-0">
                  CloudWatch alarms currently in ALARM, across every region this connector reads
                </p>
              </div>
            </div>
            <div className="row align-items-center g-2">
              <div className="col-12 col-md">
                <div className="search-box w-100">
                  <form className="position-relative">
                    <input className="form-control search-input search form-control-sm" type="search" placeholder="Search alarms" aria-label="Search" />
                    <span className="fas fa-search search-box-icon"></span>
                  </form>
                </div>
              </div>
              <div className="col-6 col-md-auto">
                <select className="form-select form-select-sm" data-list-filter="data-list-filter" aria-label="Filter">
                  <option value="">
                    Filter: All
                  </option>
                  <option value="In alarm">
                    In alarm
                  </option>
                </select>
              </div>
              <div className="col-6 col-md-auto">
                <select className="form-select form-select-sm" aria-label="Sort by" data-obs-sort="data-obs-sort">
                  <option value="">
                    Sort by
                  </option>
                  <option value="col0">
                    Alarm
                  </option>
                  <option value="col1">
                    Metric
                  </option>
                  <option value="col2">
                    Region
                  </option>
                  <option value="col3">
                    Since
                  </option>
                  <option value="col4">
                    State
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
                      Alarm
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col1">
                      Metric
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col2">
                      Region
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col3">
                      Since
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col4">
                      State
                    </th>
                  </tr>
                </thead>
                <tbody className="list" data-sample-rows="data-sample-rows">
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-bell text-danger"></span>
                        <div>
                          <h6 className="mb-0">
                            cpu-high-prod
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            threshold crossed
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      CPUUtilization
                    </td>
                    <td className="align-middle col2">
                      us-east-1
                    </td>
                    <td className="align-middle col3">
                      2026-09-10T09:40:00Z
                    </td>
                    <td className="align-middle col4">
                      <span className="badge badge-phoenix badge-phoenix-danger">
                        In alarm
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
      <div className="obs-list-root" data-list={"{\"valueNames\":[\"col0\",\"col1\",\"col2\",\"col3\",\"col4\",\"col5\"],\"page\":10,\"filter\":{\"key\":\"col5\"}}"} data-live-table="accountResources">
        <div className="card">
          <div className="card-header border-bottom border-translucent py-3">
            <div className="row align-items-center g-2 mb-3">
              <div className="col">
                <h4 className="mb-0">
                  Streamed resources
                </h4>
                <p className="text-body-tertiary fs-9 mb-0">
                  Every resource this account’s metric stream has described
                </p>
              </div>
            </div>
            <div className="row align-items-center g-2">
              <div className="col-12 col-md">
                <div className="search-box w-100">
                  <form className="position-relative">
                    <input className="form-control search-input search form-control-sm" type="search" placeholder="Search resources" aria-label="Search" />
                    <span className="fas fa-search search-box-icon"></span>
                  </form>
                </div>
              </div>
              <div className="col-6 col-md-auto">
                <select className="form-select form-select-sm" data-list-filter="data-list-filter" aria-label="Filter">
                  <option value="">
                    Filter: All
                  </option>
                  <option value="Live">
                    Live
                  </option>
                </select>
              </div>
              <div className="col-6 col-md-auto">
                <select className="form-select form-select-sm" aria-label="Sort by" data-obs-sort="data-obs-sort">
                  <option value="">
                    Sort by
                  </option>
                  <option value="col0">
                    Resource
                  </option>
                  <option value="col1">
                    Service
                  </option>
                  <option value="col2">
                    Region
                  </option>
                  <option value="col3">
                    Metrics
                  </option>
                  <option value="col4">
                    Last seen
                  </option>
                  <option value="col5">
                    Freshness
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
                      Resource
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col1">
                      Service
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col2">
                      Region
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col3">
                      Metrics
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col4">
                      Last seen
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col5">
                      Freshness
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
                            i-0abc123
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            InstanceId=i-0abc123
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      EC2
                    </td>
                    <td className="align-middle col2">
                      us-east-1
                    </td>
                    <td className="align-middle col3">
                      14
                    </td>
                    <td className="align-middle col4">
                      2026-09-10T10:04:00Z
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Live
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
      <div className="obs-list-root" data-list={"{\"valueNames\":[\"col0\",\"col1\",\"col2\",\"col3\"],\"page\":5,\"filter\":{\"key\":\"col3\"}}"} data-live-table="accountChanges">
        <div className="card">
          <div className="card-header border-bottom border-translucent py-3">
            <div className="row align-items-center g-2 mb-3">
              <div className="col">
                <h4 className="mb-0">
                  Recent changes
                </h4>
                <p className="text-body-tertiary fs-9 mb-0">
                  What appeared, vanished or changed in this account between inventory snapshots
                </p>
              </div>
            </div>
            <div className="row align-items-center g-2">
              <div className="col-12 col-md">
                <div className="search-box w-100">
                  <form className="position-relative">
                    <input className="form-control search-input search form-control-sm" type="search" placeholder="Search changes" aria-label="Search" />
                    <span className="fas fa-search search-box-icon"></span>
                  </form>
                </div>
              </div>
              <div className="col-6 col-md-auto">
                <select className="form-select form-select-sm" data-list-filter="data-list-filter" aria-label="Filter">
                  <option value="">
                    Filter: All
                  </option>
                  <option value="Added">
                    Added
                  </option>
                </select>
              </div>
              <div className="col-6 col-md-auto">
                <select className="form-select form-select-sm" aria-label="Sort by" data-obs-sort="data-obs-sort">
                  <option value="">
                    Sort by
                  </option>
                  <option value="col0">
                    Resource
                  </option>
                  <option value="col1">
                    Kind
                  </option>
                  <option value="col2">
                    Seen
                  </option>
                  <option value="col3">
                    Change
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
                      Resource
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col1">
                      Kind
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col2">
                      Seen
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col3">
                      Change
                    </th>
                  </tr>
                </thead>
                <tbody className="list" data-sample-rows="data-sample-rows">
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-plus text-success"></span>
                        <div>
                          <h6 className="mb-0">
                            assets-staging
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            assets-staging
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      S3 bucket
                    </td>
                    <td className="align-middle col2">
                      2026-09-10T08:00:00Z
                    </td>
                    <td className="align-middle col3">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Added
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
