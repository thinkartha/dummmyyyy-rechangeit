import Scripts from '@/components/scripts'

export default function Page() {
  return (
    <>
      {/* =============================================== */}
      {/* Main Content */}
      {/* =============================================== */}
      <main className="main" id="top">
        <nav className="navbar navbar-expand-lg sticky-top bg-body border-bottom border-translucent py-3">
          <div className="container">
            <a className="navbar-brand d-flex align-items-center gap-2 fw-bolder fs-6 text-body-emphasis" href="#top">
              <div className="d-flex align-items-center">
                <h5 className="logo-text mb-0">
                  LoveHeartBeat
                </h5>
              </div>
            </a>
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#landing-nav" aria-controls="landing-nav" aria-expanded={false} aria-label="Toggle navigation">
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse justify-content-end" id="landing-nav">
              <ul className="navbar-nav align-items-lg-center gap-lg-2 mt-3 mt-lg-0">
                <li className="nav-item">
                  <a className="nav-link fw-semibold" href="#features">
                    Features
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link fw-semibold" href="#integrations">
                    Integrations
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link fw-semibold" href="#mobile">
                    Mobile
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link fw-semibold" href="/pages/authentication/sign-in/">
                    Sign In
                  </a>
                </li>
                <li className="nav-item mt-2 mt-lg-0">
                  <a className="btn btn-primary px-4" href="/pages/authentication/sign-up/">
                    Start Free Trial
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </nav>
        <section className="py-8 py-md-11">
          <div className="container">
            <div className="row justify-content-center text-center">
              <div className="col-12 col-lg-10 col-xl-9">
                <span className="badge badge-phoenix badge-phoenix-primary mb-4">
                  AI-Powered Enterprise Monitoring Platform
                </span>
                <h1 className="fw-bolder mb-4" style={{ fontSize: "clamp(2.25rem, 5vw, 3.75rem)", lineHeight: "1.1" }}>
                  Monitor Everything.
                  <br />
                  <span className="text-primary">
                    AI Automate Everything.
                  </span>
                </h1>
                <p className="fs-6 text-body-secondary mb-6 mx-auto" style={{ maxWidth: "48rem" }}>
                  Your one-stop platform for ETL monitoring, orchestration monitoring, multi-cloud monitoring, and multi-platform health management. Powered by AI-driven automation, intelligent alerts, and predictive analytics to keep your entire data ecosystem running flawlessly.
                </p>
                <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
                  <a className="btn btn-primary btn-lg px-5" href="/pages/authentication/sign-up/">
                    Start Free Trial
                    <span className="fa-solid fa-arrow-right ms-2"></span>
                  </a>
                  <button className="btn btn-phoenix-secondary btn-lg px-5" type="button" data-bs-toggle="modal" data-bs-target="#demo-video">
                    <span className="fa-solid fa-circle-play me-2"></span>
                    Watch Demo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="bg-body-highlight py-8 py-md-11" id="features">
          <div className="container">
            <div className="text-center mb-8">
              <h2 className="fw-bolder mb-3">
                Complete Observability for Your Data Ecosystem
              </h2>
              <p className="fs-7 text-body-secondary mx-auto" style={{ maxWidth: "48rem" }}>
                From ETL pipelines to orchestration workflows, get comprehensive visibility across your entire data infrastructure with AI-powered insights and automation.
              </p>
            </div>
            <div className="row g-4">
              <div className="col-12 col-md-6 col-lg-4">
                <div className="card h-100 border border-translucent">
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center justify-content-center rounded-3 mb-4 bg-primary-subtle" style={{ height: "3rem", width: "3rem" }}>
                      <span className="fa-solid fs-6 fa-database text-primary"></span>
                    </div>
                    <h4 className="mb-3">
                      ETL Pipeline Monitoring
                    </h4>
                    <p className="text-body-secondary mb-0">
                      Monitor data flows across Talend, Qlik, Informatica, SnapLogic, AWS Glue, Dell Boomi, and more with real-time pipeline health tracking.
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-6 col-lg-4">
                <div className="card h-100 border border-translucent">
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center justify-content-center rounded-3 mb-4 bg-success-subtle" style={{ height: "3rem", width: "3rem" }}>
                      <span className="fa-solid fs-6 fa-diagram-project text-success"></span>
                    </div>
                    <h4 className="mb-3">
                      Orchestration Intelligence
                    </h4>
                    <p className="text-body-secondary mb-0">
                      Track Control-M, Airflow, Camunda, Ansible, Tidal, AutoSys, and Jenkins workflows with AI-powered failure prediction and auto-remediation.
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-6 col-lg-4">
                <div className="card h-100 border border-translucent">
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center justify-content-center rounded-3 mb-4 bg-info-subtle" style={{ height: "3rem", width: "3rem" }}>
                      <span className="fa-solid fs-6 fa-cloud text-info"></span>
                    </div>
                    <h4 className="mb-3">
                      Multi-Cloud Observability
                    </h4>
                    <p className="text-body-secondary mb-0">
                      Unified monitoring across AWS CloudWatch, BigPanda, AppDynamics with intelligent correlation and cross-platform insights.
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-6 col-lg-4">
                <div className="card h-100 border border-translucent">
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center justify-content-center rounded-3 mb-4 bg-warning-subtle" style={{ height: "3rem", width: "3rem" }}>
                      <span className="fa-solid fs-6 fa-bolt text-warning"></span>
                    </div>
                    <h4 className="mb-3">
                      AI-Powered Automation
                    </h4>
                    <p className="text-body-secondary mb-0">
                      Machine learning algorithms predict failures, automate incident response, and optimize resource allocation across your entire stack.
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-6 col-lg-4">
                <div className="card h-100 border border-translucent">
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center justify-content-center rounded-3 mb-4 bg-danger-subtle" style={{ height: "3rem", width: "3rem" }}>
                      <span className="fa-solid fs-6 fa-chart-simple text-danger"></span>
                    </div>
                    <h4 className="mb-3">
                      Intelligent Alerts & Notifications
                    </h4>
                    <p className="text-body-secondary mb-0">
                      Smart alerting with noise reduction, priority scoring, and contextual notifications that help you focus on what matters most.
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-6 col-lg-4">
                <div className="card h-100 border border-translucent">
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center justify-content-center rounded-3 mb-4 bg-primary-subtle" style={{ height: "3rem", width: "3rem" }}>
                      <span className="fa-solid fs-6 fa-shield-halved text-primary"></span>
                    </div>
                    <h4 className="mb-3">
                      Predictive Health Monitoring
                    </h4>
                    <p className="text-body-secondary mb-0">
                      AI-driven health scoring and predictive analytics identify potential issues before they impact your business operations.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="py-8 py-md-11" id="integrations">
          <div className="container">
            <div className="text-center mb-8">
              <h2 className="fw-bolder mb-3">
                Seamless Integration with Your Existing Tools
              </h2>
              <p className="fs-7 text-body-secondary mx-auto" style={{ maxWidth: "42rem" }}>
                Connect with 100+ tools across integration platforms, ETL solutions, and orchestration systems
              </p>
            </div>
            <div className="row g-6">
              <div className="col-12 col-lg-4 text-center">
                <div className="d-flex align-items-center justify-content-center rounded-3 mx-auto mb-5 bg-primary-subtle" style={{ height: "4rem", width: "4rem" }}>
                  <span className="fa-solid fs-4 fa-cloud text-primary"></span>
                </div>
                <h4 className="mb-4">
                  Integration Platforms
                </h4>
                <div className="d-flex flex-wrap justify-content-center gap-2">
                  <span className="badge border border-translucent bg-body text-body-emphasis fw-normal px-3 py-2">
                    AWS CloudWatch
                  </span>
                  <span className="badge border border-translucent bg-body text-body-emphasis fw-normal px-3 py-2">
                    BigPanda
                  </span>
                  <span className="badge border border-translucent bg-body text-body-emphasis fw-normal px-3 py-2">
                    AppDynamics
                  </span>
                  <span className="badge border border-translucent bg-body text-body-emphasis fw-normal px-3 py-2">
                    Azure Monitor
                  </span>
                  <span className="badge border border-translucent bg-body text-body-emphasis fw-normal px-3 py-2">
                    Google Cloud Operations
                  </span>
                  <span className="badge border border-translucent bg-body text-body-emphasis fw-normal px-3 py-2">
                    Oracle OCI Monitoring
                  </span>
                </div>
              </div>
              <div className="col-12 col-lg-4 text-center">
                <div className="d-flex align-items-center justify-content-center rounded-3 mx-auto mb-5 bg-success-subtle" style={{ height: "4rem", width: "4rem" }}>
                  <span className="fa-solid fs-4 fa-database text-success"></span>
                </div>
                <h4 className="mb-4">
                  ETL & Data Integration
                </h4>
                <div className="d-flex flex-wrap justify-content-center gap-2">
                  <span className="badge border border-translucent bg-body text-body-emphasis fw-normal px-3 py-2">
                    Talend
                  </span>
                  <span className="badge border border-translucent bg-body text-body-emphasis fw-normal px-3 py-2">
                    Qlik
                  </span>
                  <span className="badge border border-translucent bg-body text-body-emphasis fw-normal px-3 py-2">
                    Informatica
                  </span>
                  <span className="badge border border-translucent bg-body text-body-emphasis fw-normal px-3 py-2">
                    SnapLogic
                  </span>
                  <span className="badge border border-translucent bg-body text-body-emphasis fw-normal px-3 py-2">
                    AWS Glue
                  </span>
                  <span className="badge border border-translucent bg-body text-body-emphasis fw-normal px-3 py-2">
                    Dell Boomi
                  </span>
                  <span className="badge border border-translucent bg-body text-body-emphasis fw-normal px-3 py-2">
                    SAP Integrators
                  </span>
                  <span className="badge border border-translucent bg-body text-body-emphasis fw-normal px-3 py-2">
                    Kinaxis
                  </span>
                  <span className="badge border border-translucent bg-body text-body-emphasis fw-normal px-3 py-2">
                    Ab Initio
                  </span>
                </div>
              </div>
              <div className="col-12 col-lg-4 text-center">
                <div className="d-flex align-items-center justify-content-center rounded-3 mx-auto mb-5 bg-info-subtle" style={{ height: "4rem", width: "4rem" }}>
                  <span className="fa-solid fs-4 fa-diagram-project text-info"></span>
                </div>
                <h4 className="mb-4">
                  Orchestration & Workflow
                </h4>
                <div className="d-flex flex-wrap justify-content-center gap-2">
                  <span className="badge border border-translucent bg-body text-body-emphasis fw-normal px-3 py-2">
                    Control-M
                  </span>
                  <span className="badge border border-translucent bg-body text-body-emphasis fw-normal px-3 py-2">
                    Apache Airflow
                  </span>
                  <span className="badge border border-translucent bg-body text-body-emphasis fw-normal px-3 py-2">
                    Camunda
                  </span>
                  <span className="badge border border-translucent bg-body text-body-emphasis fw-normal px-3 py-2">
                    Ansible
                  </span>
                  <span className="badge border border-translucent bg-body text-body-emphasis fw-normal px-3 py-2">
                    Tidal
                  </span>
                  <span className="badge border border-translucent bg-body text-body-emphasis fw-normal px-3 py-2">
                    AutoSys
                  </span>
                  <span className="badge border border-translucent bg-body text-body-emphasis fw-normal px-3 py-2">
                    Jenkins
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="bg-body-highlight py-8 py-md-11" id="mobile">
          <div className="container">
            <div className="text-center mb-8">
              <h2 className="fw-bolder mb-3">
                Monitor On-the-Go with LoveHeartBeat Mobile
              </h2>
              <p className="fs-7 text-body-secondary mx-auto" style={{ maxWidth: "42rem" }}>
                Stay connected to your data infrastructure anywhere, anytime. Get real-time alerts, monitor system health, and manage incidents directly from your mobile device.
              </p>
            </div>
            <div className="row g-6 align-items-center">
              <div className="col-12 col-lg-6">
                <div className="d-flex align-items-center justify-content-center bg-primary-subtle rounded-3 mb-5" style={{ height: "4rem", width: "4rem" }}>
                  <span className="fa-solid fa-mobile-screen-button fs-4 text-primary"></span>
                </div>
                <h3 className="fw-bold mb-4">
                  Full-Featured Mobile Experience
                </h3>
                <ul className="list-unstyled text-body-secondary mb-6">
                  <li className="d-flex align-items-center gap-3 mb-3">
                    <span className="bg-primary rounded-circle flex-shrink-0" style={{ height: ".5rem", width: ".5rem" }}></span>
                    <span>
                      Real-time alerts and notifications
                    </span>
                  </li>
                  <li className="d-flex align-items-center gap-3 mb-3">
                    <span className="bg-primary rounded-circle flex-shrink-0" style={{ height: ".5rem", width: ".5rem" }}></span>
                    <span>
                      Interactive dashboards and metrics
                    </span>
                  </li>
                  <li className="d-flex align-items-center gap-3 mb-3">
                    <span className="bg-primary rounded-circle flex-shrink-0" style={{ height: ".5rem", width: ".5rem" }}></span>
                    <span>
                      Incident management and escalation
                    </span>
                  </li>
                  <li className="d-flex align-items-center gap-3 mb-3">
                    <span className="bg-primary rounded-circle flex-shrink-0" style={{ height: ".5rem", width: ".5rem" }}></span>
                    <span>
                      AI-powered insights and recommendations
                    </span>
                  </li>
                </ul>
                <div className="d-flex flex-column flex-sm-row gap-3">
                  <a className="btn btn-dark btn-lg" href="#!">
                    <span className="fa-solid fa-download me-2"></span>
                    Download for iOS
                  </a>
                  <a className="btn btn-phoenix-secondary btn-lg" href="#!">
                    <span className="fa-solid fa-download me-2"></span>
                    Download for Android
                  </a>
                </div>
              </div>
              <div className="col-12 col-lg-6">
                <div className="bg-primary-subtle rounded-3 p-5 p-md-7">
                  <div className="card border-0 shadow mx-auto" style={{ maxWidth: "22rem" }}>
                    <div className="card-body">
                      <div className="d-flex align-items-center gap-2 mb-4">
                        <span className="d-flex flex-center bg-primary rounded" style={{ height: "1.5rem", width: "1.5rem" }}>
                          <span className="fa-solid fa-shield-halved text-white fs-10"></span>
                        </span>
                        <span className="fw-semibold text-body-emphasis">
                          LoveHeartBeat Mobile
                        </span>
                      </div>
                      <div className="alert alert-subtle-success d-flex align-items-center gap-2 py-2 mb-3">
                        <span className="bg-success rounded-circle" style={{ height: ".5rem", width: ".5rem" }}></span>
                        <span className="fs-9 fw-medium">
                          All Systems Operational
                        </span>
                      </div>
                      <div className="alert alert-subtle-warning d-flex align-items-center gap-2 py-2 mb-3">
                        <span className="bg-warning rounded-circle" style={{ height: ".5rem", width: ".5rem" }}></span>
                        <span className="fs-9 fw-medium">
                          2 Warnings Detected
                        </span>
                      </div>
                      <div className="alert alert-subtle-info py-2 mb-0">
                        <span className="fs-9">
                          ETL Pipeline: 98.5% Success Rate
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="bg-primary py-8 py-md-11">
          <div className="container text-center">
            <h2 className="fw-bolder text-white mb-3">
              Ready to Transform Your Data Operations?
            </h2>
            <p className="fs-7 text-white opacity-75 mb-6 mx-auto" style={{ maxWidth: "42rem" }}>
              Join thousands of companies using LoveHeartBeat's AI-powered platform to monitor, automate, and optimize their entire data ecosystem.
            </p>
            <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
              <a className="btn btn-light btn-lg px-5 text-primary" href="/pages/authentication/sign-up/">
                Start Free Trial
                <span className="fa-solid fa-arrow-right ms-2"></span>
              </a>
              <a className="btn btn-outline-light btn-lg px-5" href="mailto:sales@loveheartbeat.com">
                Contact Sales
              </a>
            </div>
          </div>
        </section>
        <footer className="bg-body-highlight py-8">
          <div className="container">
            <div className="row g-5">
              <div className="col-12 col-md-3">
                <h5 className="fw-bold mb-3">
                  LoveHeartBeat
                </h5>
                <p className="text-body-secondary mb-0">
                  AI-powered monitoring and automation platform for modern data infrastructure.
                </p>
              </div>
              <div className="col-6 col-md-3">
                <h6 className="fw-semibold mb-3">
                  Product
                </h6>
                <ul className="list-unstyled mb-0">
                  <li className="mb-2">
                    <a className="text-body-secondary text-decoration-none" href="/apps/observability/etl-monitoring/">
                      ETL Monitoring
                    </a>
                  </li>
                  <li className="mb-2">
                    <a className="text-body-secondary text-decoration-none" href="/apps/observability/orchestration-monitoring/">
                      Orchestration
                    </a>
                  </li>
                  <li className="mb-2">
                    <a className="text-body-secondary text-decoration-none" href="/apps/platform/integrations/">
                      Integrations
                    </a>
                  </li>
                  <li className="mb-2">
                    <a className="text-body-secondary text-decoration-none" href="/apps/observability/automation/">
                      AI Automation
                    </a>
                  </li>
                </ul>
              </div>
              <div className="col-6 col-md-3">
                <h6 className="fw-semibold mb-3">
                  Company
                </h6>
                <ul className="list-unstyled mb-0">
                  <li className="mb-2">
                    <a className="text-body-secondary text-decoration-none" href="#!">
                      About
                    </a>
                  </li>
                  <li className="mb-2">
                    <a className="text-body-secondary text-decoration-none" href="#!">
                      Blog
                    </a>
                  </li>
                  <li className="mb-2">
                    <a className="text-body-secondary text-decoration-none" href="#!">
                      Careers
                    </a>
                  </li>
                  <li className="mb-2">
                    <a className="text-body-secondary text-decoration-none" href="#!">
                      Contact
                    </a>
                  </li>
                </ul>
              </div>
              <div className="col-6 col-md-3">
                <h6 className="fw-semibold mb-3">
                  Support
                </h6>
                <ul className="list-unstyled mb-0">
                  <li className="mb-2">
                    <a className="text-body-secondary text-decoration-none" href="/undefined">
                      Documentation
                    </a>
                  </li>
                  <li className="mb-2">
                    <a className="text-body-secondary text-decoration-none" href="#!">
                      Help Center
                    </a>
                  </li>
                  <li className="mb-2">
                    <a className="text-body-secondary text-decoration-none" href="/apps/platform/health-connectivity/">
                      Status
                    </a>
                  </li>
                  <li className="mb-2">
                    <a className="text-body-secondary text-decoration-none" href="/apps/platform/command-center/">
                      Command Center
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <hr className="border-translucent my-6" />
            <p className="text-center text-body-secondary mb-0">
              © 2026 LoveHeartBeat. All rights reserved. A Product from
              <a className="ms-1" href="https://www.thinkartha.com/" target="_blank" rel="noopener noreferrer">
                Artha Solutions
              </a>
            </p>
          </div>
        </footer>
        <div className="modal fade" id="demo-video" tabIndex={-1} aria-labelledby="demo-video-label" aria-hidden={true}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-bottom border-translucent">
                <h5 className="modal-title mb-0" id="demo-video-label">
                  LoveHeartBeat overview
                </h5>
                <button className="btn-close" type="button" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div className="modal-body p-0">
                <video className="w-100 d-block" id="demo-video-player" controls={true} preload="none" playsInline={true} poster="/assets/img/spot-illustrations/auth.png">
                  <source src="/docs/video/overview.mp4" type="video/mp4" />
                </video>
                <div className="alert alert-subtle-info d-none m-3" data-demo-video-fallback="" role="alert">
                  The overview recording is not available on this server yet.
                  <a className="ms-1" href="https://www.loom.com/share/be36e76dd2e2460b818d6b45158a9341" target="_blank" rel="noopener noreferrer">
                    Watch it on Loom instead.
                  </a>
                </div>
              </div>
              <div className="modal-footer border-top border-translucent justify-content-between">
                <a className="fs-9" href="https://www.loom.com/share/be36e76dd2e2460b818d6b45158a9341" target="_blank" rel="noopener noreferrer">
                  <span className="fa-solid fa-arrow-up-right-from-square me-1"></span>
                  Watch on Loom
                </a>
                <button className="btn btn-phoenix-secondary btn-sm" type="button" data-bs-dismiss="modal">
                  Close
                </button>
              </div>
            </div>
          </div>
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
          "code": "\n      import {\n        api,\n        currentTenantSlug,\n        tenantUrl,\n        getToken,\n        setToken\n      } from './assets/js/integration/api-client.js';\n      import {\n        hydrate\n      } from './assets/js/integration/live-data.js';\n      import {\n        bind\n      } from './assets/js/integration/actions.js';\n      import {\n        init as initAuth\n      } from './assets/js/integration/auth.js';\n      import {\n        init as initAccount\n      } from './assets/js/integration/account.js';\n      window.lhb = {\n        api,\n        currentTenantSlug,\n        tenantUrl,\n        getToken,\n        setToken\n      };\n      window.__lhbResolve(window.lhb);\n      //- The guard runs first: a page about to redirect a signed-out visitor should not\n      //- spend a round trip per table finding out it had no session.\n      //- .catch, not .then alone: a guard that throws must not take the page's data with\n      //- it — an unhydrated dashboard is a silent one.\n      initAuth().catch(() => {}).then(() => {\n        hydrate(api);\n        bind(api);\n        //- Paints the signed-in account onto any page that asks for it, and reveals the\n        //- owner-only block. Same .catch reasoning as the guard above.\n        initAccount().catch(() => {});\n      });\n    ",
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
        },
        {
          "code": "\n      (function() {\n        var modal = document.getElementById('demo-video');\n        var player = document.getElementById('demo-video-player');\n        if (!modal || !player) return;\n        var fallback = modal.querySelector('[data-demo-video-fallback]');\n\n        //- The error fires on the <source>, not the <video>, and does not bubble — so\n        //- listen in the capture phase or a missing file just shows an empty player.\n        player.addEventListener('error', show, true);\n\n        function show() {\n          player.classList.add('d-none');\n          if (fallback) fallback.classList.remove('d-none');\n        }\n\n        //- preload='none' means nothing is fetched until the modal opens, and stopping on\n        //- close keeps audio from playing on into a page nobody is looking at.\n        modal.addEventListener('shown.bs.modal', function() {\n          player.play().catch(function() {});\n        });\n        modal.addEventListener('hidden.bs.modal', function() {\n          player.pause();\n        });\n      })();\n    "
        }
      ]} />
    </>
  )
}
