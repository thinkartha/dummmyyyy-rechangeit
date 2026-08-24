import AppLayout from '@/components/app-layout'

export default function Page() {
  return (
    <AppLayout scripts={[
        {
          "code": "\n              (function() {\n                document.querySelectorAll('[data-obs-sort]').forEach(function(select) {\n                  if (select.dataset.bound === '1') return;\n                  select.dataset.bound = '1';\n                  select.addEventListener('change', function() {\n                    var key = select.value;\n                    if (!key) return;\n                    var root = select.closest('[data-list]');\n                    if (!root) return;\n                    var header = root.querySelector('th[data-sort=\"' + key + '\"]');\n                    if (header) header.click();\n                  });\n                });\n              })();\n            "
        },
        {
          "code": "\n            (function() {\n              document.querySelectorAll('[data-obs-sort]').forEach(function(select) {\n                if (select.dataset.bound === '1') return;\n                select.dataset.bound = '1';\n                select.addEventListener('change', function() {\n                  var key = select.value;\n                  if (!key) return;\n                  var root = select.closest('[data-list]');\n                  if (!root) return;\n                  var header = root.querySelector('th[data-sort=\"' + key + '\"]');\n                  if (header) header.click();\n                });\n              });\n            })();\n          "
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
          "src": "/vendors/leaflet/leaflet.js"
        },
        {
          "src": "/vendors/leaflet.markercluster/leaflet.markercluster.js"
        },
        {
          "src": "/vendors/leaflet.tilelayer.colorfilter/leaflet-tilelayer-colorfilter.min.js"
        },
        {
          "src": "/assets/js/phoenix.js"
        },
        {
          "src": "/vendors/echarts/echarts.min.js"
        },
        {
          "src": "/assets/js/dashboards/ecommerce-dashboard.js"
        }
      ]}>
      <div className="pb-5">
        <div className="row g-4">
          <div className="col-12 col-xxl-6">
            <div className="mb-8">
              <h2 className="mb-2">
                Observability Dashboard
              </h2>
              <h5 className="text-body-tertiary fw-semibold">
                LoveHeartBeat — APIs, AI tools, ETL, alerts, and multi-cloud cost in one place
              </h5>
            </div>
            <div className="row align-items-center g-4">
              <div className="col-12 col-md-auto">
                <div className="d-flex align-items-center">
                  <span className="fa-stack" style={{ minHeight: "46px", minWidth: "46px" }}>
                    <span className="fa-solid fa-square fa-stack-2x dark__text-opacity-50 text-danger-light" data-fa-transform="down-4 rotate--10 left-4"></span>
                    <span className="fa-solid fa-circle fa-stack-2x stack-circle text-stats-circle-danger" data-fa-transform="up-4 right-3 grow-2"></span>
                    <span className="fa-stack-1x fa-solid fa-triangle-exclamation text-danger " data-fa-transform="shrink-2 up-8 right-6"></span>
                  </span>
                  <div className="ms-3">
                    <h4 className="mb-0">
                      12 critical alerts
                    </h4>
                    <p className="text-body-secondary fs-9 mb-0">
                      Across APIs & cloud
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-auto">
                <div className="d-flex align-items-center">
                  <span className="fa-stack" style={{ minHeight: "46px", minWidth: "46px" }}>
                    <span className="fa-solid fa-square fa-stack-2x dark__text-opacity-50 text-warning-light" data-fa-transform="down-4 rotate--10 left-4"></span>
                    <span className="fa-solid fa-circle fa-stack-2x stack-circle text-stats-circle-warning" data-fa-transform="up-4 right-3 grow-2"></span>
                    <span className="fa-stack-1x fa-solid fa-robot text-warning " data-fa-transform="shrink-2 up-8 right-6"></span>
                  </span>
                  <div className="ms-3">
                    <h4 className="mb-0">
                      $4.2k AI spend
                    </h4>
                    <p className="text-body-secondary fs-9 mb-0">
                      This billing period
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-auto">
                <div className="d-flex align-items-center">
                  <span className="fa-stack" style={{ minHeight: "46px", minWidth: "46px" }}>
                    <span className="fa-solid fa-square fa-stack-2x dark__text-opacity-50 text-info-light" data-fa-transform="down-4 rotate--10 left-4"></span>
                    <span className="fa-solid fa-circle fa-stack-2x stack-circle text-stats-circle-info" data-fa-transform="up-4 right-3 grow-2"></span>
                    <span className="fa-stack-1x fa-solid fa-cloud text-info " data-fa-transform="shrink-2 up-8 right-6"></span>
                  </span>
                  <div className="ms-3">
                    <h4 className="mb-0">
                      18 cloud accounts
                    </h4>
                    <p className="text-body-secondary fs-9 mb-0">
                      AWS · GCP · Azure
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <hr className="bg-body-secondary mb-6 mt-4" />
            <div className="row flex-between-center mb-4 g-3">
              <div className="col-auto">
                <h3>
                  Platform spend & traffic
                </h3>
                <p className="text-body-tertiary lh-sm mb-0">
                  Cloud cost + AI cost + API volume across the org
                </p>
              </div>
              <div className="col-8 col-sm-4">
                <select className="form-select form-select-sm" id="select-gross-revenue-month">
                  <option>
                    Mar 1 - 31, 2026
                  </option>
                  <option>
                    April 1 - 30, 2026
                  </option>
                  <option>
                    May 1 - 31, 2026
                  </option>
                </select>
              </div>
            </div>
            <div className="echart-total-sales-chart" style={{ minHeight: "320px", width: "100%" }}></div>
          </div>
          <div className="col-12 col-xxl-6">
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <div className="card h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <div>
                        <h5 className="mb-1">
                          API requests
                          <span className="badge badge-phoenix badge-phoenix-success rounded-pill fs-9 ms-2">
                            <span className="badge-label">
                              +12.4%
                            </span>
                          </span>
                        </h5>
                        <h6 className="text-body-tertiary">
                          Last 7 days
                        </h6>
                      </div>
                      <h4>
                        2.4M
                      </h4>
                    </div>
                    <div className="d-flex justify-content-center px-4 py-6">
                      <div className="echart-total-orders" style={{ height: "85px", width: "115px" }}></div>
                    </div>
                    <div className="mt-2">
                      <div className="d-flex align-items-center mb-2">
                        <div className="bullet-item bg-primary me-2"></div>
                        <h6 className="text-body fw-semibold flex-1 mb-0">
                          Success (2xx)
                        </h6>
                        <h6 className="text-body fw-semibold mb-0">
                          97.2%
                        </h6>
                      </div>
                      <div className="d-flex align-items-center">
                        <div className="bullet-item bg-primary-subtle me-2"></div>
                        <h6 className="text-body fw-semibold flex-1 mb-0">
                          Errors (4xx/5xx)
                        </h6>
                        <h6 className="text-body fw-semibold mb-0">
                          2.8%
                        </h6>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-6">
                <div className="card h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <div>
                        <h5 className="mb-1">
                          AI tool usage
                          <span className="badge badge-phoenix badge-phoenix-warning rounded-pill fs-9 ms-2">
                            <span className="badge-label">
                              +26.5%
                            </span>
                          </span>
                        </h5>
                        <h6 className="text-body-tertiary">
                          Tokens · last 7 days
                        </h6>
                      </div>
                      <h4>
                        48.2M
                      </h4>
                    </div>
                    <div className="pb-0 pt-4">
                      <div className="echarts-new-customers" style={{ height: "180px", width: "100%" }}></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-6">
                <div className="card h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <div>
                        <h5 className="mb-2">
                          AI spend mix
                        </h5>
                        <h6 className="text-body-tertiary">
                          ChatGPT · Claude · Cursor · Copilot
                        </h6>
                      </div>
                    </div>
                    <div className="pb-4 pt-3">
                      <div className="echart-top-coupons" style={{ height: "115px", width: "100%" }}></div>
                    </div>
                    <div>
                      <div className="d-flex align-items-center mb-2">
                        <div className="bullet-item bg-primary me-2"></div>
                        <h6 className="text-body fw-semibold flex-1 mb-0">
                          ChatGPT / OpenAI
                        </h6>
                        <h6 className="text-body fw-semibold mb-0">
                          34%
                        </h6>
                      </div>
                      <div className="d-flex align-items-center mb-2">
                        <div className="bullet-item bg-primary-lighter me-2"></div>
                        <h6 className="text-body fw-semibold flex-1 mb-0">
                          Claude / Anthropic
                        </h6>
                        <h6 className="text-body fw-semibold mb-0">
                          22%
                        </h6>
                      </div>
                      <div className="d-flex align-items-center">
                        <div className="bullet-item bg-info-dark me-2"></div>
                        <h6 className="text-body fw-semibold flex-1 mb-0">
                          Cursor · Copilot · Grok · others
                        </h6>
                        <h6 className="text-body fw-semibold mb-0">
                          44%
                        </h6>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-6">
                <div className="card h-100">
                  <div className="card-body d-flex flex-column">
                    <div className="d-flex justify-content-between">
                      <div>
                        <h5 className="mb-2">
                          ETL pipeline health
                        </h5>
                        <h6 className="text-body-tertiary">
                          Last 7 days
                        </h6>
                      </div>
                    </div>
                    <div className="d-flex justify-content-center pt-3 flex-1">
                      <div className="echarts-paying-customer-chart" style={{ height: "100%", width: "100%" }}></div>
                    </div>
                    <div className="mt-3">
                      <div className="d-flex align-items-center mb-2">
                        <div className="bullet-item bg-primary me-2"></div>
                        <h6 className="text-body fw-semibold flex-1 mb-0">
                          Healthy runs
                        </h6>
                        <h6 className="text-body fw-semibold mb-0">
                          88%
                        </h6>
                      </div>
                      <div className="d-flex align-items-center">
                        <div className="bullet-item bg-primary-subtle me-2"></div>
                        <h6 className="text-body fw-semibold flex-1 mb-0">
                          Failed / delayed
                        </h6>
                        <h6 className="text-body fw-semibold mb-0">
                          12%
                        </h6>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="row gx-6">
        <div className="col-12 col-xl-6">
          <div data-list={"{\"valueNames\":[\"country\",\"users\",\"transactions\",\"revenue\",\"conv-rate\"],\"page\":5,\"filter\":{\"key\":\"country\"}}"}>
            <div className="mb-5 mt-7">
              <div className="row align-items-end justify-content-between g-3">
                <div className="col-auto">
                  <h3>
                    Cloud cost by account
                  </h3>
                  <p className="text-body-tertiary mb-0">
                    Multi-account spend across AWS, GCP, and Azure
                  </p>
                </div>
                <div className="col-12 col-md-auto">
                  <div className="row g-2">
                    <div className="col-auto">
                      <div className="search-box">
                        <form className="position-relative">
                          <input className="form-control search-input search form-control-sm" type="search" placeholder="Search accounts" aria-label="Search" />
                          <span className="fas fa-search search-box-icon"></span>
                        </form>
                      </div>
                    </div>
                    <div className="col-auto">
                      <select className="form-select form-select-sm" data-list-filter="data-list-filter" aria-label="Filter region">
                        <option value="">
                          Region: All
                        </option>
                        <option value="India">
                          India
                        </option>
                        <option value="China">
                          China
                        </option>
                        <option value="USA">
                          USA
                        </option>
                        <option value="South Korea">
                          South Korea
                        </option>
                        <option value="Vietnam">
                          Vietnam
                        </option>
                        <option value="Australia">
                          Australia
                        </option>
                        <option value="England">
                          England
                        </option>
                        <option value="Indonesia">
                          Indonesia
                        </option>
                        <option value="Japan">
                          Japan
                        </option>
                      </select>
                    </div>
                    <div className="col-auto">
                      <select className="form-select form-select-sm" data-obs-sort="data-obs-sort" aria-label="Sort by">
                        <option value="">
                          Sort by
                        </option>
                        <option value="country">
                          Account / region
                        </option>
                        <option value="users">
                          Resources
                        </option>
                        <option value="transactions">
                          Alerts
                        </option>
                        <option value="revenue">
                          Cost
                        </option>
                        <option value="conv-rate">
                          Budget used
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="table-responsive scrollbar">
              <table className="table fs-10 mb-0">
                <thead>
                  <tr>
                    <th className="sort border-top border-translucent ps-0 align-middle" scope="col" data-sort="country" style={{ width: "32%" }}>
                      ACCOUNT / REGION
                    </th>
                    <th className="sort border-top border-translucent align-middle" scope="col" data-sort="users" style={{ width: "17%" }}>
                      RESOURCES
                    </th>
                    <th className="sort border-top border-translucent text-end align-middle" scope="col" data-sort="transactions" style={{ width: "16%" }}>
                      ALERTS
                    </th>
                    <th className="sort border-top border-translucent text-end align-middle" scope="col" data-sort="revenue" style={{ width: "20%" }}>
                      COST
                    </th>
                    <th className="sort border-top border-translucent text-end pe-0 align-middle" scope="col" data-sort="conv-rate" style={{ width: "17%" }}>
                      BUDGET USED
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td></td>
                    <td className="align-middle py-4">
                      <h4 className="mb-0 fw-normal">
                        377,620
                      </h4>
                    </td>
                    <td className="align-middle text-end py-4">
                      <h4 className="mb-0 fw-normal">
                        236
                      </h4>
                    </td>
                    <td className="align-middle text-end py-4">
                      <h4 className="mb-0 fw-normal">
                        $15,758
                      </h4>
                    </td>
                    <td className="align-middle text-end py-4 pe-0">
                      <h4 className="mb-0 fw-normal">
                        10.32%
                      </h4>
                    </td>
                  </tr>
                </tbody>
                <tbody className="list" id="table-regions-by-revenue">
                  <tr>
                    <td className="white-space-nowrap ps-0 country" style={{ width: "32%" }}>
                      <div className="d-flex align-items-center">
                        <h6 className="mb-0 me-3">
                          1.
                        </h6>
                        <a href="#!">
                          <div className="d-flex align-items-center">
                            <img src="/assets/img/country/india.png" alt="" width="24" />
                            <p className="mb-0 ps-3 text-primary fw-bold fs-9">
                              India
                            </p>
                          </div>
                        </a>
                      </div>
                    </td>
                    <td className="align-middle users" style={{ width: "17%" }}>
                      <h6 className="mb-0">
                        92896
                        <span className="text-body-tertiary fw-semibold ms-2">
                          (41.6%)
                        </span>
                      </h6>
                    </td>
                    <td className="align-middle text-end transactions" style={{ width: "17%" }}>
                      <h6 className="mb-0">
                        67
                        <span className="text-body-tertiary fw-semibold ms-2">
                          (34.3%)
                        </span>
                      </h6>
                    </td>
                    <td className="align-middle text-end revenue" style={{ width: "17%" }}>
                      <h6 className="mb-0">
                        $7560
                        <span className="text-body-tertiary fw-semibold ms-2">
                          (36.9%)
                        </span>
                      </h6>
                    </td>
                    <td className="align-middle text-end pe-0 conv-rate" style={{ width: "17%" }}>
                      <h6>
                        14.01%
                      </h6>
                    </td>
                  </tr>
                  <tr>
                    <td className="white-space-nowrap ps-0 country" style={{ width: "32%" }}>
                      <div className="d-flex align-items-center">
                        <h6 className="mb-0 me-3">
                          2.
                        </h6>
                        <a href="#!">
                          <div className="d-flex align-items-center">
                            <img src="/assets/img/country/china.png" alt="" width="24" />
                            <p className="mb-0 ps-3 text-primary fw-bold fs-9">
                              China
                            </p>
                          </div>
                        </a>
                      </div>
                    </td>
                    <td className="align-middle users" style={{ width: "17%" }}>
                      <h6 className="mb-0">
                        50496
                        <span className="text-body-tertiary fw-semibold ms-2">
                          (32.8%)
                        </span>
                      </h6>
                    </td>
                    <td className="align-middle text-end transactions" style={{ width: "17%" }}>
                      <h6 className="mb-0">
                        54
                        <span className="text-body-tertiary fw-semibold ms-2">
                          (23.8%)
                        </span>
                      </h6>
                    </td>
                    <td className="align-middle text-end revenue" style={{ width: "17%" }}>
                      <h6 className="mb-0">
                        $6532
                        <span className="text-body-tertiary fw-semibold ms-2">
                          (26.5%)
                        </span>
                      </h6>
                    </td>
                    <td className="align-middle text-end pe-0 conv-rate" style={{ width: "17%" }}>
                      <h6>
                        23.56%
                      </h6>
                    </td>
                  </tr>
                  <tr>
                    <td className="white-space-nowrap ps-0 country" style={{ width: "32%" }}>
                      <div className="d-flex align-items-center">
                        <h6 className="mb-0 me-3">
                          3.
                        </h6>
                        <a href="#!">
                          <div className="d-flex align-items-center">
                            <img src="/assets/img/country/usa.png" alt="" width="24" />
                            <p className="mb-0 ps-3 text-primary fw-bold fs-9">
                              USA
                            </p>
                          </div>
                        </a>
                      </div>
                    </td>
                    <td className="align-middle users" style={{ width: "17%" }}>
                      <h6 className="mb-0">
                        45679
                        <span className="text-body-tertiary fw-semibold ms-2">
                          (24.3%)
                        </span>
                      </h6>
                    </td>
                    <td className="align-middle text-end transactions" style={{ width: "17%" }}>
                      <h6 className="mb-0">
                        35
                        <span className="text-body-tertiary fw-semibold ms-2">
                          (19.7%)
                        </span>
                      </h6>
                    </td>
                    <td className="align-middle text-end revenue" style={{ width: "17%" }}>
                      <h6 className="mb-0">
                        $5432
                        <span className="text-body-tertiary fw-semibold ms-2">
                          (16.9%)
                        </span>
                      </h6>
                    </td>
                    <td className="align-middle text-end pe-0 conv-rate" style={{ width: "17%" }}>
                      <h6>
                        10.23%
                      </h6>
                    </td>
                  </tr>
                  <tr>
                    <td className="white-space-nowrap ps-0 country" style={{ width: "32%" }}>
                      <div className="d-flex align-items-center">
                        <h6 className="mb-0 me-3">
                          4.
                        </h6>
                        <a href="#!">
                          <div className="d-flex align-items-center">
                            <img src="/assets/img/country/south-korea.png" alt="" width="24" />
                            <p className="mb-0 ps-3 text-primary fw-bold fs-9">
                              South Korea
                            </p>
                          </div>
                        </a>
                      </div>
                    </td>
                    <td className="align-middle users" style={{ width: "17%" }}>
                      <h6 className="mb-0">
                        36453
                        <span className="text-body-tertiary fw-semibold ms-2">
                          (19.7%)
                        </span>
                      </h6>
                    </td>
                    <td className="align-middle text-end transactions" style={{ width: "17%" }}>
                      <h6 className="mb-0">
                        22
                        <span className="text-body-tertiary fw-semibold ms-2">
                          (9.54%)
                        </span>
                      </h6>
                    </td>
                    <td className="align-middle text-end revenue" style={{ width: "17%" }}>
                      <h6 className="mb-0">
                        $4673
                        <span className="text-body-tertiary fw-semibold ms-2">
                          (11.6%)
                        </span>
                      </h6>
                    </td>
                    <td className="align-middle text-end pe-0 conv-rate" style={{ width: "17%" }}>
                      <h6>
                        8.85%
                      </h6>
                    </td>
                  </tr>
                  <tr>
                    <td className="white-space-nowrap ps-0 country" style={{ width: "32%" }}>
                      <div className="d-flex align-items-center">
                        <h6 className="mb-0 me-3">
                          5.
                        </h6>
                        <a href="#!">
                          <div className="d-flex align-items-center">
                            <img src="/assets/img/country/vietnam.png" alt="" width="24" />
                            <p className="mb-0 ps-3 text-primary fw-bold fs-9">
                              Vietnam
                            </p>
                          </div>
                        </a>
                      </div>
                    </td>
                    <td className="align-middle users" style={{ width: "17%" }}>
                      <h6 className="mb-0">
                        15007
                        <span className="text-body-tertiary fw-semibold ms-2">
                          (11.9%)
                        </span>
                      </h6>
                    </td>
                    <td className="align-middle text-end transactions" style={{ width: "17%" }}>
                      <h6 className="mb-0">
                        17
                        <span className="text-body-tertiary fw-semibold ms-2">
                          (6.91%)
                        </span>
                      </h6>
                    </td>
                    <td className="align-middle text-end revenue" style={{ width: "17%" }}>
                      <h6 className="mb-0">
                        $2456
                        <span className="text-body-tertiary fw-semibold ms-2">
                          (10.2%)
                        </span>
                      </h6>
                    </td>
                    <td className="align-middle text-end pe-0 conv-rate" style={{ width: "17%" }}>
                      <h6>
                        6.01%
                      </h6>
                    </td>
                  </tr>
                  <tr>
                    <td className="white-space-nowrap ps-0 country" style={{ width: "32%" }}>
                      <div className="d-flex align-items-center">
                        <h6 className="mb-0 me-3">
                          6.
                        </h6>
                        <a href="#!">
                          <div className="d-flex align-items-center">
                            <img src="/assets/img/country/russia.png" alt="" width="24" />
                            <p className="mb-0 ps-3 text-primary fw-bold fs-9">
                              Russia
                            </p>
                          </div>
                        </a>
                      </div>
                    </td>
                    <td className="align-middle users" style={{ width: "17%" }}>
                      <h6 className="mb-0">
                        54215
                        <span className="text-body-tertiary fw-semibold ms-2">
                          (32.9%)
                        </span>
                      </h6>
                    </td>
                    <td className="align-middle text-end transactions" style={{ width: "17%" }}>
                      <h6 className="mb-0">
                        38
                        <span className="text-body-tertiary fw-semibold ms-2">
                          (7.91%)
                        </span>
                      </h6>
                    </td>
                    <td className="align-middle text-end revenue" style={{ width: "17%" }}>
                      <h6 className="mb-0">
                        $3254
                        <span className="text-body-tertiary fw-semibold ms-2">
                          (12.4%)
                        </span>
                      </h6>
                    </td>
                    <td className="align-middle text-end pe-0 conv-rate" style={{ width: "17%" }}>
                      <h6>
                        6.21%
                      </h6>
                    </td>
                  </tr>
                  <tr>
                    <td className="white-space-nowrap ps-0 country" style={{ width: "32%" }}>
                      <div className="d-flex align-items-center">
                        <h6 className="mb-0 me-3">
                          7.
                        </h6>
                        <a href="#!">
                          <div className="d-flex align-items-center">
                            <img src="/assets/img/country/australia.png" alt="" width="24" />
                            <p className="mb-0 ps-3 text-primary fw-bold fs-9">
                              Australia
                            </p>
                          </div>
                        </a>
                      </div>
                    </td>
                    <td className="align-middle users" style={{ width: "17%" }}>
                      <h6 className="mb-0">
                        54789
                        <span className="text-body-tertiary fw-semibold ms-2">
                          (12.7%)
                        </span>
                      </h6>
                    </td>
                    <td className="align-middle text-end transactions" style={{ width: "17%" }}>
                      <h6 className="mb-0">
                        32
                        <span className="text-body-tertiary fw-semibold ms-2">
                          (14.0%)
                        </span>
                      </h6>
                    </td>
                    <td className="align-middle text-end revenue" style={{ width: "17%" }}>
                      <h6 className="mb-0">
                        $3215
                        <span className="text-body-tertiary fw-semibold ms-2">
                          (5.72%)
                        </span>
                      </h6>
                    </td>
                    <td className="align-middle text-end pe-0 conv-rate" style={{ width: "17%" }}>
                      <h6>
                        12.02%
                      </h6>
                    </td>
                  </tr>
                  <tr>
                    <td className="white-space-nowrap ps-0 country" style={{ width: "32%" }}>
                      <div className="d-flex align-items-center">
                        <h6 className="mb-0 me-3">
                          8.
                        </h6>
                        <a href="#!">
                          <div className="d-flex align-items-center">
                            <img src="/assets/img/country/england.png" alt="" width="24" />
                            <p className="mb-0 ps-3 text-primary fw-bold fs-9">
                              England
                            </p>
                          </div>
                        </a>
                      </div>
                    </td>
                    <td className="align-middle users" style={{ width: "17%" }}>
                      <h6 className="mb-0">
                        14785
                        <span className="text-body-tertiary fw-semibold ms-2">
                          (12.9%)
                        </span>
                      </h6>
                    </td>
                    <td className="align-middle text-end transactions" style={{ width: "17%" }}>
                      <h6 className="mb-0">
                        11
                        <span className="text-body-tertiary fw-semibold ms-2">
                          (32.91%)
                        </span>
                      </h6>
                    </td>
                    <td className="align-middle text-end revenue" style={{ width: "17%" }}>
                      <h6 className="mb-0">
                        $4745
                        <span className="text-body-tertiary fw-semibold ms-2">
                          (10.2%)
                        </span>
                      </h6>
                    </td>
                    <td className="align-middle text-end pe-0 conv-rate" style={{ width: "17%" }}>
                      <h6>
                        8.01%
                      </h6>
                    </td>
                  </tr>
                  <tr>
                    <td className="white-space-nowrap ps-0 country" style={{ width: "32%" }}>
                      <div className="d-flex align-items-center">
                        <h6 className="mb-0 me-3">
                          9.
                        </h6>
                        <a href="#!">
                          <div className="d-flex align-items-center">
                            <img src="/assets/img/country/indonesia.png" alt="" width="24" />
                            <p className="mb-0 ps-3 text-primary fw-bold fs-9">
                              Indonesia
                            </p>
                          </div>
                        </a>
                      </div>
                    </td>
                    <td className="align-middle users" style={{ width: "17%" }}>
                      <h6 className="mb-0">
                        32156
                        <span className="text-body-tertiary fw-semibold ms-2">
                          (32.2%)
                        </span>
                      </h6>
                    </td>
                    <td className="align-middle text-end transactions" style={{ width: "17%" }}>
                      <h6 className="mb-0">
                        89
                        <span className="text-body-tertiary fw-semibold ms-2">
                          (12.0%)
                        </span>
                      </h6>
                    </td>
                    <td className="align-middle text-end revenue" style={{ width: "17%" }}>
                      <h6 className="mb-0">
                        $2456
                        <span className="text-body-tertiary fw-semibold ms-2">
                          (23.2%)
                        </span>
                      </h6>
                    </td>
                    <td className="align-middle text-end pe-0 conv-rate" style={{ width: "17%" }}>
                      <h6>
                        9.07%
                      </h6>
                    </td>
                  </tr>
                  <tr>
                    <td className="white-space-nowrap ps-0 country" style={{ width: "32%" }}>
                      <div className="d-flex align-items-center">
                        <h6 className="mb-0 me-3">
                          10.
                        </h6>
                        <a href="#!">
                          <div className="d-flex align-items-center">
                            <img src="/assets/img/country/japan.png" alt="" width="24" />
                            <p className="mb-0 ps-3 text-primary fw-bold fs-9">
                              Japan
                            </p>
                          </div>
                        </a>
                      </div>
                    </td>
                    <td className="align-middle users" style={{ width: "17%" }}>
                      <h6 className="mb-0">
                        12547
                        <span className="text-body-tertiary fw-semibold ms-2">
                          (12.7%)
                        </span>
                      </h6>
                    </td>
                    <td className="align-middle text-end transactions" style={{ width: "17%" }}>
                      <h6 className="mb-0">
                        21
                        <span className="text-body-tertiary fw-semibold ms-2">
                          (14.91%)
                        </span>
                      </h6>
                    </td>
                    <td className="align-middle text-end revenue" style={{ width: "17%" }}>
                      <h6 className="mb-0">
                        $2541
                        <span className="text-body-tertiary fw-semibold ms-2">
                          (23.2%)
                        </span>
                      </h6>
                    </td>
                    <td className="align-middle text-end pe-0 conv-rate" style={{ width: "17%" }}>
                      <h6>
                        20.01%
                      </h6>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="row align-items-center py-1">
              <div className="pagination d-none"></div>
              <div className="col d-flex fs-9">
                <p className="mb-0 d-none d-sm-block me-3 fw-semibold text-body" data-list-info="data-list-info"></p>
                <a className="fw-semibold" href="#!" data-list-view="*">
                  View all
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
        <div className="col-12 col-xl-6">
          <div className="mx-n4 mx-lg-n6 ms-xl-0 h-100">
            <div className="h-100 w-100">
              <div className="h-100 bg-body-emphasis" id="map" style={{ minHeight: "300px" }}></div>
            </div>
          </div>
        </div>
      </div>
      <div className="mx-n4 px-4 mx-lg-n6 px-lg-6 bg-body-emphasis pt-6 pb-9 border-top">
        <div className="row g-6">
          <div className="col-12 col-xl-6">
            <div className="me-xl-4">
              <div>
                <h3>
                  Forecast vs actual spend
                </h3>
                <p className="mb-1 text-body-tertiary">
                  Budgeted cloud + AI cost vs actual burn
                </p>
              </div>
              <div className="echart-projection-actual" style={{ height: "300px", width: "100%" }}></div>
            </div>
          </div>
          <div className="col-12 col-xl-6">
            <div>
              <h3>
                Alert resolution rate
              </h3>
              <p className="mb-1 text-body-tertiary">
                Share of alerts acknowledged and closed over time
              </p>
            </div>
            <div className="echart-returning-customer" style={{ height: "300px" }}></div>
          </div>
        </div>
      </div>
      <div className="mx-n4 px-4 mx-lg-n6 px-lg-6 bg-body-emphasis pt-7 pb-7 border-top">
        <div data-list={"{\"valueNames\":[\"product\",\"customer\",\"rating\",\"review\",\"status\",\"time\"],\"page\":6,\"filter\":{\"key\":\"status\"}}"}>
          <div className="row align-items-end justify-content-between pb-5 g-3">
            <div className="col-auto">
              <h3>
                Active alerts
              </h3>
              <p className="text-body-tertiary lh-sm mb-0">
                API · AI Gateway · ETL · Cloud · Cost anomalies
              </p>
            </div>
            <div className="col-12 col-md-auto">
              <div className="row g-2 gy-3">
                <div className="col-auto flex-1">
                  <div className="search-box">
                    <form className="position-relative">
                      <input className="form-control search-input search form-control-sm" type="search" placeholder="Search alerts" aria-label="Search" />
                      <span className="fas fa-search search-box-icon"></span>
                    </form>
                  </div>
                </div>
                <div className="col-auto">
                  <select className="form-select form-select-sm" data-list-filter="data-list-filter" aria-label="Filter status">
                    <option value="">
                      Status: All
                    </option>
                    <option value="Critical">
                      Critical
                    </option>
                    <option value="Warning">
                      Warning
                    </option>
                    <option value="Open">
                      Open
                    </option>
                    <option value="Acknowledged">
                      Acknowledged
                    </option>
                    <option value="Resolved">
                      Resolved
                    </option>
                  </select>
                </div>
                <div className="col-auto">
                  <select className="form-select form-select-sm" aria-label="Sort by" data-obs-sort="data-obs-sort">
                    <option value="">
                      Sort by
                    </option>
                    <option value="product">
                      Source
                    </option>
                    <option value="customer">
                      Owner
                    </option>
                    <option value="status">
                      Status
                    </option>
                    <option value="time">
                      Time
                    </option>
                  </select>
                  <button className="btn btn-sm btn-phoenix-secondary bg-body-emphasis bg-body-hover action-btn ms-2" type="button" data-bs-toggle="dropdown" data-boundary="window" aria-haspopup={true} aria-expanded={false} data-bs-reference="parent">
                    <span className="fas fa-ellipsis-h" data-fa-transform="shrink-2"></span>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li>
                      <a className="dropdown-item" href="#">
                        Acknowledge all
                      </a>
                    </li>
                    <li>
                      <a className="dropdown-item" href="#">
                        Mute noise
                      </a>
                    </li>
                    <li>
                      <a className="dropdown-item" href="#">
                        Export
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="table-responsive mx-n1 px-1 scrollbar">
            <table className="table fs-9 mb-0 border-top border-translucent">
              <thead>
                <tr>
                  <th className="white-space-nowrap fs-9 ps-0 align-middle">
                    <div className="form-check mb-0 fs-8">
                      <input className="form-check-input" id="checkbox-bulk-reviews-select" type="checkbox" data-bulk-select={"{\"body\":\"table-latest-review-body\"}"} />
                    </div>
                  </th>
                  <th className="sort white-space-nowrap align-middle" scope="col" style={{ minWidth: "360px" }} data-sort="product">
                    SOURCE / SERVICE
                  </th>
                  <th className="sort align-middle" scope="col" data-sort="customer" style={{ minWidth: "200px" }}>
                    OWNER
                  </th>
                  <th className="sort align-middle" scope="col" data-sort="rating" style={{ minWidth: "110px" }}>
                    SEVERITY
                  </th>
                  <th className="sort align-middle" scope="col" style={{ maxWidth: "350px" }} data-sort="review">
                    MESSAGE
                  </th>
                  <th className="sort text-start ps-5 align-middle" scope="col" data-sort="status">
                    STATUS
                  </th>
                  <th className="sort text-end align-middle" scope="col" data-sort="time">
                    TIME
                  </th>
                  <th className="sort text-end pe-0 align-middle" scope="col"></th>
                </tr>
              </thead>
              <tbody className="list" id="table-latest-review-body">
                <tr className="hover-actions-trigger btn-reveal-trigger position-static">
                  <td className="fs-9 align-middle ps-0">
                    <div className="form-check mb-0 fs-8">
                      <input className="form-check-input" type="checkbox" data-bulk-select-row={"{\"product\":\"API Gateway · /v1/checkout · p99 latency spike\",\"productImage\":\"/products/60x60/1.png\",\"customer\":{\"name\":\"Platform SRE\",\"avatar\":\"\"},\"rating\":5,\"review\":\"p99 latency exceeded 800ms for 12 minutes on checkout API. AI Gateway retries amplified load from Cursor + Copilot agents.\",\"status\":{\"title\":\"Critical\",\"badge\":\"danger\",\"icon\":\"alert-triangle\"},\"time\":\"Just now\"}"} />
                    </div>
                  </td>
                  <td className="align-middle product white-space-nowrap">
                    <a className="fw-semibold" href="#!">
                      API Gateway · /v1/checkout · p99 latency spike
                    </a>
                  </td>
                  <td className="align-middle customer white-space-nowrap">
                    <a className="d-flex align-items-center text-body" href="#!">
                      <div className="avatar avatar-l">
                        <div className="avatar-name rounded-circle">
                          <span>
                            P
                          </span>
                        </div>
                      </div>
                      <h6 className="mb-0 ms-3 text-body">
                        Platform SRE
                      </h6>
                    </a>
                  </td>
                  <td className="align-middle rating white-space-nowrap fs-10">
                    <span className="fa fa-star text-warning"></span>
                    <span className="fa fa-star text-warning"></span>
                    <span className="fa fa-star text-warning"></span>
                    <span className="fa fa-star text-warning"></span>
                    <span className="fa fa-star text-warning"></span>
                  </td>
                  <td className="align-middle review" style={{ minWidth: "350px" }}>
                    <p className="fs-9 fw-semibold text-body-highlight mb-0">
                      p99 latency exceeded 800ms for 12 minutes on checkout API. AI Gateway retries amplified load from Cursor + Copilot agents.
                    </p>
                  </td>
                  <td className="align-middle text-start ps-5 status">
                    <span className="badge badge-phoenix fs-10 badge-phoenix-danger">
                      <span className="badge-label">
                        Critical
                      </span>
                      <span className="ms-1" data-feather="alert-triangle" style={{ height: "12.8px", width: "12.8px" }}></span>
                    </span>
                  </td>
                  <td className="align-middle text-end time white-space-nowrap">
                    <div className="hover-hide">
                      <h6 className="text-body-highlight mb-0">
                        Just now
                      </h6>
                    </div>
                  </td>
                  <td className="align-middle white-space-nowrap text-end pe-0">
                    <div className="position-relative">
                      <div className="hover-actions">
                        <button className="btn btn-sm btn-phoenix-secondary me-1 fs-10">
                          <span className="fas fa-check"></span>
                        </button>
                        <button className="btn btn-sm btn-phoenix-secondary fs-10">
                          <span className="fas fa-trash"></span>
                        </button>
                      </div>
                    </div>
                    <div className="btn-reveal-trigger position-static">
                      <button className="btn btn-sm dropdown-toggle dropdown-caret-none transition-none btn-reveal fs-10" type="button" data-bs-toggle="dropdown" data-boundary="window" aria-haspopup={true} aria-expanded={false} data-bs-reference="parent">
                        <span className="fas fa-ellipsis-h fs-10"></span>
                      </button>
                      <div className="dropdown-menu dropdown-menu-end py-2">
                        <a className="dropdown-item" href="#!">
                          View
                        </a>
                        <a className="dropdown-item" href="#!">
                          Export
                        </a>
                        <div className="dropdown-divider"></div>
                        <a className="dropdown-item text-danger" href="#!">
                          Remove
                        </a>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr className="hover-actions-trigger btn-reveal-trigger position-static">
                  <td className="fs-9 align-middle ps-0">
                    <div className="form-check mb-0 fs-8">
                      <input className="form-check-input" type="checkbox" data-bulk-select-row={"{\"product\":\"AI Cost · OpenAI ChatGPT org-billing\",\"productImage\":\"/products/60x60/2.png\",\"customer\":{\"name\":\"FinOps\",\"avatar\":\"/team/40x40/59.webp\"},\"rating\":4,\"review\":\"Daily OpenAI spend crossed $1.2k threshold. Top consumers: Cursor, Claude API proxy, and BabyLoveGrowth workflows.\",\"status\":{\"title\":\"Warning\",\"badge\":\"warning\",\"icon\":\"alert-circle\"},\"time\":\"Just now\"}"} />
                    </div>
                  </td>
                  <td className="align-middle product white-space-nowrap">
                    <a className="fw-semibold" href="#!">
                      AI Cost · OpenAI ChatGPT org-billing
                    </a>
                  </td>
                  <td className="align-middle customer white-space-nowrap">
                    <a className="d-flex align-items-center text-body" href="#!">
                      <div className="avatar avatar-l">
                        <img className="rounded-circle" src="/assets/img/team/40x40/59.webp" alt="" />
                      </div>
                      <h6 className="mb-0 ms-3 text-body">
                        FinOps
                      </h6>
                    </a>
                  </td>
                  <td className="align-middle rating white-space-nowrap fs-10">
                    <span className="fa fa-star text-warning"></span>
                    <span className="fa fa-star text-warning"></span>
                    <span className="fa fa-star text-warning"></span>
                    <span className="fa fa-star text-warning"></span>
                    <span className="fa-regular fa-star text-warning-light" data-bs-theme="light"></span>
                  </td>
                  <td className="align-middle review" style={{ minWidth: "350px" }}>
                    <p className="fs-9 fw-semibold text-body-highlight mb-0">
                      Daily OpenAI spend crossed $1.2k threshold. Top consumers: Cursor, Claude API proxy, and BabyLoveGrowth workflows.
                    </p>
                  </td>
                  <td className="align-middle text-start ps-5 status">
                    <span className="badge badge-phoenix fs-10 badge-phoenix-warning">
                      <span className="badge-label">
                        Warning
                      </span>
                      <span className="ms-1" data-feather="alert-circle" style={{ height: "12.8px", width: "12.8px" }}></span>
                    </span>
                  </td>
                  <td className="align-middle text-end time white-space-nowrap">
                    <div className="hover-hide">
                      <h6 className="text-body-highlight mb-0">
                        Just now
                      </h6>
                    </div>
                  </td>
                  <td className="align-middle white-space-nowrap text-end pe-0">
                    <div className="position-relative">
                      <div className="hover-actions">
                        <button className="btn btn-sm btn-phoenix-secondary me-1 fs-10">
                          <span className="fas fa-check"></span>
                        </button>
                        <button className="btn btn-sm btn-phoenix-secondary fs-10">
                          <span className="fas fa-trash"></span>
                        </button>
                      </div>
                    </div>
                    <div className="btn-reveal-trigger position-static">
                      <button className="btn btn-sm dropdown-toggle dropdown-caret-none transition-none btn-reveal fs-10" type="button" data-bs-toggle="dropdown" data-boundary="window" aria-haspopup={true} aria-expanded={false} data-bs-reference="parent">
                        <span className="fas fa-ellipsis-h fs-10"></span>
                      </button>
                      <div className="dropdown-menu dropdown-menu-end py-2">
                        <a className="dropdown-item" href="#!">
                          View
                        </a>
                        <a className="dropdown-item" href="#!">
                          Export
                        </a>
                        <div className="dropdown-divider"></div>
                        <a className="dropdown-item text-danger" href="#!">
                          Remove
                        </a>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr className="hover-actions-trigger btn-reveal-trigger position-static">
                  <td className="fs-9 align-middle ps-0">
                    <div className="form-check mb-0 fs-8">
                      <input className="form-check-input" type="checkbox" data-bulk-select-row={"{\"product\":\"ETL · middleware/customer_sync failed\",\"productImage\":\"/products/60x60/3.png\",\"customer\":{\"name\":\"Data Eng\",\"avatar\":\"/team/40x40/58.webp\"},\"rating\":3,\"review\":\"ELT job customer_sync aborted after S3 extract timeout. Downstream warehouse load skipped for account batch 14.\",\"status\":{\"title\":\"Open\",\"badge\":\"warning\",\"icon\":\"clock\"},\"time\":\"1 hour ago\"}"} />
                    </div>
                  </td>
                  <td className="align-middle product white-space-nowrap">
                    <a className="fw-semibold" href="#!">
                      ETL · middleware/customer_sync failed
                    </a>
                  </td>
                  <td className="align-middle customer white-space-nowrap">
                    <a className="d-flex align-items-center text-body" href="#!">
                      <div className="avatar avatar-l">
                        <img className="rounded-circle" src="/assets/img/team/40x40/58.webp" alt="" />
                      </div>
                      <h6 className="mb-0 ms-3 text-body">
                        Data Eng
                      </h6>
                    </a>
                  </td>
                  <td className="align-middle rating white-space-nowrap fs-10">
                    <span className="fa fa-star text-warning"></span>
                    <span className="fa fa-star text-warning"></span>
                    <span className="fa fa-star text-warning"></span>
                    <span className="fa-regular fa-star text-warning-light" data-bs-theme="light"></span>
                    <span className="fa-regular fa-star text-warning-light" data-bs-theme="light"></span>
                  </td>
                  <td className="align-middle review" style={{ minWidth: "350px" }}>
                    <p className="fs-9 fw-semibold text-body-highlight mb-0">
                      ELT job customer_sync aborted after S3 extract timeout. Downstream warehouse load skipped for account batch 14.
                    </p>
                  </td>
                  <td className="align-middle text-start ps-5 status">
                    <span className="badge badge-phoenix fs-10 badge-phoenix-warning">
                      <span className="badge-label">
                        Open
                      </span>
                      <span className="ms-1" data-feather="clock" style={{ height: "12.8px", width: "12.8px" }}></span>
                    </span>
                  </td>
                  <td className="align-middle text-end time white-space-nowrap">
                    <div className="hover-hide">
                      <h6 className="text-body-highlight mb-0">
                        1 hour ago
                      </h6>
                    </div>
                  </td>
                  <td className="align-middle white-space-nowrap text-end pe-0">
                    <div className="position-relative">
                      <div className="hover-actions">
                        <button className="btn btn-sm btn-phoenix-secondary me-1 fs-10">
                          <span className="fas fa-check"></span>
                        </button>
                        <button className="btn btn-sm btn-phoenix-secondary fs-10">
                          <span className="fas fa-trash"></span>
                        </button>
                      </div>
                    </div>
                    <div className="btn-reveal-trigger position-static">
                      <button className="btn btn-sm dropdown-toggle dropdown-caret-none transition-none btn-reveal fs-10" type="button" data-bs-toggle="dropdown" data-boundary="window" aria-haspopup={true} aria-expanded={false} data-bs-reference="parent">
                        <span className="fas fa-ellipsis-h fs-10"></span>
                      </button>
                      <div className="dropdown-menu dropdown-menu-end py-2">
                        <a className="dropdown-item" href="#!">
                          View
                        </a>
                        <a className="dropdown-item" href="#!">
                          Export
                        </a>
                        <div className="dropdown-divider"></div>
                        <a className="dropdown-item text-danger" href="#!">
                          Remove
                        </a>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr className="hover-actions-trigger btn-reveal-trigger position-static">
                  <td className="fs-9 align-middle ps-0">
                    <div className="form-check mb-0 fs-8">
                      <input className="form-check-input" type="checkbox" data-bulk-select-row={"{\"product\":\"AWS · prod-us-east-1 cost anomaly\",\"productImage\":\"/products/60x60/4.png\",\"customer\":{\"name\":\"Cloud Ops\",\"avatar\":\"\"},\"rating\":5,\"review\":\"EC2 + Lambda spend +38% WoW across 6 linked accounts. Azure and GCP remain within forecast.\",\"status\":{\"title\":\"Acknowledged\",\"badge\":\"info\",\"icon\":\"check\"},\"time\":\"2 hours ago\"}"} />
                    </div>
                  </td>
                  <td className="align-middle product white-space-nowrap">
                    <a className="fw-semibold" href="#!">
                      AWS · prod-us-east-1 cost anomaly
                    </a>
                  </td>
                  <td className="align-middle customer white-space-nowrap">
                    <a className="d-flex align-items-center text-body" href="#!">
                      <div className="avatar avatar-l">
                        <div className="avatar-name rounded-circle">
                          <span>
                            C
                          </span>
                        </div>
                      </div>
                      <h6 className="mb-0 ms-3 text-body">
                        Cloud Ops
                      </h6>
                    </a>
                  </td>
                  <td className="align-middle rating white-space-nowrap fs-10">
                    <span className="fa fa-star text-warning"></span>
                    <span className="fa fa-star text-warning"></span>
                    <span className="fa fa-star text-warning"></span>
                    <span className="fa fa-star text-warning"></span>
                    <span className="fa fa-star text-warning"></span>
                  </td>
                  <td className="align-middle review" style={{ minWidth: "350px" }}>
                    <p className="fs-9 fw-semibold text-body-highlight mb-0">
                      EC2 + Lambda spend +38% WoW across 6 linked accounts. Azure and GCP remain within forecast.
                    </p>
                  </td>
                  <td className="align-middle text-start ps-5 status">
                    <span className="badge badge-phoenix fs-10 badge-phoenix-info">
                      <span className="badge-label">
                        Acknowledged
                      </span>
                      <span className="ms-1" data-feather="check" style={{ height: "12.8px", width: "12.8px" }}></span>
                    </span>
                  </td>
                  <td className="align-middle text-end time white-space-nowrap">
                    <div className="hover-hide">
                      <h6 className="text-body-highlight mb-0">
                        2 hours ago
                      </h6>
                    </div>
                  </td>
                  <td className="align-middle white-space-nowrap text-end pe-0">
                    <div className="position-relative">
                      <div className="hover-actions">
                        <button className="btn btn-sm btn-phoenix-secondary me-1 fs-10">
                          <span className="fas fa-check"></span>
                        </button>
                        <button className="btn btn-sm btn-phoenix-secondary fs-10">
                          <span className="fas fa-trash"></span>
                        </button>
                      </div>
                    </div>
                    <div className="btn-reveal-trigger position-static">
                      <button className="btn btn-sm dropdown-toggle dropdown-caret-none transition-none btn-reveal fs-10" type="button" data-bs-toggle="dropdown" data-boundary="window" aria-haspopup={true} aria-expanded={false} data-bs-reference="parent">
                        <span className="fas fa-ellipsis-h fs-10"></span>
                      </button>
                      <div className="dropdown-menu dropdown-menu-end py-2">
                        <a className="dropdown-item" href="#!">
                          View
                        </a>
                        <a className="dropdown-item" href="#!">
                          Export
                        </a>
                        <div className="dropdown-divider"></div>
                        <a className="dropdown-item text-danger" href="#!">
                          Remove
                        </a>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr className="hover-actions-trigger btn-reveal-trigger position-static">
                  <td className="fs-9 align-middle ps-0">
                    <div className="form-check mb-0 fs-8">
                      <input className="form-check-input" type="checkbox" data-bulk-select-row={"{\"product\":\"AI Gateway · Claude rate limit\",\"productImage\":\"/products/60x60/5.png\",\"customer\":{\"name\":\"AI Platform\",\"avatar\":\"/team/40x40/57.webp\"},\"rating\":2,\"review\":\"Anthropic Claude tier hit RPM ceiling. Fallback routed to Grok and GitHub Copilot for non-critical prompts.\",\"status\":{\"title\":\"Resolved\",\"badge\":\"success\",\"icon\":\"check\"},\"time\":\"3 hours ago\"}"} />
                    </div>
                  </td>
                  <td className="align-middle product white-space-nowrap">
                    <a className="fw-semibold" href="#!">
                      AI Gateway · Claude rate limit
                    </a>
                  </td>
                  <td className="align-middle customer white-space-nowrap">
                    <a className="d-flex align-items-center text-body" href="#!">
                      <div className="avatar avatar-l">
                        <img className="rounded-circle" src="/assets/img/team/40x40/57.webp" alt="" />
                      </div>
                      <h6 className="mb-0 ms-3 text-body">
                        AI Platform
                      </h6>
                    </a>
                  </td>
                  <td className="align-middle rating white-space-nowrap fs-10">
                    <span className="fa fa-star text-warning"></span>
                    <span className="fa fa-star text-warning"></span>
                    <span className="fa-regular fa-star text-warning-light" data-bs-theme="light"></span>
                    <span className="fa-regular fa-star text-warning-light" data-bs-theme="light"></span>
                    <span className="fa-regular fa-star text-warning-light" data-bs-theme="light"></span>
                  </td>
                  <td className="align-middle review" style={{ minWidth: "350px" }}>
                    <p className="fs-9 fw-semibold text-body-highlight mb-0">
                      Anthropic Claude tier hit RPM ceiling. Fallback routed to Grok and GitHub Copilot for non-critical prompts.
                    </p>
                  </td>
                  <td className="align-middle text-start ps-5 status">
                    <span className="badge badge-phoenix fs-10 badge-phoenix-success">
                      <span className="badge-label">
                        Resolved
                      </span>
                      <span className="ms-1" data-feather="check" style={{ height: "12.8px", width: "12.8px" }}></span>
                    </span>
                  </td>
                  <td className="align-middle text-end time white-space-nowrap">
                    <div className="hover-hide">
                      <h6 className="text-body-highlight mb-0">
                        3 hours ago
                      </h6>
                    </div>
                  </td>
                  <td className="align-middle white-space-nowrap text-end pe-0">
                    <div className="position-relative">
                      <div className="hover-actions">
                        <button className="btn btn-sm btn-phoenix-secondary me-1 fs-10">
                          <span className="fas fa-check"></span>
                        </button>
                        <button className="btn btn-sm btn-phoenix-secondary fs-10">
                          <span className="fas fa-trash"></span>
                        </button>
                      </div>
                    </div>
                    <div className="btn-reveal-trigger position-static">
                      <button className="btn btn-sm dropdown-toggle dropdown-caret-none transition-none btn-reveal fs-10" type="button" data-bs-toggle="dropdown" data-boundary="window" aria-haspopup={true} aria-expanded={false} data-bs-reference="parent">
                        <span className="fas fa-ellipsis-h fs-10"></span>
                      </button>
                      <div className="dropdown-menu dropdown-menu-end py-2">
                        <a className="dropdown-item" href="#!">
                          View
                        </a>
                        <a className="dropdown-item" href="#!">
                          Export
                        </a>
                        <div className="dropdown-divider"></div>
                        <a className="dropdown-item text-danger" href="#!">
                          Remove
                        </a>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr className="hover-actions-trigger btn-reveal-trigger position-static">
                  <td className="fs-9 align-middle ps-0">
                    <div className="form-check mb-0 fs-8">
                      <input className="form-check-input" type="checkbox" data-bulk-select-row={"{\"product\":\"GCP · analytics-billing project\",\"productImage\":\"/products/60x60/6.png\",\"customer\":{\"name\":\"FinOps\",\"avatar\":\"/team/40x40/3.webp\"},\"rating\":4,\"review\":\"BigQuery on-demand bytes scanned exceeded budget guardrail. Recommend slot reservations for ETL monitoring workloads.\",\"status\":{\"title\":\"Open\",\"badge\":\"warning\",\"icon\":\"alert-circle\"},\"time\":\"Yesterday\"}"} />
                    </div>
                  </td>
                  <td className="align-middle product white-space-nowrap">
                    <a className="fw-semibold" href="#!">
                      GCP · analytics-billing project
                    </a>
                  </td>
                  <td className="align-middle customer white-space-nowrap">
                    <a className="d-flex align-items-center text-body" href="#!">
                      <div className="avatar avatar-l">
                        <img className="rounded-circle" src="/assets/img/team/40x40/3.webp" alt="" />
                      </div>
                      <h6 className="mb-0 ms-3 text-body">
                        FinOps
                      </h6>
                    </a>
                  </td>
                  <td className="align-middle rating white-space-nowrap fs-10">
                    <span className="fa fa-star text-warning"></span>
                    <span className="fa fa-star text-warning"></span>
                    <span className="fa fa-star text-warning"></span>
                    <span className="fa fa-star text-warning"></span>
                    <span className="fa-regular fa-star text-warning-light" data-bs-theme="light"></span>
                  </td>
                  <td className="align-middle review" style={{ minWidth: "350px" }}>
                    <p className="fs-9 fw-semibold text-body-highlight mb-0">
                      BigQuery on-demand bytes scanned exceeded budget guardrail. Recommend slot reservations for ETL monitoring workloads.
                    </p>
                  </td>
                  <td className="align-middle text-start ps-5 status">
                    <span className="badge badge-phoenix fs-10 badge-phoenix-warning">
                      <span className="badge-label">
                        Open
                      </span>
                      <span className="ms-1" data-feather="alert-circle" style={{ height: "12.8px", width: "12.8px" }}></span>
                    </span>
                  </td>
                  <td className="align-middle text-end time white-space-nowrap">
                    <div className="hover-hide">
                      <h6 className="text-body-highlight mb-0">
                        Yesterday
                      </h6>
                    </div>
                  </td>
                  <td className="align-middle white-space-nowrap text-end pe-0">
                    <div className="position-relative">
                      <div className="hover-actions">
                        <button className="btn btn-sm btn-phoenix-secondary me-1 fs-10">
                          <span className="fas fa-check"></span>
                        </button>
                        <button className="btn btn-sm btn-phoenix-secondary fs-10">
                          <span className="fas fa-trash"></span>
                        </button>
                      </div>
                    </div>
                    <div className="btn-reveal-trigger position-static">
                      <button className="btn btn-sm dropdown-toggle dropdown-caret-none transition-none btn-reveal fs-10" type="button" data-bs-toggle="dropdown" data-boundary="window" aria-haspopup={true} aria-expanded={false} data-bs-reference="parent">
                        <span className="fas fa-ellipsis-h fs-10"></span>
                      </button>
                      <div className="dropdown-menu dropdown-menu-end py-2">
                        <a className="dropdown-item" href="#!">
                          View
                        </a>
                        <a className="dropdown-item" href="#!">
                          Export
                        </a>
                        <div className="dropdown-divider"></div>
                        <a className="dropdown-item text-danger" href="#!">
                          Remove
                        </a>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="row align-items-center py-1">
            <div className="pagination d-none"></div>
            <div className="col d-flex fs-9">
              <p className="mb-0 d-none d-sm-block me-3 fw-semibold text-body" data-list-info="data-list-info"></p>
              <a className="fw-semibold" href="#!" data-list-view="*">
                View all
                <span className="fas fa-angle-right ms-1" data-fa-transform="down-1"></span>
              </a>
              <a className="fw-semibold d-none" href="#!" data-list-view="less">
                View Less
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
    </AppLayout>
  )
}
