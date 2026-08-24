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
          "src": "https://maps.googleapis.com/maps/api/js?key=&callback=initMap"
        },
        {
          "src": "/vendors/choices/choices.min.js"
        },
        {
          "src": "/vendors/glightbox/glightbox.min.js"
        },
        {
          "src": "/assets/js/phoenix.js"
        }
      ]}>
      <nav className="mb-3" aria-label="breadcrumb">
        <ol className="breadcrumb mb-0">
          <li className="breadcrumb-item">
            <a href="#!">
              Page 1
            </a>
          </li>
          <li className="breadcrumb-item">
            <a href="#!">
              Page 2
            </a>
          </li>
          <li className="breadcrumb-item active">
            Default
          </li>
        </ol>
      </nav>
      <div className="pb-9">
        <h2 className="mb-4 mb-lg-6">
          Event details
        </h2>
        <img className="rounded w-100 object-fit-cover mb-5 mb-md-6 mb-xl-8" src="/assets/img/generic/34.png" alt="" style={{ minHeight: "250px" }} />
        <div className="row gx-lg-9">
          <div className="col-xl-8 border-end-xl">
            <div className="card mb-9">
              <div className="card-body">
                <h1 className="lh-sm fs-6 fs-xxl-4 mb-2">
                  Brandmyth presents- Shironamhin 25 years celebration with symphony orchestra
                </h1>
                <p className="fs-8 mb-4 text-body-tertiary">
                  Tavern on the Greend, New York
                </p>
                <div className="card mb-5 mb-xxl-7">
                  <div className="card-body">
                    <div className="row gy-5">
                      <div className="col-md-6 d-flex justify-content-between">
                        <div>
                          <div className="mb-3">
                            <div className="d-flex align-items-center">
                              <div className="px-2 py-1 bg-info-subtle rounded">
                                <span className="text-info" data-feather="map-pin"></span>
                              </div>
                              <h5 className="ms-2 text-body-emphasis mb-0">
                                Location
                              </h5>
                            </div>
                          </div>
                          <p className="lh-sm mb-0 text-body-tertiary">
                            36/4A, James Tiberius Auditorium,
                            <br />
                            Vancouver, British Columbia, Canada
                          </p>
                        </div>
                        <div className="my-4 mx-3 border-start border-translucent d-none d-md-block"></div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <div className="d-flex align-items-center">
                            <div className="px-2 py-1 bg-primary-subtle rounded">
                              <span className="text-primary" data-feather="clock"></span>
                            </div>
                            <h5 className="ms-2 mb-0">
                              Date & Time
                            </h5>
                          </div>
                        </div>
                        <p className="lh-sm mb-0 text-body-tertiary">
                          28th June - 2nd July 2022,
                          <br />
                          10 am - 4 pm Eastern Daylight Time
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row g-2">
                  <div className="col-12 col-md-auto flex-md-grow-1">
                    <button className="btn btn-primary w-100" type="button">
                      Get Tickets
                    </button>
                  </div>
                  <div className="col-12 col-sm-auto flex-sm-grow-1 flex-md-grow-0">
                    <button className="btn btn-phoenix-primary w-100" type="button">
                      <span className="fa-regular fa-calendar-plus me-2"></span>
                      Add to Calendar
                    </button>
                  </div>
                  <div className="col-6 col-sm-auto">
                    <button className="btn btn-phoenix-primary w-100" type="button">
                      <span className="fa-solid fa-heart me-2"></span>
                      3677
                    </button>
                  </div>
                  <div className="col-6 col-sm-auto">
                    <button className="btn btn-phoenix-primary w-100" type="button">
                      <span className="fa-solid fa-share-nodes me-2"></span>
                      4467
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <h2 className="mb-3">
              About this event
            </h2>
            <p className="text-justify text-body-secondary mb-6 mb-xxl-8">
              The Festival Season hopes to continue its rescheduled events in 2023 during the spring block. This will be a continuation of the tradition for the loyal fanbase to watch a jam-packed day full of exciting top-notch performances. With a unique lineup, you’ll know what to expect and get ready to embrace the festivity. Moreover, we’ve added a detailed list of the performers, with details of dates, lineups and prospective entry requirements. We will keep you posted with necessary updates regarding the event.
            </p>
            <h4 className="mb-3 fw-bold text-body-highlight fs-xxl-6">
              Singers:
            </h4>
            <p>
              To join the festival, you’ll need to register through
              <a href="mailto:register@event.com">
                register@event.com
              </a>
              after confirming the payment, you’ll be provided with a unique ID number that you’ll need to show before the authority to get the tickets.
            </p>
            <p>
              The ID number will be unique to all members, so it’s requested that you don’t share it with anyone. Any damage regarding a misused ID will not be ours to compensate or refund.Enjoy!
            </p>
            <div className="row g-1 g-sm-2 mb-7 mb-xxl-8">
              <div className="col-3">
                <a href="/assets/img/gallery/19.jpg" data-gallery="gallery-posts-undefined">
                  <img className="rounded h-100 w-100 object-fit-cover" src="/assets/img/gallery/19.jpg" alt="..." />
                </a>
              </div>
              <div className="col-3">
                <a href="/assets/img/gallery/20.jpg" data-gallery="gallery-posts-undefined">
                  <img className="rounded h-100 w-100 object-fit-cover" src="/assets/img/gallery/20.jpg" alt="..." />
                </a>
              </div>
              <div className="col-6">
                <a href="/assets/img/gallery/21.jpg" data-gallery="gallery-posts-undefined">
                  <img className="rounded h-100 w-100 object-fit-cover" src="/assets/img/gallery/21.jpg" alt="..." />
                </a>
              </div>
            </div>
            <h4 className="mb-3 text-body-highlight fs-xxl-6">
              Topic To Be Covered:
            </h4>
            <ul className="mb-6 ps-4">
              <li>
                Latest Update With Bitcoin
              </li>
              <li>
                Blockchain Vs Bitcoin
              </li>
              <li>
                Why Do We Need CryptoCurrency?
              </li>
              <li>
                Bitcoin History
              </li>
              <li>
                Bitcoin Vs Ethereum
              </li>
              <li>
                How Big Is Cryptocurrency Right Now?
              </li>
              <li>
                Crypto Scams & How To Identify Them
              </li>
              <li>
                Is it Worth Buying To Keep?
              </li>
            </ul>
            <h4 className="mb-3 text-body-highlight fs-xxl-6">
              Refund Policy:
            </h4>
            <ul className="mb-6 ps-4">
              <li>
                Contact the organizer to request a refund.
              </li>
              <li>
                Eventbrite's fee is nonrefundable.
              </li>
            </ul>
            <h3 className="mb-3 fw-bold text-body-highlight fs-7 fs-xxl-6">
              Responses:
            </h3>
            <div className="d-flex mb-6">
              <div className="me-3">
                <p className="mb-2 text-body-secondary">
                  Going
                </p>
                <h3 className="text-body-secondary">
                  4,569
                </h3>
              </div>
              <div className="my-3 mx-2 mx-sm-3 border-start"></div>
              <div className="mx-3">
                <p className="mb-2 text-body-secondary">
                  Interested
                </p>
                <h3 className="text-body-secondary">
                  15,652
                </h3>
              </div>
              <div className="my-3 mx-2 mx-sm-3 border-start"></div>
              <div className="ms-3">
                <p className="mb-2 text-body-secondary">
                  Share
                </p>
                <h3 className="text-body-secondary">
                  11,236
                </h3>
              </div>
            </div>
            <h3 className="mb-3 fw-bold text-body-highlight fs-7">
              Share with Friends:
            </h3>
            <div className="d-flex mb-5">
              <button className="btn btn-phoenix-primary btn-icon me-2">
                <span className="fa-brands fa-facebook text-facebbok"></span>
              </button>
              <button className="btn btn-phoenix-primary btn-icon me-2">
                <span className="fa-brands fa-facebook-messenger"></span>
              </button>
              <button className="btn btn-phoenix-primary btn-icon me-2">
                <span className="fa-brands fa-twitter text-info"></span>
              </button>
              <button className="btn btn-phoenix-primary btn-icon me-2">
                <span className="fa-solid fa-envelope text-danger"></span>
              </button>
              <button className="btn btn-phoenix-primary btn-icon me-2">
                <span className="fa-brands fa-linkedin-in text-info"></span>
              </button>
            </div>
            <button className="btn btn-phoenix-primary w-100 mb-5 mb-xl-0" type="button">
              Load more
            </button>
          </div>
          <div className="col-xl-4">
            <h3 className="mb-5 mb-xl-4">
              Organized by
            </h3>
            <div className="row g-2 mb-6 align-items-center">
              <div className="col-auto">
                <img className="rounded img-fluid" src="/assets/img/brand2/b.png" alt="..." width="40" height="40" />
              </div>
              <div className="col-sm-auto flex-1">
                <a className="mb-0 text-primary fw-semibold lh-sm" href="#!">
                  Bass Events, Inc.
                </a>
              </div>
              <div className="col-sm-auto col-xl-12 col-xxl-auto">
                <button className="btn btn-link text-body p-0 me-2" type="button">
                  10k Followers
                </button>
                <button className="btn btn-phoenix-primary px-3" type="button">
                  <span className="fa-solid fa-user-plus me-2"></span>
                  Follow
                </button>
              </div>
            </div>
            <div className="mb-8">
              <h3 className="mb-5 mb-xl-4">
                Location
              </h3>
              <div className="googlemap mb-3 mb-xl-4 location-map border" data-googlemap="data-googlemap" data-gmap="data-gmap" data-latlng="40.7228022,-74.0020158" data-scrollwheel="false" data-zoom="15">
                <div className="marker-content py-3">
                  <h5>
                    Google map
                  </h5>
                  <p className="mb-0">
                    A nice template for your site.
                    <br />
                    Customize it as you want.
                  </p>
                </div>
              </div>
              <div className="row flex-between-center g-0 gy-3">
                <div className="col-12 col-sm-auto me-1">
                  <div className="d-flex">
                    <h3 className="fw-bold text-body-highlight fs-8 me-2 mb-0">
                      James Tiberius Auditorium
                    </h3>
                    <p className="mb-0 text-body-highlight fs-9">
                      Vancouver
                    </p>
                  </div>
                </div>
                <div className="col-12 col-sm-auto col-xl-12">
                  <button className="btn btn-phoenix-primary w-100" type="button">
                    <span className="fa-solid fa-route me-2"></span>
                    Get directions
                  </button>
                </div>
              </div>
            </div>
            <h3 className="mb-3">
              Tags
            </h3>
            <div className="d-flex flex-wrap pb-7 border-bottom border-translucent">
              <span className="badge badge-tag me-2 mb-2">
                Music
              </span>
              <span className="badge badge-tag me-2 mb-2">
                CONCERT
              </span>
              <span className="badge badge-tag mb-2">
                Greatest show on earth
              </span>
            </div>
            <div className="row g-0 py-3 border-bottom border-dashed align-items-end justify-content-between">
              <div className="col-auto">
                <h3 className="flex-1 mb-0 text-nowrap me-3">
                  Upcoming events
                </h3>
              </div>
              <div className="col-auto">
                <a className="fw-bold fs-9" href="#!">
                  See more
                </a>
              </div>
            </div>
            <div className="py-3 border-bottom border-translucent border-dashed">
              <div className="d-flex flex-between-center">
                <p className="text-warning fs-10 mb-0 fw-bold mb-1">
                  MON, FEB 21- MARCH 23
                </p>
                <div className="btn-reveal-trigger">
                  <button className="btn btn-sm dropdown-toggle dropdown-caret-none transition-none d-flex btn-reveal" type="button" data-bs-toggle="dropdown" data-boundary="window" aria-haspopup={true} aria-expanded={false} data-bs-reference="parent">
                    <span className="fas fa-ellipsis-h"></span>
                  </button>
                  <div className="dropdown-menu dropdown-menu-end py-2">
                    <a className="dropdown-item" href="#!">
                      Edit
                    </a>
                    <a className="dropdown-item text-danger" href="#!">
                      Delete
                    </a>
                    <a className="dropdown-item" href="#!">
                      Download
                    </a>
                    <a className="dropdown-item" href="#!">
                      Report abuse
                    </a>
                  </div>
                </div>
              </div>
              <a className="text-primary-hover text-body-highlight fw-bold mb-2 line-clamp-1 me-5 lh-base" href="#!">
                Master Class on FILM Studies THESIS on Makers
              </a>
              <p className="text-body-secondary fs-9 mb-2">
                Organized by
                <br />
                <a className="fw-bold text-primary" href="#!">
                  IAFM- International Academy of Film and Media
                </a>
              </p>
              <p className="fs-10 text-body-tertiary text-opacity-85">
                64 people going
              </p>
              <p className="fs-9 text-body-tertiary fw-bold mb-1">
                <span className="fa-solid fa-clock text-body-secondary me-1"></span>
                12.30PM - 10PM
              </p>
              <p className="fs-9 text-body-tertiary fw-bold mb-0">
                <span className="fa-solid fa-map-marker-alt text-body-secondary me-1"></span>
                Tavern on the Greend, New York
              </p>
            </div>
            <div className="py-3 border-bottom border-translucent border-dashed">
              <div className="d-flex flex-between-center">
                <p className="text-warning fs-10 mb-0 fw-bold mb-1">
                  MON, FEB 21- MARCH 23
                </p>
                <div className="btn-reveal-trigger">
                  <button className="btn btn-sm dropdown-toggle dropdown-caret-none transition-none d-flex btn-reveal" type="button" data-bs-toggle="dropdown" data-boundary="window" aria-haspopup={true} aria-expanded={false} data-bs-reference="parent">
                    <span className="fas fa-ellipsis-h"></span>
                  </button>
                  <div className="dropdown-menu dropdown-menu-end py-2">
                    <a className="dropdown-item" href="#!">
                      Edit
                    </a>
                    <a className="dropdown-item text-danger" href="#!">
                      Delete
                    </a>
                    <a className="dropdown-item" href="#!">
                      Download
                    </a>
                    <a className="dropdown-item" href="#!">
                      Report abuse
                    </a>
                  </div>
                </div>
              </div>
              <a className="text-primary-hover text-body-highlight fw-bold mb-2 line-clamp-1 me-5 lh-base" href="#!">
                Master Class on FILM Studies 'ANALYSIS of Cinema'
              </a>
              <p className="text-body-secondary fs-9 mb-2">
                Organized by
                <br />
                <a className="fw-bold text-primary" href="#!">
                  IAFM- International Academy of Film and Media
                </a>
              </p>
              <p className="fs-10 text-body-tertiary text-opacity-85">
                64 people going
              </p>
              <p className="fs-9 text-body-tertiary fw-bold mb-1">
                <span className="fa-solid fa-clock text-body-secondary me-1"></span>
                12.30PM - 10PM
              </p>
              <p className="fs-9 text-body-tertiary fw-bold mb-0">
                <span className="fa-solid fa-map-marker-alt text-body-secondary me-1"></span>
                Tavern on the Greend, New York
              </p>
            </div>
            <div className="py-3 border-bottom border-translucent border-dashed">
              <div className="d-flex flex-between-center">
                <p className="text-warning fs-10 mb-0 fw-bold mb-1">
                  MON, FEB 21- MARCH 23
                </p>
                <div className="btn-reveal-trigger">
                  <button className="btn btn-sm dropdown-toggle dropdown-caret-none transition-none d-flex btn-reveal" type="button" data-bs-toggle="dropdown" data-boundary="window" aria-haspopup={true} aria-expanded={false} data-bs-reference="parent">
                    <span className="fas fa-ellipsis-h"></span>
                  </button>
                  <div className="dropdown-menu dropdown-menu-end py-2">
                    <a className="dropdown-item" href="#!">
                      Edit
                    </a>
                    <a className="dropdown-item text-danger" href="#!">
                      Delete
                    </a>
                    <a className="dropdown-item" href="#!">
                      Download
                    </a>
                    <a className="dropdown-item" href="#!">
                      Report abuse
                    </a>
                  </div>
                </div>
              </div>
              <a className="text-primary-hover text-body-highlight fw-bold mb-2 line-clamp-1 me-5 lh-base" href="#!">
                Witnessing History in Making Photographs
              </a>
              <p className="text-body-secondary fs-9 mb-2">
                Organized by
                <br />
                <a className="fw-bold text-primary" href="#!">
                  IAFM- International Academy of Film and Media
                </a>
              </p>
              <p className="fs-10 text-body-tertiary text-opacity-85">
                64 people going
              </p>
              <p className="fs-9 text-body-tertiary fw-bold mb-1">
                <span className="fa-solid fa-clock text-body-secondary me-1"></span>
                12.30PM - 10PM
              </p>
              <p className="fs-9 text-body-tertiary fw-bold mb-0">
                <span className="fa-solid fa-map-marker-alt text-body-secondary me-1"></span>
                Tavern on the Greend, New York
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
