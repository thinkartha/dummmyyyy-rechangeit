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
              Pages
            </a>
          </li>
          <li className="breadcrumb-item active">
            Notifications
          </li>
        </ol>
      </nav>
      <h2 className="mb-5">
        Notifications
      </h2>
      <h5 className="text-body-emphasis mb-3">
        Today
      </h5>
      <div className="mx-n4 mx-lg-n6 mb-5 border-bottom">
        <div className="d-flex align-items-center justify-content-between py-3 px-lg-6 px-4 notification-card border-top read">
          <div className="d-flex">
            <div className="avatar avatar-xl me-3">
              <img className="rounded-circle" src="/assets/img/team/30.webp" alt="" />
            </div>
            <div className="me-3 flex-1 mt-2">
              <h4 className="fs-9 text-body-emphasis">
                Jessie Samson
              </h4>
              <p className="fs-9 text-body-highlight">
                <span className="me-1">
                  💬
                </span>
                Mentioned you in a comment
                <span className="fw-bold">
                  "Well done! Proud of you ❤️ "
                </span>
                <span className="ms-2 text-body-tertiary text-opacity-85 fw-bold fs-10">
                  10m
                </span>
              </p>
              <p className="text-body-secondary fs-9 mb-0">
                <span className="me-1 fas fa-clock"></span>
                <span className="fw-bold">
                  10:41 AM
                </span>
                August 7,2021
              </p>
            </div>
          </div>
          <div className="dropdown">
            <button className="btn fs-10 btn-sm dropdown-toggle dropdown-caret-none transition-none notification-dropdown-toggle" type="button" data-bs-toggle="dropdown" data-boundary="window" aria-haspopup={true} aria-expanded={false} data-bs-reference="parent">
              <span className="fas fa-ellipsis-h fs-10 text-body"></span>
            </button>
            <div className="dropdown-menu dropdown-menu-end py-2">
              <a className="dropdown-item" href="#!">
                Mark as unread
              </a>
            </div>
          </div>
        </div>
        <div className="d-flex align-items-center justify-content-between py-3 px-lg-6 px-4 notification-card border-top unread">
          <div className="d-flex">
            <div className="avatar avatar-xl me-3">
              <div className="avatar-name rounded-circle">
                <span>
                  J
                </span>
              </div>
            </div>
            <div className="me-3 flex-1 mt-2">
              <h4 className="fs-9 text-body-emphasis">
                Jane Foster
              </h4>
              <p className="fs-9 text-body-highlight">
                <span className="me-1">
                  📅
                </span>
                Created an event
                <span className="fw-bold">
                  Rome holidays
                </span>
                <span className="ms-2 text-body-tertiary text-opacity-85 fw-bold fs-10">
                  20m
                </span>
              </p>
              <p className="text-body-secondary fs-9 mb-0">
                <span className="me-1 fas fa-clock"></span>
                <span className="fw-bold">
                  10:20 AM
                </span>
                August 7,2021
              </p>
            </div>
          </div>
          <div className="dropdown">
            <button className="btn fs-10 btn-sm dropdown-toggle dropdown-caret-none transition-none notification-dropdown-toggle" type="button" data-bs-toggle="dropdown" data-boundary="window" aria-haspopup={true} aria-expanded={false} data-bs-reference="parent">
              <span className="fas fa-ellipsis-h fs-10 text-body"></span>
            </button>
            <div className="dropdown-menu dropdown-menu-end py-2">
              <a className="dropdown-item" href="#!">
                Mark as unread
              </a>
            </div>
          </div>
        </div>
        <div className="d-flex align-items-center justify-content-between py-3 px-lg-6 px-4 notification-card border-top unread">
          <div className="d-flex">
            <div className="avatar avatar-xl me-3">
              <img className="rounded-circle avatar-placeholder" src="/assets/img/team/avatar.webp" alt="" />
            </div>
            <div className="me-3 flex-1 mt-2">
              <h4 className="fs-9 text-body-emphasis">
                Jessie Samson
              </h4>
              <p className="fs-9 text-body-highlight">
                <span className="me-1">
                  👍
                </span>
                Liked your comment
                <span className="fw-bold">
                  "Amazing Works️"
                </span>
                <span className="ms-2 text-body-tertiary text-opacity-85 fw-bold fs-10">
                  1h
                </span>
              </p>
              <p className="text-body-secondary fs-9 mb-0">
                <span className="me-1 fas fa-clock"></span>
                <span className="fw-bold">
                  9:30 AM
                </span>
                August 7,2021
              </p>
            </div>
          </div>
          <div className="dropdown">
            <button className="btn fs-10 btn-sm dropdown-toggle dropdown-caret-none transition-none notification-dropdown-toggle" type="button" data-bs-toggle="dropdown" data-boundary="window" aria-haspopup={true} aria-expanded={false} data-bs-reference="parent">
              <span className="fas fa-ellipsis-h fs-10 text-body"></span>
            </button>
            <div className="dropdown-menu dropdown-menu-end py-2">
              <a className="dropdown-item" href="#!">
                Mark as unread
              </a>
            </div>
          </div>
        </div>
      </div>
      <h5 className="text-semibold text-body-emphasis mb-3">
        Yesterday
      </h5>
      <div className="mx-n4 mx-lg-n6 mb-9 border-bottom">
        <div className="d-flex align-items-center justify-content-between py-3 px-lg-6 px-4 notification-card border-top unread">
          <div className="d-flex">
            <div className="avatar avatar-xl me-3">
              <img className="rounded-circle" src="/assets/img/team/57.webp" alt="" />
            </div>
            <div className="me-3 flex-1 mt-2">
              <h4 className="fs-9 text-body-emphasis">
                Kiera Anderson
              </h4>
              <p className="fs-9 text-body-highlight">
                <span className="me-1">
                  💬
                </span>
                Mentioned you in a comment
                <span className="fw-bold">
                  "This is too good to be true!"
                </span>
                <span className="ms-2 text-body-tertiary text-opacity-85 fw-bold fs-10"></span>
              </p>
              <p className="text-body-secondary fs-9 mb-0">
                <span className="me-1 fas fa-clock"></span>
                <span className="fw-bold">
                  9:11 AM
                </span>
                August 7,2021
              </p>
            </div>
          </div>
          <div className="dropdown">
            <button className="btn fs-10 btn-sm dropdown-toggle dropdown-caret-none transition-none notification-dropdown-toggle" type="button" data-bs-toggle="dropdown" data-boundary="window" aria-haspopup={true} aria-expanded={false} data-bs-reference="parent">
              <span className="fas fa-ellipsis-h fs-10 text-body"></span>
            </button>
            <div className="dropdown-menu dropdown-menu-end py-2">
              <a className="dropdown-item" href="#!">
                Mark as unread
              </a>
            </div>
          </div>
        </div>
        <div className="d-flex align-items-center justify-content-between py-3 px-lg-6 px-4 notification-card border-top unread">
          <div className="d-flex">
            <div className="avatar avatar-xl me-3">
              <img className="rounded-circle" src="/assets/img/team/59.webp" alt="" />
            </div>
            <div className="me-3 flex-1 mt-2">
              <h4 className="fs-9 text-body-emphasis">
                Herman Carter
              </h4>
              <p className="fs-9 text-body-highlight">
                <span className="me-1">
                  👤
                </span>
                Tagged you in a
                <span className="fw-bold">
                  post
                </span>
                <span className="ms-2 text-body-tertiary text-opacity-85 fw-bold fs-10"></span>
              </p>
              <p className="text-body-secondary fs-9 mb-0">
                <span className="me-1 fas fa-clock"></span>
                <span className="fw-bold">
                  10:58 PM
                </span>
                August 7,2021
              </p>
            </div>
          </div>
          <div className="dropdown">
            <button className="btn fs-10 btn-sm dropdown-toggle dropdown-caret-none transition-none notification-dropdown-toggle" type="button" data-bs-toggle="dropdown" data-boundary="window" aria-haspopup={true} aria-expanded={false} data-bs-reference="parent">
              <span className="fas fa-ellipsis-h fs-10 text-body"></span>
            </button>
            <div className="dropdown-menu dropdown-menu-end py-2">
              <a className="dropdown-item" href="#!">
                Mark as unread
              </a>
            </div>
          </div>
        </div>
        <div className="d-flex align-items-center justify-content-between py-3 px-lg-6 px-4 notification-card border-top read">
          <div className="d-flex">
            <div className="avatar avatar-xl me-3">
              <img className="rounded-circle" src="/assets/img/team/58.webp" alt="" />
            </div>
            <div className="me-3 flex-1 mt-2">
              <h4 className="fs-9 text-body-emphasis">
                Benjamin Button
              </h4>
              <p className="fs-9 text-body-highlight">
                <span className="me-1">
                  👍
                </span>
                Liked your comment
                <span className="fw-bold">
                  "Welcome to the team️"
                </span>
                <span className="ms-2 text-body-tertiary text-opacity-85 fw-bold fs-10"></span>
              </p>
              <p className="text-body-secondary fs-9 mb-0">
                <span className="me-1 fas fa-clock"></span>
                <span className="fw-bold">
                  10:18 AM
                </span>
                August 7,2021
              </p>
            </div>
          </div>
          <div className="dropdown">
            <button className="btn fs-10 btn-sm dropdown-toggle dropdown-caret-none transition-none notification-dropdown-toggle" type="button" data-bs-toggle="dropdown" data-boundary="window" aria-haspopup={true} aria-expanded={false} data-bs-reference="parent">
              <span className="fas fa-ellipsis-h fs-10 text-body"></span>
            </button>
            <div className="dropdown-menu dropdown-menu-end py-2">
              <a className="dropdown-item" href="#!">
                Mark as unread
              </a>
            </div>
          </div>
        </div>
        <div className="d-flex align-items-center justify-content-between py-3 px-lg-6 px-4 notification-card border-top read">
          <div className="d-flex">
            <div className="avatar avatar-xl me-3">
              <img className="rounded-circle" src="/assets/img/team/60.webp" alt="" />
            </div>
            <div className="me-3 flex-1 mt-2">
              <h4 className="fs-9 text-body-emphasis">
                Aron Paul
              </h4>
              <p className="fs-9 text-body-highlight">
                <span className="me-1">
                  📷
                </span>
                Tagged you in a
                <span className="fw-bold">
                  photo
                </span>
                <span className="ms-2 text-body-tertiary text-opacity-85 fw-bold fs-10"></span>
              </p>
              <p className="text-body-secondary fs-9 mb-0">
                <span className="me-1 fas fa-clock"></span>
                <span className="fw-bold">
                  9:53 AM
                </span>
                August 7,2021
              </p>
            </div>
          </div>
          <div className="dropdown">
            <button className="btn fs-10 btn-sm dropdown-toggle dropdown-caret-none transition-none notification-dropdown-toggle" type="button" data-bs-toggle="dropdown" data-boundary="window" aria-haspopup={true} aria-expanded={false} data-bs-reference="parent">
              <span className="fas fa-ellipsis-h fs-10 text-body"></span>
            </button>
            <div className="dropdown-menu dropdown-menu-end py-2">
              <a className="dropdown-item" href="#!">
                Mark as unread
              </a>
            </div>
          </div>
        </div>
        <div className="d-flex align-items-center justify-content-between py-3 px-lg-6 px-4 notification-card border-top read">
          <div className="d-flex">
            <div className="avatar avatar-xl me-3">
              <img className="rounded-circle" src="/assets/img/team/34.webp" alt="" />
            </div>
            <div className="me-3 flex-1 mt-2">
              <h4 className="fs-9 text-body-emphasis">
                Rick Sanchez
              </h4>
              <p className="fs-9 text-body-highlight">
                <span className="me-1">
                  💬
                </span>
                Mentioned you in a comment
                <span className="fw-bold">
                  "You need to see these amazing photos️"
                </span>
                <span className="ms-2 text-body-tertiary text-opacity-85 fw-bold fs-10"></span>
              </p>
              <p className="text-body-secondary fs-9 mb-0">
                <span className="me-1 fas fa-clock"></span>
                <span className="fw-bold">
                  9:45 AM
                </span>
                August 7,2021
              </p>
            </div>
          </div>
          <div className="dropdown">
            <button className="btn fs-10 btn-sm dropdown-toggle dropdown-caret-none transition-none notification-dropdown-toggle" type="button" data-bs-toggle="dropdown" data-boundary="window" aria-haspopup={true} aria-expanded={false} data-bs-reference="parent">
              <span className="fas fa-ellipsis-h fs-10 text-body"></span>
            </button>
            <div className="dropdown-menu dropdown-menu-end py-2">
              <a className="dropdown-item" href="#!">
                Mark as unread
              </a>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
