import AppLayout from '@/components/app-layout'

export default function Page() {
  return (
    <AppLayout scripts={[
        {
          "code": "\n          (function() {\n            document.querySelectorAll('[data-obs-sort]').forEach(function(select) {\n              if (select.dataset.bound === '1') return;\n              select.dataset.bound = '1';\n              select.addEventListener('change', function() {\n                var key = select.value;\n                if (!key) return;\n                var root = select.closest('[data-list]');\n                if (!root) return;\n                var header = root.querySelector('th[data-sort=\"' + key + '\"]');\n                if (header) header.click();\n              });\n            });\n          })();\n        "
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
            AI Monitoring
          </li>
        </ol>
      </nav>
      <div className="mb-6">
        <div className="row align-items-center g-3">
          <div className="col">
            <h2 className="mb-2">
              AI Monitoring
            </h2>
            <h5 className="text-body-tertiary fw-semibold mb-0">
              Usage, latency, failures, and spend across AI developer tools and models
            </h5>
          </div>
          <div className="col-auto">
            <button className="btn btn-primary" type="button" data-lhb-action="connectAiTool">
              Connect AI tool
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
                    Tokens (7d)
                  </h6>
                  <h3 className="mb-0">
                    48.2M
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-warning">
                  +26%
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
                    AI spend (7d)
                  </h6>
                  <h3 className="mb-0">
                    $4,280
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-warning">
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
                    Active tools
                  </h6>
                  <h3 className="mb-0">
                    11
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-info">
                  org-wide
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
                    Failed calls
                  </h6>
                  <h3 className="mb-0">
                    1.2%
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-success">
                  -0.3%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="obs-list-root" data-list={"{\"valueNames\":[\"col0\",\"col1\",\"col2\",\"col3\",\"col4\",\"col5\"],\"page\":5,\"filter\":{\"key\":\"col5\"}}"} data-live-table="aiAgents">
        <div className="card">
          <div className="card-header border-bottom border-translucent py-3">
            <div className="row align-items-center g-2 mb-3">
              <div className="col">
                <h4 className="mb-0">
                  AI tools & providers
                </h4>
                <p className="text-body-tertiary fs-9 mb-0">
                  Claude · Cursor · Lovable · Grok · ChatGPT · BabyLoveGrowth · DeepSeek · GitHub Copilot and more
                </p>
              </div>
            </div>
            <div className="row align-items-center g-2">
              <div className="col-12 col-md">
                <div className="search-box w-100">
                  <form className="position-relative">
                    <input className="form-control search-input search form-control-sm" type="search" placeholder="Search AI tools" aria-label="Search" />
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
                    Tool
                  </option>
                  <option value="col1">
                    Vendor
                  </option>
                  <option value="col2">
                    Users
                  </option>
                  <option value="col3">
                    Tokens / 7d
                  </option>
                  <option value="col4">
                    Spend
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
                      Users
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col3">
                      Tokens / 7d
                    </th>
                    <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col4">
                      Spend
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
                      86
                    </td>
                    <td className="align-middle col3">
                      9.4M
                    </td>
                    <td className="align-middle col4">
                      $980
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
                            ide-agent
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Cursor
                    </td>
                    <td className="align-middle col2">
                      124
                    </td>
                    <td className="align-middle col3">
                      11.2M
                    </td>
                    <td className="align-middle col4">
                      $1,140
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
                        <span className="me-2 fa-solid fa-wand-magic-sparkles text-info"></span>
                        <div>
                          <h6 className="mb-0">
                            Lovable
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            app-builder
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Lovable
                    </td>
                    <td className="align-middle col2">
                      18
                    </td>
                    <td className="align-middle col3">
                      2.1M
                    </td>
                    <td className="align-middle col4">
                      $260
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
                      42
                    </td>
                    <td className="align-middle col3">
                      3.8M
                    </td>
                    <td className="align-middle col4">
                      $410
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
                      210
                    </td>
                    <td className="align-middle col3">
                      14.6M
                    </td>
                    <td className="align-middle col4">
                      $1,320
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
                      9
                    </td>
                    <td className="align-middle col3">
                      1.0M
                    </td>
                    <td className="align-middle col4">
                      $95
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
                            deepseek
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      DeepSeek
                    </td>
                    <td className="align-middle col2">
                      27
                    </td>
                    <td className="align-middle col3">
                      2.4M
                    </td>
                    <td className="align-middle col4">
                      $120
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
                            copilot
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      GitHub / Microsoft
                    </td>
                    <td className="align-middle col2">
                      156
                    </td>
                    <td className="align-middle col3">
                      6.7M
                    </td>
                    <td className="align-middle col4">
                      $540
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
                            ms-copilot
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Microsoft
                    </td>
                    <td className="align-middle col2">
                      73
                    </td>
                    <td className="align-middle col3">
                      3.1M
                    </td>
                    <td className="align-middle col4">
                      $290
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
                        <span className="me-2 fa-solid fa-brain text-primary"></span>
                        <div>
                          <h6 className="mb-0">
                            Gemini
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            gemini
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Google
                    </td>
                    <td className="align-middle col2">
                      35
                    </td>
                    <td className="align-middle col3">
                      2.0M
                    </td>
                    <td className="align-middle col4">
                      $175
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
                        <span className="me-2 fa-solid fa-fire text-danger"></span>
                        <div>
                          <h6 className="mb-0">
                            Mistral
                          </h6>
                          <p className="text-body-tertiary fs-10 mb-0">
                            mistral
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle col1">
                      Mistral AI
                    </td>
                    <td className="align-middle col2">
                      14
                    </td>
                    <td className="align-middle col3">
                      0.9M
                    </td>
                    <td className="align-middle col4">
                      $80
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
      <div className="row g-4 mt-0">
        <div className="col-12 col-xl-7">
          <div className="obs-list-root" data-list={"{\"valueNames\":[\"col0\",\"col1\",\"col2\",\"col3\",\"col4\",\"col5\"],\"page\":6,\"filter\":{\"key\":\"col5\"}}"} data-live-table="agentWorkflows">
            <div className="card">
              <div className="card-header border-bottom border-translucent py-3">
                <div className="row align-items-center g-2 mb-3">
                  <div className="col">
                    <h4 className="mb-0">
                      Agentic workflows
                    </h4>
                    <p className="text-body-tertiary fs-9 mb-0">
                      Multi-step runs reconstructed from trace parentage, newest first
                    </p>
                  </div>
                </div>
                <div className="row align-items-center g-2">
                  <div className="col-12 col-md">
                    <div className="search-box w-100">
                      <form className="position-relative">
                        <input className="form-control search-input search form-control-sm" type="search" placeholder="Search workflows" aria-label="Search" />
                        <span className="fas fa-search search-box-icon"></span>
                      </form>
                    </div>
                  </div>
                  <div className="col-6 col-md-auto">
                    <select className="form-select form-select-sm" data-list-filter="data-list-filter" aria-label="Filter">
                      <option value="">
                        Filter: All
                      </option>
                      <option value="Completed">
                        Completed
                      </option>
                      <option value="Failed">
                        Failed
                      </option>
                    </select>
                  </div>
                  <div className="col-6 col-md-auto">
                    <select className="form-select form-select-sm" aria-label="Sort by" data-obs-sort="data-obs-sort">
                      <option value="">
                        Sort by
                      </option>
                      <option value="col0">
                        Workflow
                      </option>
                      <option value="col1">
                        Agents
                      </option>
                      <option value="col2">
                        Steps
                      </option>
                      <option value="col3">
                        Duration
                      </option>
                      <option value="col4">
                        Started
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
                          Workflow
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col1">
                          Agents
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col2">
                          Steps
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col3">
                          Duration
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col4">
                          Started
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
                            <span className="me-2 fa-solid fa-code-branch text-success"></span>
                            <div>
                              <h6 className="mb-0">
                                nightly-triage
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                wf-9f2a41c8
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          3
                        </td>
                        <td className="align-middle col2">
                          12 / 12
                        </td>
                        <td className="align-middle col3">
                          48.2s
                        </td>
                        <td className="align-middle col4">
                          14:02 UTC
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-success">
                            Completed
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="align-middle ps-3 py-3 col0">
                          <div className="d-flex align-items-center">
                            <span className="me-2 fa-solid fa-code-branch text-danger"></span>
                            <div>
                              <h6 className="mb-0">
                                incident-summariser
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                wf-1b77de03
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          2
                        </td>
                        <td className="align-middle col2">
                          5 / 7
                        </td>
                        <td className="align-middle col3">
                          19.4s
                        </td>
                        <td className="align-middle col4">
                          13:58 UTC
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-danger">
                            Failed
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="align-middle ps-3 py-3 col0">
                          <div className="d-flex align-items-center">
                            <span className="me-2 fa-solid fa-code-branch text-success"></span>
                            <div>
                              <h6 className="mb-0">
                                pr-reviewer
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                wf-4c0e9a15
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          4
                        </td>
                        <td className="align-middle col2">
                          21 / 21
                        </td>
                        <td className="align-middle col3">
                          2m 11s
                        </td>
                        <td className="align-middle col4">
                          13:44 UTC
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-success">
                            Completed
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="align-middle ps-3 py-3 col0">
                          <div className="d-flex align-items-center">
                            <span className="me-2 fa-solid fa-code-branch text-success"></span>
                            <div>
                              <h6 className="mb-0">
                                runbook-drafter
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                wf-77ba2e60
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          2
                        </td>
                        <td className="align-middle col2">
                          8 / 8
                        </td>
                        <td className="align-middle col3">
                          31.7s
                        </td>
                        <td className="align-middle col4">
                          13:30 UTC
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-success">
                            Completed
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="align-middle ps-3 py-3 col0">
                          <div className="d-flex align-items-center">
                            <span className="me-2 fa-solid fa-code-branch text-danger"></span>
                            <div>
                              <h6 className="mb-0">
                                schema-migrator
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                wf-2ed4b099
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          3
                        </td>
                        <td className="align-middle col2">
                          4 / 9
                        </td>
                        <td className="align-middle col3">
                          1m 02s
                        </td>
                        <td className="align-middle col4">
                          13:12 UTC
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-danger">
                            Failed
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="align-middle ps-3 py-3 col0">
                          <div className="d-flex align-items-center">
                            <span className="me-2 fa-solid fa-code-branch text-success"></span>
                            <div>
                              <h6 className="mb-0">
                                cost-explainer
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                wf-8a31cc27
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          1
                        </td>
                        <td className="align-middle col2">
                          6 / 6
                        </td>
                        <td className="align-middle col3">
                          12.9s
                        </td>
                        <td className="align-middle col4">
                          12:55 UTC
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-success">
                            Completed
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
        <div className="col-12 col-xl-5">
          <div className="obs-list-root" data-list={"{\"valueNames\":[\"col0\",\"col1\",\"col2\",\"col3\",\"col4\",\"col5\"],\"page\":6,\"filter\":{\"key\":\"col5\"}}"} data-live-table="agentEvaluations">
            <div className="card">
              <div className="card-header border-bottom border-translucent py-3">
                <div className="row align-items-center g-2 mb-3">
                  <div className="col">
                    <h4 className="mb-0">
                      Observations & evaluations
                    </h4>
                    <p className="text-body-tertiary fs-9 mb-0">
                      Scored annotations on stored spans, rolled up per metric
                    </p>
                  </div>
                </div>
                <div className="row align-items-center g-2">
                  <div className="col-12 col-md">
                    <div className="search-box w-100">
                      <form className="position-relative">
                        <input className="form-control search-input search form-control-sm" type="search" placeholder="Search metrics" aria-label="Search" />
                        <span className="fas fa-search search-box-icon"></span>
                      </form>
                    </div>
                  </div>
                  <div className="col-6 col-md-auto">
                    <select className="form-select form-select-sm" data-list-filter="data-list-filter" aria-label="Filter">
                      <option value="">
                        Filter: All
                      </option>
                      <option value="Passing">
                        Passing
                      </option>
                      <option value="Below target">
                        Below target
                      </option>
                      <option value="Unscored">
                        Unscored
                      </option>
                    </select>
                  </div>
                  <div className="col-6 col-md-auto">
                    <select className="form-select form-select-sm" aria-label="Sort by" data-obs-sort="data-obs-sort">
                      <option value="">
                        Sort by
                      </option>
                      <option value="col0">
                        Metric
                      </option>
                      <option value="col1">
                        Annotations
                      </option>
                      <option value="col2">
                        Avg score
                      </option>
                      <option value="col3">
                        Pass rate
                      </option>
                      <option value="col4">
                        Spans
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
                          Metric
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col1">
                          Annotations
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col2">
                          Avg score
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col3">
                          Pass rate
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col4">
                          Spans
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
                            <span className="me-2 fa-solid fa-flask text-success"></span>
                            <div>
                              <h6 className="mb-0">
                                faithfulness
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                412 annotations
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          412
                        </td>
                        <td className="align-middle col2">
                          0.918
                        </td>
                        <td className="align-middle col3">
                          96.4%
                        </td>
                        <td className="align-middle col4">
                          388
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-success">
                            Passing
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="align-middle ps-3 py-3 col0">
                          <div className="d-flex align-items-center">
                            <span className="me-2 fa-solid fa-flask text-warning"></span>
                            <div>
                              <h6 className="mb-0">
                                relevance
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                406 annotations
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          406
                        </td>
                        <td className="align-middle col2">
                          0.874
                        </td>
                        <td className="align-middle col3">
                          89.1%
                        </td>
                        <td className="align-middle col4">
                          388
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-warning">
                            Below target
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="align-middle ps-3 py-3 col0">
                          <div className="d-flex align-items-center">
                            <span className="me-2 fa-solid fa-flask text-success"></span>
                            <div>
                              <h6 className="mb-0">
                                toxicity
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                388 annotations
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          388
                        </td>
                        <td className="align-middle col2">
                          0.996
                        </td>
                        <td className="align-middle col3">
                          99.7%
                        </td>
                        <td className="align-middle col4">
                          388
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-success">
                            Passing
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="align-middle ps-3 py-3 col0">
                          <div className="d-flex align-items-center">
                            <span className="me-2 fa-solid fa-flask text-success"></span>
                            <div>
                              <h6 className="mb-0">
                                tool-choice
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                201 annotations
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          201
                        </td>
                        <td className="align-middle col2">
                          0.931
                        </td>
                        <td className="align-middle col3">
                          94.5%
                        </td>
                        <td className="align-middle col4">
                          196
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-success">
                            Passing
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="align-middle ps-3 py-3 col0">
                          <div className="d-flex align-items-center">
                            <span className="me-2 fa-solid fa-flask text-secondary"></span>
                            <div>
                              <h6 className="mb-0">
                                helpfulness
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                human review
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          64
                        </td>
                        <td className="align-middle col2">
                          not scored
                        </td>
                        <td className="align-middle col3">
                          —
                        </td>
                        <td className="align-middle col4">
                          64
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-secondary">
                            Unscored
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
