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
            AI Cost & Usage
          </li>
        </ol>
      </nav>
      <div className="mb-6">
        <div className="row align-items-center g-3">
          <div className="col">
            <h2 className="mb-2">
              AI Cost & Usage
            </h2>
            <h5 className="text-body-tertiary fw-semibold mb-0">
              Token usage and billing for ChatGPT, Claude, Cursor, Copilot, Grok, Lovable, and more
            </h5>
          </div>
          <div className="col-auto">
            <button className="btn btn-primary" type="button" data-lhb-action="setAiBudget">
              Set AI budget
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
                    MTD AI spend
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat">
                    $12.8k
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-warning" data-obs-stat-delta="data-obs-stat-delta">
                  +18%
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
                    Tokens MTD
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat">
                    162M
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-info" data-obs-stat-delta="data-obs-stat-delta">
                  +22%
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
                    Top tool
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat">
                    ChatGPT
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-primary" data-obs-stat-delta="data-obs-stat-delta">
                  34%
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
                    Budget remaining
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat">
                    $2.2k
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-success" data-obs-stat-delta="data-obs-stat-delta">
                  of $15k
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="obs-list-root" data-list={"{\"valueNames\":[\"col0\",\"col1\",\"col2\",\"col3\",\"col4\",\"col5\"],\"page\":5,\"filter\":{\"key\":\"col5\"}}"} data-live-table="aiCost">
        <div className="card">
          <div className="card-header border-bottom border-translucent py-3">
            <div className="row align-items-center g-2 mb-3">
              <div className="col">
                <h4 className="mb-0">
                  Cost by AI tool
                </h4>
                <p className="text-body-tertiary fs-9 mb-0">
                  Organization-wide AI FinOps
                </p>
              </div>
            </div>
            <div className="row align-items-center g-2">
              <div className="col-12 col-md">
                <div className="search-box w-100">
                  <form className="position-relative">
                    <input className="form-control search-input search form-control-sm" type="search" placeholder="Search tools" aria-label="Search" />
                    <span className="fas fa-search search-box-icon"></span>
                  </form>
                </div>
              </div>
              <div className="col-6 col-md-auto">
                <select className="form-select form-select-sm" data-list-filter="data-list-filter" aria-label="Filter">
                  <option value="">
                    Filter: All
                  </option>
                  <option value="On track">
                    On track
                  </option>
                  <option value="Watch">
                    Watch
                  </option>
                  <option value="Over">
                    Over
                  </option>
                </select>
              </div>
              <div className="col-6 col-md-auto">
                <select className="form-select form-select-sm" aria-label="Sort by" data-obs-sort="data-obs-sort">
                  <option value="">
                    Sort by
                  </option>
                  <option value="col0">
                    Tool
                  </option>
                  <option value="col1">
                    Vendor
                  </option>
                  <option value="col2">
                    Tokens MTD
                  </option>
                  <option value="col3">
                    Spend MTD
                  </option>
                  <option value="col4">
                    Budget
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
                      Tool
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col1">
                      Vendor
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col2">
                      Tokens MTD
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col3">
                      Spend MTD
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col4">
                      Budget
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
                        <span className="me-2 fa-solid fa-comments text-success"></span>
                        <div>
                          <h6 className="mb-0">
                            ChatGPT
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            openai
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      OpenAI
                    </td>
                    <td className="align-middle col2">
                      48M
                    </td>
                    <td className="align-middle col3">
                      $4.1k
                    </td>
                    <td className="align-middle col4">
                      $4.5k
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        On track
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-robot text-success"></span>
                        <div>
                          <h6 className="mb-0">
                            Claude
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            anthropic
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Anthropic
                    </td>
                    <td className="align-middle col2">
                      31M
                    </td>
                    <td className="align-middle col3">
                      $2.9k
                    </td>
                    <td className="align-middle col4">
                      $3.0k
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-info">
                        Watch
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-code text-primary"></span>
                        <div>
                          <h6 className="mb-0">
                            Cursor
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            cursor
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Cursor
                    </td>
                    <td className="align-middle col2">
                      29M
                    </td>
                    <td className="align-middle col3">
                      $2.6k
                    </td>
                    <td className="align-middle col4">
                      $2.5k
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-danger">
                        Over
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-brands fa-github text-secondary"></span>
                        <div>
                          <h6 className="mb-0">
                            GitHub Copilot
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            copilot
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      GitHub
                    </td>
                    <td className="align-middle col2">
                      18M
                    </td>
                    <td className="align-middle col3">
                      $1.1k
                    </td>
                    <td className="align-middle col4">
                      $1.2k
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        On track
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-bolt text-warning"></span>
                        <div>
                          <h6 className="mb-0">
                            Grok
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            grok
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      xAI
                    </td>
                    <td className="align-middle col2">
                      12M
                    </td>
                    <td className="align-middle col3">
                      $0.9k
                    </td>
                    <td className="align-middle col4">
                      $1.0k
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        On track
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-wand-magic-sparkles text-info"></span>
                        <div>
                          <h6 className="mb-0">
                            Lovable
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            lovable
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Lovable
                    </td>
                    <td className="align-middle col2">
                      7M
                    </td>
                    <td className="align-middle col3">
                      $0.5k
                    </td>
                    <td className="align-middle col4">
                      $0.6k
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        On track
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-seedling text-success"></span>
                        <div>
                          <h6 className="mb-0">
                            BabyLoveGrowth
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            babylovegrowth
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      BabyLoveGrowth
                    </td>
                    <td className="align-middle col2">
                      4M
                    </td>
                    <td className="align-middle col3">
                      $0.3k
                    </td>
                    <td className="align-middle col4">
                      $0.4k
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        On track
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="align-middle ps-3 py-3 col0">
                      <div className="d-flex align-items-center">
                        <span className="me-2 fa-solid fa-microchip text-info"></span>
                        <div>
                          <h6 className="mb-0">
                            DeepSeek
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            deepseek
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      DeepSeek
                    </td>
                    <td className="align-middle col2">
                      8M
                    </td>
                    <td className="align-middle col3">
                      $0.2k
                    </td>
                    <td className="align-middle col4">
                      $0.3k
                    </td>
                    <td className="align-middle col5">
                      <span className="badge badge-phoenix badge-phoenix-success">
                        On track
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
