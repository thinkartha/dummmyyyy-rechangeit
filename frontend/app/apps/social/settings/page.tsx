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
      <div className="mb-9">
        <div className="row g-6">
          <div className="col-12 col-xl-4">
            <div className="card mb-5">
              <div className="card-header hover-actions-trigger position-relative mb-6" style={{ minHeight: "130px" }}>
                <div className="bg-holder rounded-top" style={{ backgroundImage: "linear-gradient(0deg, #000000 -3%, rgba(0, 0, 0, 0) 83%), url(../../assets/img/generic/59.png)" }}>
                  <input className="d-none" id="upload-settings-cover-image" type="file" />
                  <label className="cover-image-file-input" htmlFor="upload-settings-cover-image"></label>
                  <div className="hover-actions end-0 bottom-0 pe-1 pb-2 text-white dark__text-gray-1100">
                    <span className="fa-solid fa-camera me-2"></span>
                  </div>
                </div>
                <input className="d-none" id="upload-settings-porfile-picture" type="file" />
                <label className="avatar avatar-4xl status-online feed-avatar-profile cursor-pointer" htmlFor="upload-settings-porfile-picture">
                  <img className="rounded-circle img-thumbnail shadow-sm border-0" src="/assets/img/team/20.webp" width="200" alt="" />
                </label>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-12">
                    <div className="d-flex flex-wrap mb-2 align-items-center">
                      <h3 className="me-2">
                        Ansolo Lazinatov
                      </h3>
                      <span className="fw-normal fs-8">
                        u/hansolo
                      </span>
                    </div>
                    <div className="d-flex d-xl-block d-xxl-flex align-items-center">
                      <div className="d-flex mb-xl-2 mb-xxl-0">
                        <span className="fa-solid fa-user-group fs-10 me-2 me-lg-1 me-xl-2"></span>
                        <h6 className="d-inline-block mb-0">
                          1297
                          <span className="fw-semibold ms-1 me-4">
                            Followers
                          </span>
                        </h6>
                      </div>
                      <div className="d-flex">
                        <span className="fa-solid fa-user-check fs-10 me-2 me-lg-1 me-xl-2"></span>
                        <h6 className="d-block d-xl-inline-block mb-0">
                          3971
                          <span className="fw-semibold ms-1">
                            Following
                          </span>
                        </h6>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="border-bottom border-translucent border-dashed pb-3 mb-4">
              <h5 className="text-body mb-3">
                Who will be able to see your profile?
              </h5>
              <div className="form-check">
                <input className="form-check-input" id="onlyMe" type="radio" defaultChecked={true} name="profiileVisibility" />
                <label className="form-check-label fs-8" htmlFor="onlyMe">
                  Only me
                </label>
              </div>
              <div className="form-check">
                <input className="form-check-input" id="myFollowers" type="radio" name="profiileVisibility" />
                <label className="form-check-label fs-8" htmlFor="myFollowers">
                  My followers
                </label>
              </div>
              <div className="form-check">
                <input className="form-check-input" id="everyone" type="radio" name="profiileVisibility" />
                <label className="form-check-label fs-8" htmlFor="everyone">
                  Everyone
                </label>
              </div>
            </div>
            <div className="border-bottom border-translucent border-dashed pb-3 mb-4">
              <h5 className="text-body mb-3">
                Who can tag you?
              </h5>
              <div className="form-check">
                <input className="form-check-input" id="tagGroupMembers" type="radio" defaultChecked={true} name="tagPermission" />
                <label className="form-check-label fs-8" htmlFor="tagGroupMembers">
                  Group Members
                </label>
              </div>
              <div className="form-check">
                <input className="form-check-input" id="tagEveryone" type="radio" name="tagPermission" />
                <label className="form-check-label fs-8" htmlFor="tagEveryone">
                  Everyone
                </label>
              </div>
            </div>
            <div className="border-bottom border-translucent border-dashed pb-3 mb-4">
              <div className="form-check">
                <input className="form-check-input" id="showEmail" type="checkbox" name="showEmail" />
                <label className="form-check-label fs-8" htmlFor="showEmail">
                  Allow users to show your email
                </label>
              </div>
              <div className="form-check">
                <input className="form-check-input" id="showExperiences" type="checkbox" name="showExperiences" />
                <label className="form-check-label fs-8" htmlFor="showExperiences">
                  Allow users to show your experiences
                </label>
              </div>
              <div className="form-check">
                <input className="form-check-input" id="showFollowers" type="checkbox" defaultChecked={true} name="showFollowers" />
                <label className="form-check-label fs-8" htmlFor="showFollowers">
                  Allow users to show your followers
                </label>
              </div>
            </div>
            <div className="mb-4">
              <div className="form-check form-switch">
                <input className="form-check-input" id="showPhone" type="checkbox" defaultChecked={true} name="showPhone" />
                <label className="form-check-label fs-8" htmlFor="showPhone">
                  Show your phone number
                </label>
              </div>
              <div className="form-check form-switch">
                <input className="form-check-input" id="permitFollow" type="checkbox" defaultChecked={true} name="permitFollow" />
                <label className="form-check-label fs-8" htmlFor="permitFollow">
                  Permit users to follow you.
                </label>
              </div>
            </div>
          </div>
          <div className="col-12 col-xl-8">
            <div className="border-bottom mb-4">
              <div className="mb-6">
                <h4 className="mb-4">
                  Personal Information
                </h4>
                <div className="row g-3">
                  <div className="col-12 col-sm-6">
                    <div className="form-icon-container">
                      <div className="form-floating">
                        <input className="form-control form-icon-input" id="firstName" type="text" placeholder="First Name" />
                        <label className="text-body-tertiary form-icon-label" htmlFor="firstName">
                          FIRST NAME
                        </label>
                      </div>
                      <span className="fa-solid fa-user text-body fs-9 form-icon"></span>
                    </div>
                  </div>
                  <div className="col-12 col-sm-6">
                    <div className="form-icon-container">
                      <div className="form-floating">
                        <input className="form-control form-icon-input" id="lastName" type="text" placeholder="Last Name" />
                        <label className="text-body-tertiary form-icon-label" htmlFor="lastName">
                          LAST NAME
                        </label>
                      </div>
                      <span className="fa-solid fa-user text-body fs-9 form-icon"></span>
                    </div>
                  </div>
                  <div className="col-12 col-sm-6">
                    <div className="form-icon-container">
                      <div className="form-floating">
                        <input className="form-control form-icon-input" id="emailSocial" type="email" placeholder="Email" />
                        <label className="text-body-tertiary form-icon-label" htmlFor="emailSocial">
                          ENTER YOUR EMAIL
                        </label>
                      </div>
                      <span className="fa-solid fa-envelope text-body fs-9 form-icon"></span>
                    </div>
                  </div>
                  <div className="col-12 col-sm-6">
                    <div className="form-icon-container">
                      <div className="form-floating">
                        <input className="form-control form-icon-input" id="phone" type="tel" placeholder="Phone" />
                        <label className="text-body-tertiary form-icon-label" htmlFor="phone">
                          ENTER YOUR PHONE
                        </label>
                      </div>
                      <span className="fa-solid fa-phone text-body fs-9 form-icon"></span>
                    </div>
                  </div>
                  <div className="col-12 col-sm-6">
                    <div className="form-icon-container">
                      <div className="form-floating">
                        <textarea className="form-control form-icon-input" id="info" style={{ height: "115px" }} placeholder="Info" />
                        <label className="text-body-tertiary form-icon-label" htmlFor="info">
                          Info
                        </label>
                      </div>
                      <span className="fa-solid fa-circle-info text-body fs-9 form-icon"></span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="row gx-3 mb-6 gy-6 gy-sm-3">
                <div className="col-12 col-sm-6">
                  <h4 className="mb-4">
                    Company Info
                  </h4>
                  <div className="form-icon-container mb-3">
                    <div className="form-floating">
                      <input className="form-control form-icon-input" id="companyName" type="text" placeholder="Company Name" />
                      <label className="text-body-tertiary form-icon-label" htmlFor="companyName">
                        COMPANY NAME
                      </label>
                    </div>
                    <span className="fa-solid fa-building text-body fs-9 form-icon"></span>
                  </div>
                  <div className="form-icon-container">
                    <div className="form-floating">
                      <input className="form-control form-icon-input" id="website" type="text" placeholder="Website" />
                      <label className="text-body-tertiary form-icon-label" htmlFor="website">
                        Website
                      </label>
                    </div>
                    <span className="fa-solid fa-globe text-body fs-9 form-icon"></span>
                  </div>
                </div>
                <div className="col-12 col-sm-6">
                  <h4 className="mb-4">
                    Change Password
                  </h4>
                  <div className="form-icon-container mb-3">
                    <div className="form-floating">
                      <input className="form-control form-icon-input" id="oldPassword" type="password" placeholder="Old password" />
                      <label className="text-body-tertiary form-icon-label" htmlFor="oldPassword">
                        Old Password
                      </label>
                    </div>
                    <span className="fa-solid fa-lock text-body fs-9 form-icon"></span>
                  </div>
                  <div className="form-icon-container mb-3">
                    <div className="form-floating">
                      <input className="form-control form-icon-input" id="newPassword" type="password" placeholder="New password" />
                      <label className="text-body-tertiary form-icon-label" htmlFor="newPassword">
                        New Password
                      </label>
                    </div>
                    <span className="fa-solid fa-key text-body fs-9 form-icon"></span>
                  </div>
                  <div className="form-icon-container">
                    <div className="form-floating">
                      <input className="form-control form-icon-input" id="newPassword2" type="password" placeholder="Confirm New password" />
                      <label className="text-body-tertiary form-icon-label" htmlFor="newPassword2">
                        Confirm New Password
                      </label>
                    </div>
                    <span className="fa-solid fa-key text-body fs-9 form-icon"></span>
                  </div>
                </div>
              </div>
              <div className="mb-6">
                <h4 className="mb-4">
                  Social
                </h4>
                <div className="row g-3">
                  <div className="col-12 col-sm-6">
                    <div className="form-icon-container">
                      <div className="form-floating">
                        <input className="form-control form-icon-input" id="facebook" type="text" placeholder="Facebook" />
                        <label className="text-body-tertiary form-icon-label" htmlFor="facebook">
                          Facebook
                        </label>
                      </div>
                      <span className="fa-brands fa-facebook text-body fs-9 form-icon"></span>
                    </div>
                  </div>
                  <div className="col-12 col-sm-6">
                    <div className="form-icon-container">
                      <div className="form-floating">
                        <input className="form-control form-icon-input" id="twitter" type="text" placeholder="Twitter" />
                        <label className="text-body-tertiary form-icon-label" htmlFor="twitter">
                          Twitter
                        </label>
                      </div>
                      <span className="fa-brands fa-twitter text-body fs-9 form-icon"></span>
                    </div>
                  </div>
                  <div className="col-12 col-sm-6">
                    <div className="form-icon-container">
                      <div className="form-floating">
                        <input className="form-control form-icon-input" id="linkedin" type="text" placeholder="Linkedin" />
                        <label className="text-body-tertiary form-icon-label" htmlFor="linkedin">
                          linkedin
                        </label>
                      </div>
                      <span className="fa-brands fa-linkedin-in text-body fs-9 form-icon"></span>
                    </div>
                  </div>
                  <div className="col-12 col-sm-6">
                    <div className="form-icon-container">
                      <div className="form-floating">
                        <input className="form-control form-icon-input" id="youtube" type="text" placeholder="youtube" />
                        <label className="text-body-tertiary form-icon-label" htmlFor="youtube">
                          youtube
                        </label>
                      </div>
                      <span className="fa-brands fa-youtube text-body fs-9 form-icon"></span>
                    </div>
                  </div>
                  <div className="col-12 col-sm-6">
                    <div className="form-icon-container">
                      <div className="form-floating">
                        <input className="form-control form-icon-input" id="artstation" type="text" placeholder="artstation" />
                        <label className="text-body-tertiary form-icon-label" htmlFor="artstation">
                          artstation
                        </label>
                      </div>
                      <span className="fa-brands fa-artstation text-body fs-9 form-icon"></span>
                    </div>
                  </div>
                  <div className="col-12 col-sm-6">
                    <div className="form-icon-container">
                      <div className="form-floating">
                        <input className="form-control form-icon-input" id="behance" type="text" placeholder="behance" />
                        <label className="text-body-tertiary form-icon-label" htmlFor="behance">
                          behance
                        </label>
                      </div>
                      <span className="fa-brands fa-behance text-body fs-9 form-icon"></span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-end mb-6">
                <div>
                  <button className="btn btn-phoenix-secondary me-2">
                    Cancel Changes
                  </button>
                  <button className="btn btn-phoenix-primary">
                    Save Information
                  </button>
                </div>
              </div>
            </div>
            <div className="row gy-5">
              <div className="col-12 col-md-6">
                <h4 className="text-body-emphasis">
                  Transfer Ownership
                </h4>
                <p className="text-body-tertiary">
                  Transfer this account to another person or to a company repository.
                </p>
                <button className="btn btn-phoenix-warning">
                  Transfer
                </button>
              </div>
              <div className="col-12 col-md-6">
                <h4 className="text-body-emphasis">
                  Account Deletion
                </h4>
                <p className="text-body-tertiary">
                  Transfer this account to another person or to a company repository.
                </p>
                <button className="btn btn-phoenix-danger">
                  Delete account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
