import Scripts from '@/components/scripts'

export default function Page() {
  return (
    <>
      {/* =============================================== */}
      {/* Main Content */}
      {/* =============================================== */}
      <main className="main" id="top">
        <div className="min-vh-100 d-flex flex-column bg-body">
          <header className="border-bottom border-translucent bg-body">
            <div className="container">
              <div className="d-flex align-items-center" style={{ height: "4rem" }}>
                <a className="d-flex align-items-center gap-2 text-decoration-none fw-bolder fs-7 text-body-emphasis" href="/">
                  <div className="d-flex align-items-center">
                    <h5 className="logo-text mb-0">
                      LoveHeartBeat
                    </h5>
                  </div>
                </a>
              </div>
            </div>
          </header>
          <main className="flex-grow-1 d-flex align-items-center justify-content-center px-3 py-8">
            <div className="w-100" style={{ maxWidth: "28rem" }}>
              <div className="text-center mb-6">
                <h1 className="fs-5 fw-bold mb-2">
                  Forgot your password?
                </h1>
                <p className="fs-9 text-body-tertiary mb-0">
                  Enter your email and we will send you a code to reset it.
                </p>
              </div>
              <div className="card border border-translucent">
                <div className="card-body p-4" data-lhb-auth="forgot">
                  <div className="mb-4">
                    <label className="form-label fs-9" htmlFor="email">
                      Email
                    </label>
                    <div className="position-relative">
                      <span className="fa-solid position-absolute top-50 translate-middle-y text-body-tertiary fs-9 fa-envelope" style={{ left: ".85rem", pointerEvents: "none" }}></span>
                      <input className="form-control" id="email" name="email" type="text" placeholder="you@company.com" autoComplete="email" style={{ paddingLeft: "2.4rem" }} />
                    </div>
                  </div>
                  <button className="btn btn-primary w-100" type="button" data-lhb-auth-submit="">
                    Send reset code
                  </button>
                  <p className="text-center fs-10 text-body-tertiary mt-4 mb-0">
                    If the address has an account, a code is on its way.
                  </p>
                  <p className="text-center fs-9 mt-2 mb-0">
                    <a href="/pages/authentication/sign-in/">
                      Back to sign in
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </main>
      {/* =============================================== */}
      {/* End of Main Content */}
      {/* =============================================== */}
      {/* =============================================== */}
      {/* JavaScripts */}
      {/* =============================================== */}
      <Scripts items={[
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
      ]} />
    </>
  )
}
