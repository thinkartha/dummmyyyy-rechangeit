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
              Platform
            </a>
          </li>
          <li className="breadcrumb-item active">
            Administration
          </li>
        </ol>
      </nav>
      <div className="mb-6">
        <div className="row align-items-center g-3">
          <div className="col">
            <h2 className="mb-2">
              Platform Administration
            </h2>
            <h5 className="text-body-tertiary fw-semibold mb-0">
              Cross-tenant view for platform admins — organizations, users, join requests, and pending approvals
            </h5>
          </div>
          <div className="col-auto">
            <button className="btn btn-primary" type="button" data-lhb-action="adminCreateOrganization">
              Create organization
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
                    Organizations
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat">
                    1,284
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-info" data-obs-stat-delta="data-obs-stat-delta">
                  of 30,000 capacity
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
                    Users
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat">
                    18,402
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-success" data-obs-stat-delta="data-obs-stat-delta">
                  +312 (30d)
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
                    Pending approvals
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat">
                    23
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-warning" data-obs-stat-delta="data-obs-stat-delta">
                  awaiting review
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
                    Suspended
                  </h6>
                  <h3 className="mb-0" data-obs-stat="data-obs-stat">
                    7
                  </h3>
                </div>
                <span className="badge badge-phoenix badge-phoenix-danger" data-obs-stat-delta="data-obs-stat-delta">
                  billing or policy
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ul className="nav nav-underline mb-4" role="tablist">
        <li className="nav-item" role="presentation">
          <button className="nav-link active" data-bs-toggle="tab" data-bs-target="#tab-orgs" type="button" role="tab" aria-controls="tab-orgs" aria-selected={true}>
            Organizations
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button className="nav-link" data-bs-toggle="tab" data-bs-target="#tab-users" type="button" role="tab" aria-controls="tab-users" aria-selected={false}>
            Users
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button className="nav-link" data-bs-toggle="tab" data-bs-target="#tab-requests" type="button" role="tab" aria-controls="tab-requests" aria-selected={false}>
            Join requests
          </button>
        </li>
      </ul>
      <div className="tab-content">
        <div className="tab-pane fade show active" id="tab-orgs" role="tabpanel">
          <div className="obs-list-root" data-list={"{\"valueNames\":[\"col0\",\"col1\",\"col2\",\"col3\",\"col4\",\"col5\"],\"page\":8,\"filter\":{\"key\":\"col5\"}}"} data-live-table="adminOrganizations">
            <div className="card">
              <div className="card-header border-bottom border-translucent py-3">
                <div className="row align-items-center g-2 mb-3">
                  <div className="col">
                    <h4 className="mb-0">
                      Organizations
                    </h4>
                    <p className="text-body-tertiary fs-9 mb-0">
                      Every tenant on the platform. Each owns its slug subdomain, members, connectors, and billing.
                    </p>
                  </div>
                </div>
                <div className="row align-items-center g-2">
                  <div className="col-12 col-md">
                    <div className="search-box w-100">
                      <form className="position-relative">
                        <input className="form-control search-input search form-control-sm" type="search" placeholder="Search organizations or slugs" aria-label="Search" />
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
                      <option value="Trial">
                        Trial
                      </option>
                      <option value="Past due">
                        Past due
                      </option>
                      <option value="Suspended">
                        Suspended
                      </option>
                    </select>
                  </div>
                  <div className="col-6 col-md-auto">
                    <select className="form-select form-select-sm" aria-label="Sort by" data-obs-sort="data-obs-sort">
                      <option value="">
                        Sort by
                      </option>
                      <option value="col0">
                        Organization
                      </option>
                      <option value="col1">
                        Plan
                      </option>
                      <option value="col2">
                        Members
                      </option>
                      <option value="col3">
                        Connectors
                      </option>
                      <option value="col4">
                        Auth
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
                          Organization
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col1">
                          Plan
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col2">
                          Members
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col3">
                          Connectors
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col4">
                          Auth
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
                            <span className="me-2 fa-solid fa-building text-primary"></span>
                            <div>
                              <h6 className="mb-0">
                                RootVyana
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                rootvyana.loveheartbeat.com
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          Enterprise
                        </td>
                        <td className="align-middle col2">
                          184
                        </td>
                        <td className="align-middle col3">
                          27
                        </td>
                        <td className="align-middle col4">
                          Okta SSO
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-success">
                            Active
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="align-middle ps-3 py-3 col0">
                          <div className="d-flex align-items-center">
                            <span className="me-2 fa-solid fa-building text-info"></span>
                            <div>
                              <h6 className="mb-0">
                                Acme Corp
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                acme.loveheartbeat.com
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          Business
                        </td>
                        <td className="align-middle col2">
                          62
                        </td>
                        <td className="align-middle col3">
                          11
                        </td>
                        <td className="align-middle col4">
                          Entra ID
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-success">
                            Active
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="align-middle ps-3 py-3 col0">
                          <div className="d-flex align-items-center">
                            <span className="me-2 fa-solid fa-building text-primary"></span>
                            <div>
                              <h6 className="mb-0">
                                Contoso
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                contoso.loveheartbeat.com
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          Enterprise
                        </td>
                        <td className="align-middle col2">
                          241
                        </td>
                        <td className="align-middle col3">
                          34
                        </td>
                        <td className="align-middle col4">
                          SAML
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-success">
                            Active
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="align-middle ps-3 py-3 col0">
                          <div className="d-flex align-items-center">
                            <span className="me-2 fa-solid fa-building text-secondary"></span>
                            <div>
                              <h6 className="mb-0">
                                LoveHeartBeat Demo
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                demo.loveheartbeat.com
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          Trial
                        </td>
                        <td className="align-middle col2">
                          4
                        </td>
                        <td className="align-middle col3">
                          3
                        </td>
                        <td className="align-middle col4">
                          Native
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-info">
                            Trial
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="align-middle ps-3 py-3 col0">
                          <div className="d-flex align-items-center">
                            <span className="me-2 fa-solid fa-building text-info"></span>
                            <div>
                              <h6 className="mb-0">
                                Northwind
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                northwind.loveheartbeat.com
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          Business
                        </td>
                        <td className="align-middle col2">
                          38
                        </td>
                        <td className="align-middle col3">
                          9
                        </td>
                        <td className="align-middle col4">
                          Google
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-success">
                            Active
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="align-middle ps-3 py-3 col0">
                          <div className="d-flex align-items-center">
                            <span className="me-2 fa-solid fa-building text-warning"></span>
                            <div>
                              <h6 className="mb-0">
                                Initech
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                initech.loveheartbeat.com
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          Business
                        </td>
                        <td className="align-middle col2">
                          19
                        </td>
                        <td className="align-middle col3">
                          6
                        </td>
                        <td className="align-middle col4">
                          Native
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-warning">
                            Past due
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="align-middle ps-3 py-3 col0">
                          <div className="d-flex align-items-center">
                            <span className="me-2 fa-solid fa-building text-secondary"></span>
                            <div>
                              <h6 className="mb-0">
                                Umbrella
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                umbrella.loveheartbeat.com
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          Trial
                        </td>
                        <td className="align-middle col2">
                          2
                        </td>
                        <td className="align-middle col3">
                          1
                        </td>
                        <td className="align-middle col4">
                          Native
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-info">
                            Trial
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="align-middle ps-3 py-3 col0">
                          <div className="d-flex align-items-center">
                            <span className="me-2 fa-solid fa-building text-danger"></span>
                            <div>
                              <h6 className="mb-0">
                                Hooli
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                hooli.loveheartbeat.com
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          Business
                        </td>
                        <td className="align-middle col2">
                          0
                        </td>
                        <td className="align-middle col3">
                          0
                        </td>
                        <td className="align-middle col4">
                          Native
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-danger">
                            Suspended
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
        <div className="tab-pane fade" id="tab-users" role="tabpanel">
          <div className="obs-list-root" data-list={"{\"valueNames\":[\"col0\",\"col1\",\"col2\",\"col3\",\"col4\",\"col5\"],\"page\":8,\"filter\":{\"key\":\"col5\"}}"} data-live-table="adminUsers">
            <div className="card">
              <div className="card-header border-bottom border-translucent py-3">
                <div className="row align-items-center g-2 mb-3">
                  <div className="col">
                    <h4 className="mb-0">
                      Users
                    </h4>
                    <p className="text-body-tertiary fs-9 mb-0">
                      Platform-wide directory. A user belongs to one or more organizations; roles are scoped per organization.
                    </p>
                  </div>
                  <div className="col-auto">
                    <button className="btn btn-primary btn-sm" type="button" data-lhb-action="adminCreateUser">
                      Create user
                    </button>
                  </div>
                </div>
                <div className="row align-items-center g-2">
                  <div className="col-12 col-md">
                    <div className="search-box w-100">
                      <form className="position-relative">
                        <input className="form-control search-input search form-control-sm" type="search" placeholder="Search users or emails" aria-label="Search" />
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
                      <option value="Pending">
                        Pending
                      </option>
                      <option value="Suspended">
                        Suspended
                      </option>
                    </select>
                  </div>
                  <div className="col-6 col-md-auto">
                    <select className="form-select form-select-sm" aria-label="Sort by" data-obs-sort="data-obs-sort">
                      <option value="">
                        Sort by
                      </option>
                      <option value="col0">
                        User
                      </option>
                      <option value="col1">
                        Organization
                      </option>
                      <option value="col2">
                        Role
                      </option>
                      <option value="col3">
                        Auth
                      </option>
                      <option value="col4">
                        Last seen
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
                          User
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col1">
                          Organization
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col2">
                          Role
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col3">
                          Auth
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col4">
                          Last seen
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
                            <span className="me-2 fa-solid fa-user-shield text-danger"></span>
                            <div>
                              <h6 className="mb-0">
                                Priya Raman
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                admin@rootvyana.com
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          RootVyana
                        </td>
                        <td className="align-middle col2">
                          Platform admin
                        </td>
                        <td className="align-middle col3">
                          Okta
                        </td>
                        <td className="align-middle col4">
                          2m ago
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-success">
                            Active
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="align-middle ps-3 py-3 col0">
                          <div className="d-flex align-items-center">
                            <span className="me-2 fa-solid fa-user text-primary"></span>
                            <div>
                              <h6 className="mb-0">
                                Marcus Webb
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                devops@rootvyana.com
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          RootVyana
                        </td>
                        <td className="align-middle col2">
                          Org admin
                        </td>
                        <td className="align-middle col3">
                          Okta
                        </td>
                        <td className="align-middle col4">
                          14m ago
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-success">
                            Active
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="align-middle ps-3 py-3 col0">
                          <div className="d-flex align-items-center">
                            <span className="me-2 fa-solid fa-user text-primary"></span>
                            <div>
                              <h6 className="mb-0">
                                Lin Zhao
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                sre@acme.com
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          Acme Corp
                        </td>
                        <td className="align-middle col2">
                          Org admin
                        </td>
                        <td className="align-middle col3">
                          Entra ID
                        </td>
                        <td className="align-middle col4">
                          1h ago
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-success">
                            Active
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="align-middle ps-3 py-3 col0">
                          <div className="d-flex align-items-center">
                            <span className="me-2 fa-solid fa-user text-info"></span>
                            <div>
                              <h6 className="mb-0">
                                Sofia Almeida
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                data@contoso.com
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          Contoso
                        </td>
                        <td className="align-middle col2">
                          Member
                        </td>
                        <td className="align-middle col3">
                          SAML
                        </td>
                        <td className="align-middle col4">
                          3h ago
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-success">
                            Active
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="align-middle ps-3 py-3 col0">
                          <div className="d-flex align-items-center">
                            <span className="me-2 fa-solid fa-user text-info"></span>
                            <div>
                              <h6 className="mb-0">
                                Tomas Nowak
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                analyst@contoso.com
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          Contoso
                        </td>
                        <td className="align-middle col2">
                          Member
                        </td>
                        <td className="align-middle col3">
                          SAML
                        </td>
                        <td className="align-middle col4">
                          1d ago
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-success">
                            Active
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="align-middle ps-3 py-3 col0">
                          <div className="d-flex align-items-center">
                            <span className="me-2 fa-solid fa-user-clock text-warning"></span>
                            <div>
                              <h6 className="mb-0">
                                Ada Okoro
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                newhire@northwind.com
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          Northwind
                        </td>
                        <td className="align-middle col2">
                          Member
                        </td>
                        <td className="align-middle col3">
                          Google
                        </td>
                        <td className="align-middle col4">
                          —
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-warning">
                            Pending
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="align-middle ps-3 py-3 col0">
                          <div className="d-flex align-items-center">
                            <span className="me-2 fa-solid fa-user-clock text-warning"></span>
                            <div>
                              <h6 className="mb-0">
                                Ravi Menon
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                contractor@initech.com
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          Initech
                        </td>
                        <td className="align-middle col2">
                          Member
                        </td>
                        <td className="align-middle col3">
                          Native
                        </td>
                        <td className="align-middle col4">
                          —
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-warning">
                            Pending
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="align-middle ps-3 py-3 col0">
                          <div className="d-flex align-items-center">
                            <span className="me-2 fa-solid fa-user-slash text-danger"></span>
                            <div>
                              <h6 className="mb-0">
                                Jordan Pike
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                former@hooli.com
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          Hooli
                        </td>
                        <td className="align-middle col2">
                          Member
                        </td>
                        <td className="align-middle col3">
                          Native
                        </td>
                        <td className="align-middle col4">
                          46d ago
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-danger">
                            Suspended
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
        <div className="tab-pane fade" id="tab-requests" role="tabpanel">
          <div className="obs-list-root" data-list={"{\"valueNames\":[\"col0\",\"col1\",\"col2\",\"col3\",\"col4\",\"col5\"],\"page\":6,\"filter\":{\"key\":\"col5\"}}"} data-live-table="adminJoinRequests">
            <div className="card">
              <div className="card-header border-bottom border-translucent py-3">
                <div className="row align-items-center g-2 mb-3">
                  <div className="col">
                    <h4 className="mb-0">
                      Join requests
                    </h4>
                    <p className="text-body-tertiary fs-9 mb-0">
                      People asking to join an organization. Approving grants access scoped to that organization only.
                    </p>
                  </div>
                </div>
                <div className="row align-items-center g-2">
                  <div className="col-12 col-md">
                    <div className="search-box w-100">
                      <form className="position-relative">
                        <input className="form-control search-input search form-control-sm" type="search" placeholder="Search join requests" aria-label="Search" />
                        <span className="fas fa-search search-box-icon"></span>
                      </form>
                    </div>
                  </div>
                  <div className="col-6 col-md-auto">
                    <select className="form-select form-select-sm" data-list-filter="data-list-filter" aria-label="Filter">
                      <option value="">
                        Filter: All
                      </option>
                      <option value="Pending">
                        Pending
                      </option>
                      <option value="Approved">
                        Approved
                      </option>
                      <option value="Denied">
                        Denied
                      </option>
                    </select>
                  </div>
                  <div className="col-6 col-md-auto">
                    <select className="form-select form-select-sm" aria-label="Sort by" data-obs-sort="data-obs-sort">
                      <option value="">
                        Sort by
                      </option>
                      <option value="col0">
                        Requester
                      </option>
                      <option value="col1">
                        Organization
                      </option>
                      <option value="col2">
                        Requested role
                      </option>
                      <option value="col3">
                        Domain match
                      </option>
                      <option value="col4">
                        Requested
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
                          Requester
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col1">
                          Organization
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col2">
                          Requested role
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col3">
                          Domain match
                        </th>
                        <th className="sort align-middle white-space-nowrap text-uppercase" scope="col" data-sort="col4">
                          Requested
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
                            <span className="me-2 fa-solid fa-user-plus text-warning"></span>
                            <div>
                              <h6 className="mb-0">
                                Ada Okoro
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                ada.okoro@northwind.com
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          Northwind
                        </td>
                        <td className="align-middle col2">
                          Member
                        </td>
                        <td className="align-middle col3">
                          Yes
                        </td>
                        <td className="align-middle col4">
                          2h ago
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-warning">
                            Pending
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="align-middle ps-3 py-3 col0">
                          <div className="d-flex align-items-center">
                            <span className="me-2 fa-solid fa-user-plus text-warning"></span>
                            <div>
                              <h6 className="mb-0">
                                Ravi Menon
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                r.menon@initech.com
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          Initech
                        </td>
                        <td className="align-middle col2">
                          Member
                        </td>
                        <td className="align-middle col3">
                          Yes
                        </td>
                        <td className="align-middle col4">
                          6h ago
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-warning">
                            Pending
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="align-middle ps-3 py-3 col0">
                          <div className="d-flex align-items-center">
                            <span className="me-2 fa-solid fa-user-plus text-warning"></span>
                            <div>
                              <h6 className="mb-0">
                                Karina Silva
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                k.silva@gmail.com
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          Acme Corp
                        </td>
                        <td className="align-middle col2">
                          Member
                        </td>
                        <td className="align-middle col3">
                          No
                        </td>
                        <td className="align-middle col4">
                          1d ago
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-warning">
                            Pending
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="align-middle ps-3 py-3 col0">
                          <div className="d-flex align-items-center">
                            <span className="me-2 fa-solid fa-user-check text-success"></span>
                            <div>
                              <h6 className="mb-0">
                                Sofia Almeida
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                s.almeida@contoso.com
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          Contoso
                        </td>
                        <td className="align-middle col2">
                          Member
                        </td>
                        <td className="align-middle col3">
                          Yes
                        </td>
                        <td className="align-middle col4">
                          3d ago
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-success">
                            Approved
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="align-middle ps-3 py-3 col0">
                          <div className="d-flex align-items-center">
                            <span className="me-2 fa-solid fa-user-xmark text-danger"></span>
                            <div>
                              <h6 className="mb-0">
                                Unverified user
                              </h6>
                              <p className="text-body-tertiary fs-10 mb-0">
                                unknown@mailinator.com
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle col1">
                          RootVyana
                        </td>
                        <td className="align-middle col2">
                          Org admin
                        </td>
                        <td className="align-middle col3">
                          No
                        </td>
                        <td className="align-middle col4">
                          4d ago
                        </td>
                        <td className="align-middle col5">
                          <span className="badge badge-phoenix badge-phoenix-danger">
                            Denied
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
