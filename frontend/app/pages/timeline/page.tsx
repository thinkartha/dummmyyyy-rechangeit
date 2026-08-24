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
      <nav className="mb-3 breadcrumb-sticky-top" aria-label="breadcrumb">
        <ol className="breadcrumb mb-0">
          <li className="breadcrumb-item">
            <a href="#!">
              Pages
            </a>
          </li>
          <li className="breadcrumb-item active">
            Timeline
          </li>
        </ol>
      </nav>
      <h2 className="text-bold mb-5 page-title-sticky-top">
        Timeline
      </h2>
      <div className="row gx-xl-8 gx-xxl-11">
        <div className="col-xl-5 p-xxl-7">
          <div className="ms-xxl-3 d-none d-xl-block position-sticky" style={{ top: "30%" }}>
            <img className="d-dark-none img-fluid" src="/assets/img/spot-illustrations/timeline.png" alt="" />
            <img className="d-light-none img-fluid" src="/assets/img/spot-illustrations/timeline-dark.png" alt="" />
          </div>
        </div>
        <div className="col-xl-7 scrollbar">
          <div>
            <h4 className="py-3 border-y mb-5 ms-8">
              Today
            </h4>
            <div className="timeline-basic mb-9">
              <div className="timeline-item">
                <div className="row g-3">
                  <div className="col-auto">
                    <div className="timeline-item-bar position-relative">
                      <div className="icon-item icon-item-md rounded-7 border border-translucent">
                        <span className="fa-solid fa-clipboard text-success fs-9"></span>
                      </div>
                      <span className="timeline-bar border-end border-dashed"></span>
                    </div>
                  </div>
                  <div className="col">
                    <div className="d-flex justify-content-between">
                      <div className="d-flex mb-2">
                        <h6 className="lh-sm mb-0 me-2 text-body-secondary timeline-item-title">
                          Assigned to serve as the
                          <br className="d-sm-none" />
                          project's director
                        </h6>
                      </div>
                      <p className="text-body-quaternary fs-9 mb-0 text-nowrap timeline-time">
                        <span className="fa-regular fa-clock me-1"></span>
                        4:33pm
                      </p>
                    </div>
                    <h6 className="fs-10 fw-normal mb-3">
                      by
                      <a className="fw-semibold" href="#!">
                        John N. Ward
                      </a>
                    </h6>
                    <p className="fs-9 text-body-secondary w-sm-60 mb-5">
                      Utilizing best practices to better leverage our assets, we must engage in black sky leadership thinking, not the usual band-aid solution.
                    </p>
                  </div>
                </div>
              </div>
              <div className="timeline-item">
                <div className="row g-3">
                  <div className="col-auto">
                    <div className="timeline-item-bar position-relative">
                      <div className="icon-item icon-item-md rounded-7 border border-translucent">
                        <span className="fa-solid fa-envelope text-danger fs-9"></span>
                      </div>
                      <span className="timeline-bar border-end border-dashed"></span>
                    </div>
                  </div>
                  <div className="col">
                    <div className="d-flex justify-content-between">
                      <div className="d-flex mb-2">
                        <h6 className="lh-sm mb-0 me-2 text-body-secondary timeline-item-title">
                          Quary about purchased
                          <br className="d-sm-none" />
                          soccer socks
                        </h6>
                      </div>
                      <p className="text-body-quaternary fs-9 mb-0 text-nowrap timeline-time">
                        <span className="fa-regular fa-clock me-1"></span>
                        6:30pm
                      </p>
                    </div>
                    <h6 className="fs-10 fw-normal mb-3">
                      by
                      <a className="fw-semibold" href="#!">
                        Edward Hopper
                      </a>
                    </h6>
                    <p className="fs-9 text-body-secondary w-sm-60 mb-5">
                      I’ve come across your posts and found some favorable deals on your page. I’ve added a load of products to the cart and I don’t know the payment options you avail. Also, can you enlighten me about any discount.
                    </p>
                  </div>
                </div>
              </div>
              <div className="timeline-item">
                <div className="row g-3">
                  <div className="col-auto">
                    <div className="timeline-item-bar position-relative">
                      <div className="icon-item icon-item-md rounded-7 border border-translucent">
                        <span className="fa-solid fa-video text-info fs-9"></span>
                      </div>
                    </div>
                  </div>
                  <div className="col">
                    <div className="d-flex justify-content-between">
                      <div className="d-flex mb-2">
                        <h6 className="lh-sm mb-0 me-2 text-body-secondary timeline-item-title">
                          Onboarding Meeting
                        </h6>
                      </div>
                      <p className="text-body-quaternary fs-9 mb-0 text-nowrap timeline-time">
                        <span className="fa-regular fa-clock me-1"></span>
                        9:33pm
                      </p>
                    </div>
                    <h6 className="fs-10 fw-normal false">
                      by
                      <a className="fw-semibold" href="#!">
                        John N. Ward
                      </a>
                    </h6>
                    <p className="fs-9 text-body-secondary w-sm-60 mb-0"></p>
                  </div>
                </div>
              </div>
            </div>
            <h4 className="py-3 border-y mb-5 ms-8">
              15 October, 2022
            </h4>
            <div className="timeline-basic mb-9">
              <div className="timeline-item">
                <div className="row g-3">
                  <div className="col-auto">
                    <div className="timeline-item-bar position-relative">
                      <div className="icon-item icon-item-md rounded-7 border border-translucent">
                        <span className="fa-solid fa-swatchbook text-primary fs-9"></span>
                      </div>
                      <span className="timeline-bar border-end border-dashed"></span>
                    </div>
                  </div>
                  <div className="col">
                    <div className="d-flex justify-content-between">
                      <div className="d-flex mb-2">
                        <h6 className="lh-sm mb-0 me-2 text-body-secondary timeline-item-title">
                          Designing the dungeon
                        </h6>
                      </div>
                      <p className="text-body-quaternary fs-9 mb-0 text-nowrap timeline-time">
                        <span className="fa-regular fa-clock me-1"></span>
                        1:30pm
                      </p>
                    </div>
                    <h6 className="fs-10 fw-normal mb-3">
                      by
                      <a className="fw-semibold" href="#!">
                        John N. Ward
                      </a>
                    </h6>
                    <p className="fs-9 text-body-secondary w-sm-60 mb-5">
                      To get off the runway and paradigm shift, we should take brass tacks with above-the-board actionable analytics, ramp up with viral partnering, not the usual goat rodeo putting socks on an octopus.
                    </p>
                  </div>
                </div>
              </div>
              <div className="timeline-item">
                <div className="row g-3">
                  <div className="col-auto">
                    <div className="timeline-item-bar position-relative">
                      <div className="icon-item icon-item-md rounded-7 border border-translucent">
                        <span className="fa-solid fa-skull-crossbones text-danger fs-9"></span>
                      </div>
                      <span className="timeline-bar border-end border-dashed"></span>
                    </div>
                  </div>
                  <div className="col">
                    <div className="d-flex justify-content-between">
                      <div className="d-flex mb-2">
                        <h6 className="lh-sm mb-0 me-2 text-body-secondary timeline-item-title">
                          How to take the headache
                          <br className="d-sm-none" />
                          out of Order
                        </h6>
                      </div>
                      <p className="text-body-quaternary fs-9 mb-0 text-nowrap timeline-time">
                        <span className="fa-regular fa-clock me-1"></span>
                        8:32pm
                      </p>
                    </div>
                    <h6 className="fs-10 fw-normal mb-3">
                      by
                      <a className="fw-semibold" href="#!">
                        Edward Hopper
                      </a>
                    </h6>
                    <p className="fs-9 text-body-secondary w-sm-60 mb-5">
                      It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters.
                    </p>
                  </div>
                </div>
              </div>
              <div className="timeline-item">
                <div className="row g-3">
                  <div className="col-auto">
                    <div className="timeline-item-bar position-relative">
                      <div className="icon-item icon-item-md rounded-7 border border-translucent">
                        <span className="fa-solid fa-stethoscope text-primary fs-9"></span>
                      </div>
                      <span className="timeline-bar border-end border-dashed"></span>
                    </div>
                  </div>
                  <div className="col">
                    <div className="d-flex justify-content-between">
                      <div className="d-flex mb-2">
                        <h6 className="lh-sm mb-0 me-2 text-body-secondary timeline-item-title">
                          Mandatory routine checkup
                        </h6>
                      </div>
                      <p className="text-body-quaternary fs-9 mb-0 text-nowrap timeline-time">
                        <span className="fa-regular fa-clock me-1"></span>
                        9:30pm
                      </p>
                    </div>
                    <h6 className="fs-10 fw-normal mb-3">
                      by
                      <a className="fw-semibold" href="#!">
                        Eye before Thy Hospital
                      </a>
                    </h6>
                    <p className="fs-9 text-body-secondary w-sm-60 mb-5">
                      To get the bitter butter out and take the better butter into the bitter dough to make a bitter bread and broad donut, not the usual yellow butter, but the white butterless butter.
                    </p>
                  </div>
                </div>
              </div>
              <div className="timeline-item">
                <div className="row g-3">
                  <div className="col-auto">
                    <div className="timeline-item-bar position-relative">
                      <div className="icon-item icon-item-md rounded-7 border border-translucent">
                        <span className="fa-solid fa-utensils text-success fs-9"></span>
                      </div>
                      <span className="timeline-bar border-end border-dashed"></span>
                    </div>
                  </div>
                  <div className="col">
                    <div className="d-flex justify-content-between">
                      <div className="d-flex mb-2">
                        <h6 className="lh-sm mb-0 me-2 text-body-secondary timeline-item-title">
                          Making bad butter better
                        </h6>
                      </div>
                      <p className="text-body-quaternary fs-9 mb-0 text-nowrap timeline-time">
                        <span className="fa-regular fa-clock me-1"></span>
                        8:30pm
                      </p>
                    </div>
                    <h6 className="fs-10 fw-normal mb-3">
                      by
                      <a className="fw-semibold" href="#!">
                        Edward Hopper
                      </a>
                    </h6>
                    <p className="fs-9 text-body-secondary w-sm-60 mb-5">
                      Check how long a fish might live out of water and if you can check the pulse to see if it's alive or not though it's okay to eat fish cause they don't have any feelings.
                    </p>
                  </div>
                </div>
              </div>
              <div className="timeline-item">
                <div className="row g-3">
                  <div className="col-auto">
                    <div className="timeline-item-bar position-relative">
                      <div className="icon-item icon-item-md rounded-7 border border-translucent">
                        <span className="fa-solid fa-rocket text-info fs-9"></span>
                      </div>
                    </div>
                  </div>
                  <div className="col">
                    <div className="d-flex justify-content-between">
                      <div className="d-flex mb-2">
                        <h6 className="lh-sm mb-0 me-2 text-body-secondary timeline-item-title">
                          Launching Phoenix
                        </h6>
                      </div>
                      <p className="text-body-quaternary fs-9 mb-0 text-nowrap timeline-time">
                        <span className="fa-regular fa-clock me-1"></span>
                        10:33pm
                      </p>
                    </div>
                    <h6 className="fs-10 fw-normal false">
                      by
                      <a className="fw-semibold" href="#!">
                        John N. Ward
                      </a>
                    </h6>
                    <p className="fs-9 text-body-secondary w-sm-60 mb-0"></p>
                  </div>
                </div>
              </div>
            </div>
            <h4 className="py-3 border-y mb-5 ms-8">
              20 October, 2022
            </h4>
            <div className="timeline-basic mb-9">
              <div className="timeline-item">
                <div className="row g-3">
                  <div className="col-auto">
                    <div className="timeline-item-bar position-relative">
                      <div className="icon-item icon-item-md rounded-7 border border-translucent">
                        <span className="fa-solid fa-screwdriver-wrench text-warning fs-9"></span>
                      </div>
                      <span className="timeline-bar border-end border-dashed"></span>
                    </div>
                  </div>
                  <div className="col">
                    <div className="d-flex justify-content-between">
                      <div className="d-flex mb-2">
                        <h6 className="lh-sm mb-0 me-2 text-body-secondary timeline-item-title">
                          To take the ants out
                        </h6>
                      </div>
                      <p className="text-body-quaternary fs-9 mb-0 text-nowrap timeline-time">
                        <span className="fa-regular fa-clock me-1"></span>
                        8:32pm
                      </p>
                    </div>
                    <h6 className="fs-10 fw-normal mb-3">
                      by
                      <a className="fw-semibold" href="#!">
                        Edward Hopper
                      </a>
                    </h6>
                    <p className="fs-9 text-body-secondary w-sm-60 mb-5">
                      Many ants are crawling into my PC and now they live in there to get highly skilled in web development and programming language that will make them earn better than the humans so that they’ll be able to buy off all the sugar out of the market.
                    </p>
                  </div>
                </div>
              </div>
              <div className="timeline-item">
                <div className="row g-3">
                  <div className="col-auto">
                    <div className="timeline-item-bar position-relative">
                      <div className="icon-item icon-item-md rounded-7 border border-translucent">
                        <span className="fa-solid fa-paperclip text-info fs-9"></span>
                      </div>
                    </div>
                  </div>
                  <div className="col">
                    <div className="d-flex justify-content-between">
                      <div className="d-flex mb-2">
                        <h6 className="lh-sm mb-0 me-2 text-body-secondary timeline-item-title">
                          Added file
                        </h6>
                        <h6 className="mb-0 fs-9">
                          <span className="fa-solid fa-file-pdf me-1 text-body-tertiary"></span>
                          <a href="#!">
                            Readme.pdf
                          </a>
                        </h6>
                      </div>
                      <p className="text-body-quaternary fs-9 mb-0 text-nowrap timeline-time">
                        <span className="fa-regular fa-clock me-1"></span>
                        10:33pm
                      </p>
                    </div>
                    <h6 className="fs-10 fw-normal false">
                      by
                      <a className="fw-semibold" href="#!">
                        John N. Ward
                      </a>
                    </h6>
                    <p className="fs-9 text-body-secondary w-sm-60 mb-0"></p>
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
