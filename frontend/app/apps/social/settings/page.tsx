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
              Account
            </a>
          </li>
          <li className="breadcrumb-item active">
            Profile
          </li>
        </ol>
      </nav>
      <div className="mb-9">
        <div className="row g-4">
          <div className="col-12 col-xl-4">
            <div className="card h-100">
              <div className="card-body text-center">
                <img className="rounded-circle img-thumbnail shadow-sm border-0 mb-3" src="/assets/img/team/72x72/57.webp" width="112" height="112" alt="" />
                <h3 className="mb-1" data-lhb-account="name">
                  —
                </h3>
                <p className="text-body-tertiary fs-9 mb-3" data-lhb-account="email"></p>
                <div className="d-flex justify-content-center gap-4 fs-9">
                  <div>
                    <span className="fa-solid fa-building text-body-tertiary me-2"></span>
                    <span data-lhb-account="orgName">
                      —
                    </span>
                  </div>
                  <div>
                    <span className="fa-solid fa-user-shield text-body-tertiary me-2"></span>
                    <span data-lhb-account="role">
                      —
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-12 col-xl-8">
            <div className="card mb-4">
              <div className="card-body">
                <h4 className="mb-3">
                  Personal details
                </h4>
                <div className="row g-3 fs-9">
                  <div className="col-12 col-sm-6">
                    <p className="text-body-tertiary fs-10 text-uppercase mb-1">
                      Name
                    </p>
                    <p className="mb-0 fw-semibold" data-lhb-account="name">
                      —
                    </p>
                  </div>
                  <div className="col-12 col-sm-6">
                    <p className="text-body-tertiary fs-10 text-uppercase mb-1">
                      Email
                    </p>
                    <p className="mb-0 fw-semibold" data-lhb-account="email">
                      —
                    </p>
                  </div>
                  <div className="col-12 col-sm-6">
                    <p className="text-body-tertiary fs-10 text-uppercase mb-1">
                      Role
                    </p>
                    <p className="mb-0 fw-semibold" data-lhb-account="role">
                      —
                    </p>
                  </div>
                  <div className="col-12 col-sm-6">
                    <p className="text-body-tertiary fs-10 text-uppercase mb-1">
                      Signed in as
                    </p>
                    <p className="mb-0 fw-semibold font-monospace fs-10" data-lhb-account="email">
                      —
                    </p>
                  </div>
                </div>
                <p className="text-body-tertiary fs-10 mt-3 mb-0">
                  Name and email come from your sign-in account.
                </p>
              </div>
            </div>
            <div className="card mb-4">
              <div className="card-body">
                <h4 className="mb-3">
                  Organization
                </h4>
                <div className="row g-3 fs-9">
                  <div className="col-12 col-sm-6">
                    <p className="text-body-tertiary fs-10 text-uppercase mb-1">
                      Organization
                    </p>
                    <p className="mb-0 fw-semibold" data-lhb-account="orgName">
                      —
                    </p>
                  </div>
                  <div className="col-12 col-sm-6">
                    <p className="text-body-tertiary fs-10 text-uppercase mb-1">
                      Owner
                    </p>
                    <p className="mb-0 fw-semibold" data-lhb-account="orgOwner">
                      —
                    </p>
                  </div>
                  <div className="col-12 col-sm-6">
                    <p className="text-body-tertiary fs-10 text-uppercase mb-1">
                      Plan
                    </p>
                    <p className="mb-0 fw-semibold" data-lhb-account="orgPlan">
                      —
                    </p>
                  </div>
                  <div className="col-12 col-sm-6">
                    <p className="text-body-tertiary fs-10 text-uppercase mb-1">
                      Your role
                    </p>
                    <p className="mb-0 fw-semibold" data-lhb-account="role">
                      —
                    </p>
                  </div>
                </div>
                <div className="border-top border-translucent mt-4 pt-4" data-lhb-owner-only="data-lhb-owner-only" hidden={true}>
                  <div className="row gy-4">
                    <div className="col-12 col-md-6">
                      <h5 className="text-body-emphasis mb-1">
                        Invite people
                      </h5>
                      <p className="text-body-tertiary fs-9">
                        Send someone an invite and choose what they can do once they accept.
                      </p>
                      <button className="btn btn-phoenix-primary btn-sm" type="button" data-lhb-action="inviteMember">
                        Invite a member
                      </button>
                    </div>
                    <div className="col-12 col-md-6">
                      <h5 className="text-body-emphasis mb-1">
                        Transfer ownership
                      </h5>
                      <p className="text-body-tertiary fs-9">
                        Hand the organization to another member. They become an admin and the owner; you keep your admin access.
                      </p>
                      <button className="btn btn-phoenix-warning btn-sm" type="button" data-lhb-action="transferOwnership">
                        Transfer ownership
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <h4 className="mb-2">
                  Password
                </h4>
                <p className="text-body-tertiary fs-9">
                  Rotate it with the current one. Forgotten it instead? Sign out and use "Forgot password" to get a code by email.
                </p>
                <button className="btn btn-phoenix-secondary btn-sm" type="button" data-lhb-action="changePassword">
                  Change password
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
