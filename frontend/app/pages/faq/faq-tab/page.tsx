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
      <div className="mb-9">
        <div className="mx-n4 mx-lg-n6 mt-n5 position-relative mb-md-9" style={{ height: "208px" }}>
          <div className="bg-holder bg-card d-dark-none" style={{ backgroundImage: "url(../../assets/img/bg/bg-40.png)", backgroundSize: "cover" }}></div>
          {/* /.bg-holder */}
          <div className="bg-holder bg-card d-light-none" style={{ backgroundImage: "url(../../assets/img/bg/bg-dark-40.png)", backgroundSize: "cover" }}></div>
          {/* /.bg-holder */}
          <div className="faq-title-box position-relative bg-body-emphasis border border-translucent p-6 rounded-3 text-center mx-auto">
            <h1>
              How can we help?
            </h1>
            <p className="my-3">
              Search for the topic you need help with or
              <a href="#!">
                contact our support
              </a>
            </p>
            <div className="search-box w-100">
              <form className="position-relative" data-bs-toggle="search" data-bs-display="static">
                <input className="form-control search-input search" type="search" aria-label="Search" />
                <span className="fas fa-search search-box-icon"></span>
              </form>
            </div>
          </div>
        </div>
        <div className="row gx-xl-8 gx-xxl-11 gy-6 faq">
          <div className="col-md-6 col-xl-5 col-xxl-4">
            <div className="faq-sidebar offcanvas offcanvas-start bg-body z-5 w-100" id="faq-offcanvas" data-bs-backdrop="false" data-vertical-category-offcanvas="data-vertical-category-offcanvas">
              <ul className="faq-category-tab nav nav-tabs mb-10 mb-md-5 pb-3 pt-2 w-100 w-sm-75 w-md-100 mx-auto">
                <li className="nav-item">
                  <button className="nav-link fw-semibold me-3 fs-8" id="popular" type="button" data-bs-toggle="tab" data-category-filter="popular">
                    Popular Categories
                  </button>
                </li>
                <li className="nav-item">
                  <button className="nav-link fw-semibold fs-8 active" id="all" type="button" data-bs-toggle="tab" data-category-filter="all">
                    All Categories
                  </button>
                </li>
              </ul>
              <div className="faq-subcategory-tab nav nav-tabs w-sm-75 w-md-100 mx-auto mb-4" id="faq-subcategory-tab" style={{ width: "90%" }}>
                <div className="nav-item w-100 popular mb-3" role="presentation">
                  <button className="category nav-link btn bg-body-emphasis w-100 px-3 pt-4 pb-3 fs-8 active" id="tab-sale-101" data-bs-toggle="tab" data-bs-target="#sale-101" type="button" role="tab" aria-selected={false} data-vertical-category-tab="data-vertical-category-tab">
                    <span className="category-icon text-body-secondary fs-6 fa-solid fa-chart-pie"></span>
                    <span className="d-block fs-6 fw-bolder lh-1 text-body mt-3 mb-2">
                      Sales
                    </span>
                    <span className="d-block text-body fw-normal mb-0 fs-9">
                      Answer the most frequently asked questions about your products & services here.
                    </span>
                  </button>
                </div>
                <div className="nav-item w-100  mb-3" role="presentation">
                  <button className="category nav-link btn bg-body-emphasis w-100 px-3 pt-4 pb-3 fs-8" id="tab-delivery-101" data-bs-toggle="tab" data-bs-target="#delivery-101" type="button" role="tab" aria-selected={false} data-vertical-category-tab="data-vertical-category-tab">
                    <span className="category-icon text-body-secondary fs-6 fa-solid fa-truck-fast"></span>
                    <span className="d-block fs-6 fw-bolder lh-1 text-body mt-3 mb-2">
                      Delivery
                    </span>
                    <span className="d-block text-body fw-normal mb-0 fs-9">
                      Answer each & every question about your product and service delivery, maintain customers.
                    </span>
                  </button>
                </div>
                <div className="nav-item w-100  mb-3" role="presentation">
                  <button className="category nav-link btn bg-body-emphasis w-100 px-3 pt-4 pb-3 fs-8" id="tab-notification-101" data-bs-toggle="tab" data-bs-target="#notification-101" type="button" role="tab" aria-selected={false} data-vertical-category-tab="data-vertical-category-tab">
                    <span className="category-icon text-body-secondary fs-6 fa-solid fa-bell"></span>
                    <span className="d-block fs-6 fw-bolder lh-1 text-body mt-3 mb-2">
                      Notification
                    </span>
                    <span className="d-block text-body fw-normal mb-0 fs-9">
                      Check and get all the necessary notices on the same page and board. Learn the FAQs here.
                    </span>
                  </button>
                </div>
                <div className="nav-item w-100  mb-3" role="presentation">
                  <button className="category nav-link btn bg-body-emphasis w-100 px-3 pt-4 pb-3 fs-8" id="tab-order-101" data-bs-toggle="tab" data-bs-target="#order-101" type="button" role="tab" aria-selected={false} data-vertical-category-tab="data-vertical-category-tab">
                    <span className="category-icon text-body-secondary fs-6 fa-solid fa-file-invoice-dollar"></span>
                    <span className="d-block fs-6 fw-bolder lh-1 text-body mt-3 mb-2">
                      Order
                    </span>
                    <span className="d-block text-body fw-normal mb-0 fs-9">
                      Check and have all your product order FAQs answered here.
                    </span>
                  </button>
                </div>
                <div className="nav-item w-100  mb-3" role="presentation">
                  <button className="category nav-link btn bg-body-emphasis w-100 px-3 pt-4 pb-3 fs-8" id="tab-networking-101" data-bs-toggle="tab" data-bs-target="#networking-101" type="button" role="tab" aria-selected={false} data-vertical-category-tab="data-vertical-category-tab">
                    <span className="category-icon text-body-secondary fs-6 fa-solid fa-circle-nodes"></span>
                    <span className="d-block fs-6 fw-bolder lh-1 text-body mt-3 mb-2">
                      Networking
                    </span>
                    <span className="d-block text-body fw-normal mb-0 fs-9">
                      See and answer all the queries to help your clients and customers and build strong networking between your team and your clientele
                    </span>
                  </button>
                </div>
                <div className="nav-item w-100 popular mb-3" role="presentation">
                  <button className="category nav-link btn bg-body-emphasis w-100 px-3 pt-4 pb-3 fs-8" id="tab-customize-101" data-bs-toggle="tab" data-bs-target="#customize-101" type="button" role="tab" aria-selected={false} data-vertical-category-tab="data-vertical-category-tab">
                    <span className="category-icon text-body-secondary fs-6 fa-solid fa-sliders"></span>
                    <span className="d-block fs-6 fw-bolder lh-1 text-body mt-3 mb-2">
                      Customize
                    </span>
                    <span className="d-block text-body fw-normal mb-0 fs-9">
                      Answer customization related questions here for simple and easy assistance.
                    </span>
                  </button>
                </div>
                <div className="nav-item w-100  mb-3" role="presentation">
                  <button className="category nav-link btn bg-body-emphasis w-100 px-3 pt-4 pb-3 fs-8" id="tab-marketing-101" data-bs-toggle="tab" data-bs-target="#marketing-101" type="button" role="tab" aria-selected={false} data-vertical-category-tab="data-vertical-category-tab">
                    <span className="category-icon text-body-secondary fs-6 fa-solid fa-bullhorn"></span>
                    <span className="d-block fs-6 fw-bolder lh-1 text-body mt-3 mb-2">
                      Marketing
                    </span>
                    <span className="d-block text-body fw-normal mb-0 fs-9">
                      Get all the marketing related questions answered here.
                    </span>
                  </button>
                </div>
                <div className="nav-item w-100  mb-3" role="presentation">
                  <button className="category nav-link btn bg-body-emphasis w-100 px-3 pt-4 pb-3 fs-8" id="tab-our-vision-101" data-bs-toggle="tab" data-bs-target="#our-vision-101" type="button" role="tab" aria-selected={false} data-vertical-category-tab="data-vertical-category-tab">
                    <span className="category-icon text-body-secondary fs-6 fa-solid fa-peace"></span>
                    <span className="d-block fs-6 fw-bolder lh-1 text-body mt-3 mb-2">
                      Our Vision
                    </span>
                    <span className="d-block text-body fw-normal mb-0 fs-9">
                      We provide web development solution in an economically efficient way. Learn further from these FAQs here
                    </span>
                  </button>
                </div>
                <div className="nav-item w-100  mb-0" role="presentation">
                  <button className="category nav-link btn bg-body-emphasis w-100 px-3 pt-4 pb-3 fs-8" id="tab-scheduling-101" data-bs-toggle="tab" data-bs-target="#scheduling-101" type="button" role="tab" aria-selected={false} data-vertical-category-tab="data-vertical-category-tab">
                    <span className="category-icon text-body-secondary fs-6 fa-solid fa-calendar-xmark"></span>
                    <span className="d-block fs-6 fw-bolder lh-1 text-body mt-3 mb-2">
                      Scheduling
                    </span>
                    <span className="d-block text-body fw-normal mb-0 fs-9">
                      See everything related to our scheduling from these FAQs below:
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-6 col-xl-7 col-xxl-8 mt-md-11">
            <div className="faq-subcategory-content tab-content">
              <div className="empty-header d-none d-md-block"></div>
              <button className="btn btn-link d-md-none my-6 fs-8 ps-0" type="button" data-bs-toggle="offcanvas" data-bs-target="#faq-offcanvas">
                <span className="fa-solid fa-chevron-left fs-9 me-2" data-fa-transform="up-2"></span>
                Categories
              </button>
              <div className="tab-pane fade active show" id="sale-101">
                <ul className="list-inline mb-0">
                  <li className="d-flex gap-2 mb-6">
                    <span className="fa-solid fa-star fs-8 text-primary"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        How can I purchase your services?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        You can mail us at
                        <a href="mailto:info@phoenix.template">
                          info@phoenix.template
                        </a>
                        or go to our services page to directly choose and pay to buy the services we provide.
                      </p>
                    </div>
                  </li>
                  <li className="d-flex gap-2 mb-6">
                    <span className="fa-solid fa-star fs-8 text-primary"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        How much do your service cost?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        Our services can be availed at a minimum cost. Please visit
                        <a href="mailto:info.phoenix-tw.com">
                          info.phoenix-tw.com
                        </a>
                        to get insights into the better purchase plans.
                      </p>
                    </div>
                  </li>
                  <li className="d-flex gap-2 mb-6">
                    <span className="fa-solid fa-star fs-8 text-primary"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        Do you offer any money-back guarantee?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        We offer refunds to customers who are eligible to get one under our terms and conditions, as well as our policies.
                      </p>
                    </div>
                  </li>
                </ul>
                <hr className="border-top" />
                <ul className="faq-list list-inline">
                  <li className="d-flex mt-6">
                    <span className="fa-solid fa-circle"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        Do you offer any free trial?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        No, we don’t avail of any pre-booking or free trial option. You can contact at
                        <a href="mailto:support.phoenix.themewagon">
                          support.phoenix.themewagon
                        </a>
                        for further info.
                      </p>
                    </div>
                  </li>
                  <li className="d-flex mt-6">
                    <span className="fa-solid fa-circle"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        Is it compatible with all available browsers?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        Yes, it is a cross-browser compatible product.
                      </p>
                    </div>
                  </li>
                  <li className="d-flex mt-6">
                    <span className="fa-solid fa-circle"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        What level of customer service do you provide?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        Our customer service is available 24/7 for your concerns. You can communicate through live chat, email, or phone for any queries at support.phoenix.themewagon.
                      </p>
                    </div>
                  </li>
                  <li className="d-flex mt-6">
                    <span className="fa-solid fa-circle"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        Is my data privacy secure with your product?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        Yes. We constantly update and cross-check security audits and assessments to ensure the highest security standards.
                      </p>
                    </div>
                  </li>
                  <li className="d-flex mt-6">
                    <span className="fa-solid fa-circle"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        Do you provide any refund?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        Yes, we offer refunds to our customers under our terms and policies. Contact
                        <a href="mailto:info@phoenix.template">
                          info@phoenix.template
                        </a>
                        for more information.
                      </p>
                    </div>
                  </li>
                  <li className="d-flex mt-6">
                    <span className="fa-solid fa-circle"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        Do I need to complete the full payment at a time, or is any installment or discount available?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        Contact
                        <a href="mailto:info@phoenix.template">
                          info@phoenix.template
                        </a>
                        for more information.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="tab-pane fade" id="delivery-101">
                <ul className="list-inline mb-0">
                  <li className="d-flex gap-2 mb-6">
                    <span className="fa-solid fa-star fs-8 text-primary"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        Do you avail any delivery tracking option?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        Yes. You can track your order and shipment details through the purchase code that we send, and know the current status of your purchase
                      </p>
                    </div>
                  </li>
                  <li className="d-flex gap-2 mb-6">
                    <span className="fa-solid fa-star fs-8 text-primary"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        What happens if I’m not available to receive?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        Our delivery team will try to reach you if you’re not available, and you can choose to pick it up from our pick-up points
                      </p>
                    </div>
                  </li>
                </ul>
                <hr className="border-top" />
                <ul className="faq-list list-inline">
                  <li className="d-flex mt-6">
                    <span className="fa-solid fa-circle"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        What are your policies regarding missing or damaged product?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        We replace or refund for the damaged products, if our delivery personnel make any mistake. Note that, any damage on your or seller’s end is irreversible.
                      </p>
                    </div>
                  </li>
                  <li className="d-flex mt-6">
                    <span className="fa-solid fa-circle"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        Do you offer same-day or any express delivery option?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        Yes, you can select your delivery option from the given options, and you’ll get the service accordingly.
                      </p>
                    </div>
                  </li>
                  <li className="d-flex mt-6">
                    <span className="fa-solid fa-circle"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        What is the delivery cost?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        We have three different delivery options available for our customers. The costs hence differ, and you’ll get the details on info.phoenix.themewagon.
                      </p>
                    </div>
                  </li>
                  <li className="d-flex mt-6">
                    <span className="fa-solid fa-circle"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        What is the proximity of your shipment?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        For three different categories of delivery options, our shipping time varies. This is dependent on the category/delivery option you choose.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="tab-pane fade" id="notification-101">
                <ul className="list-inline mb-0">
                  <li className="d-flex gap-2 mb-6">
                    <span className="fa-solid fa-star fs-8 text-primary"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        Do you allow customized notification option?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        Yes, you can customize and select the topics that you want to be notified about and remove the ones you think are unnecessary.
                      </p>
                    </div>
                  </li>
                  <li className="d-flex gap-2 mb-6">
                    <span className="fa-solid fa-star fs-8 text-primary"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        Are my notifications secure?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        Yes, we take data security seriously and all the information, including your notification types and other things, are protected and cannot be shared.
                      </p>
                    </div>
                  </li>
                </ul>
                <hr className="border-top" />
                <ul className="faq-list list-inline">
                  <li className="d-flex mt-6">
                    <span className="fa-solid fa-circle"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        Do you allow direct actions on your notification?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        Depending on the notification type, and your settings and privacy settings. Please remember, we do not allow open sharing of notifications.
                      </p>
                    </div>
                  </li>
                  <li className="d-flex mt-6">
                    <span className="fa-solid fa-circle"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        Do you allow multi-device notification?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        Certainly! No need to worry about getting notified about anything as you can log in to multiple devices and get notified according to your preferred way.
                      </p>
                    </div>
                  </li>
                  <li className="d-flex mt-6">
                    <span className="fa-solid fa-circle"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        Do you allow multi-language notification?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        We have a preselection checkbox to choose your preferred language to get notified in. You can always change the settings later.
                      </p>
                    </div>
                  </li>
                  <li className="d-flex mt-6">
                    <span className="fa-solid fa-circle"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        Can I opt out anytime?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        You can opt out or modify the preferred notification option as you want to and opt out anytime.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="tab-pane fade" id="order-101">
                <ul className="list-inline mb-0">
                  <li className="d-flex gap-2 mb-6">
                    <span className="fa-solid fa-star fs-8 text-primary"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        Do offer wholesale order option?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        Yes, you can choose the desired product and select the order option to bulk, and you’re good to go.
                      </p>
                    </div>
                  </li>
                  <li className="d-flex gap-2 mb-6">
                    <span className="fa-solid fa-star fs-8 text-primary"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        Can I change my order?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        If you’ve already clicked check out, then you’ll need to wait for the confirmation call before changing the order. We recommend deciding beforehand to avoid further hassles.
                      </p>
                    </div>
                  </li>
                </ul>
                <hr className="border-top" />
                <ul className="faq-list list-inline">
                  <li className="d-flex mt-6">
                    <span className="fa-solid fa-circle"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        Do you allow viewing the order history?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        Yes, you can see and manage your order history from the orders page that we have and keep your details personal.
                      </p>
                    </div>
                  </li>
                  <li className="d-flex mt-6">
                    <span className="fa-solid fa-circle"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        Do you notify about the placed orders?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        You can palace personalize the notification option as you want to, and we’ll keep you updated accordingly about your orders and everything.
                      </p>
                    </div>
                  </li>
                  <li className="d-flex mt-6">
                    <span className="fa-solid fa-circle"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        How do I track my orders?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        You can easily track all your currently placed orders with the ID number that we provided you. Please remember not to share the ID with any untrusted contact.
                      </p>
                    </div>
                  </li>
                  <li className="d-flex mt-6">
                    <span className="fa-solid fa-circle"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        How do I know my order placement is confirmed?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        We’ll send an OTP (one time password) to verify and confirm the order, and you’ll be notified via your preferred notification method.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="tab-pane fade" id="networking-101">
                <ul className="list-inline mb-0">
                  <li className="d-flex gap-2 mb-6">
                    <span className="fa-solid fa-star fs-8 text-primary"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        What are some best features for networking coming with this template?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        Some features included in this template are responsiveness & compatibility, different contact form UIs, social pages and apps and many more. Explore and modify according to your wish and your resolution to grow!
                      </p>
                    </div>
                  </li>
                  <li className="d-flex gap-2 mb-6">
                    <span className="fa-solid fa-star fs-8 text-primary"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        How can I utilize networking to gain insights into customer/client needs and preferences?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        We provide detailed data visualization dashboards that can help you gain the required data to analyze and act according to your needs so that you get to enhance your growth through networking.
                      </p>
                    </div>
                  </li>
                </ul>
                <hr className="border-top" />
                <ul className="faq-list list-inline">
                  <li className="d-flex mt-6">
                    <span className="fa-solid fa-circle"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        Are there any specific configuration process applied to use the networking of your site?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        No, you can just use it as is. Yet, we recommend adjusting the page as you need, so you get the optimized feed to see.
                      </p>
                    </div>
                  </li>
                  <li className="d-flex mt-6">
                    <span className="fa-solid fa-circle"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        How can I use networking to generate leads and attract new customers or clients?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        By using the default dashboards that we avail with the theme, you can log all your data and monitor the networking of your site.
                      </p>
                    </div>
                  </li>
                  <li className="d-flex mt-6">
                    <span className="fa-solid fa-circle"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        How can I effectively network with customers and clients?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        Use our social apps pages to build any networking site and see yourself grow with enhanced and better networking options.
                      </p>
                    </div>
                  </li>
                  <li className="d-flex mt-6">
                    <span className="fa-solid fa-circle"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        What graphs can I use to build strong relationships with customers and clients?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        We’ve added different data visualization charts with the template that can help you track your networking sites as well and help you in building a storing network. See the modules that came inclusive with the theme and you’ll get necessary insights.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="tab-pane fade" id="customize-101">
                <ul className="list-inline mb-0">
                  <li className="d-flex gap-2 mb-6">
                    <span className="fa-solid fa-star fs-8 text-primary"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        Can I customize the design as needed?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        Yes, you can just go to: settings&gt;site theme&gt;design&gt;change and customize according to your needs with easy filters and checkbox from the given ones.
                      </p>
                    </div>
                  </li>
                  <li className="d-flex gap-2 mb-6">
                    <span className="fa-solid fa-star fs-8 text-primary"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        Can I personalize the contents as I need?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        Yes, we allow easy and simple customization of feed and notification. You can select category and get the customized result on your feed.
                      </p>
                    </div>
                  </li>
                </ul>
                <hr className="border-top" />
                <ul className="faq-list list-inline">
                  <li className="d-flex mt-6">
                    <span className="fa-solid fa-circle"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        Can I integrate third-party extensions or plugins into the e-commerce site template?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        Yes, we’ve already installed necessary plugins and covered the most of what you might need. Also, you can integrate any third-party plugin that you need with our easy documentation.
                      </p>
                    </div>
                  </li>
                  <li className="d-flex mt-6">
                    <span className="fa-solid fa-circle"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        Can I customize the checkout process on the e-commerce site template?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        You can edit and choose custom modules or import any from the Bootstrap components and customize the design as you want to.
                      </p>
                    </div>
                  </li>
                  <li className="d-flex mt-6">
                    <span className="fa-solid fa-circle"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        Can I use the customized design and maintain responsiveness?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        You can if you follow the documentation accordingly and modify the codebase without error.
                      </p>
                    </div>
                  </li>
                  <li className="d-flex mt-6">
                    <span className="fa-solid fa-circle"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        Is it possible to change the color scheme of the site template?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        We provide the theme color scheme in the box. You can choose any from there or use any custom color as your needs.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="tab-pane fade" id="marketing-101">
                <ul className="list-inline mb-0">
                  <li className="d-flex gap-2 mb-6">
                    <span className="fa-solid fa-star fs-8 text-primary"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        How is this theme going to help my marketing strategy?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        This template is SEO optimized and comes with built-in user-friendly dashboards that will help you track your leads, sales and help you get better insights into what you need to do for better growth.
                      </p>
                    </div>
                  </li>
                  <li className="d-flex gap-2 mb-6">
                    <span className="fa-solid fa-star fs-8 text-primary"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        Do I need any distinct plugin or software to use it?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        Certainly not, if you do not want to customize it totally. For full customization, please see our documentation.
                      </p>
                    </div>
                  </li>
                </ul>
                <hr className="border-top" />
                <ul className="faq-list list-inline">
                  <li className="d-flex mt-6">
                    <span className="fa-solid fa-circle"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        Can I use the template for multiple sites?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        Yes, we avail a multi-site option for this template. Please contact our support: support@phoenix.themewagon.
                      </p>
                    </div>
                  </li>
                  <li className="d-flex mt-6">
                    <span className="fa-solid fa-circle"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        Do you avail necessary marketing support?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        We provide 24/7 technical support for the template and we cover related issues. Contact our helpline for further details.
                      </p>
                    </div>
                  </li>
                  <li className="d-flex mt-6">
                    <span className="fa-solid fa-circle"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        Can I change the style and design while also maintaining site SEO?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        You certainly can, all our components are responsive and SEO optimized. Enjoy creating with Phoenix.
                      </p>
                    </div>
                  </li>
                  <li className="d-flex mt-6">
                    <span className="fa-solid fa-circle"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        Can I customize the emails pages of the theme?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        Yes, our theme is totally customizable, and it will remain compatible and responsive even if you customize it. If you do not change or modify the codebase, there is nothing to worry about, since we provide 24/7 support for this theme.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="tab-pane fade" id="our-vision-101">
                <ul className="list-inline mb-0">
                  <li className="d-flex gap-2 mb-6">
                    <span className="fa-solid fa-star fs-8 text-primary"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        What solutions do you offer?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        We take on-demand projects and will be available for contractual front-end development (React/Vue), back-end development (LaRavel/NodeJS), UX/UI design and search engine optimization (SEO).
                      </p>
                    </div>
                  </li>
                  <li className="d-flex gap-2 mb-6">
                    <span className="fa-solid fa-star fs-8 text-primary"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        What frameworks and technologies do you specialize in at our web development farm?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        Our efficient offers solutions including but not limited to HTML5, CSS3, JavaScript (such as React, Angular), PHP, Python, WordPress, Drupal, and Magento. We have experience working with various content management systems (CMS) and e-commerce platforms
                      </p>
                    </div>
                  </li>
                </ul>
                <hr className="border-top" />
                <ul className="faq-list list-inline">
                  <li className="d-flex mt-6">
                    <span className="fa-solid fa-circle"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        How do you ensure customer satisfaction?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        We achieve it by closely collaborating with our clients throughout the development process, actively seeking feedback, providing regular project updates, and ensuring that our solutions align with their business goals and objectives.
                      </p>
                    </div>
                  </li>
                  <li className="d-flex mt-6">
                    <span className="fa-solid fa-circle"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        How does our web development provider ensure the security of websites and web applications?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        Security is a top priority for our web development provider. We implement industry best practices, such as secure coding techniques, data encryption, protection against common web vulnerabilities (e.g., Cross-Site Scripting, SQL injection), and user authentication mechanisms to ensure the confidentiality, integrity, and availability of your website or web application
                      </p>
                    </div>
                  </li>
                  <li className="d-flex mt-6">
                    <span className="fa-solid fa-circle"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        How can you get started with our web development providers services?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        Simply reach out to our team, and we will schedule an initial consultation to discuss your project requirements, goals, and timelines. We will provide you with a tailored proposal outlining the recommended services, deliverables, and pricing. Once we have your approval, we will embark on the journey of bringing your vision to life.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="tab-pane fade" id="scheduling-101">
                <ul className="list-inline mb-0">
                  <li className="d-flex gap-2 mb-6">
                    <span className="fa-solid fa-star fs-8 text-primary"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        Can I request changes to the project timeline after it has been finalized?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        If you require changes to the project timeline, please communicate with our team as early as possible. We will assess the feasibility of the requested changes and work with you to accommodate them if feasible.
                      </p>
                    </div>
                  </li>
                  <li className="d-flex gap-2 mb-6">
                    <span className="fa-solid fa-star fs-8 text-primary"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        Can I track the progress of my project and stay updated on the schedule?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        Absolutely! We provide regular project updates, including progress reports and milestone achievements. We can set up a communication channel where you can track project progress and stay informed about the schedule throughout the development process.
                      </p>
                    </div>
                  </li>
                </ul>
                <hr className="border-top" />
                <ul className="faq-list list-inline">
                  <li className="d-flex mt-6">
                    <span className="fa-solid fa-circle"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        Can I request an expedited timeline for my project?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        If you have a specific deadline or require an expedited timeline for your project, please inform us during the initial discussions. We will evaluate the feasibility and provide you with a realistic timeline based on the projects complexity and our resource availability.
                      </p>
                    </div>
                  </li>
                  <li className="d-flex mt-6">
                    <span className="fa-solid fa-circle"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        Can I make changes to the project scope or requirements once the scheduling has been finalized?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        It’s recommended that you do not. Still, if you need to make changes to the project scope or requirements after scheduling, please communicate with our team as soon as possible. We will assess the impact of the changes on the schedule and provide you with revised timelines and any necessary adjustments.
                      </p>
                    </div>
                  </li>
                  <li className="d-flex mt-6">
                    <span className="fa-solid fa-circle"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        Can your web development provider handle multiple projects simultaneously?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        Yes, our web development provider is equipped to handle multiple projects simultaneously. We have a dedicated team of developers and project managers who excel at multitasking and prioritizing tasks. We strive to allocate resources effectively to ensure that each project receives the attention it requires.
                      </p>
                    </div>
                  </li>
                  <li className="d-flex mt-6">
                    <span className="fa-solid fa-circle"></span>
                    <div>
                      <h4 className="mb-3 text-body-highlight">
                        How far in advance should I contact your web development provider to schedule a project?
                      </h4>
                      <p className="mb-0 text-body-tertiary">
                        We recommend reaching out to our web development provider as soon as you have a project in mind. Contacting us in advance allows us to allocate the necessary resources and plan our schedule accordingly. It also ensures that we can accommodate your project within your desired timeframe.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
