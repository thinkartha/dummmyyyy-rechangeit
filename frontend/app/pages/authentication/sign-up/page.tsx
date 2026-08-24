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
                  Create your account
                </h1>
                <p className="fs-9 text-body-tertiary mb-0">
                  Join the LoveHeartBeat observability platform.
                </p>
              </div>
              <div className="card border border-translucent">
                <div className="card-body p-4" data-lhb-auth="signup">
                  <div className="mb-4">
                    <label className="form-label fs-9">
                      Account type
                    </label>
                    <div className="row g-2">
                      <div className="col-6">
                        <input className="btn-check" type="radio" name="intent" id="intent-solo" defaultValue="solo" defaultChecked={true} data-lhb-intent="" />
                        <label className="btn btn-phoenix-secondary w-100 h-100 text-start p-3" htmlFor="intent-solo">
                          <span className="fa-solid d-block mb-2 fa-user"></span>
                          <span className="d-block fs-9 fw-semibold">
                            Personal account
                          </span>
                          <span className="d-block fs-10 text-body-tertiary fw-normal">
                            Just me, no organization
                          </span>
                        </label>
                      </div>
                      <div className="col-6">
                        <input className="btn-check" type="radio" name="intent" id="intent-create_org" defaultValue="create_org" data-lhb-intent="" />
                        <label className="btn btn-phoenix-secondary w-100 h-100 text-start p-3" htmlFor="intent-create_org">
                          <span className="fa-solid d-block mb-2 fa-building"></span>
                          <span className="d-block fs-9 fw-semibold">
                            New organization
                          </span>
                          <span className="d-block fs-10 text-body-tertiary fw-normal">
                            I am setting one up
                          </span>
                        </label>
                      </div>
                      <div className="col-6">
                        <input className="btn-check" type="radio" name="intent" id="intent-join_org" defaultValue="join_org" data-lhb-intent="" />
                        <label className="btn btn-phoenix-secondary w-100 h-100 text-start p-3" htmlFor="intent-join_org">
                          <span className="fa-solid d-block mb-2 fa-users"></span>
                          <span className="d-block fs-9 fw-semibold">
                            Join an organization
                          </span>
                          <span className="d-block fs-10 text-body-tertiary fw-normal">
                            An admin approves it
                          </span>
                        </label>
                      </div>
                      <div className="col-6">
                        <input className="btn-check" type="radio" name="intent" id="intent-accept_invite" defaultValue="accept_invite" data-lhb-intent="" />
                        <label className="btn btn-phoenix-secondary w-100 h-100 text-start p-3" htmlFor="intent-accept_invite">
                          <span className="fa-solid d-block mb-2 fa-envelope-open-text"></span>
                          <span className="d-block fs-9 fw-semibold">
                            Redeem an invite
                          </span>
                          <span className="d-block fs-10 text-body-tertiary fw-normal">
                            I have a token
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="mb-4 d-none" data-lhb-intent-field="create_org">
                    <label className="form-label fs-9" htmlFor="org_name">
                      Organization name
                    </label>
                    <input className="form-control" id="org_name" type="text" name="org_name" placeholder="Acme Corp" />
                  </div>
                  <div className="mb-4 d-none" data-lhb-intent-field="join_org">
                    <label className="form-label fs-9" htmlFor="org_identifier">
                      Organization name or ID
                    </label>
                    <input className="form-control" id="org_identifier" type="text" name="org_identifier" placeholder="acme" />
                    <div className="form-text fs-10">
                      An administrator there approves your request before you can sign in.
                    </div>
                  </div>
                  <div className="mb-4 d-none" data-lhb-intent-field="accept_invite">
                    <label className="form-label fs-9" htmlFor="invite_token">
                      Invite token
                    </label>
                    <input className="form-control" id="invite_token" type="text" name="invite_token" placeholder="Paste the token from your invite" />
                  </div>
                  <div className="mb-4">
                    <label className="form-label fs-9" htmlFor="name">
                      Full name
                    </label>
                    <div className="position-relative">
                      <span className="fa-solid position-absolute top-50 translate-middle-y text-body-tertiary fs-9 fa-user" style={{ left: ".85rem", pointerEvents: "none" }}></span>
                      <input className="form-control" id="name" name="name" type="text" placeholder="Ada Lovelace" autoComplete="name" style={{ paddingLeft: "2.4rem" }} />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="form-label fs-9" htmlFor="email">
                      Email
                    </label>
                    <div className="position-relative">
                      <span className="fa-solid position-absolute top-50 translate-middle-y text-body-tertiary fs-9 fa-envelope" style={{ left: ".85rem", pointerEvents: "none" }}></span>
                      <input className="form-control" id="email" name="email" type="text" placeholder="you@company.com" autoComplete="email" style={{ paddingLeft: "2.4rem" }} />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="form-label fs-9" htmlFor="password">
                      Password
                    </label>
                    <div className="position-relative" data-password="data-password">
                      <span className="fa-solid position-absolute top-50 translate-middle-y text-body-tertiary fs-9 fa-lock" style={{ left: ".85rem", pointerEvents: "none" }}></span>
                      <input className="form-control pe-6" id="password" name="password" type="password" placeholder="At least 8 characters" autoComplete="new-password" style={{ paddingLeft: "2.4rem" }} data-password-input="data-password-input" />
                      <button className="btn px-3 py-0 h-100 position-absolute top-0 end-0 fs-8 text-body-tertiary" type="button" data-password-toggle="data-password-toggle">
                        <span className="uil uil-eye show"></span>
                        <span className="uil uil-eye-slash hide"></span>
                      </button>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="form-label fs-9" htmlFor="confirmPassword">
                      Confirm password
                    </label>
                    <div className="position-relative" data-password="data-password">
                      <span className="fa-solid position-absolute top-50 translate-middle-y text-body-tertiary fs-9 fa-lock" style={{ left: ".85rem", pointerEvents: "none" }}></span>
                      <input className="form-control pe-6" id="confirmPassword" name="confirmPassword" type="password" placeholder="Repeat your password" autoComplete="new-password" style={{ paddingLeft: "2.4rem" }} data-password-input="data-password-input" />
                      <button className="btn px-3 py-0 h-100 position-absolute top-0 end-0 fs-8 text-body-tertiary" type="button" data-password-toggle="data-password-toggle">
                        <span className="uil uil-eye show"></span>
                        <span className="uil uil-eye-slash hide"></span>
                      </button>
                    </div>
                  </div>
                  <button className="btn btn-primary w-100" type="button" data-lhb-auth-submit="">
                    Create account
                  </button>
                  <p className="text-center fs-9 text-body-tertiary mt-4 mb-0">
                    Already have an account?
                    <a className="fw-semibold ms-1" href="/pages/authentication/sign-in/">
                      Sign in
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
      ]} />
    </>
  )
}
