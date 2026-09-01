import AppLayout from '@/components/app-layout'

export default function Page() {
  return (
    <AppLayout scripts={[
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
            AI Automation
          </li>
        </ol>
      </nav>
      <div className="mb-6">
        <div className="row align-items-center g-3">
          <div className="col">
            <h2 className="mb-2">
              AI Automation
            </h2>
            <h5 className="text-body-tertiary fw-semibold mb-0">
              Rules that act on signals, models that predict them, and the agents that carry out remediation
            </h5>
          </div>
          <div className="col-auto">
            <button className="btn btn-primary" type="button" data-lhb-action="automationRule">
              New rule
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
                    Active rules
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat">
                    19
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-info" data-obs-stat-delta="data-obs-stat-delta">
                  of 24
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
                    Executions (7d)
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat">
                    412
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-success" data-obs-stat-delta="data-obs-stat-delta">
                  +64
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
                    97.1%
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-success" data-obs-stat-delta="data-obs-stat-delta">
                  +0.6%
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
                    Awaiting approval
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat">
                    5
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-warning" data-obs-stat-delta="data-obs-stat-delta">
                  high impact
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-7">
          <div className="obs-list-root" data-list={"{\"valueNames\":[\"col0\",\"col1\",\"col2\",\"col3\",\"col4\",\"col5\"],\"page\":6,\"filter\":{\"key\":\"col5\"}}"} data-live-table="automationRules">
            <div className="card">
              <div className="card-header border-bottom border-translucent py-3">
                <div className="row align-items-center g-2 mb-3">
                  <div className="col">
                    <h4 className="mb-0">
                      Automation rules
                    </h4>
                    <p className="text-body-tertiary fs-9 mb-0">
                      Trigger → condition → action. High-impact actions require approval before they run.
                    </p>
                  </div>
                </div>
                <div className="row align-items-center g-2">
                  <div className="col-12 col-md">
                    <div className="search-box w-100">
                      <form className="position-relative">
                        <input className="form-control search-input search form-control-sm" type="search" placeholder="Search automation rules" aria-label="Search" />
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
                        Trigger
                      </option>
                      <option value="col2">
                        Action
                      </option>
                      <option value="col3">
                        Runs
                      </option>
                      <option value="col4">
                        Type
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
                          Trigger
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col2">
                          Action
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col3">
                          Runs
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col4">
                          Type
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
                            <span className="me-2 fa-solid fa-bolt text-success"></span>
                            <div>
                              <h6 className="mb-0">
                                Restart stuck ETL job
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                auto-approved
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          etl.job.stalled &gt; 30m
                        </td>
                        <td className="align-middle col2">
                          Retry execution
                        </td>
                        <td className="align-middle col3">
                          38
                        </td>
                        <td className="align-middle col4">
                          Auto
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
                            <span className="me-2 fa-solid fa-bolt text-success"></span>
                            <div>
                              <h6 className="mb-0">
                                Scale checkout pods
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                auto-approved
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          p99 &gt; 2s for 5m
                        </td>
                        <td className="align-middle col2">
                          Scale +2 replicas
                        </td>
                        <td className="align-middle col3">
                          17
                        </td>
                        <td className="align-middle col4">
                          Auto
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
                            <span className="me-2 fa-solid fa-bolt text-warning"></span>
                            <div>
                              <h6 className="mb-0">
                                Failover payments replica
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                needs approval
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          replication lag &gt; 10s
                        </td>
                        <td className="align-middle col2">
                          Promote replica
                        </td>
                        <td className="align-middle col3">
                          2
                        </td>
                        <td className="align-middle col4">
                          Approval
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
                            <span className="me-2 fa-solid fa-bolt text-info"></span>
                            <div>
                              <h6 className="mb-0">
                                Clear CDN cache
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                auto-approved
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          5xx spike on static
                        </td>
                        <td className="align-middle col2">
                          Purge edge cache
                        </td>
                        <td className="align-middle col3">
                          6
                        </td>
                        <td className="align-middle col4">
                          Auto
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
                            <span className="me-2 fa-solid fa-bolt text-warning"></span>
                            <div>
                              <h6 className="mb-0">
                                Throttle AI provider
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                needs approval
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          cost anomaly &gt; 3σ
                        </td>
                        <td className="align-middle col2">
                          Lower rate limit
                        </td>
                        <td className="align-middle col3">
                          3
                        </td>
                        <td className="align-middle col4">
                          Approval
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
                            <span className="me-2 fa-solid fa-bolt text-secondary"></span>
                            <div>
                              <h6 className="mb-0">
                                Rollback deploy
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                draft
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          error rate &gt; 5% post-deploy
                        </td>
                        <td className="align-middle col2">
                          Revert to previous
                        </td>
                        <td className="align-middle col3">
                          0
                        </td>
                        <td className="align-middle col4">
                          Approval
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
        <div className="col-12 col-lg-5">
          <div className="card h-100" data-mock-block="data-mock-block">
            <div className="card-body">
              <h4 className="mb-3">
                Predictive insights
              </h4>
              <p className="text-body-tertiary fs-9">
                Model output the platform believes is actionable. Approve to turn an insight into a scheduled action; dismiss to feed the rejection back into training.
              </p>
              <div className="border border-translucent rounded-3 p-3 mb-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <strong className="fs-9">
                    orders replica will breach lag SLO
                  </strong>
                  <span className="badge badge-phoenix badge-phoenix-warning">
                    0.79
                  </span>
                </div>
                <p className="fs-10 text-body-tertiary mb-2">
                  Predicted within 4 hours, based on the backfill schedule and current write volume.
                </p>
                <button className="btn btn-sm btn-primary me-2" type="button">
                  Approve
                </button>
                <button className="btn btn-sm btn-phoenix-secondary" type="button">
                  Dismiss
                </button>
              </div>
              <div className="border border-translucent rounded-3 p-3 mb-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <strong className="fs-9">
                    AI spend will exceed monthly budget
                  </strong>
                  <span className="badge badge-phoenix badge-phoenix-danger">
                    0.91
                  </span>
                </div>
                <p className="fs-10 text-body-tertiary mb-2">
                  Current burn projects 118% of the Claude + GPT budget by month end.
                </p>
                <button className="btn btn-sm btn-primary me-2" type="button">
                  Approve
                </button>
                <button className="btn btn-sm btn-phoenix-secondary" type="button">
                  Dismiss
                </button>
              </div>
              <div className="border border-translucent rounded-3 p-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <strong className="fs-9">
                    partner-api error budget exhausted
                  </strong>
                  <span className="badge badge-phoenix badge-phoenix-info">
                    0.68
                  </span>
                </div>
                <p className="fs-10 text-body-tertiary mb-2">
                  Recommend freezing non-critical changes until the window resets.
                </p>
                <button className="btn btn-sm btn-primary me-2" type="button">
                  Approve
                </button>
                <button className="btn btn-sm btn-phoenix-secondary" type="button">
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="obs-list-root" data-list={"{\"valueNames\":[\"col0\",\"col1\",\"col2\",\"col3\",\"col4\",\"col5\"],\"page\":8,\"filter\":{\"key\":\"col5\"}}"} data-live-table="automationModels">
        <div className="card">
          <div className="card-header border-bottom border-translucent py-3">
            <div className="row align-items-center g-2 mb-3">
              <div className="col">
                <h4 className="mb-0">
                  ML models & remediation agents
                </h4>
                <p className="text-body-tertiary fs-9 mb-0">
                  Models scoring signals, and the agents installed in customer environments that execute approved actions
                </p>
              </div>
            </div>
            <div className="row align-items-center g-2">
              <div className="col-12 col-md">
                <div className="search-box w-100">
                  <form className="position-relative">
                    <input className="form-control search-input search form-control-sm" type="search" placeholder="Search models or agents" aria-label="Search" />
                    <span className="fas fa-search search-box-icon"></span>
                  </form>
                </div>
              </div>
              <div className="col-6 col-md-auto">
                <select className="form-select form-select-sm" data-list-filter="data-list-filter" aria-label="Filter">
                  <option value="">
                    Filter: All
                  </option>
                  <option value="Serving">
                    Serving
                  </option>
                  <option value="Retrain due">
                    Retrain due
                  </option>
                  <option value="Online">
                    Online
                  </option>
                  <option value="Stale">
                    Stale
                  </option>
                  <option value="Offline">
                    Offline
                  </option>
                </select>
              </div>
              <div className="col-6 col-md-auto">
                <select className="form-select form-select-sm" aria-label="Sort by" data-obs-sort="data-obs-sort">
                  <option value="">
                    Sort by
                  </option>
                  <option value="col0">
                    Name
                  </option>
                  <option value="col1">
                    Type
                  </option>
                  <option value="col2">
                    Version
                  </option>
                  <option value="col3">
                    Accuracy
                  </option>
                  <option value="col4">
                    Last trained
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
                      Name
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col1">
                      Type
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col2">
                      Version
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col3">
                      Accuracy
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col4">
                      Last trained
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
                        <span className="me-2 fa-solid fa-brain text-primary"></span>
                        <div>
                          <h6 className="mb-0">
                            latency-anomaly
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            anomaly detection
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Model
                    </td>
                    <td className="align-middle col2">
                      v14
                    </td>
                    <td className="align-middle col3">
                      94.2%
                    </td>
                    <td className="align-middle col4">
                      2d ago
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Serving
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-brain text-primary"></span>
                        <div>
                          <h6 className="mb-0">
                            cost-forecast
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            forecasting
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Model
                    </td>
                    <td className="align-middle col2">
                      v8
                    </td>
                    <td className="align-middle col3">
                      91.7%
                    </td>
                    <td className="align-middle col4">
                      1d ago
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Serving
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-brain text-warning"></span>
                        <div>
                          <h6 className="mb-0">
                            alert-triage
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            classification
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Model
                    </td>
                    <td className="align-middle col2">
                      v21
                    </td>
                    <td className="align-middle col3">
                      88.1%
                    </td>
                    <td className="align-middle col4">
                      9d ago
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-warning">
                        Retrain due
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-brain text-info"></span>
                        <div>
                          <h6 className="mb-0">
                            incident-grouping
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            clustering
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Model
                    </td>
                    <td className="align-middle col2">
                      v11
                    </td>
                    <td className="align-middle col3">
                      96.0%
                    </td>
                    <td className="align-middle col4">
                      4d ago
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Serving
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-robot text-success"></span>
                        <div>
                          <h6 className="mb-0">
                            remediation-agent-01
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            us-east-1 · prod
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Agent
                    </td>
                    <td className="align-middle col2">
                      2.4.1
                    </td>
                    <td className="align-middle col3">
                      —
                    </td>
                    <td className="align-middle col4">
                      heartbeat 22s ago
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Online
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-robot text-success"></span>
                        <div>
                          <h6 className="mb-0">
                            remediation-agent-02
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            eu-west-1 · prod
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Agent
                    </td>
                    <td className="align-middle col2">
                      2.4.1
                    </td>
                    <td className="align-middle col3">
                      —
                    </td>
                    <td className="align-middle col4">
                      heartbeat 31s ago
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Online
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-robot text-warning"></span>
                        <div>
                          <h6 className="mb-0">
                            remediation-agent-03
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            us-west-2 · stage
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Agent
                    </td>
                    <td className="align-middle col2">
                      2.3.0
                    </td>
                    <td className="align-middle col3">
                      —
                    </td>
                    <td className="align-middle col4">
                      heartbeat 14m ago
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-warning">
                        Stale
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-robot text-danger"></span>
                        <div>
                          <h6 className="mb-0">
                            remediation-agent-04
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            on-prem · dc1
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Agent
                    </td>
                    <td className="align-middle col2">
                      2.2.6
                    </td>
                    <td className="align-middle col3">
                      —
                    </td>
                    <td className="align-middle col4">
                      heartbeat 3d ago
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-danger">
                        Offline
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
