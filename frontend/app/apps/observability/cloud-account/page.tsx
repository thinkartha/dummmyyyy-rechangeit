import AppLayout from '@/components/app-layout'

export default function Page() {
  return (
    <AppLayout scripts={[
        {
          "code": "\n              (function() {\n                document.querySelectorAll('[data-obs-sort]').forEach(function(select) {\n                  if (select.dataset.bound === '1') return;\n                  select.dataset.bound = '1';\n                  select.addEventListener('change', function() {\n                    var key = select.value;\n                    if (!key) return;\n                    var root = select.closest('[data-list]');\n                    if (!root) return;\n                    var header = root.querySelector('th[data-sort=\"' + key + '\"]');\n                    if (header) header.click();\n                  });\n                });\n              })();\n            "
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
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-3" data-account-heading="data-account-heading">
        <div>
          <h2 className="mb-1" data-account-name="data-account-name">
            —
          </h2>
          <p className="text-body-tertiary fs-9 mb-0" data-account-meta="data-account-meta">
            Loading account…
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <a className="btn btn-phoenix-secondary btn-sm" href="/apps/observability/cloud-monitoring/">
            <span className="fa-solid fa-arrow-left me-2"></span>
            All accounts
          </a>
          <button className="btn btn-phoenix-secondary btn-sm" type="button" data-lhb-action="refreshData">
            <span className="fa-solid fa-arrows-rotate me-2"></span>
            Update
          </button>
        </div>
      </div>
      <ul className="nav nav-underline mb-4" role="tablist">
        <li className="nav-item" role="presentation">
          <button className="nav-link d-flex align-items-center gap-2 active" id="account-dashboard-tab" data-bs-toggle="tab" data-bs-target="#account-dashboard" type="button" role="tab" aria-controls="account-dashboard" aria-selected={true}>
            <span className="fa-solid fa-chart-simple fs-10"></span>
            Dashboard
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button className="nav-link d-flex align-items-center gap-2" id="account-inventory-tab" data-bs-toggle="tab" data-bs-target="#account-inventory" type="button" role="tab" aria-controls="account-inventory" aria-selected={false}>
            <span className="fa-solid fa-list fs-10"></span>
            Resource list
          </button>
        </li>
      </ul>
      <div className="tab-content">
        <div className="tab-pane fade show active" id="account-dashboard" role="tabpanel" aria-labelledby="account-dashboard-tab">
          <div className="card mb-4">
            <div className="card-body py-3">
              <div className="row g-2 align-items-end">
                <div className="col-12 col-lg">
                  <label className="form-label fs-10 text-uppercase text-body-tertiary mb-1" htmlFor="account-search">
                    Search
                  </label>
                  <div className="position-relative">
                    <span className="fa-solid fa-magnifying-glass position-absolute text-body-tertiary fs-10" style={{ left: ".75rem", top: "50%", transform: "translateY(-50%)" }}></span>
                    <input className="form-control form-control-sm" id="account-search" type="search" data-lhb-refresh="data-lhb-refresh" placeholder="Search resources by name, service or dimension" style={{ paddingLeft: "2rem" }} />
                  </div>
                </div>
                <div className="col-6 col-lg-auto">
                  <label className="form-label fs-10 text-uppercase text-body-tertiary mb-1" htmlFor="account-range">
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
                <div className="col-6 col-lg-auto">
                  <label className="form-label fs-10 text-uppercase text-body-tertiary mb-1" htmlFor="account-metric">
                    Metric
                  </label>
                  <select className="form-select form-select-sm" id="account-metric" data-lhb-chart-control="data-lhb-chart-control" aria-label="Metric to chart"></select>
                </div>
                <div className="col-6 col-lg-auto">
                  <label className="form-label fs-10 text-uppercase text-body-tertiary mb-1" htmlFor="account-group-by">
                    Group spend by
                  </label>
                  <select className="form-select form-select-sm" id="account-group-by" data-lhb-chart-control="data-lhb-chart-control" aria-label="Spend grouping">
                    <option value="SERVICE">
                      Service
                    </option>
                    <option value="REGION">
                      Region
                    </option>
                    <option value="USAGE_TYPE">
                      Usage type
                    </option>
                    <option value="team">
                      Tag: team
                    </option>
                    <option value="environment">
                      Tag: environment
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="obs-kpi-row d-flex gap-3 mb-4 pb-1" style={{ overflowX: "auto", scrollbarWidth: "thin" }}>
            <div className="card flex-shrink-0" style={{ minWidth: "11.5rem", flex: "1 1 0" }}>
              <div className="card-body py-3 px-3">
                <div className="d-flex align-items-center gap-1 mb-2">
                  <h6 className="text-body-tertiary text-uppercase fs-10 fw-semibold mb-0 lh-1" style={{ letterSpacing: ".04em" }}>
                    Open alarms
                  </h6>
                  <span className="text-body-quaternary fs-10" data-bs-toggle="tooltip" data-bs-placement="top" title="CloudWatch alarms in ALARM right now, across every region this connector reads.">
                    <span className="fa-solid fa-circle-info"></span>
                  </span>
                </div>
                <div className="d-flex align-items-baseline gap-2 flex-wrap">
                  <h2 className="mb-0 fw-semibold lh-1" data-obs-stat="data-obs-stat" data-obs-stat-key="accountAlarms">
                    0
                  </h2>
                  <span className="badge badge-phoenix fs-10 badge-phoenix-danger" data-obs-stat-delta="data-obs-stat-delta" data-obs-stat-delta-key="accountAlarms">
                    awaiting data
                  </span>
                </div>
              </div>
            </div>
            <div className="card flex-shrink-0" style={{ minWidth: "11.5rem", flex: "1 1 0" }}>
              <div className="card-body py-3 px-3">
                <div className="d-flex align-items-center gap-1 mb-2">
                  <h6 className="text-body-tertiary text-uppercase fs-10 fw-semibold mb-0 lh-1" style={{ letterSpacing: ".04em" }}>
                    Resources
                  </h6>
                  <span className="text-body-quaternary fs-10" data-bs-toggle="tooltip" data-bs-placement="top" title="Route 53 zones, domains, CloudFront distributions, S3 buckets and IAM users found in this account.">
                    <span className="fa-solid fa-circle-info"></span>
                  </span>
                </div>
                <div className="d-flex align-items-baseline gap-2 flex-wrap">
                  <h2 className="mb-0 fw-semibold lh-1" data-obs-stat="data-obs-stat" data-obs-stat-key="accountResources">
                    0
                  </h2>
                  <span className="badge badge-phoenix fs-10 badge-phoenix-info" data-obs-stat-delta="data-obs-stat-delta" data-obs-stat-delta-key="accountResources">
                    awaiting data
                  </span>
                </div>
              </div>
            </div>
            <div className="card flex-shrink-0" style={{ minWidth: "11.5rem", flex: "1 1 0" }}>
              <div className="card-body py-3 px-3">
                <div className="d-flex align-items-center gap-1 mb-2">
                  <h6 className="text-body-tertiary text-uppercase fs-10 fw-semibold mb-0 lh-1" style={{ letterSpacing: ".04em" }}>
                    Streamed
                  </h6>
                  <span className="text-body-quaternary fs-10" data-bs-toggle="tooltip" data-bs-placement="top" title="Distinct resources the CloudWatch metric stream has described in the selected range.">
                    <span className="fa-solid fa-circle-info"></span>
                  </span>
                </div>
                <div className="d-flex align-items-baseline gap-2 flex-wrap">
                  <h2 className="mb-0 fw-semibold lh-1" data-obs-stat="data-obs-stat" data-obs-stat-key="accountStreamed">
                    0
                  </h2>
                  <span className="badge badge-phoenix fs-10 badge-phoenix-success" data-obs-stat-delta="data-obs-stat-delta" data-obs-stat-delta-key="accountStreamed">
                    awaiting data
                  </span>
                </div>
              </div>
            </div>
            <div className="card flex-shrink-0" style={{ minWidth: "11.5rem", flex: "1 1 0" }}>
              <div className="card-body py-3 px-3">
                <div className="d-flex align-items-center gap-1 mb-2">
                  <h6 className="text-body-tertiary text-uppercase fs-10 fw-semibold mb-0 lh-1" style={{ letterSpacing: ".04em" }}>
                    Services
                  </h6>
                  <span className="text-body-quaternary fs-10" data-bs-toggle="tooltip" data-bs-placement="top" title="AWS services reporting through the metric stream. No per-service integration sits behind these.">
                    <span className="fa-solid fa-circle-info"></span>
                  </span>
                </div>
                <div className="d-flex align-items-baseline gap-2 flex-wrap">
                  <h2 className="mb-0 fw-semibold lh-1" data-obs-stat="data-obs-stat" data-obs-stat-key="accountServices">
                    0
                  </h2>
                  <span className="badge badge-phoenix fs-10 badge-phoenix-primary" data-obs-stat-delta="data-obs-stat-delta" data-obs-stat-delta-key="accountServices">
                    awaiting data
                  </span>
                </div>
              </div>
            </div>
            <div className="card flex-shrink-0" style={{ minWidth: "11.5rem", flex: "1 1 0" }}>
              <div className="card-body py-3 px-3">
                <div className="d-flex align-items-center gap-1 mb-2">
                  <h6 className="text-body-tertiary text-uppercase fs-10 fw-semibold mb-0 lh-1" style={{ letterSpacing: ".04em" }}>
                    Regions
                  </h6>
                  <span className="text-body-quaternary fs-10" data-bs-toggle="tooltip" data-bs-placement="top" title="Regions this connector is configured to read. Alarms outside them are not visible here.">
                    <span className="fa-solid fa-circle-info"></span>
                  </span>
                </div>
                <div className="d-flex align-items-baseline gap-2 flex-wrap">
                  <h2 className="mb-0 fw-semibold lh-1" data-obs-stat="data-obs-stat" data-obs-stat-key="accountRegions">
                    0
                  </h2>
                  <span className="badge badge-phoenix fs-10 badge-phoenix-secondary" data-obs-stat-delta="data-obs-stat-delta" data-obs-stat-delta-key="accountRegions">
                    awaiting data
                  </span>
                </div>
              </div>
            </div>
            <div className="card flex-shrink-0" style={{ minWidth: "11.5rem", flex: "1 1 0" }}>
              <div className="card-body py-3 px-3">
                <div className="d-flex align-items-center gap-1 mb-2">
                  <h6 className="text-body-tertiary text-uppercase fs-10 fw-semibold mb-0 lh-1" style={{ letterSpacing: ".04em" }}>
                    Spend MTD
                  </h6>
                  <span className="text-body-quaternary fs-10" data-bs-toggle="tooltip" data-bs-placement="top" title="Month-to-date unblended cost for this linked account, from Cost Explorer. Lags about a day.">
                    <span className="fa-solid fa-circle-info"></span>
                  </span>
                </div>
                <div className="d-flex align-items-baseline gap-2 flex-wrap">
                  <h2 className="mb-0 fw-semibold lh-1" data-obs-stat="data-obs-stat" data-obs-stat-key="accountSpend">
                    0
                  </h2>
                  <span className="badge badge-phoenix fs-10 badge-phoenix-warning" data-obs-stat-delta="data-obs-stat-delta" data-obs-stat-delta-key="accountSpend">
                    awaiting data
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="row g-4 mb-4">
            <div className="col-12 col-xl-7">
              <div className="card h-100">
                <div className="card-header border-bottom border-translucent py-3">
                  <div className="d-flex align-items-center justify-content-between gap-2">
                    <div className="d-flex align-items-center gap-1">
                      <h6 className="text-body-tertiary text-uppercase fs-10 fw-semibold mb-0 lh-1" style={{ letterSpacing: ".04em" }}>
                        Metric over time
                      </h6>
                      <span className="text-body-quaternary fs-10" data-bs-toggle="tooltip" data-bs-placement="top" title="One line per resource, the five highest by peak. Anything beyond folds into “Other” rather than being dropped.">
                        <span className="fa-solid fa-circle-info"></span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  <div data-lhb-chart="accountMetric" style={{ height: "300px", width: "100%" }}></div>
                </div>
              </div>
            </div>
            <div className="col-12 col-xl-5">
              <div className="card h-100">
                <div className="card-header border-bottom border-translucent py-3">
                  <div className="d-flex align-items-center justify-content-between gap-2">
                    <div className="d-flex align-items-center gap-1">
                      <h6 className="text-body-tertiary text-uppercase fs-10 fw-semibold mb-0 lh-1" style={{ letterSpacing: ".04em" }}>
                        Daily spend
                      </h6>
                      <span className="text-body-quaternary fs-10" data-bs-toggle="tooltip" data-bs-placement="top" title="Last 30 days. A month-to-date total only ever rises, so it cannot show whether spend is accelerating.">
                        <span className="fa-solid fa-circle-info"></span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  <div data-lhb-chart="accountCost" style={{ height: "300px", width: "100%" }}></div>
                </div>
              </div>
            </div>
          </div>
          <div className="card h-100">
            <div className="card-header border-bottom border-translucent py-3">
              <div className="d-flex align-items-center justify-content-between gap-2">
                <div className="d-flex align-items-center gap-1">
                  <h6 className="text-body-tertiary text-uppercase fs-10 fw-semibold mb-0 lh-1" style={{ letterSpacing: ".04em" }}>
                    Spend breakdown
                  </h6>
                  <span className="text-body-quaternary fs-10" data-bs-toggle="tooltip" data-bs-placement="top" title="Tile area is the amount. Ordered and shaded by value, so the darkest tile is also the largest. Untagged spend is shown rather than dropped.">
                    <span className="fa-solid fa-circle-info"></span>
                  </span>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div data-lhb-chart="accountSpendTreemap" style={{ height: "380px", width: "100%" }}></div>
            </div>
          </div>
        </div>
        <div className="tab-pane fade" id="account-inventory" role="tabpanel" aria-labelledby="account-inventory-tab">
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
                      Every resource this account’s metric stream has described in the selected range
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
        </div>
      </div>
    </AppLayout>
  )
}
