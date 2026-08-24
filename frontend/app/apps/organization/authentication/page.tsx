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
            Authentication
          </li>
        </ol>
      </nav>
      <div className="mb-6">
        <div className="row align-items-center g-3">
          <div className="col">
            <h2 className="mb-2">
              Authentication & SSO
            </h2>
            <h5 className="text-body-tertiary fw-semibold mb-0">
              Okta / enterprise SSO, or LoveHeartBeat email and password for the active organization
            </h5>
          </div>
          <div className="col-auto">
            <button className="btn btn-primary" type="button" data-lhb-action="saveAuthSettings">
              Save changes
            </button>
          </div>
        </div>
      </div>
      <div className="row g-4">
        <div className="col-12 col-xl-6">
          <div className="card h-100">
            <div className="card-header border-bottom border-translucent py-3">
              <h4 className="mb-0">
                Sign-in mode
              </h4>
            </div>
            <div className="card-body">
              <div className="form-check mb-3">
                <input className="form-check-input" id="modeSso" type="radio" name="signInMode" defaultChecked={true} />
                <label className="form-check-label" htmlFor="modeSso">
                  <span className="fw-semibold">
                    Okta / SSO
                  </span>
                  <span className="d-block text-body-tertiary fs-9">
                    Members authenticate via your identity provider (SAML 2.0 or OIDC).
                  </span>
                </label>
              </div>
              <div className="form-check mb-4">
                <input className="form-check-input" id="modeNative" type="radio" name="signInMode" />
                <label className="form-check-label" htmlFor="modeNative">
                  <span className="fw-semibold">
                    LoveHeartBeat login & password
                  </span>
                  <span className="d-block text-body-tertiary fs-9">
                    Built-in accounts with optional MFA. No IdP required.
                  </span>
                </label>
              </div>
              <div className="form-check form-switch">
                <input className="form-check-input" id="allowMixed" type="checkbox" />
                <label className="form-check-label" htmlFor="allowMixed">
                  Allow mixed mode (SSO for employees, native for guests)
                </label>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-xl-6">
          <div className="card h-100">
            <div className="card-header border-bottom border-translucent py-3">
              <h4 className="mb-0">
                Okta / IdP connection
              </h4>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">
                  Provider
                </label>
                <select className="form-select">
                  <option>
                    Okta
                  </option>
                  <option>
                    Azure AD / Entra ID
                  </option>
                  <option>
                    Google Workspace
                  </option>
                  <option>
                    Other SAML / OIDC
                  </option>
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">
                  Issuer / Okta domain
                </label>
                <input className="form-control" type="text" placeholder="https://your-org.okta.com" />
              </div>
              <div className="mb-3">
                <label className="form-label">
                  Client ID / Entity ID
                </label>
                <input className="form-control" type="text" placeholder="loveheartbeat-sp" />
              </div>
              <div className="mb-3">
                <label className="form-label">
                  Client secret / certificate
                </label>
                <input className="form-control" type="password" placeholder="••••••••" />
              </div>
              <button className="btn btn-phoenix-secondary" type="button">
                Test connection
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="card mt-4">
        <div className="card-header border-bottom border-translucent py-3">
          <h4 className="mb-0">
            Native login policy
          </h4>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <div className="form-check form-switch">
                <input className="form-check-input" id="requireMfa" type="checkbox" defaultChecked={true} />
                <label className="form-check-label" htmlFor="requireMfa">
                  Require MFA
                </label>
              </div>
            </div>
            <div className="col-md-4">
              <div className="form-check form-switch">
                <input className="form-check-input" id="passwordRotation" type="checkbox" />
                <label className="form-check-label" htmlFor="passwordRotation">
                  90-day password rotation
                </label>
              </div>
            </div>
            <div className="col-md-4">
              <div className="form-check form-switch">
                <input className="form-check-input" id="inviteOnly" type="checkbox" defaultChecked={true} />
                <label className="form-check-label" htmlFor="inviteOnly">
                  Invite-only signup
                </label>
              </div>
            </div>
          </div>
          <p className="text-body-tertiary fs-9 mb-0 mt-3">
            Native login uses LoveHeartBeat sign-in pages when SSO is not enabled for the organization.
          </p>
        </div>
      </div>
    </AppLayout>
  )
}
