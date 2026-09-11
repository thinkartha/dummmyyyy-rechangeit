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
          "code": "\n              (function() {\n                document.querySelectorAll('[data-obs-sort]').forEach(function(select) {\n                  if (select.dataset.bound === '1') return;\n                  select.dataset.bound = '1';\n                  select.addEventListener('change', function() {\n                    var key = select.value;\n                    if (!key) return;\n                    var root = select.closest('[data-list]');\n                    if (!root) return;\n                    var header = root.querySelector('th[data-sort=\"' + key + '\"]');\n                    if (header) header.click();\n                  });\n                });\n              })();\n            "
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
              Every AWS account your connected credential reaches, with what it owns, what is alarming, and what it has cost this month
            </h5>
          </div>
          <div className="col-auto d-flex gap-2">
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
              <div className="d-flex justify-content-between align-items-start gap-2">
                <div style={{ minWidth: "0" }}>
                  <h6 className="text-body-tertiary mb-2 text-truncate" title="Linked accounts">
                    Linked accounts
                  </h6>
                  <h3 className="mb-0 text-truncate" data-obs-stat="data-obs-stat" data-obs-stat-key="linkedAccounts" title="18">
                    18
                  </h3>
                </div>
                <span className="badge badge-phoenix text-truncate badge-phoenix-info" style={{ maxWidth: "55%", textTransform: "none" }} title="3 clouds" data-obs-stat-delta="data-obs-stat-delta" data-obs-stat-delta-key="linkedAccounts">
                  3 clouds
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start gap-2">
                <div style={{ minWidth: "0" }}>
                  <h6 className="text-body-tertiary mb-2 text-truncate" title="Resources watched">
                    Resources watched
                  </h6>
                  <h3 className="mb-0 text-truncate" data-obs-stat="data-obs-stat" data-obs-stat-key="resources" title="12.4k">
                    12.4k
                  </h3>
                </div>
                <span className="badge badge-phoenix text-truncate badge-phoenix-success" style={{ maxWidth: "55%", textTransform: "none" }} title="+320" data-obs-stat-delta="data-obs-stat-delta" data-obs-stat-delta-key="resources">
                  +320
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start gap-2">
                <div style={{ minWidth: "0" }}>
                  <h6 className="text-body-tertiary mb-2 text-truncate" title="Open cloud alarms">
                    Open cloud alarms
                  </h6>
                  <h3 className="mb-0 text-truncate" data-obs-stat="data-obs-stat" data-obs-stat-key="openAlarms" title="7">
                    7
                  </h3>
                </div>
                <span className="badge badge-phoenix text-truncate badge-phoenix-danger" style={{ maxWidth: "55%", textTransform: "none" }} title="2 critical" data-obs-stat-delta="data-obs-stat-delta" data-obs-stat-delta-key="openAlarms">
                  2 critical
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start gap-2">
                <div style={{ minWidth: "0" }}>
                  <h6 className="text-body-tertiary mb-2 text-truncate" title="Spend month to date">
                    Spend month to date
                  </h6>
                  <h3 className="mb-0 text-truncate" data-obs-stat="data-obs-stat" data-obs-stat-key="mtdSpend" title="USD 42,180.00">
                    USD 42,180.00
                  </h3>
                </div>
                <span className="badge badge-phoenix text-truncate badge-phoenix-primary" style={{ maxWidth: "55%", textTransform: "none" }} title="since 2026-09-01" data-obs-stat-delta="data-obs-stat-delta" data-obs-stat-delta-key="mtdSpend">
                  since 2026-09-01
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
                Accounts are connected under Integrations → Cloud accounts; every one of them is monitored here.
              </p>
            </div>
            <div className="col-auto">
              <a className="btn btn-sm btn-primary" href="/apps/platform/integrations/cloud/">
                Connect an account
              </a>
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
      <div className="obs-list-root" data-list={"{\"valueNames\":[\"col0\",\"col1\",\"col2\",\"col3\",\"col4\",\"col5\",\"col6\"],\"page\":8,\"filter\":{\"key\":\"col6\"}}"} data-live-table="cloudAccounts">
        <div className="card">
          <div className="card-header border-bottom border-translucent py-3">
            <div className="row align-items-center g-2 mb-3">
              <div className="col">
                <h4 className="mb-0">
                  Linked accounts
                </h4>
                <p className="text-body-tertiary fs-9 mb-0">
                  From organizations:ListAccounts on the connected credential — nothing is registered here
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
                  <option value="Alarm">
                    Alarm
                  </option>
                  <option value="Unreachable">
                    Unreachable
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
                    Open alarms
                  </option>
                  <option value="col5">
                    Cost (MTD)
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
                      Open alarms
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col5">
                      Cost (MTD)
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
                        <span className="me-2 fa-brands fa-aws text-success"></span>
                        <div>
                          <h6 className="mb-0">
                            prod-root
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
                      Connected account
                    </td>
                    <td className="align-middle col3">
                      482
                    </td>
                    <td className="align-middle col4">
                      0
                    </td>
                    <td className="align-middle col5">
                      USD 18,220.14
                    </td>
                    <td className="align-middle col6">
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
                      214
                    </td>
                    <td className="align-middle col4">
                      2
                    </td>
                    <td className="align-middle col5">
                      USD 15,904.77
                    </td>
                    <td className="align-middle col6">
                      <span className="badge badge-phoenix badge-phoenix-warning">
                        Alarm
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-brands fa-aws text-success"></span>
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
                      68
                    </td>
                    <td className="align-middle col4">
                      0
                    </td>
                    <td className="align-middle col5">
                      USD 1,142.03
                    </td>
                    <td className="align-middle col6">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Healthy
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-brands fa-aws text-danger"></span>
                        <div>
                          <h6 className="mb-0">
                            data-platform
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            ClientError: not authorized to perform sts:AssumeRole
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
                      —
                    </td>
                    <td className="align-middle col4">
                      —
                    </td>
                    <td className="align-middle col5">
                      USD 6,913.44
                    </td>
                    <td className="align-middle col6">
                      <span className="badge badge-phoenix badge-phoenix-danger">
                        Unreachable
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
      <div className="obs-list-root" data-list={"{\"valueNames\":[\"col0\",\"col1\",\"col2\",\"col3\",\"col4\",\"col5\",\"col6\"],\"page\":8,\"filter\":{\"key\":\"col6\"}}"} data-live-table="cloudServices">
        <div className="card">
          <div className="card-header border-bottom border-translucent py-3">
            <div className="row align-items-center g-2 mb-3">
              <div className="col">
                <h4 className="mb-0">
                  Streamed services
                </h4>
                <p className="text-body-tertiary fs-9 mb-0">
                  Every AWS service your CloudWatch metric stream is delivering — no per-service integration behind any of these
                </p>
              </div>
              <div className="col-auto">
                <button className="btn btn-primary btn-sm" type="button" data-lhb-action="cloudSetup">
                  Set up metric streaming
                </button>
              </div>
            </div>
            <div className="row align-items-center g-2">
              <div className="col-12 col-md">
                <div className="search-box w-100">
                  <form className="position-relative">
                    <input className="form-control search-input search form-control-sm" type="search" placeholder="Search services" aria-label="Search" />
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
                  <option value="Lagging">
                    Lagging
                  </option>
                </select>
              </div>
              <div className="col-6 col-md-auto">
                <select className="form-select form-select-sm" aria-label="Sort by" data-obs-sort="data-obs-sort">
                  <option value="">
                    Sort by
                  </option>
                  <option value="col0">
                    Service
                  </option>
                  <option value="col1">
                    Account
                  </option>
                  <option value="col2">
                    Regions
                  </option>
                  <option value="col3">
                    Resources
                  </option>
                  <option value="col4">
                    Metrics
                  </option>
                  <option value="col5">
                    Last seen
                  </option>
                  <option value="col6">
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
                      Service
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col1">
                      Account
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col2">
                      Regions
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col3">
                      Resources
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col4">
                      Metrics
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col5">
                      Last seen
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col6">
                      Freshness
                    </th>
                  </tr>
                </thead>
                <tbody className="list" data-sample-rows="data-sample-rows">
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-brands fa-aws text-warning"></span>
                        <div>
                          <h6 className="mb-0">
                            EC2
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            AWS/EC2
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      111122223333
                    </td>
                    <td className="align-middle col2">
                      us-east-1
                    </td>
                    <td className="align-middle col3">
                      42
                    </td>
                    <td className="align-middle col4">
                      18
                    </td>
                    <td className="align-middle col5">
                      2026-09-10T10:04:00Z
                    </td>
                    <td className="align-middle col6">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Live
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-brands fa-aws text-warning"></span>
                        <div>
                          <h6 className="mb-0">
                            RDS
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            AWS/RDS
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      111122223333
                    </td>
                    <td className="align-middle col2">
                      us-east-1, eu-west-1
                    </td>
                    <td className="align-middle col3">
                      6
                    </td>
                    <td className="align-middle col4">
                      24
                    </td>
                    <td className="align-middle col5">
                      2026-09-10T10:04:00Z
                    </td>
                    <td className="align-middle col6">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Live
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-brands fa-aws text-warning"></span>
                        <div>
                          <h6 className="mb-0">
                            SQS
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            AWS/SQS
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      444455556666
                    </td>
                    <td className="align-middle col2">
                      us-east-1
                    </td>
                    <td className="align-middle col3">
                      11
                    </td>
                    <td className="align-middle col4">
                      9
                    </td>
                    <td className="align-middle col5">
                      2026-09-10T09:12:00Z
                    </td>
                    <td className="align-middle col6">
                      <span className="badge badge-phoenix badge-phoenix-warning">
                        Lagging
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
      <div className="row g-4 mb-4">
        <div className="col-12">
          <div className="obs-list-root" data-list={"{\"valueNames\":[\"col0\",\"col1\",\"col2\",\"col3\",\"col4\",\"col5\"],\"page\":5,\"filter\":{\"key\":\"col5\"}}"} data-live-table="metricConditions">
            <div className="card">
              <div className="card-header border-bottom border-translucent py-3">
                <div className="row align-items-center g-2 mb-3">
                  <div className="col">
                    <h4 className="mb-0">
                      Metric alert conditions
                    </h4>
                    <p className="text-body-tertiary fs-9 mb-0">
                      Evaluated as each delivery lands, so a breach is about a minute old — not a poll interval old
                    </p>
                  </div>
                  <div className="col-auto">
                    <button className="btn btn-primary btn-sm" type="button" data-lhb-action="addMetricCondition">
                      Add condition
                    </button>
                  </div>
                </div>
                <div className="row align-items-center g-2">
                  <div className="col-12 col-md">
                    <div className="search-box w-100">
                      <form className="position-relative">
                        <input className="form-control search-input search form-control-sm" type="search" placeholder="Search conditions" aria-label="Search" />
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
                      <option value="OK">
                        OK
                      </option>
                    </select>
                  </div>
                  <div className="col-6 col-md-auto">
                    <select className="form-select form-select-sm" aria-label="Sort by" data-obs-sort="data-obs-sort">
                      <option value="">
                        Sort by
                      </option>
                      <option value="col0">
                        Condition
                      </option>
                      <option value="col1">
                        Metric
                      </option>
                      <option value="col2">
                        For
                      </option>
                      <option value="col3">
                        Watching
                      </option>
                      <option value="col4">
                        Firing
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
                          Condition
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col1">
                          Metric
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col2">
                          For
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col3">
                          Watching
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col4">
                          Firing
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col5">
                          Status
                        </th>
                        <th className="align-middle text-end pe-3" scope="col"></th>
                      </tr>
                    </thead>
                    <tbody className="list" data-sample-rows="data-sample-rows">
                      <tr>
                        <td className="align-middle ps-3 py-3 col0">
                          <div className="d-flex align-items-center">
                            <span className="me-2 fa-solid fa-bell text-danger"></span>
                            <div>
                              <h6 className="mb-0">
                                EC2 CPU above 80%
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                AWS/EC2 · avg &gt; 80
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          CPUUtilization
                        </td>
                        <td className="align-middle col2">
                          2m
                        </td>
                        <td className="align-middle col3">
                          42
                        </td>
                        <td className="align-middle col4">
                          3
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-danger">
                            Firing
                          </span>
                        </td>
                        <td className="align-middle pe-3"></td>
                      </tr>
                      <tr>
                        <td className="align-middle ps-3 py-3 col0">
                          <div className="d-flex align-items-center">
                            <span className="me-2 fa-solid fa-bell-slash text-success"></span>
                            <div>
                              <h6 className="mb-0">
                                Order queue backing up
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                AWS/SQS · max &gt; 1000
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          ApproximateNumberOfMessagesVisible
                        </td>
                        <td className="align-middle col2">
                          3m
                        </td>
                        <td className="align-middle col3">
                          11
                        </td>
                        <td className="align-middle col4">
                          0
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-success">
                            OK
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
        </div>
      </div>
      <div className="obs-list-root" data-list={"{\"valueNames\":[\"col0\",\"col1\",\"col2\",\"col3\",\"col4\"],\"page\":5,\"filter\":{\"key\":\"col4\"}}"} data-live-table="cloudChanges">
        <div className="card">
          <div className="card-header border-bottom border-translucent py-3">
            <div className="row align-items-center g-2 mb-3">
              <div className="col">
                <h4 className="mb-0">
                  Resource changes
                </h4>
                <p className="text-body-tertiary fs-9 mb-0">
                  What appeared, vanished or changed between inventory snapshots
                </p>
              </div>
              <div className="col-auto">
                <button className="btn btn-primary btn-sm" type="button" data-lhb-action="scanCloudChanges">
                  Scan for changes
                </button>
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
                  <option value="Removed">
                    Removed
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
                    Account
                  </option>
                  <option value="col3">
                    Seen
                  </option>
                  <option value="col4">
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
                      Account
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col3">
                      Seen
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col4">
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
                            111122223333
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      S3 bucket
                    </td>
                    <td className="align-middle col2">
                      prod-root
                    </td>
                    <td className="align-middle col3">
                      2026-09-10T08:00:00Z
                    </td>
                    <td className="align-middle col4">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Added
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-trash text-danger"></span>
                        <div>
                          <h6 className="mb-0">
                            legacy-exports
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            444455556666
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      S3 bucket
                    </td>
                    <td className="align-middle col2">
                      prod-workloads
                    </td>
                    <td className="align-middle col3">
                      2026-09-09T18:20:00Z
                    </td>
                    <td className="align-middle col4">
                      <span className="badge badge-phoenix badge-phoenix-danger">
                        Removed
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
