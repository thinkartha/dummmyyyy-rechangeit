import AppLayout from '@/components/app-layout'

export default function Page() {
  return (
    <AppLayout scripts={[
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
              Organization
            </a>
          </li>
          <li className="breadcrumb-item active">
            Onboarding
          </li>
        </ol>
      </nav>
      <div className="mb-6">
        <div className="row align-items-center g-3">
          <div className="col">
            <h2 className="mb-2">
              Organization onboarding
            </h2>
            <h5 className="text-body-tertiary fw-semibold mb-0">
              Create an org, choose how people sign in, invite members, then connect cloud & AI sources
            </h5>
          </div>
        </div>
      </div>
      <div className="row g-4">
        <div className="col-12 col-xl-8">
          <div className="card mb-4">
            <div className="card-body">
              <h4 className="mb-4">
                1. Organization profile
              </h4>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">
                    Organization name
                  </label>
                  <input className="form-control" type="text" placeholder="e.g. RootVyana" />
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    Tenant slug
                  </label>
                  <div className="input-group">
                    <input className="form-control" id="orgSlug" type="text" placeholder="rootvyana" />
                    <span className="input-group-text">
                      .loveheartbeat.com
                    </span>
                  </div>
                  <p className="text-body-tertiary fs-10 mb-0 mt-1">
                    Becomes
                    <code className="ms-1">
                      https://rootvyana.loveheartbeat.com
                    </code>
                  </p>
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    Company domain
                  </label>
                  <input className="form-control" type="text" placeholder="rootvyana.com" />
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    Plan
                  </label>
                  <select className="form-select">
                    <option>
                      Trial
                    </option>
                    <option>
                      Business
                    </option>
                    <option>
                      Enterprise
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="card mb-4">
            <div className="card-body">
              <h4 className="mb-2">
                2. How will members sign in?
              </h4>
              <p className="text-body-tertiary mb-4">
                Choose Okta / SSO for enterprise, or LoveHeartBeat email + password.
              </p>
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="border border-translucent rounded-3 p-4 h-100">
                    <div className="form-check">
                      <input className="form-check-input" id="authOkta" type="radio" name="authMode" defaultChecked={true} />
                      <label className="form-check-label fw-semibold" htmlFor="authOkta">
                        Okta / SSO (SAML / OIDC)
                      </label>
                    </div>
                    <p className="text-body-tertiary fs-9 mt-2 mb-0">
                      Connect Okta, Azure AD, Google Workspace, or any SAML/OIDC IdP. Members sign in with corporate identity.
                    </p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="border border-translucent rounded-3 p-4 h-100">
                    <div className="form-check">
                      <input className="form-check-input" id="authNative" type="radio" name="authMode" />
                      <label className="form-check-label fw-semibold" htmlFor="authNative">
                        LoveHeartBeat login
                      </label>
                    </div>
                    <p className="text-body-tertiary fs-9 mt-2 mb-0">
                      Email and password managed by LoveHeartBeat. Optional MFA. Good for trials and smaller teams.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="card mb-4">
            <div className="card-body">
              <h4 className="mb-4">
                3. Invite first members
              </h4>
              <div className="row g-3 align-items-end">
                <div className="col-md-7">
                  <label className="form-label">
                    Work emails
                  </label>
                  <input className="form-control" type="text" placeholder="alex@company.com, jordan@company.com" />
                </div>
                <div className="col-md-3">
                  <label className="form-label">
                    Role
                  </label>
                  <select className="form-select">
                    <option>
                      Admin
                    </option>
                    <option>
                      Member
                    </option>
                    <option>
                      Viewer
                    </option>
                  </select>
                </div>
                <div className="col-md-2">
                  <button className="btn btn-phoenix-secondary w-100" type="button">
                    Invite
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <h4 className="mb-2">
                4. Connect data sources
              </h4>
              <p className="text-body-tertiary mb-3">
                You can finish this later from Cloud Monitoring and AI Monitoring.
              </p>
              <div className="d-flex flex-wrap gap-2">
                <button className="btn btn-sm btn-phoenix-secondary" type="button">
                  Connect AWS accounts
                </button>
                <button className="btn btn-sm btn-phoenix-secondary" type="button">
                  Connect GCP
                </button>
                <button className="btn btn-sm btn-phoenix-secondary" type="button">
                  Connect Azure
                </button>
                <button className="btn btn-sm btn-phoenix-secondary" type="button">
                  Connect AI tools
                </button>
              </div>
              <div className="mt-4 text-end">
                <button className="btn btn-primary" type="button">
                  Finish onboarding
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-xl-4">
          <div className="card bg-body-emphasis">
            <div className="card-body">
              <h5 className="mb-3">
                Checklist
              </h5>
              <ul className="list-unstyled mb-0">
                <li className="mb-3">
                  <span className="fa-solid fa-circle-check text-success me-2"></span>
                  Create organization
                </li>
                <li className="mb-3">
                  <span className="fa-solid fa-circle-check text-success me-2"></span>
                  Pick SSO or native login
                </li>
                <li className="mb-3">
                  <span className="fa-regular fa-circle text-body-tertiary me-2"></span>
                  Invite members
                </li>
                <li className="mb-3">
                  <span className="fa-regular fa-circle text-body-tertiary me-2"></span>
                  Link cloud accounts
                </li>
                <li>
                  <span className="fa-regular fa-circle text-body-tertiary me-2"></span>
                  Connect AI / ETL sources
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
