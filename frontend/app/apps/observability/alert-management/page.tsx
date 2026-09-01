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
            Alert Management
          </li>
        </ol>
      </nav>
      <div className="mb-6">
        <div className="row align-items-center g-3">
          <div className="col">
            <h2 className="mb-2">
              Alert Management
            </h2>
            <h5 className="text-body-tertiary fw-semibold mb-0">
              Where alerts go, who owes a response, and when to stay quiet — routing rules, SLA policies, and maintenance windows
            </h5>
          </div>
          <div className="col-auto">
            <button className="btn btn-primary" type="button" data-lhb-action="routingRule">
              New routing rule
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
                  <h3 className="mb-0" data-obs-stat="data-obs-stat">
                    37
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-success" data-obs-stat-delta="data-obs-stat-delta">
                  -8
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
                    Breaching SLA
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat">
                    4
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-danger" data-obs-stat-delta="data-obs-stat-delta">
                  ack overdue
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
                    Routing rules
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat">
                    22
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-info" data-obs-stat-delta="data-obs-stat-delta">
                  19 enabled
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
                    Windows active
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat">
                    2
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-warning" data-obs-stat-delta="data-obs-stat-delta">
                  suppressing
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ul className="nav nav-underline mb-4" role="tablist">
        <li className="nav-item" role="presentation">
          <button className="nav-link active" data-bs-toggle="tab" data-bs-target="#tab-routing" type="button" role="tab" aria-controls="tab-routing" aria-selected={true}>
            Routing rules
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button className="nav-link" data-bs-toggle="tab" data-bs-target="#tab-sla" type="button" role="tab" aria-controls="tab-sla" aria-selected={false}>
            SLA policies
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button className="nav-link" data-bs-toggle="tab" data-bs-target="#tab-maintenance" type="button" role="tab" aria-controls="tab-maintenance" aria-selected={false}>
            Maintenance windows
          </button>
        </li>
      </ul>
      <div className="tab-content">
        <div className="tab-pane fade show active" id="tab-routing" role="tabpanel">
          <div className="obs-list-root" data-list={"{\"valueNames\":[\"col0\",\"col1\",\"col2\",\"col3\",\"col4\",\"col5\"],\"page\":6,\"filter\":{\"key\":\"col5\"}}"} data-live-table="alertManagement">
            <div className="card">
              <div className="card-header border-bottom border-translucent py-3">
                <div className="row align-items-center g-2 mb-3">
                  <div className="col">
                    <h4 className="mb-0">
                      Routing rules
                    </h4>
                    <p className="text-body-tertiary fs-9 mb-0">
                      First matching rule wins. Test a rule against a recent alert before enabling it.
                    </p>
                  </div>
                </div>
                <div className="row align-items-center g-2">
                  <div className="col-12 col-md">
                    <div className="search-box w-100">
                      <form className="position-relative">
                        <input className="form-control search-input search form-control-sm" type="search" placeholder="Search rules, services, or destinations" aria-label="Search" />
                        <span className="fas fa-search search-box-icon"></span>
                      </form>
                    </div>
                  </div>
                  <div className="col-6 col-md-auto">
                    <select className="form-select form-select-sm" data-list-filter="data-list-filter" aria-label="Filter">
                      <option value="">
                        Filter: All
                      </option>
                      <option value="Enabled">
                        Enabled
                      </option>
                      <option value="Disabled">
                        Disabled
                      </option>
                    </select>
                  </div>
                  <div className="col-6 col-md-auto">
                    <select className="form-select form-select-sm" aria-label="Sort by" data-obs-sort="data-obs-sort">
                      <option value="">
                        Sort by
                      </option>
                      <option value="col0">
                        Rule
                      </option>
                      <option value="col1">
                        Scope
                      </option>
                      <option value="col2">
                        Channels
                      </option>
                      <option value="col3">
                        Severity
                      </option>
                      <option value="col4">
                        Escalates in
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
                          Rule
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col1">
                          Scope
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col2">
                          Channels
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col3">
                          Severity
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col4">
                          Escalates in
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
                            <span className="me-2 fa-solid fa-route text-danger"></span>
                            <div>
                              <h6 className="mb-0">
                                Payments critical
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                priority 1
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          service=payments-api
                        </td>
                        <td className="align-middle col2">
                          PagerDuty · payments-oncall
                        </td>
                        <td className="align-middle col3">
                          critical
                        </td>
                        <td className="align-middle col4">
                          14
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-success">
                            Enabled
                          </span>
                        </td>
                        <td className="align-middle pe-3"></td>
                      </tr>
                      <tr>
                        <td className="align-middle ps-3 py-3 col0">
                          <div className="d-flex align-items-center">
                            <span className="me-2 fa-solid fa-route text-warning"></span>
                            <div>
                              <h6 className="mb-0">
                                ETL failures
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                priority 2
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          source in (talend, boomi)
                        </td>
                        <td className="align-middle col2">
                          Slack · #data-eng
                        </td>
                        <td className="align-middle col3">
                          critical
                        </td>
                        <td className="align-middle col4">
                          31
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-success">
                            Enabled
                          </span>
                        </td>
                        <td className="align-middle pe-3"></td>
                      </tr>
                      <tr>
                        <td className="align-middle ps-3 py-3 col0">
                          <div className="d-flex align-items-center">
                            <span className="me-2 fa-solid fa-route text-info"></span>
                            <div>
                              <h6 className="mb-0">
                                Database degraded
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                priority 3
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          source=database
                        </td>
                        <td className="align-middle col2">
                          Slack · #dba
                        </td>
                        <td className="align-middle col3">
                          warning
                        </td>
                        <td className="align-middle col4">
                          9
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-success">
                            Enabled
                          </span>
                        </td>
                        <td className="align-middle pe-3"></td>
                      </tr>
                      <tr>
                        <td className="align-middle ps-3 py-3 col0">
                          <div className="d-flex align-items-center">
                            <span className="me-2 fa-solid fa-route text-primary"></span>
                            <div>
                              <h6 className="mb-0">
                                AI cost spike
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                priority 4
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          type=ai.cost.anomaly
                        </td>
                        <td className="align-middle col2">
                          Email · finops@
                        </td>
                        <td className="align-middle col3">
                          warning
                        </td>
                        <td className="align-middle col4">
                          5
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-success">
                            Enabled
                          </span>
                        </td>
                        <td className="align-middle pe-3"></td>
                      </tr>
                      <tr>
                        <td className="align-middle ps-3 py-3 col0">
                          <div className="d-flex align-items-center">
                            <span className="me-2 fa-solid fa-route text-secondary"></span>
                            <div>
                              <h6 className="mb-0">
                                Stage noise
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                priority 5
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          env=stage
                        </td>
                        <td className="align-middle col2">
                          Slack · #stage-alerts
                        </td>
                        <td className="align-middle col3">
                          info
                        </td>
                        <td className="align-middle col4">
                          212
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-success">
                            Enabled
                          </span>
                        </td>
                        <td className="align-middle pe-3"></td>
                      </tr>
                      <tr>
                        <td className="align-middle ps-3 py-3 col0">
                          <div className="d-flex align-items-center">
                            <span className="me-2 fa-solid fa-route text-secondary"></span>
                            <div>
                              <h6 className="mb-0">
                                Partner API escalation
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                draft
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          service=partner-api
                        </td>
                        <td className="align-middle col2">
                          ServiceNow · L2
                        </td>
                        <td className="align-middle col3">
                          critical
                        </td>
                        <td className="align-middle col4">
                          0
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-secondary">
                            Disabled
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
        <div className="tab-pane fade" id="tab-sla" role="tabpanel">
          <div className="obs-list-root" data-list={"{\"valueNames\":[\"col0\",\"col1\",\"col2\",\"col3\",\"col4\",\"col5\"],\"page\":6,\"filter\":{\"key\":\"col5\"}}"} data-live-table="sla">
            <div className="card">
              <div className="card-header border-bottom border-translucent py-3">
                <div className="row align-items-center g-2 mb-3">
                  <div className="col">
                    <h4 className="mb-0">
                      SLA policies
                    </h4>
                    <p className="text-body-tertiary fs-9 mb-0">
                      Acknowledgement and resolution targets by severity. Breaches escalate to the next tier automatically.
                    </p>
                  </div>
                </div>
                <div className="row align-items-center g-2">
                  <div className="col-12 col-md">
                    <div className="search-box w-100">
                      <form className="position-relative">
                        <input className="form-control search-input search form-control-sm" type="search" placeholder="Search SLA policies" aria-label="Search" />
                        <span className="fas fa-search search-box-icon"></span>
                      </form>
                    </div>
                  </div>
                  <div className="col-6 col-md-auto">
                    <select className="form-select form-select-sm" data-list-filter="data-list-filter" aria-label="Filter">
                      <option value="">
                        Filter: All
                      </option>
                      <option value="At risk">
                        At risk
                      </option>
                      <option value="Meeting">
                        Meeting
                      </option>
                    </select>
                  </div>
                  <div className="col-6 col-md-auto">
                    <select className="form-select form-select-sm" aria-label="Sort by" data-obs-sort="data-obs-sort">
                      <option value="">
                        Sort by
                      </option>
                      <option value="col0">
                        Policy
                      </option>
                      <option value="col1">
                        Severity
                      </option>
                      <option value="col2">
                        Ack within
                      </option>
                      <option value="col3">
                        Resolve within
                      </option>
                      <option value="col4">
                        Compliance (30d)
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
                          Policy
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col1">
                          Severity
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col2">
                          Ack within
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col3">
                          Resolve within
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col4">
                          Compliance (30d)
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
                            <span className="me-2 fa-solid fa-stopwatch text-danger"></span>
                            <div>
                              <h6 className="mb-0">
                                Critical response
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                escalates to L2
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          critical
                        </td>
                        <td className="align-middle col2">
                          5m
                        </td>
                        <td className="align-middle col3">
                          1h
                        </td>
                        <td className="align-middle col4">
                          92%
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-warning">
                            At risk
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="align-middle ps-3 py-3 col0">
                          <div className="d-flex align-items-center">
                            <span className="me-2 fa-solid fa-stopwatch text-warning"></span>
                            <div>
                              <h6 className="mb-0">
                                High response
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                escalates to L2
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          high
                        </td>
                        <td className="align-middle col2">
                          15m
                        </td>
                        <td className="align-middle col3">
                          4h
                        </td>
                        <td className="align-middle col4">
                          97%
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-success">
                            Meeting
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="align-middle ps-3 py-3 col0">
                          <div className="d-flex align-items-center">
                            <span className="me-2 fa-solid fa-stopwatch text-info"></span>
                            <div>
                              <h6 className="mb-0">
                                Warning response
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                no escalation
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          warning
                        </td>
                        <td className="align-middle col2">
                          1h
                        </td>
                        <td className="align-middle col3">
                          1d
                        </td>
                        <td className="align-middle col4">
                          99%
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-success">
                            Meeting
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="align-middle ps-3 py-3 col0">
                          <div className="d-flex align-items-center">
                            <span className="me-2 fa-solid fa-stopwatch text-secondary"></span>
                            <div>
                              <h6 className="mb-0">
                                Info triage
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                no escalation
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          info
                        </td>
                        <td className="align-middle col2">
                          1d
                        </td>
                        <td className="align-middle col3">
                          5d
                        </td>
                        <td className="align-middle col4">
                          100%
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-success">
                            Meeting
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
        <div className="tab-pane fade" id="tab-maintenance" role="tabpanel">
          <div className="obs-list-root" data-list={"{\"valueNames\":[\"col0\",\"col1\",\"col2\",\"col3\",\"col4\",\"col5\"],\"page\":6,\"filter\":{\"key\":\"col5\"}}"} data-live-table="maintenanceWindows">
            <div className="card">
              <div className="card-header border-bottom border-translucent py-3">
                <div className="row align-items-center g-2 mb-3">
                  <div className="col">
                    <h4 className="mb-0">
                      Maintenance windows
                    </h4>
                    <p className="text-body-tertiary fs-9 mb-0">
                      Alerts matching a window are suppressed, not dropped — they stay queryable and resume routing when the window closes.
                    </p>
                  </div>
                </div>
                <div className="row align-items-center g-2">
                  <div className="col-12 col-md">
                    <div className="search-box w-100">
                      <form className="position-relative">
                        <input className="form-control search-input search form-control-sm" type="search" placeholder="Search maintenance windows" aria-label="Search" />
                        <span className="fas fa-search search-box-icon"></span>
                      </form>
                    </div>
                  </div>
                  <div className="col-6 col-md-auto">
                    <select className="form-select form-select-sm" data-list-filter="data-list-filter" aria-label="Filter">
                      <option value="">
                        Filter: All
                      </option>
                      <option value="Active">
                        Active
                      </option>
                      <option value="Scheduled">
                        Scheduled
                      </option>
                      <option value="Ended">
                        Ended
                      </option>
                    </select>
                  </div>
                  <div className="col-6 col-md-auto">
                    <select className="form-select form-select-sm" aria-label="Sort by" data-obs-sort="data-obs-sort">
                      <option value="">
                        Sort by
                      </option>
                      <option value="col0">
                        Window
                      </option>
                      <option value="col1">
                        Scope
                      </option>
                      <option value="col2">
                        Starts
                      </option>
                      <option value="col3">
                        Ends
                      </option>
                      <option value="col4">
                        Suppressed
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
                          Window
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col1">
                          Scope
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col2">
                          Starts
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col3">
                          Ends
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col4">
                          Suppressed
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
                            <span className="me-2 fa-solid fa-wrench text-warning"></span>
                            <div>
                              <h6 className="mb-0">
                                Nightly ETL window
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                recurring · weekly
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          source in (talend, boomi)
                        </td>
                        <td className="align-middle col2">
                          Daily 01:00 UTC
                        </td>
                        <td className="align-middle col3">
                          Daily 04:00 UTC
                        </td>
                        <td className="align-middle col4">
                          128
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-warning">
                            Active
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="align-middle ps-3 py-3 col0">
                          <div className="d-flex align-items-center">
                            <span className="me-2 fa-solid fa-wrench text-warning"></span>
                            <div>
                              <h6 className="mb-0">
                                Payments DB failover
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                one-off
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          service=payments-api
                        </td>
                        <td className="align-middle col2">
                          20 Aug 22:00 UTC
                        </td>
                        <td className="align-middle col3">
                          21 Aug 02:00 UTC
                        </td>
                        <td className="align-middle col4">
                          19
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-warning">
                            Active
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="align-middle ps-3 py-3 col0">
                          <div className="d-flex align-items-center">
                            <span className="me-2 fa-solid fa-wrench text-secondary"></span>
                            <div>
                              <h6 className="mb-0">
                                Apigee upgrade
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                one-off
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          gateway=org-apigee-prod
                        </td>
                        <td className="align-middle col2">
                          24 Aug 06:00 UTC
                        </td>
                        <td className="align-middle col3">
                          24 Aug 09:00 UTC
                        </td>
                        <td className="align-middle col4">
                          0
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-info">
                            Scheduled
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="align-middle ps-3 py-3 col0">
                          <div className="d-flex align-items-center">
                            <span className="me-2 fa-solid fa-wrench text-secondary"></span>
                            <div>
                              <h6 className="mb-0">
                                Stage refresh
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                completed
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          env=stage
                        </td>
                        <td className="align-middle col2">
                          17 Aug 20:00 UTC
                        </td>
                        <td className="align-middle col3">
                          18 Aug 02:00 UTC
                        </td>
                        <td className="align-middle col4">
                          341
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-secondary">
                            Ended
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
