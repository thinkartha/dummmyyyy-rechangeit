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
            Escalation & Approval
          </li>
        </ol>
      </nav>
      <div className="mb-6">
        <div className="row align-items-center g-3">
          <div className="col">
            <h2 className="mb-2">
              Escalation & Approval
            </h2>
            <h5 className="text-body-tertiary fw-semibold mb-0">
              Who gets woken when nobody answers, and what a machine is not allowed to do without a human saying yes
            </h5>
          </div>
          <div className="col-auto">
            <button className="btn btn-primary" type="button" data-lhb-action="escalationPath">
              New escalation path
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
                    Awaiting approval
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat">
                    4
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-warning" data-obs-stat-delta="data-obs-stat-delta">
                  2 expiring
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
                    Escalation paths
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat">
                    6
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-success" data-obs-stat-delta="data-obs-stat-delta">
                  all active
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
                    Reached level 3+
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat">
                    3
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-danger" data-obs-stat-delta="data-obs-stat-delta">
                  last 7d
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
                    Median time to ack
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat">
                    4m 12s
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-success" data-obs-stat-delta="data-obs-stat-delta">
                  -38s
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="obs-list-root" data-list={"{\"valueNames\":[\"col0\",\"col1\",\"col2\",\"col3\",\"col4\",\"col5\"],\"page\":8,\"filter\":{\"key\":\"col5\"}}"} data-live-table="pendingApprovals">
        <div className="card">
          <div className="card-header border-bottom border-translucent py-3">
            <div className="row align-items-center g-2 mb-3">
              <div className="col">
                <h4 className="mb-0">
                  Pending approvals
                </h4>
                <p className="text-body-tertiary fs-9 mb-0">
                  Actions the automation engine has proposed and is holding until a human decides
                </p>
              </div>
            </div>
            <div className="row align-items-center g-2">
              <div className="col-12 col-md">
                <div className="search-box w-100">
                  <form className="position-relative">
                    <input className="form-control search-input search form-control-sm" type="search" placeholder="Search proposals" aria-label="Search" />
                    <span className="fas fa-search search-box-icon"></span>
                  </form>
                </div>
              </div>
              <div className="col-6 col-md-auto">
                <select className="form-select form-select-sm" data-list-filter="data-list-filter" aria-label="Filter">
                  <option value="">
                    Filter: All
                  </option>
                  <option value="High">
                    High
                  </option>
                  <option value="Medium">
                    Medium
                  </option>
                  <option value="Low">
                    Low
                  </option>
                </select>
              </div>
              <div className="col-6 col-md-auto">
                <select className="form-select form-select-sm" aria-label="Sort by" data-obs-sort="data-obs-sort">
                  <option value="">
                    Sort by
                  </option>
                  <option value="col0">
                    Proposed action
                  </option>
                  <option value="col1">
                    Requested by
                  </option>
                  <option value="col2">
                    Confidence
                  </option>
                  <option value="col3">
                    Impact
                  </option>
                  <option value="col4">
                    Waiting
                  </option>
                  <option value="col5">
                    Priority
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
                      Proposed action
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col1">
                      Requested by
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col2">
                      Confidence
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col3">
                      Impact
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col4">
                      Waiting
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col5">
                      Priority
                    </th>
                    <th className="align-middle text-end pe-3" scope="col"></th>
                  </tr>
                </thead>
                <tbody className="list" data-sample-rows="data-sample-rows">
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-rotate-right text-danger"></span>
                        <div>
                          <h6 className="mb-0">
                            Restart user-service in production
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            Production Restart Approval
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Automation engine
                    </td>
                    <td className="align-middle col2">
                      92%
                    </td>
                    <td className="align-middle col3">
                      user-service, auth-service · ~3m downtime
                    </td>
                    <td className="align-middle col4">
                      5m
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-danger">
                        High
                      </span>
                    </td>
                    <td className="align-middle pe-3"></td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-database text-warning"></span>
                        <div>
                          <h6 className="mb-0">
                            Scale orders connection pool 450 → 600
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            Database Performance Approval
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Database monitor
                    </td>
                    <td className="align-middle col2">
                      87%
                    </td>
                    <td className="align-middle col3">
                      orders-db · no downtime
                    </td>
                    <td className="align-middle col4">
                      12m
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-warning">
                        Medium
                      </span>
                    </td>
                    <td className="align-middle pe-3"></td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-arrows-up-down text-warning"></span>
                        <div>
                          <h6 className="mb-0">
                            Scale checkout-api to 6 replicas
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            Capacity Approval
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Predictive scaler
                    </td>
                    <td className="align-middle col2">
                      81%
                    </td>
                    <td className="align-middle col3">
                      checkout-api · +$34/day
                    </td>
                    <td className="align-middle col4">
                      21m
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-warning">
                        Medium
                      </span>
                    </td>
                    <td className="align-middle pe-3"></td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-shield-halved text-info"></span>
                        <div>
                          <h6 className="mb-0">
                            Rotate the expiring Databricks PAT
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            Security Policy Changes
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Credential monitor
                    </td>
                    <td className="align-middle col2">
                      99%
                    </td>
                    <td className="align-middle col3">
                      Data Observability, ETL collection
                    </td>
                    <td className="align-middle col4">
                      2h
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-info">
                        Low
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
      <div className="row g-4 my-0">
        <div className="col-12 col-xl-7">
          <div className="card h-100" data-mock-block="data-mock-block">
            <div className="card-header border-bottom border-translucent py-3">
              <h4 className="mb-0">
                Escalation paths
              </h4>
              <p className="text-body-tertiary fs-9 mb-0">
                Each level is given its timeout to acknowledge before the next one is paged
              </p>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive scrollbar">
                <table className="table table-sm fs-9 mb-0">
                  <thead>
                    <tr>
                      <th className="ps-3 text-uppercase">
                        Path
                      </th>
                      <th className="text-uppercase">
                        Trigger
                      </th>
                      <th className="text-uppercase">
                        Levels
                      </th>
                      <th className="text-uppercase">
                        Success
                      </th>
                      <th className="text-uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="ps-3">
                        <h6 className="mb-0">
                          Critical Infrastructure
                        </h6>
                        <p className="text-body-tertiary fs-10 mb-0">
                          On-call → Team lead → Eng manager → VP
                        </p>
                      </td>
                      <td className="font-monospace fs-10">
                        severity=critical AND category=infrastructure
                      </td>
                      <td>
                        4 · 15m/30m/60m/120m
                      </td>
                      <td>
                        94%
                      </td>
                      <td>
                        <span className="badge badge-phoenix badge-phoenix-success">
                          Active
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="ps-3">
                        <h6 className="mb-0">
                          Security Incident
                        </h6>
                        <p className="text-body-tertiary fs-10 mb-0">
                          Analyst → Security lead → CISO → Exec
                        </p>
                      </td>
                      <td className="font-monospace fs-10">
                        category=security
                      </td>
                      <td>
                        4 · 10m/20m/30m/60m
                      </td>
                      <td>
                        98%
                      </td>
                      <td>
                        <span className="badge badge-phoenix badge-phoenix-success">
                          Active
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="ps-3">
                        <h6 className="mb-0">
                          Database Performance
                        </h6>
                        <p className="text-body-tertiary fs-10 mb-0">
                          DBA → Senior DBA → Architect
                        </p>
                      </td>
                      <td className="font-monospace fs-10">
                        source=database AND response_time&gt;5s
                      </td>
                      <td>
                        3 · 20m/45m/90m
                      </td>
                      <td>
                        91%
                      </td>
                      <td>
                        <span className="badge badge-phoenix badge-phoenix-success">
                          Active
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="ps-3">
                        <h6 className="mb-0">
                          ETL Freshness
                        </h6>
                        <p className="text-body-tertiary fs-10 mb-0">
                          Data engineer → Platform lead
                        </p>
                      </td>
                      <td className="font-monospace fs-10">
                        category=etl AND freshness_breached
                      </td>
                      <td>
                        2 · 30m/90m
                      </td>
                      <td>
                        88%
                      </td>
                      <td>
                        <span className="badge badge-phoenix badge-phoenix-success">
                          Active
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="card-footer border-top border-translucent">
              <p className="fs-9 text-body-tertiary mb-0">
                The routing rule a path belongs to carries its first timeout —
                <a className="ms-1" href="/apps/observability/alert-management/">
                  Alert Management
                </a>
                is where that number is set.
              </p>
            </div>
          </div>
        </div>
        <div className="col-12 col-xl-5">
          <div className="card h-100" data-mock-block="data-mock-block">
            <div className="card-header border-bottom border-translucent py-3">
              <h4 className="mb-0">
                Approval workflows
              </h4>
              <p className="text-body-tertiary fs-9 mb-0">
                What automation may not do on its own
              </p>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive scrollbar">
                <table className="table table-sm fs-9 mb-0">
                  <thead>
                    <tr>
                      <th className="ps-3 text-uppercase">
                        Workflow
                      </th>
                      <th className="text-uppercase">
                        Approvers
                      </th>
                      <th className="text-uppercase">
                        Timeout
                      </th>
                      <th className="text-uppercase">
                        Pending
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="ps-3">
                        <h6 className="mb-0">
                          Production Restart
                        </h6>
                        <p className="text-body-tertiary fs-10 mb-0">
                          Emergency override allowed
                        </p>
                      </td>
                      <td>
                        Team lead (required), Eng manager
                      </td>
                      <td>
                        30m
                      </td>
                      <td>
                        3
                      </td>
                    </tr>
                    <tr>
                      <td className="ps-3">
                        <h6 className="mb-0">
                          Database Schema Changes
                        </h6>
                        <p className="text-body-tertiary fs-10 mb-0">
                          No override
                        </p>
                      </td>
                      <td>
                        DBA, Architect, Eng manager — all required
                      </td>
                      <td>
                        60m
                      </td>
                      <td>
                        1
                      </td>
                    </tr>
                    <tr>
                      <td className="ps-3">
                        <h6 className="mb-0">
                          Security Policy Changes
                        </h6>
                        <p className="text-body-tertiary fs-10 mb-0">
                          Emergency override allowed
                        </p>
                      </td>
                      <td>
                        Security lead, CISO — both required
                      </td>
                      <td>
                        45m
                      </td>
                      <td>
                        0
                      </td>
                    </tr>
                    <tr>
                      <td className="ps-3">
                        <h6 className="mb-0">
                          Cost-increasing scale-up
                        </h6>
                        <p className="text-body-tertiary fs-10 mb-0">
                          Auto-approves under $50/day
                        </p>
                      </td>
                      <td>
                        FinOps owner
                      </td>
                      <td>
                        120m
                      </td>
                      <td>
                        0
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="card" data-mock-block="data-mock-block">
        <div className="card-header border-bottom border-translucent py-3">
          <h4 className="mb-0">
            Escalation analytics
          </h4>
          <p className="text-body-tertiary fs-9 mb-0">
            How far up the chain incidents actually travelled, last 5 days
          </p>
        </div>
        <div className="card-body">
          <div className="table-responsive scrollbar">
            <table className="table table-sm fs-9 mb-0">
              <thead>
                <tr>
                  <th className="ps-3 text-uppercase">
                    Day
                  </th>
                  <th className="text-uppercase">
                    Level 1
                  </th>
                  <th className="text-uppercase">
                    Level 2
                  </th>
                  <th className="text-uppercase">
                    Level 3
                  </th>
                  <th className="text-uppercase">
                    Level 4
                  </th>
                  <th className="text-uppercase">
                    Escaped L1
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="ps-3">
                    Mon
                  </td>
                  <td>
                    45
                  </td>
                  <td>
                    12
                  </td>
                  <td>
                    3
                  </td>
                  <td>
                    1
                  </td>
                  <td>
                    27%
                  </td>
                </tr>
                <tr>
                  <td className="ps-3">
                    Tue
                  </td>
                  <td>
                    52
                  </td>
                  <td>
                    15
                  </td>
                  <td>
                    4
                  </td>
                  <td>
                    0
                  </td>
                  <td>
                    29%
                  </td>
                </tr>
                <tr>
                  <td className="ps-3">
                    Wed
                  </td>
                  <td>
                    38
                  </td>
                  <td>
                    8
                  </td>
                  <td>
                    2
                  </td>
                  <td>
                    1
                  </td>
                  <td>
                    21%
                  </td>
                </tr>
                <tr>
                  <td className="ps-3">
                    Thu
                  </td>
                  <td>
                    41
                  </td>
                  <td>
                    11
                  </td>
                  <td>
                    3
                  </td>
                  <td>
                    0
                  </td>
                  <td>
                    27%
                  </td>
                </tr>
                <tr>
                  <td className="ps-3">
                    Fri
                  </td>
                  <td>
                    47
                  </td>
                  <td>
                    13
                  </td>
                  <td>
                    2
                  </td>
                  <td>
                    0
                  </td>
                  <td>
                    28%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="card-footer border-top border-translucent">
          <p className="fs-9 text-body-tertiary mb-0">
            An incident escaping level 1 usually means the first responder was already busy, not that the alert was hard. That ratio is the one worth watching.
          </p>
        </div>
      </div>
    </AppLayout>
  )
}
