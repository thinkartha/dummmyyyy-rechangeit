import AppLayout from '@/components/app-layout'

export default function Page() {
  return (
    <AppLayout scripts={[
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
            Custom AI Models
          </li>
        </ol>
      </nav>
      <div className="mb-6">
        <div className="row align-items-center g-3">
          <div className="col">
            <h2 className="mb-2">
              Custom AI Models
            </h2>
            <h5 className="text-body-tertiary fw-semibold mb-0">
              Inference health for the models your organization deploys — latency, failures, and the thresholds that decide what counts as broken
            </h5>
          </div>
          <div className="col-auto d-flex gap-2">
            <button className="btn btn-phoenix-secondary" type="button" data-lhb-action="editThresholds">
              Edit thresholds
            </button>
            <button className="btn btn-primary" type="button" data-lhb-action="registerModel">
              Register model
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
                    Models
                  </h6>
                  <h3 className="mb-0">
                    12
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-info">
                  +2
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
                    Inferences (24h)
                  </h6>
                  <h3 className="mb-0">
                    4.8M
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-success">
                  +11%
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
                    Failure rate
                  </h6>
                  <h3 className="mb-0">
                    0.42%
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-warning">
                  +0.09%
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
                    p95 latency
                  </h6>
                  <h3 className="mb-0">
                    318ms
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-success">
                  -24ms
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-7">
          <div className="obs-list-root" data-list={"{\"valueNames\":[\"col0\",\"col1\",\"col2\",\"col3\",\"col4\",\"col5\"],\"page\":6,\"filter\":{\"key\":\"col5\"}}"} data-live-table="aiModels">
            <div className="card">
              <div className="card-header border-bottom border-translucent py-3">
                <div className="row align-items-center g-2 mb-3">
                  <div className="col">
                    <h4 className="mb-0">
                      Registered models
                    </h4>
                    <p className="text-body-tertiary fs-9 mb-0">
                      Every model an organization has registered, scored against its own thresholds rather than a global default
                    </p>
                  </div>
                </div>
                <div className="row align-items-center g-2">
                  <div className="col-12 col-md">
                    <div className="search-box w-100">
                      <form className="position-relative">
                        <input className="form-control search-input search form-control-sm" type="search" placeholder="Search models" aria-label="Search" />
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
                      <option value="Degraded">
                        Degraded
                      </option>
                      <option value="Down">
                        Down
                      </option>
                    </select>
                  </div>
                  <div className="col-6 col-md-auto">
                    <select className="form-select form-select-sm" aria-label="Sort by" data-obs-sort="data-obs-sort">
                      <option value="">
                        Sort by
                      </option>
                      <option value="col0">
                        Model
                      </option>
                      <option value="col1">
                        Task
                      </option>
                      <option value="col2">
                        Requests (24h)
                      </option>
                      <option value="col3">
                        p95
                      </option>
                      <option value="col4">
                        Failures
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
                          Model
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col1">
                          Task
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col2">
                          Requests (24h)
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col3">
                          p95
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col4">
                          Failures
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
                            <span className="me-2 fa-solid fa-microchip text-success"></span>
                            <div>
                              <h6 className="mb-0">
                                fraud-scorer
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                v4 · sagemaker
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          Classification
                        </td>
                        <td className="align-middle col2">
                          2.1M
                        </td>
                        <td className="align-middle col3">
                          84ms
                        </td>
                        <td className="align-middle col4">
                          0.02%
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
                            <span className="me-2 fa-solid fa-microchip text-success"></span>
                            <div>
                              <h6 className="mb-0">
                                risk-ranker
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                v2 · sagemaker
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          Ranking
                        </td>
                        <td className="align-middle col2">
                          910K
                        </td>
                        <td className="align-middle col3">
                          142ms
                        </td>
                        <td className="align-middle col4">
                          0.11%
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
                            <span className="me-2 fa-solid fa-microchip text-warning"></span>
                            <div>
                              <h6 className="mb-0">
                                demand-forecast
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                v9 · vertex
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          Regression
                        </td>
                        <td className="align-middle col2">
                          318K
                        </td>
                        <td className="align-middle col3">
                          1.2s
                        </td>
                        <td className="align-middle col4">
                          1.84%
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-warning">
                            Degraded
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="align-middle ps-3 py-3 col0">
                          <div className="d-flex align-items-center">
                            <span className="me-2 fa-solid fa-microchip text-success"></span>
                            <div>
                              <h6 className="mb-0">
                                doc-extractor
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                v1 · self-hosted
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          Extraction
                        </td>
                        <td className="align-middle col2">
                          486K
                        </td>
                        <td className="align-middle col3">
                          640ms
                        </td>
                        <td className="align-middle col4">
                          0.31%
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
                            <span className="me-2 fa-solid fa-microchip text-danger"></span>
                            <div>
                              <h6 className="mb-0">
                                image-tagger
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                v3 · self-hosted
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          Vision
                        </td>
                        <td className="align-middle col2">
                          92K
                        </td>
                        <td className="align-middle col3">
                          3.4s
                        </td>
                        <td className="align-middle col4">
                          6.20%
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-danger">
                            Down
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="align-middle ps-3 py-3 col0">
                          <div className="d-flex align-items-center">
                            <span className="me-2 fa-solid fa-microchip text-info"></span>
                            <div>
                              <h6 className="mb-0">
                                churn-predictor
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                v7 · azure ml
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          Classification
                        </td>
                        <td className="align-middle col2">
                          204K
                        </td>
                        <td className="align-middle col3">
                          96ms
                        </td>
                        <td className="align-middle col4">
                          0.08%
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
        </div>
        <div className="col-12 col-lg-5">
          <div className="card mb-4">
            <div className="card-body">
              <h4 className="mb-3">
                Thresholds
              </h4>
              <p className="text-body-tertiary fs-9">
                A model is marked degraded or down by its own limits. Raise them for a batch model that is allowed to be slow; tighten them for anything in a request path.
              </p>
              <div className="mb-3">
                <label className="form-label fs-9" htmlFor="thr-latency">
                  Degraded above p95 latency
                </label>
                <div className="input-group input-group-sm">
                  <input className="form-control" id="thr-latency" type="number" defaultValue="800" aria-label="Degraded latency threshold in milliseconds" />
                  <span className="input-group-text">
                    ms
                  </span>
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label fs-9" htmlFor="thr-failure">
                  Degraded above failure rate
                </label>
                <div className="input-group input-group-sm">
                  <input className="form-control" id="thr-failure" type="number" defaultValue="1.0" step="0.1" aria-label="Degraded failure rate threshold percent" />
                  <span className="input-group-text">
                    %
                  </span>
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label fs-9" htmlFor="thr-down">
                  Down above failure rate
                </label>
                <div className="input-group input-group-sm">
                  <input className="form-control" id="thr-down" type="number" defaultValue="5.0" step="0.1" aria-label="Down failure rate threshold percent" />
                  <span className="input-group-text">
                    %
                  </span>
                </div>
              </div>
              <button className="btn btn-primary btn-sm" type="button">
                Save thresholds
              </button>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <h4 className="mb-3">
                Recent failures
              </h4>
              <div className="table-responsive scrollbar">
                <table className="table table-sm fs-9 mb-0">
                  <thead>
                    <tr>
                      <th className="text-uppercase">
                        Model
                      </th>
                      <th className="text-uppercase">
                        Error
                      </th>
                      <th className="text-uppercase">
                        When
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        image-tagger
                      </td>
                      <td className="text-danger">
                        CUDA out of memory
                      </td>
                      <td>
                        3m ago
                      </td>
                    </tr>
                    <tr>
                      <td>
                        image-tagger
                      </td>
                      <td className="text-danger">
                        Inference timeout
                      </td>
                      <td>
                        5m ago
                      </td>
                    </tr>
                    <tr>
                      <td>
                        demand-forecast
                      </td>
                      <td className="text-warning">
                        Feature null in payload
                      </td>
                      <td>
                        18m ago
                      </td>
                    </tr>
                    <tr>
                      <td>
                        doc-extractor
                      </td>
                      <td className="text-warning">
                        Unsupported MIME type
                      </td>
                      <td>
                        41m ago
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
