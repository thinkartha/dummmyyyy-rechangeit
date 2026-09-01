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
            AI Gateway
          </li>
        </ol>
      </nav>
      <div className="mb-6">
        <div className="row align-items-center g-3">
          <div className="col">
            <h2 className="mb-2">
              AI Gateway
            </h2>
            <h5 className="text-body-tertiary fw-semibold mb-0">
              Route, rate-limit, observe, and fall back across AI tools and model providers
            </h5>
          </div>
          <div className="col-auto">
            <button className="btn btn-primary" type="button" data-lhb-action="addAiRoute">
              Add AI route
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
                    AI calls (24h)
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat">
                    2.4M
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-success" data-obs-stat-delta="data-obs-stat-delta">
                  +14%
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
                    Rate-limit hits
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat">
                    1.8k
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-warning" data-obs-stat-delta="data-obs-stat-delta">
                  +5%
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
                    Fallback activations
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat">
                    312
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-info" data-obs-stat-delta="data-obs-stat-delta">
                  auto
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
                    Avg route latency
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat">
                    420ms
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-success" data-obs-stat-delta="data-obs-stat-delta">
                  -35ms
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="obs-list-root" data-list={"{\"valueNames\":[\"col0\",\"col1\",\"col2\",\"col3\",\"col4\",\"col5\"],\"page\":5,\"filter\":{\"key\":\"col5\"}}"} data-live-table="aiGateway">
        <div className="card">
          <div className="card-header border-bottom border-translucent py-3">
            <div className="row align-items-center g-2 mb-3">
              <div className="col">
                <h4 className="mb-0">
                  AI tool routes
                </h4>
                <p className="text-body-tertiary fs-9 mb-0">
                  Claude · Cursor · ChatGPT · Grok · Lovable · DeepSeek · Copilot · BabyLoveGrowth and more
                </p>
              </div>
            </div>
            <div className="row align-items-center g-2">
              <div className="col-12 col-md">
                <div className="search-box w-100">
                  <form className="position-relative">
                    <input className="form-control search-input search form-control-sm" type="search" placeholder="Search AI routes" aria-label="Search" />
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
                  <option value="Watch">
                    Watch
                  </option>
                </select>
              </div>
              <div className="col-6 col-md-auto">
                <select className="form-select form-select-sm" aria-label="Sort by" data-obs-sort="data-obs-sort">
                  <option value="">
                    Sort by
                  </option>
                  <option value="col0">
                    Route / tool
                  </option>
                  <option value="col1">
                    Provider
                  </option>
                  <option value="col2">
                    Primary model
                  </option>
                  <option value="col3">
                    Fallback
                  </option>
                  <option value="col4">
                    RPM
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
                      Route / tool
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col1">
                      Provider
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col2">
                      Primary model
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col3">
                      Fallback
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col4">
                      RPM
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
                        <span className="me-2 fa-solid fa-robot text-success"></span>
                        <div>
                          <h6 className="mb-0">
                            Claude
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            chat.completions
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Anthropic
                    </td>
                    <td className="align-middle col2">
                      claude-sonnet
                    </td>
                    <td className="align-middle col3">
                      GPT-4.1
                    </td>
                    <td className="align-middle col4">
                      12k
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
                        <span className="me-2 fa-solid fa-code text-primary"></span>
                        <div>
                          <h6 className="mb-0">
                            Cursor
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            agent + inline
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Cursor
                    </td>
                    <td className="align-middle col2">
                      claude-sonnet
                    </td>
                    <td className="align-middle col3">
                      GPT-4.1
                    </td>
                    <td className="align-middle col4">
                      18k
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
                        <span className="me-2 fa-solid fa-comments text-success"></span>
                        <div>
                          <h6 className="mb-0">
                            ChatGPT
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            org workspace
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      OpenAI
                    </td>
                    <td className="align-middle col2">
                      gpt-4.1
                    </td>
                    <td className="align-middle col3">
                      Grok
                    </td>
                    <td className="align-middle col4">
                      22k
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
                        <span className="me-2 fa-solid fa-bolt text-warning"></span>
                        <div>
                          <h6 className="mb-0">
                            Grok
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            xai
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      xAI
                    </td>
                    <td className="align-middle col2">
                      grok-2
                    </td>
                    <td className="align-middle col3">
                      DeepSeek
                    </td>
                    <td className="align-middle col4">
                      6k
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
                        <span className="me-2 fa-solid fa-wand-magic-sparkles text-info"></span>
                        <div>
                          <h6 className="mb-0">
                            Lovable
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            app gen
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Lovable
                    </td>
                    <td className="align-middle col2">
                      lovable-default
                    </td>
                    <td className="align-middle col3">
                      Claude
                    </td>
                    <td className="align-middle col4">
                      2k
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
                        <span className="me-2 fa-solid fa-microchip text-info"></span>
                        <div>
                          <h6 className="mb-0">
                            DeepSeek
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            chat
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      DeepSeek
                    </td>
                    <td className="align-middle col2">
                      deepseek-v3
                    </td>
                    <td className="align-middle col3">
                      Claude
                    </td>
                    <td className="align-middle col4">
                      4k
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
                        <span className="me-2 fa-brands fa-github text-secondary"></span>
                        <div>
                          <h6 className="mb-0">
                            GitHub Copilot
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            ide
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      GitHub
                    </td>
                    <td className="align-middle col2">
                      copilot-chat
                    </td>
                    <td className="align-middle col3">
                      Claude
                    </td>
                    <td className="align-middle col4">
                      9k
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
                        <span className="me-2 fa-brands fa-windows text-info"></span>
                        <div>
                          <h6 className="mb-0">
                            Microsoft Copilot
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            m365
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Microsoft
                    </td>
                    <td className="align-middle col2">
                      copilot-studio
                    </td>
                    <td className="align-middle col3">
                      GPT-4.1
                    </td>
                    <td className="align-middle col4">
                      5k
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
                        <span className="me-2 fa-solid fa-seedling text-success"></span>
                        <div>
                          <h6 className="mb-0">
                            BabyLoveGrowth
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            growth
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      BabyLoveGrowth
                    </td>
                    <td className="align-middle col2">
                      blg-default
                    </td>
                    <td className="align-middle col3">
                      ChatGPT
                    </td>
                    <td className="align-middle col4">
                      1k
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
      <div className="card mt-4">
        <div className="card-body">
          <h5 className="mb-2">
            AI routing policies
          </h5>
          <p className="text-body-tertiary mb-3">
            Fallback order when quota, latency, or provider errors breach SLOs.
          </p>
          <ul className="mb-0">
            <li>
              Claude → GPT-4.1 → Grok → DeepSeek
            </li>
            <li>
              Cursor agent traffic prefers Claude, then GitHub Copilot
            </li>
            <li>
              Lovable / BabyLoveGrowth fall back to ChatGPT when vendor APIs throttle
            </li>
          </ul>
        </div>
      </div>
    </AppLayout>
  )
}
