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
            Drift Detection
          </li>
        </ol>
      </nav>
      <div className="mb-6">
        <div className="row align-items-center g-3">
          <div className="col">
            <h2 className="mb-2">
              Drift Detection
            </h2>
            <h5 className="text-body-tertiary fw-semibold mb-0">
              Where today stopped looking like the baseline — for metrics feeding alerts and features feeding models
            </h5>
          </div>
          <div className="col-auto">
            <button className="btn btn-primary" type="button" data-lhb-action="rebaseline">
              Rebaseline
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
                    Features tracked
                  </h6>
                  <h3 className="mb-0">
                    214
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-info">
                  +18
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
                    Drifting
                  </h6>
                  <h3 className="mb-0">
                    9
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-warning">
                  4 significant
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
                    Baseline age
                  </h6>
                  <h3 className="mb-0">
                    14d
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-primary">
                  rolling
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
                    Models affected
                  </h6>
                  <h3 className="mb-0">
                    3
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-danger">
                  retrain suggested
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-5">
          <div className="card h-100">
            <div className="card-body">
              <h4 className="mb-3">
                How drift is measured
              </h4>
              <p className="text-body-tertiary fs-9">
                Two tests, chosen by what the feature is:
              </p>
              <ul className="fs-9">
                <li>
                  <strong>
                    Numeric
                  </strong>
                  — Kolmogorov–Smirnov against the baseline distribution
                </li>
                <li>
                  <strong>
                    Categorical
                  </strong>
                  — population stability index over the category mix
                </li>
              </ul>
              <p className="text-body-tertiary fs-9 mb-0">
                Drift is a warning, not a failure. A p95 that shifted because traffic doubled is real drift and entirely fine; a feature that shifted because an upstream schema changed is not. The evidence column is there so you can tell them apart.
              </p>
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-7">
          <div className="card h-100">
            <div className="card-body">
              <h4 className="mb-3">
                Significant drift needing review
              </h4>
              <div className="table-responsive scrollbar">
                <table className="table table-sm fs-9 mb-0">
                  <thead>
                    <tr>
                      <th className="text-uppercase">
                        Feature
                      </th>
                      <th className="text-uppercase">
                        Test
                      </th>
                      <th className="text-uppercase">
                        Score
                      </th>
                      <th className="text-uppercase">
                        Likely cause
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        payments-api latency_p95
                      </td>
                      <td>
                        KS
                      </td>
                      <td className="text-danger">
                        0.42
                      </td>
                      <td className="text-body-tertiary">
                        Replica routing change
                      </td>
                    </tr>
                    <tr>
                      <td>
                        checkout basket_size
                      </td>
                      <td>
                        KS
                      </td>
                      <td className="text-warning">
                        0.28
                      </td>
                      <td className="text-body-tertiary">
                        Promotion campaign
                      </td>
                    </tr>
                    <tr>
                      <td>
                        fraud-scorer country_code
                      </td>
                      <td>
                        PSI
                      </td>
                      <td className="text-danger">
                        0.31
                      </td>
                      <td className="text-body-tertiary">
                        New market launch
                      </td>
                    </tr>
                    <tr>
                      <td>
                        demand-forecast channel
                      </td>
                      <td>
                        PSI
                      </td>
                      <td className="text-warning">
                        0.19
                      </td>
                      <td className="text-body-tertiary">
                        Upstream column added
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="obs-list-root" data-list={"{\"valueNames\":[\"col0\",\"col1\",\"col2\",\"col3\",\"col4\",\"col5\"],\"page\":8,\"filter\":{\"key\":\"col5\"}}"} data-live-table="drift">
        <div className="card">
          <div className="card-header border-bottom border-translucent py-3">
            <div className="row align-items-center g-2 mb-3">
              <div className="col">
                <h4 className="mb-0">
                  Tracked features
                </h4>
                <p className="text-body-tertiary fs-9 mb-0">
                  Compared against a rolling 14-day baseline, recomputed nightly per organization
                </p>
              </div>
            </div>
            <div className="row align-items-center g-2">
              <div className="col-12 col-md">
                <div className="search-box w-100">
                  <form className="position-relative">
                    <input className="form-control search-input search form-control-sm" type="search" placeholder="Search features or models" aria-label="Search" />
                    <span className="fas fa-search search-box-icon"></span>
                  </form>
                </div>
              </div>
              <div className="col-6 col-md-auto">
                <select className="form-select form-select-sm" data-list-filter="data-list-filter" aria-label="Filter">
                  <option value="">
                    Filter: All
                  </option>
                  <option value="Drifting">
                    Drifting
                  </option>
                  <option value="Watch">
                    Watch
                  </option>
                  <option value="Stable">
                    Stable
                  </option>
                </select>
              </div>
              <div className="col-6 col-md-auto">
                <select className="form-select form-select-sm" aria-label="Sort by" data-obs-sort="data-obs-sort">
                  <option value="">
                    Sort by
                  </option>
                  <option value="col0">
                    Feature
                  </option>
                  <option value="col1">
                    Kind
                  </option>
                  <option value="col2">
                    Test
                  </option>
                  <option value="col3">
                    Score
                  </option>
                  <option value="col4">
                    Threshold
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
                      Feature
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col1">
                      Kind
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col2">
                      Test
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col3">
                      Score
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col4">
                      Threshold
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
                        <span className="me-2 fa-solid fa-wave-square text-danger"></span>
                        <div>
                          <h6 className="mb-0">
                            latency_p95
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            numeric
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      payments-api alerts
                    </td>
                    <td className="align-middle col2">
                      KS
                    </td>
                    <td className="align-middle col3">
                      0.42
                    </td>
                    <td className="align-middle col4">
                      0.30
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-danger">
                        Drifting
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-wave-square text-warning"></span>
                        <div>
                          <h6 className="mb-0">
                            basket_size
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            numeric
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      demand-forecast
                    </td>
                    <td className="align-middle col2">
                      KS
                    </td>
                    <td className="align-middle col3">
                      0.28
                    </td>
                    <td className="align-middle col4">
                      0.30
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-warning">
                        Watch
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-chart-simple text-danger"></span>
                        <div>
                          <h6 className="mb-0">
                            country_code
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            categorical
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      fraud-scorer
                    </td>
                    <td className="align-middle col2">
                      PSI
                    </td>
                    <td className="align-middle col3">
                      0.31
                    </td>
                    <td className="align-middle col4">
                      0.25
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-danger">
                        Drifting
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-chart-simple text-warning"></span>
                        <div>
                          <h6 className="mb-0">
                            channel
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            categorical
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      demand-forecast
                    </td>
                    <td className="align-middle col2">
                      PSI
                    </td>
                    <td className="align-middle col3">
                      0.19
                    </td>
                    <td className="align-middle col4">
                      0.25
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-warning">
                        Watch
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-wave-square text-success"></span>
                        <div>
                          <h6 className="mb-0">
                            error_rate
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            numeric
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      checkout-api alerts
                    </td>
                    <td className="align-middle col2">
                      KS
                    </td>
                    <td className="align-middle col3">
                      0.06
                    </td>
                    <td className="align-middle col4">
                      0.30
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Stable
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-wave-square text-success"></span>
                        <div>
                          <h6 className="mb-0">
                            tokens_per_request
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            numeric
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      ai-gateway cost
                    </td>
                    <td className="align-middle col2">
                      KS
                    </td>
                    <td className="align-middle col3">
                      0.11
                    </td>
                    <td className="align-middle col4">
                      0.30
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Stable
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-chart-simple text-success"></span>
                        <div>
                          <h6 className="mb-0">
                            device_type
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            categorical
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      churn-predictor
                    </td>
                    <td className="align-middle col2">
                      PSI
                    </td>
                    <td className="align-middle col3">
                      0.04
                    </td>
                    <td className="align-middle col4">
                      0.25
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Stable
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-wave-square text-success"></span>
                        <div>
                          <h6 className="mb-0">
                            rows_processed
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            numeric
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      etl freshness SLO
                    </td>
                    <td className="align-middle col2">
                      KS
                    </td>
                    <td className="align-middle col3">
                      0.09
                    </td>
                    <td className="align-middle col4">
                      0.30
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        Stable
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
