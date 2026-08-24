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
              Pages
            </a>
          </li>
          <li className="breadcrumb-item active">
            Faq
          </li>
        </ol>
      </nav>
      <h2 className="mb-5">
        FAQ
      </h2>
      <h5 className="mb-3">
        How can we help?
      </h5>
      <p className="text-body-tertiary">
        Search for the topic you need help with or
        <a href="#!">
          contact our support
        </a>
      </p>
      <div className="search-box mb-8 w-100" style={{ maxWidth: "25rem" }}>
        <form className="position-relative">
          <input className="form-control search-input search" type="search" placeholder="Search" aria-label="Search" />
          <span className="fas fa-search search-box-icon"></span>
        </form>
      </div>
      <div className="accordion" id="faqAccordion">
        <div className="accordion-item border-top">
          <h2 className="accordion-header" id="headingOne">
            <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded={false} aria-controls="collapseOne">
              What’s your return policy?
            </button>
          </h2>
          <div className="accordion-collapse collapse show" id="collapseOne" aria-labelledby="headingOne" data-bs-parent="#faqAccordion">
            <div className="accordion-body pt-0">
              At the time of shipment, we assure that your product will be free of defects in materials and workmanship and will conform to the specifications outlined on the lot-specific datasheet included with the product. Please contact our technical support services if you have a technical issue with a product :
              <a href="mailto:phoenix@email.com">
                Email: phoenix@support.com.
              </a>
              If the team concludes that the product does not adhere to the requirements mentioned on the datasheet, we will provide a free replacement or a full refund of the product's invoice price.
            </div>
          </div>
        </div>
        <div className="accordion-item">
          <h2 className="accordion-header" id="headingTwo">
            <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo" aria-expanded={true} aria-controls="collapseOne">
              I ordered the wrong product.
              <br className="d-sm-none" />
              What should I do?
            </button>
          </h2>
          <div className="accordion-collapse collapse" id="collapseTwo" aria-labelledby="headingTwo" data-bs-parent="#faqAccordion">
            <div className="accordion-body pt-0">
              We would consider accepting the return of the merchandise, subject to an 20% restocking fee plus any shipping and handling fees. The customer is liable for shipping costs for both the returned product and the new replacement product, both to and from our facility. All returns require prior authorisation from us and must be mailed back to us within seven business days of receiving the goods. Products must be returned in the same or equivalent packing (i.e., cold and insulated) in which they were shipped (i.e., cold and insulated). Once we get the item, we will ship out the replacement item.
            </div>
          </div>
        </div>
        <div className="accordion-item">
          <h2 className="accordion-header" id="headingThree">
            <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseThree" aria-expanded={false} aria-controls="collapseOne">
              How do I cancel my order?
            </button>
          </h2>
          <div className="accordion-collapse collapse" id="collapseThree" aria-labelledby="headingThree" data-bs-parent="#faqAccordion">
            <div className="accordion-body pt-0">
              If you must cancel your order, please call
              <a href="tel:+871406-7509">
                (871) 406-7509
              </a>
              Please note that we attempt to process and dispatch orders the same day (if received before 1pm PST), and once your product has shipped, our return policy will apply.
            </div>
          </div>
        </div>
        <div className="accordion-item">
          <h2 className="accordion-header" id="headingFour">
            <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseFour" aria-expanded={false} aria-controls="collapseOne">
              What are your shipping &
              <br className="d-sm-none" />
              handling charges?
            </button>
          </h2>
          <div className="accordion-collapse collapse" id="collapseFour" aria-labelledby="headingFour" data-bs-parent="#faqAccordion">
            <div className="accordion-body pt-0">
              Our handling fee is a flat rate of $20. The shipping costs vary depending on your location and the items you've purchased. For an exact shipping cost estimate, please proceed through the checkout process and enter your items and address.
            </div>
          </div>
        </div>
        <div className="accordion-item">
          <h2 className="accordion-header" id="headingFive">
            <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseFive" aria-expanded={false} aria-controls="collapseOne">
              Do you accept purchase orders?
            </button>
          </h2>
          <div className="accordion-collapse collapse" id="collapseFive" aria-labelledby="headingFive" data-bs-parent="#faqAccordion">
            <div className="accordion-body pt-0">
              Yes. Please include your purchase order number at online checkout, or clearly label it on a faxed or emailed purchase order. Please give the relevant email or mailing address for your accounts payable department so that the invoice can be sent to the appropriate location.
            </div>
          </div>
        </div>
      </div>
      <div className="text-center py-11">
        <h3 className="text-body-emphasis">
          Still can’t find your answer?
        </h3>
        <p className="text-body">
          We are happy to help
        </p>
        <button className="btn btn-sm btn-outline-primary btn-support-chat">
          <span className="fas fa-comment me-2"></span>
          Chat with us
        </button>
      </div>
    </AppLayout>
  )
}
