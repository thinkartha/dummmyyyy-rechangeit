'use client'

import { usePathname } from 'next/navigation'
import Scripts from './scripts'

// Which sidebar group each route belongs to. The pug build baked the open/active
// state into every page; here it is derived from the URL once.
const NAV_GROUPS: Record<string, string[]> = {
  "nv-home": [
    "/dashboard/observability/"
  ],
  "nv-observability": [
    "/apps/observability/api-monitoring/",
    "/apps/observability/api-gateway/",
    "/apps/observability/ai-monitoring/",
    "/apps/observability/ai-gateway/",
    "/apps/observability/etl-monitoring/",
    "/apps/observability/alerts/",
    "/apps/observability/cloud-monitoring/",
    "/apps/observability/cloud-cost/",
    "/apps/observability/ai-cost-usage/",
    "/apps/observability/ai-models/",
    "/apps/observability/orchestration-monitoring/",
    "/apps/observability/database-monitoring/",
    "/apps/observability/data-observability/",
    "/apps/observability/traces/",
    "/apps/observability/logs/",
    "/apps/observability/alert-management/",
    "/apps/observability/incident-correlation/",
    "/apps/observability/automation/",
    "/apps/observability/slo/",
    "/apps/observability/drift/",
    "/apps/observability/escalation/",
    "/apps/observability/service-topology/"
  ],
  "nv-platform": [
    "/apps/platform/command-center/",
    "/apps/platform/admin/",
    "/apps/platform/integrations/",
    "/apps/platform/integrations/api-gateway/",
    "/apps/platform/integrations/cloud/",
    "/apps/platform/integrations/etl/",
    "/apps/platform/integrations/databases/",
    "/apps/platform/integrations/ai-tools/",
    "/apps/platform/databricks/",
    "/apps/platform/health-connectivity/"
  ],
  "nv-integrations": [
    "/apps/platform/integrations/",
    "/apps/platform/integrations/api-gateway/",
    "/apps/platform/integrations/cloud/",
    "/apps/platform/integrations/etl/",
    "/apps/platform/integrations/databases/",
    "/apps/platform/integrations/ai-tools/",
    "/apps/platform/databricks/"
  ],
  "nv-organization": [
    "/apps/organization/organizations/",
    "/apps/organization/multi-tenant/",
    "/apps/organization/onboarding/",
    "/apps/organization/members/",
    "/apps/organization/authentication/"
  ],
  "nv-email": [
    "/apps/email/inbox/",
    "/apps/email/email-detail/",
    "/apps/email/compose/"
  ],
  "nv-events": [
    "/apps/events/create-an-event/",
    "/apps/events/event-detail/"
  ],
  "nv-FAQ": [
    "/pages/faq/faq-accordion/",
    "/pages/faq/faq-tab/"
  ]
}

export default function AppLayout({
  children,
  scripts = [],
  contentClass = 'content',
}: {
  children: React.ReactNode
  scripts?: Array<{ src?: string; code?: string; module?: boolean }>
  contentClass?: string
}) {
  const path = usePathname()
  const open = (group: string) => (NAV_GROUPS[group] || []).includes(path)

  return (
    <>
        {/* =============================================== */}
        {/* Main Content */}
        {/* =============================================== */}
        <main className="main" id="top">
          <nav className="navbar navbar-vertical navbar-expand-lg">
            <div className="collapse navbar-collapse" id="navbarVerticalCollapse">
              {/* scrollbar removed */}
              <div className="navbar-vertical-content">
                <ul className="navbar-nav flex-column" id="navbarVerticalNav">
                  <li className="nav-item">
                    {/* parent pages */}
                    <div className="nav-item-wrapper">
                      <a className={'nav-link dropdown-indicator label-1'} href="#nv-home" role="button" data-bs-toggle="collapse" aria-expanded={open('nv-home')} aria-controls="nv-home">
                        <div className="d-flex align-items-center">
                          <div className="dropdown-indicator-icon-wrapper">
                            <span className="fas fa-caret-right dropdown-indicator-icon"></span>
                          </div>
                          <span className="nav-link-icon">
                            <span data-feather="pie-chart"></span>
                          </span>
                          <span className="nav-link-text">
                            Home
                          </span>
                        </div>
                      </a>
                      <div className="parent-wrapper label-1">
                        <ul className={'nav collapse parent' + (open('nv-home') ? ' show' : '')} data-bs-parent="#navbarVerticalCollapse" id="nv-home">
                          <li className="collapsed-nav-item-title d-none">
                            Home
                          </li>
                          <li className="nav-item">
                            <a className={'nav-link' + (path === '/dashboard/observability/' ? ' active' : '')} href="/dashboard/observability/">
                              <div className="d-flex align-items-center">
                                <span className="nav-link-text">
                                  Observability
                                </span>
                              </div>
                            </a>
                            {/* more inner pages */}
                          </li>
                        </ul>
                      </div>
                    </div>
                  </li>
                  <li className="nav-item">
                    {/* label */}
                    <p className="navbar-vertical-label">
                      Apps
                    </p>
                    <hr className="navbar-vertical-line" />
                    {/* parent pages */}
                    <div className="nav-item-wrapper">
                      <a className={'nav-link dropdown-indicator label-1'} href="#nv-observability" role="button" data-bs-toggle="collapse" aria-expanded={open('nv-observability')} aria-controls="nv-observability">
                        <div className="d-flex align-items-center">
                          <div className="dropdown-indicator-icon-wrapper">
                            <span className="fas fa-caret-right dropdown-indicator-icon"></span>
                          </div>
                          <span className="nav-link-icon">
                            <span data-feather="activity"></span>
                          </span>
                          <span className="nav-link-text">
                            Observability
                          </span>
                        </div>
                      </a>
                      <div className="parent-wrapper label-1">
                        <ul className={'nav collapse parent' + (open('nv-observability') ? ' show' : '')} data-bs-parent="#navbarVerticalCollapse" id="nv-observability">
                          <li className="collapsed-nav-item-title d-none">
                            Observability
                          </li>
                          <li className="nav-item">
                            <a className={'nav-link' + (path === '/apps/observability/api-monitoring/' ? ' active' : '')} href="/apps/observability/api-monitoring/">
                              <div className="d-flex align-items-center">
                                <span className="nav-link-text">
                                  API monitoring
                                </span>
                              </div>
                            </a>
                            {/* more inner pages */}
                          </li>
                          <li className="nav-item">
                            <a className={'nav-link' + (path === '/apps/observability/api-gateway/' ? ' active' : '')} href="/apps/observability/api-gateway/">
                              <div className="d-flex align-items-center">
                                <span className="nav-link-text">
                                  API gateway
                                </span>
                              </div>
                            </a>
                            {/* more inner pages */}
                          </li>
                          <li className="nav-item">
                            <a className={'nav-link' + (path === '/apps/observability/ai-monitoring/' ? ' active' : '')} href="/apps/observability/ai-monitoring/">
                              <div className="d-flex align-items-center">
                                <span className="nav-link-text">
                                  AI monitoring
                                </span>
                              </div>
                            </a>
                            {/* more inner pages */}
                          </li>
                          <li className="nav-item">
                            <a className={'nav-link' + (path === '/apps/observability/ai-gateway/' ? ' active' : '')} href="/apps/observability/ai-gateway/">
                              <div className="d-flex align-items-center">
                                <span className="nav-link-text">
                                  AI gateway
                                </span>
                              </div>
                            </a>
                            {/* more inner pages */}
                          </li>
                          <li className="nav-item">
                            <a className={'nav-link' + (path === '/apps/observability/etl-monitoring/' ? ' active' : '')} href="/apps/observability/etl-monitoring/">
                              <div className="d-flex align-items-center">
                                <span className="nav-link-text">
                                  ETL monitoring
                                </span>
                              </div>
                            </a>
                            {/* more inner pages */}
                          </li>
                          <li className="nav-item">
                            <a className={'nav-link' + (path === '/apps/observability/alerts/' ? ' active' : '')} href="/apps/observability/alerts/">
                              <div className="d-flex align-items-center">
                                <span className="nav-link-text">
                                  Alerts
                                </span>
                              </div>
                            </a>
                            {/* more inner pages */}
                          </li>
                          <li className="nav-item">
                            <a className={'nav-link' + (path === '/apps/observability/cloud-monitoring/' ? ' active' : '')} href="/apps/observability/cloud-monitoring/">
                              <div className="d-flex align-items-center">
                                <span className="nav-link-text">
                                  Cloud monitoring
                                </span>
                              </div>
                            </a>
                            {/* more inner pages */}
                          </li>
                          <li className="nav-item">
                            <a className={'nav-link' + (path === '/apps/observability/cloud-cost/' ? ' active' : '')} href="/apps/observability/cloud-cost/">
                              <div className="d-flex align-items-center">
                                <span className="nav-link-text">
                                  Cloud cost
                                </span>
                              </div>
                            </a>
                            {/* more inner pages */}
                          </li>
                          <li className="nav-item">
                            <a className={'nav-link' + (path === '/apps/observability/ai-cost-usage/' ? ' active' : '')} href="/apps/observability/ai-cost-usage/">
                              <div className="d-flex align-items-center">
                                <span className="nav-link-text">
                                  AI cost usage
                                </span>
                              </div>
                            </a>
                            {/* more inner pages */}
                          </li>
                          <li className="nav-item">
                            <a className={'nav-link' + (path === '/apps/observability/ai-models/' ? ' active' : '')} href="/apps/observability/ai-models/">
                              <div className="d-flex align-items-center">
                                <span className="nav-link-text">
                                  AI models
                                </span>
                              </div>
                            </a>
                            {/* more inner pages */}
                          </li>
                          <li className="nav-item">
                            <a className={'nav-link' + (path === '/apps/observability/orchestration-monitoring/' ? ' active' : '')} href="/apps/observability/orchestration-monitoring/">
                              <div className="d-flex align-items-center">
                                <span className="nav-link-text">
                                  Orchestration
                                </span>
                              </div>
                            </a>
                            {/* more inner pages */}
                          </li>
                          <li className="nav-item">
                            <a className={'nav-link' + (path === '/apps/observability/database-monitoring/' ? ' active' : '')} href="/apps/observability/database-monitoring/">
                              <div className="d-flex align-items-center">
                                <span className="nav-link-text">
                                  Database monitoring
                                </span>
                              </div>
                            </a>
                            {/* more inner pages */}
                          </li>
                          <li className="nav-item">
                            <a className={'nav-link' + (path === '/apps/observability/data-observability/' ? ' active' : '')} href="/apps/observability/data-observability/">
                              <div className="d-flex align-items-center">
                                <span className="nav-link-text">
                                  Data observability
                                </span>
                              </div>
                            </a>
                            {/* more inner pages */}
                          </li>
                          <li className="nav-item">
                            <a className={'nav-link' + (path === '/apps/observability/traces/' ? ' active' : '')} href="/apps/observability/traces/">
                              <div className="d-flex align-items-center">
                                <span className="nav-link-text">
                                  Traces topology
                                </span>
                              </div>
                            </a>
                            {/* more inner pages */}
                          </li>
                          <li className="nav-item">
                            <a className={'nav-link' + (path === '/apps/observability/logs/' ? ' active' : '')} href="/apps/observability/logs/">
                              <div className="d-flex align-items-center">
                                <span className="nav-link-text">
                                  Logs
                                </span>
                              </div>
                            </a>
                            {/* more inner pages */}
                          </li>
                          <li className="nav-item">
                            <a className={'nav-link' + (path === '/apps/observability/alert-management/' ? ' active' : '')} href="/apps/observability/alert-management/">
                              <div className="d-flex align-items-center">
                                <span className="nav-link-text">
                                  Alert management
                                </span>
                              </div>
                            </a>
                            {/* more inner pages */}
                          </li>
                          <li className="nav-item">
                            <a className={'nav-link' + (path === '/apps/observability/incident-correlation/' ? ' active' : '')} href="/apps/observability/incident-correlation/">
                              <div className="d-flex align-items-center">
                                <span className="nav-link-text">
                                  Correlation RCA
                                </span>
                              </div>
                            </a>
                            {/* more inner pages */}
                          </li>
                          <li className="nav-item">
                            <a className={'nav-link' + (path === '/apps/observability/automation/' ? ' active' : '')} href="/apps/observability/automation/">
                              <div className="d-flex align-items-center">
                                <span className="nav-link-text">
                                  AI automation
                                </span>
                              </div>
                            </a>
                            {/* more inner pages */}
                          </li>
                          <li className="nav-item">
                            <a className={'nav-link' + (path === '/apps/observability/slo/' ? ' active' : '')} href="/apps/observability/slo/">
                              <div className="d-flex align-items-center">
                                <span className="nav-link-text">
                                  SLO error budgets
                                </span>
                              </div>
                            </a>
                            {/* more inner pages */}
                          </li>
                          <li className="nav-item">
                            <a className={'nav-link' + (path === '/apps/observability/drift/' ? ' active' : '')} href="/apps/observability/drift/">
                              <div className="d-flex align-items-center">
                                <span className="nav-link-text">
                                  Drift detection
                                </span>
                              </div>
                            </a>
                            {/* more inner pages */}
                          </li>
                          <li className="nav-item">
                            <a className={'nav-link' + (path === '/apps/observability/escalation/' ? ' active' : '')} href="/apps/observability/escalation/">
                              <div className="d-flex align-items-center">
                                <span className="nav-link-text">
                                  Escalation approval
                                </span>
                              </div>
                            </a>
                            {/* more inner pages */}
                          </li>
                          <li className="nav-item">
                            <a className={'nav-link' + (path === '/apps/observability/service-topology/' ? ' active' : '')} href="/apps/observability/service-topology/">
                              <div className="d-flex align-items-center">
                                <span className="nav-link-text">
                                  Service topology
                                </span>
                              </div>
                            </a>
                            {/* more inner pages */}
                          </li>
                        </ul>
                      </div>
                    </div>
                    {/* parent pages */}
                    <div className="nav-item-wrapper">
                      <a className={'nav-link dropdown-indicator label-1'} href="#nv-platform" role="button" data-bs-toggle="collapse" aria-expanded={open('nv-platform')} aria-controls="nv-platform">
                        <div className="d-flex align-items-center">
                          <div className="dropdown-indicator-icon-wrapper">
                            <span className="fas fa-caret-right dropdown-indicator-icon"></span>
                          </div>
                          <span className="nav-link-icon">
                            <span data-feather="command"></span>
                          </span>
                          <span className="nav-link-text">
                            Platform
                          </span>
                        </div>
                      </a>
                      <div className="parent-wrapper label-1">
                        <ul className={'nav collapse parent' + (open('nv-platform') ? ' show' : '')} data-bs-parent="#navbarVerticalCollapse" id="nv-platform">
                          <li className="collapsed-nav-item-title d-none">
                            Platform
                          </li>
                          <li className="nav-item">
                            <a className={'nav-link' + (path === '/apps/platform/command-center/' ? ' active' : '')} href="/apps/platform/command-center/">
                              <div className="d-flex align-items-center">
                                <span className="nav-link-text">
                                  Command center
                                </span>
                              </div>
                            </a>
                            {/* more inner pages */}
                          </li>
                          <li className="nav-item">
                            <a className={'nav-link' + (path === '/apps/platform/admin/' ? ' active' : '')} href="/apps/platform/admin/">
                              <div className="d-flex align-items-center">
                                <span className="nav-link-text">
                                  Administration
                                </span>
                              </div>
                            </a>
                            {/* more inner pages */}
                          </li>
                          <li className="nav-item">
                            <a className={'nav-link dropdown-indicator'} href="#nv-integrations" data-bs-toggle="collapse" aria-expanded={open('nv-integrations')} aria-controls="nv-integrations">
                              <div className="d-flex align-items-center">
                                <div className="dropdown-indicator-icon-wrapper">
                                  <span className="fas fa-caret-right dropdown-indicator-icon"></span>
                                </div>
                                <span className="nav-link-text">
                                  Integrations
                                </span>
                              </div>
                            </a>
                            {/* more inner pages */}
                            <div className="parent-wrapper">
                              <ul className={'nav collapse parent' + (open('nv-integrations') ? ' show' : '')} data-bs-parent="#platform" id="nv-integrations">
                                <li className="nav-item">
                                  <a className={'nav-link' + (path === '/apps/platform/integrations/' ? ' active' : '')} href="/apps/platform/integrations/">
                                    <div className="d-flex align-items-center">
                                      <span className="nav-link-text">
                                        Overview
                                      </span>
                                    </div>
                                  </a>
                                  {/* more inner pages */}
                                </li>
                                <li className="nav-item">
                                  <a className={'nav-link' + (path === '/apps/platform/integrations/api-gateway/' ? ' active' : '')} href="/apps/platform/integrations/api-gateway/">
                                    <div className="d-flex align-items-center">
                                      <span className="nav-link-text">
                                        API gateway
                                      </span>
                                    </div>
                                  </a>
                                  {/* more inner pages */}
                                </li>
                                <li className="nav-item">
                                  <a className={'nav-link' + (path === '/apps/platform/integrations/cloud/' ? ' active' : '')} href="/apps/platform/integrations/cloud/">
                                    <div className="d-flex align-items-center">
                                      <span className="nav-link-text">
                                        Cloud accounts
                                      </span>
                                    </div>
                                  </a>
                                  {/* more inner pages */}
                                </li>
                                <li className="nav-item">
                                  <a className={'nav-link' + (path === '/apps/platform/integrations/etl/' ? ' active' : '')} href="/apps/platform/integrations/etl/">
                                    <div className="d-flex align-items-center">
                                      <span className="nav-link-text">
                                        ETL tools
                                      </span>
                                    </div>
                                  </a>
                                  {/* more inner pages */}
                                </li>
                                <li className="nav-item">
                                  <a className={'nav-link' + (path === '/apps/platform/integrations/databases/' ? ' active' : '')} href="/apps/platform/integrations/databases/">
                                    <div className="d-flex align-items-center">
                                      <span className="nav-link-text">
                                        Databases
                                      </span>
                                    </div>
                                  </a>
                                  {/* more inner pages */}
                                </li>
                                <li className="nav-item">
                                  <a className={'nav-link' + (path === '/apps/platform/integrations/ai-tools/' ? ' active' : '')} href="/apps/platform/integrations/ai-tools/">
                                    <div className="d-flex align-items-center">
                                      <span className="nav-link-text">
                                        AI tools
                                      </span>
                                    </div>
                                  </a>
                                  {/* more inner pages */}
                                </li>
                                <li className="nav-item">
                                  <a className={'nav-link' + (path === '/apps/platform/databricks/' ? ' active' : '')} href="/apps/platform/databricks/">
                                    <div className="d-flex align-items-center">
                                      <span className="nav-link-text">
                                        Databricks
                                      </span>
                                    </div>
                                  </a>
                                  {/* more inner pages */}
                                </li>
                              </ul>
                            </div>
                          </li>
                          <li className="nav-item">
                            <a className={'nav-link' + (path === '/apps/platform/health-connectivity/' ? ' active' : '')} href="/apps/platform/health-connectivity/">
                              <div className="d-flex align-items-center">
                                <span className="nav-link-text">
                                  Health connectivity
                                </span>
                              </div>
                            </a>
                            {/* more inner pages */}
                          </li>
                        </ul>
                      </div>
                    </div>
                    {/* parent pages */}
                    <div className="nav-item-wrapper">
                      <a className={'nav-link dropdown-indicator label-1'} href="#nv-organization" role="button" data-bs-toggle="collapse" aria-expanded={open('nv-organization')} aria-controls="nv-organization">
                        <div className="d-flex align-items-center">
                          <div className="dropdown-indicator-icon-wrapper">
                            <span className="fas fa-caret-right dropdown-indicator-icon"></span>
                          </div>
                          <span className="nav-link-icon">
                            <span data-feather="briefcase"></span>
                          </span>
                          <span className="nav-link-text">
                            Organization
                          </span>
                        </div>
                      </a>
                      <div className="parent-wrapper label-1">
                        <ul className={'nav collapse parent' + (open('nv-organization') ? ' show' : '')} data-bs-parent="#navbarVerticalCollapse" id="nv-organization">
                          <li className="collapsed-nav-item-title d-none">
                            Organization
                          </li>
                          <li className="nav-item">
                            <a className={'nav-link' + (path === '/apps/organization/organizations/' ? ' active' : '')} href="/apps/organization/organizations/">
                              <div className="d-flex align-items-center">
                                <span className="nav-link-text">
                                  Organizations
                                </span>
                              </div>
                            </a>
                            {/* more inner pages */}
                          </li>
                          <li className="nav-item">
                            <a className={'nav-link' + (path === '/apps/organization/multi-tenant/' ? ' active' : '')} href="/apps/organization/multi-tenant/">
                              <div className="d-flex align-items-center">
                                <span className="nav-link-text">
                                  Multi tenant
                                </span>
                              </div>
                            </a>
                            {/* more inner pages */}
                          </li>
                          <li className="nav-item">
                            <a className={'nav-link' + (path === '/apps/organization/onboarding/' ? ' active' : '')} href="/apps/organization/onboarding/">
                              <div className="d-flex align-items-center">
                                <span className="nav-link-text">
                                  Onboarding
                                </span>
                              </div>
                            </a>
                            {/* more inner pages */}
                          </li>
                          <li className="nav-item">
                            <a className={'nav-link' + (path === '/apps/organization/members/' ? ' active' : '')} href="/apps/organization/members/">
                              <div className="d-flex align-items-center">
                                <span className="nav-link-text">
                                  Members
                                </span>
                              </div>
                            </a>
                            {/* more inner pages */}
                          </li>
                          <li className="nav-item">
                            <a className={'nav-link' + (path === '/apps/organization/authentication/' ? ' active' : '')} href="/apps/organization/authentication/">
                              <div className="d-flex align-items-center">
                                <span className="nav-link-text">
                                  Authentication SSO
                                </span>
                              </div>
                            </a>
                            {/* more inner pages */}
                          </li>
                        </ul>
                      </div>
                    </div>
                    {/* parent pages */}
                    <div className="nav-item-wrapper">
                      <a className={'nav-link label-1' + (path === '/apps/chat/' ? ' active' : '')} href="/apps/chat/" role="button" data-bs-toggle="" aria-expanded={false}>
                        <div className="d-flex align-items-center">
                          <span className="nav-link-icon">
                            <span data-feather="message-square"></span>
                          </span>
                          <span className="nav-link-text-wrapper">
                            <span className="nav-link-text">
                              Chat
                            </span>
                          </span>
                        </div>
                      </a>
                    </div>
                    {/* parent pages */}
                    <div className="nav-item-wrapper">
                      <a className={'nav-link dropdown-indicator label-1'} href="#nv-email" role="button" data-bs-toggle="collapse" aria-expanded={open('nv-email')} aria-controls="nv-email">
                        <div className="d-flex align-items-center">
                          <div className="dropdown-indicator-icon-wrapper">
                            <span className="fas fa-caret-right dropdown-indicator-icon"></span>
                          </div>
                          <span className="nav-link-icon">
                            <span data-feather="mail"></span>
                          </span>
                          <span className="nav-link-text">
                            Email
                          </span>
                        </div>
                      </a>
                      <div className="parent-wrapper label-1">
                        <ul className={'nav collapse parent' + (open('nv-email') ? ' show' : '')} data-bs-parent="#navbarVerticalCollapse" id="nv-email">
                          <li className="collapsed-nav-item-title d-none">
                            Email
                          </li>
                          <li className="nav-item">
                            <a className={'nav-link' + (path === '/apps/email/inbox/' ? ' active' : '')} href="/apps/email/inbox/">
                              <div className="d-flex align-items-center">
                                <span className="nav-link-text">
                                  Inbox
                                </span>
                              </div>
                            </a>
                            {/* more inner pages */}
                          </li>
                          <li className="nav-item">
                            <a className={'nav-link' + (path === '/apps/email/email-detail/' ? ' active' : '')} href="/apps/email/email-detail/">
                              <div className="d-flex align-items-center">
                                <span className="nav-link-text">
                                  Email detail
                                </span>
                              </div>
                            </a>
                            {/* more inner pages */}
                          </li>
                          <li className="nav-item">
                            <a className={'nav-link' + (path === '/apps/email/compose/' ? ' active' : '')} href="/apps/email/compose/">
                              <div className="d-flex align-items-center">
                                <span className="nav-link-text">
                                  Compose
                                </span>
                              </div>
                            </a>
                            {/* more inner pages */}
                          </li>
                        </ul>
                      </div>
                    </div>
                    {/* parent pages */}
                    <div className="nav-item-wrapper">
                      <a className={'nav-link dropdown-indicator label-1'} href="#nv-events" role="button" data-bs-toggle="collapse" aria-expanded={open('nv-events')} aria-controls="nv-events">
                        <div className="d-flex align-items-center">
                          <div className="dropdown-indicator-icon-wrapper">
                            <span className="fas fa-caret-right dropdown-indicator-icon"></span>
                          </div>
                          <span className="nav-link-icon">
                            <span data-feather="bookmark"></span>
                          </span>
                          <span className="nav-link-text">
                            Events
                          </span>
                        </div>
                      </a>
                      <div className="parent-wrapper label-1">
                        <ul className={'nav collapse parent' + (open('nv-events') ? ' show' : '')} data-bs-parent="#navbarVerticalCollapse" id="nv-events">
                          <li className="collapsed-nav-item-title d-none">
                            Events
                          </li>
                          <li className="nav-item">
                            <a className={'nav-link' + (path === '/apps/events/create-an-event/' ? ' active' : '')} href="/apps/events/create-an-event/">
                              <div className="d-flex align-items-center">
                                <span className="nav-link-text">
                                  Create an event
                                </span>
                              </div>
                            </a>
                            {/* more inner pages */}
                          </li>
                          <li className="nav-item">
                            <a className={'nav-link' + (path === '/apps/events/event-detail/' ? ' active' : '')} href="/apps/events/event-detail/">
                              <div className="d-flex align-items-center">
                                <span className="nav-link-text">
                                  Event detail
                                </span>
                              </div>
                            </a>
                            {/* more inner pages */}
                          </li>
                        </ul>
                      </div>
                    </div>
                  </li>
                  <li className="nav-item">
                    {/* label */}
                    <p className="navbar-vertical-label">
                      Pages
                    </p>
                    <hr className="navbar-vertical-line" />
                    {/* parent pages */}
                    <div className="nav-item-wrapper">
                      <a className={'nav-link dropdown-indicator label-1'} href="#nv-FAQ" role="button" data-bs-toggle="collapse" aria-expanded={open('nv-FAQ')} aria-controls="nv-FAQ">
                        <div className="d-flex align-items-center">
                          <div className="dropdown-indicator-icon-wrapper">
                            <span className="fas fa-caret-right dropdown-indicator-icon"></span>
                          </div>
                          <span className="nav-link-icon">
                            <span data-feather="help-circle"></span>
                          </span>
                          <span className="nav-link-text">
                            FAQ
                          </span>
                        </div>
                      </a>
                      <div className="parent-wrapper label-1">
                        <ul className={'nav collapse parent' + (open('nv-FAQ') ? ' show' : '')} data-bs-parent="#navbarVerticalCollapse" id="nv-FAQ">
                          <li className="collapsed-nav-item-title d-none">
                            FAQ
                          </li>
                          <li className="nav-item">
                            <a className={'nav-link' + (path === '/pages/faq/faq-accordion/' ? ' active' : '')} href="/pages/faq/faq-accordion/">
                              <div className="d-flex align-items-center">
                                <span className="nav-link-text">
                                  FAQ accordion
                                </span>
                              </div>
                            </a>
                            {/* more inner pages */}
                          </li>
                          <li className="nav-item">
                            <a className={'nav-link' + (path === '/pages/faq/faq-tab/' ? ' active' : '')} href="/pages/faq/faq-tab/">
                              <div className="d-flex align-items-center">
                                <span className="nav-link-text">
                                  FAQ tab
                                </span>
                              </div>
                            </a>
                            {/* more inner pages */}
                          </li>
                        </ul>
                      </div>
                    </div>
                    {/* parent pages */}
                    <div className="nav-item-wrapper">
                      <a className={'nav-link label-1' + (path === '/apps/social/settings/' ? ' active' : '')} href="/apps/social/settings/" role="button" data-bs-toggle="" aria-expanded={false}>
                        <div className="d-flex align-items-center">
                          <span className="nav-link-icon">
                            <span data-feather="settings"></span>
                          </span>
                          <span className="nav-link-text-wrapper">
                            <span className="nav-link-text">
                              Settings
                            </span>
                          </span>
                        </div>
                      </a>
                    </div>
                    {/* parent pages */}
                    <div className="nav-item-wrapper">
                      <a className={'nav-link label-1' + (path === '/pages/timeline/' ? ' active' : '')} href="/pages/timeline/" role="button" data-bs-toggle="" aria-expanded={false}>
                        <div className="d-flex align-items-center">
                          <span className="nav-link-icon">
                            <span data-feather="clock"></span>
                          </span>
                          <span className="nav-link-text-wrapper">
                            <span className="nav-link-text">
                              Timeline
                            </span>
                          </span>
                        </div>
                      </a>
                    </div>
                    {/* parent pages */}
                    <div className="nav-item-wrapper">
                      <a className={'nav-link label-1' + (path === '/pages/notifications/' ? ' active' : '')} href="/pages/notifications/" role="button" data-bs-toggle="" aria-expanded={false}>
                        <div className="d-flex align-items-center">
                          <span className="nav-link-icon">
                            <span data-feather="bell"></span>
                          </span>
                          <span className="nav-link-text-wrapper">
                            <span className="nav-link-text">
                              Notifications
                            </span>
                          </span>
                        </div>
                      </a>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
            <div className="navbar-vertical-footer">
              <button className="btn navbar-vertical-toggle border-0 fw-semibold w-100 white-space-nowrap d-flex align-items-center">
                <span className="uil uil-left-arrow-to-left fs-8"></span>
                <span className="uil uil-arrow-from-right fs-8"></span>
                <span className="navbar-vertical-footer-text ms-2">
                  Collapsed View
                </span>
              </button>
            </div>
          </nav>
          <nav className="navbar navbar-top fixed-top navbar-expand" id="navbarDefault">
            <div className="collapse navbar-collapse justify-content-between">
              <div className="navbar-logo">
                <button className="btn navbar-toggler navbar-toggler-humburger-icon hover-bg-transparent" type="button" data-bs-toggle="collapse" data-bs-target="#navbarVerticalCollapse" aria-controls="navbarVerticalCollapse" aria-expanded={false} aria-label="Toggle Navigation">
                  <span className="navbar-toggle-icon">
                    <span className="toggle-line"></span>
                  </span>
                </button>
                <a className="navbar-brand me-1 me-sm-3" href="/dashboard/observability/">
                  <div className="d-flex align-items-center">
                    <div className="d-flex align-items-center">
                      <h5 className="logo-text mb-0 d-none d-sm-block">
                        LoveHeartBeat
                      </h5>
                    </div>
                  </div>
                </a>
              </div>
              <div className="d-none d-lg-flex align-items-center border border-translucent rounded-pill px-3 py-1 bg-body-emphasis me-2">
                <span className="fa-solid fa-building text-primary me-2 fs-10"></span>
                <div>
                  <p className="mb-0 fs-10 text-body-tertiary lh-1">
                    Tenant
                  </p>
                  <a className="fw-semibold fs-9 text-body-emphasis text-decoration-none" href="/apps/organization/organizations/">
                    RootVyana
                    <span className="text-body-tertiary fw-normal ms-1">
                      rootvyana.loveheartbeat.com
                    </span>
                  </a>
                </div>
              </div>
              <div className="search-box navbar-top-search-box d-none d-lg-block" data-list={"{\"valueNames\":[\"title\"]}"} style={{ width: "25rem" }}>
                <form className="position-relative" data-bs-toggle="search" data-bs-display="static">
                  <input className="form-control search-input fuzzy-search rounded-pill form-control-sm" type="search" placeholder="Search..." aria-label="Search" />
                  <span className="fas fa-search search-box-icon"></span>
                </form>
                <div className="btn-close position-absolute end-0 top-50 translate-middle cursor-pointer shadow-none" data-bs-dismiss="search">
                  <button className="btn btn-link p-0" aria-label="Close"></button>
                </div>
                <div className="dropdown-menu border start-0 py-0 overflow-hidden w-100">
                  <div className="scrollbar-overlay" style={{ maxHeight: "30rem" }}>
                    <div className="list pb-3">
                      <h6 className="dropdown-header text-body-highlight fs-10 py-2">
                        24
                        <span className="text-body-quaternary">
                          results
                        </span>
                      </h6>
                      <hr className="my-0" />
                      <h6 className="dropdown-header text-body-highlight fs-9 border-bottom border-translucent py-2 lh-sm">
                        Recently Searched
                      </h6>
                      <div className="py-2">
                        <a className="dropdown-item" href="/undefined">
                          <div className="d-flex align-items-center">
                            <div className="fw-normal text-body-highlight title">
                              <span className="fa-solid fa-clock-rotate-left" data-fa-transform="shrink-2"></span>
                              Store Macbook
                            </div>
                          </div>
                        </a>
                        <a className="dropdown-item" href="/undefined">
                          <div className="d-flex align-items-center">
                            <div className="fw-normal text-body-highlight title">
                              <span className="fa-solid fa-clock-rotate-left" data-fa-transform="shrink-2"></span>
                              MacBook Air - 13″
                            </div>
                          </div>
                        </a>
                      </div>
                      <hr className="my-0" />
                      <h6 className="dropdown-header text-body-highlight fs-9 border-bottom border-translucent py-2 lh-sm">
                        Products
                      </h6>
                      <div className="py-2">
                        <a className="dropdown-item py-2 d-flex align-items-center" href="/undefined">
                          <div className="file-thumbnail me-2">
                            <img className="h-100 w-100 object-fit-cover rounded-3" src="/assets/img/products/60x60/3.png" alt="" />
                          </div>
                          <div className="flex-1">
                            <h6 className="mb-0 text-body-highlight title">
                              MacBook Air - 13″
                            </h6>
                            <p className="fs-10 mb-0 d-flex text-body-tertiary">
                              <span className="fw-medium text-body-tertiary text-opactity-85">
                                8GB Memory - 1.6GHz - 128GB Storage
                              </span>
                            </p>
                          </div>
                        </a>
                        <a className="dropdown-item py-2 d-flex align-items-center" href="/undefined">
                          <div className="file-thumbnail me-2">
                            <img className="img-fluid" src="/assets/img/products/60x60/3.png" alt="" />
                          </div>
                          <div className="flex-1">
                            <h6 className="mb-0 text-body-highlight title">
                              MacBook Pro - 13″
                            </h6>
                            <p className="fs-10 mb-0 d-flex text-body-tertiary">
                              <span className="fw-medium text-body-tertiary text-opactity-85">
                                30 Sep at 12:30 PM
                              </span>
                            </p>
                          </div>
                        </a>
                      </div>
                      <hr className="my-0" />
                      <h6 className="dropdown-header text-body-highlight fs-9 border-bottom border-translucent py-2 lh-sm">
                        Quick Links
                      </h6>
                      <div className="py-2">
                        <a className="dropdown-item" href="/undefined">
                          <div className="d-flex align-items-center">
                            <div className="fw-normal text-body-highlight title">
                              <span className="fa-solid fa-link text-body" data-fa-transform="shrink-2"></span>
                              Support MacBook House
                            </div>
                          </div>
                        </a>
                        <a className="dropdown-item" href="/undefined">
                          <div className="d-flex align-items-center">
                            <div className="fw-normal text-body-highlight title">
                              <span className="fa-solid fa-link text-body" data-fa-transform="shrink-2"></span>
                              Store MacBook″
                            </div>
                          </div>
                        </a>
                      </div>
                      <hr className="my-0" />
                      <h6 className="dropdown-header text-body-highlight fs-9 border-bottom border-translucent py-2 lh-sm">
                        Files
                      </h6>
                      <div className="py-2">
                        <a className="dropdown-item" href="/undefined">
                          <div className="d-flex align-items-center">
                            <div className="fw-normal text-body-highlight title">
                              <span className="fa-solid fa-file-zipper text-body" data-fa-transform="shrink-2"></span>
                              Library MacBook folder.rar
                            </div>
                          </div>
                        </a>
                        <a className="dropdown-item" href="/undefined">
                          <div className="d-flex align-items-center">
                            <div className="fw-normal text-body-highlight title">
                              <span className="fa-solid fa-file-lines text-body" data-fa-transform="shrink-2"></span>
                              Feature MacBook extensions.txt
                            </div>
                          </div>
                        </a>
                        <a className="dropdown-item" href="/undefined">
                          <div className="d-flex align-items-center">
                            <div className="fw-normal text-body-highlight title">
                              <span className="fa-solid fa-image text-body" data-fa-transform="shrink-2"></span>
                              MacBook Pro_13.jpg
                            </div>
                          </div>
                        </a>
                      </div>
                      <hr className="my-0" />
                      <h6 className="dropdown-header text-body-highlight fs-9 border-bottom border-translucent py-2 lh-sm">
                        Members
                      </h6>
                      <div className="py-2">
                        <a className="dropdown-item py-2 d-flex align-items-center" href="/undefined">
                          <div className="avatar avatar-l status-online  me-2 text-body">
                            <img className="rounded-circle " src="/assets/img/team/40x40/10.webp" alt="" />
                          </div>
                          <div className="flex-1">
                            <h6 className="mb-0 text-body-highlight title">
                              Carry Anna
                            </h6>
                            <p className="fs-10 mb-0 d-flex text-body-tertiary">
                              anna@technext.it
                            </p>
                          </div>
                        </a>
                        <a className="dropdown-item py-2 d-flex align-items-center" href="/undefined">
                          <div className="avatar avatar-l  me-2 text-body">
                            <img className="rounded-circle " src="/assets/img/team/40x40/12.webp" alt="" />
                          </div>
                          <div className="flex-1">
                            <h6 className="mb-0 text-body-highlight title">
                              John Smith
                            </h6>
                            <p className="fs-10 mb-0 d-flex text-body-tertiary">
                              smith@technext.it
                            </p>
                          </div>
                        </a>
                      </div>
                      <hr className="my-0" />
                      <h6 className="dropdown-header text-body-highlight fs-9 border-bottom border-translucent py-2 lh-sm">
                        Related Searches
                      </h6>
                      <div className="py-2">
                        <a className="dropdown-item" href="/undefined">
                          <div className="d-flex align-items-center">
                            <div className="fw-normal text-body-highlight title">
                              <span className="fa-brands fa-firefox-browser text-body" data-fa-transform="shrink-2"></span>
                              Search in the Web MacBook
                            </div>
                          </div>
                        </a>
                        <a className="dropdown-item" href="/undefined">
                          <div className="d-flex align-items-center">
                            <div className="fw-normal text-body-highlight title">
                              <span className="fa-brands fa-chrome text-body" data-fa-transform="shrink-2"></span>
                              Store MacBook″
                            </div>
                          </div>
                        </a>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="fallback fw-bold fs-7 d-none">
                        No Result Found.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <ul className="navbar-nav navbar-nav-icons flex-row">
                <li className="nav-item dropdown">
                  <a className={'nav-link dropdown-toggle lh-1 pe-0'} href="#!" role="button" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded={false}>
                    <span className="fa-solid fa-building me-1"></span>
                    <span className="d-none d-sm-inline">
                      RootVyana
                    </span>
                  </a>
                  <div className="dropdown-menu dropdown-menu-end shadow border py-2" style={{ minWidth: "18rem" }}>
                    <h6 className="dropdown-header">
                      Multi-tenant organizations
                    </h6>
                    <a className="dropdown-item" href="https://rootvyana.loveheartbeat.com" target="_blank" rel="noopener">
                      <div className="d-flex justify-content-between align-items-center">
                        <span>
                          RootVyana
                        </span>
                        <span className="badge badge-phoenix badge-phoenix-success">
                          Active
                        </span>
                      </div>
                      <div className="fs-10 text-body-tertiary">
                        rootvyana.loveheartbeat.com
                      </div>
                    </a>
                    <a className="dropdown-item" href="https://acme.loveheartbeat.com" target="_blank" rel="noopener">
                      <span>
                        Acme Corp
                      </span>
                      <div className="fs-10 text-body-tertiary">
                        acme.loveheartbeat.com
                      </div>
                    </a>
                    <a className="dropdown-item" href="https://contoso.loveheartbeat.com" target="_blank" rel="noopener">
                      <span>
                        Contoso
                      </span>
                      <div className="fs-10 text-body-tertiary">
                        contoso.loveheartbeat.com
                      </div>
                    </a>
                    <div className="dropdown-divider"></div>
                    <a className="dropdown-item" href="/apps/organization/organizations/">
                      Manage organizations
                    </a>
                    <a className="dropdown-item" href="/apps/organization/onboarding/">
                      Onboard new organization
                    </a>
                  </div>
                </li>
                <li className="nav-item">
                  <div className="theme-control-toggle feather-icon-wait px-2">
                    <input className="form-check-input ms-0 theme-control-toggle-input" type="checkbox" data-theme-control="phoenixTheme" defaultValue="dark" id="themeControlToggle" />
                    <label className="mb-0 theme-control-toggle-label theme-control-toggle-light" htmlFor="themeControlToggle" data-bs-toggle="tooltip" data-bs-placement="left" data-bs-title="Switch theme" style={{ height: "32px", width: "32px" }}>
                      <span className="icon" data-feather="moon"></span>
                    </label>
                    <label className="mb-0 theme-control-toggle-label theme-control-toggle-dark" htmlFor="themeControlToggle" data-bs-toggle="tooltip" data-bs-placement="left" data-bs-title="Switch theme" style={{ height: "32px", width: "32px" }}>
                      <span className="icon" data-feather="sun"></span>
                    </label>
                  </div>
                </li>
                <li className="nav-item d-lg-none">
                  <a className={'nav-link'} href="#" data-bs-toggle="modal" data-bs-target="#searchBoxModal">
                    <span className="d-block" style={{ height: "20px", width: "20px" }}>
                      <span data-feather="search" style={{ height: "19px", width: "19px", marginBottom: "2px" }}></span>
                    </span>
                  </a>
                </li>
                <li className="nav-item dropdown">
                  <a className={'nav-link'} href="#" style={{ minWidth: "2.25rem" }} role="button" data-bs-toggle="dropdown" aria-haspopup={true} aria-expanded={false} data-bs-auto-close="outside">
                    <span className="d-block" style={{ height: "20px", width: "20px" }}>
                      <span data-feather="bell" style={{ height: "20px", width: "20px" }}></span>
                    </span>
                  </a>
                  <div className="dropdown-menu dropdown-menu-end notification-dropdown-menu py-0 shadow border navbar-dropdown-caret" id="navbarDropdownNotfication" aria-labelledby="navbarDropdownNotfication">
                    <div className="card position-relative border-0">
                      <div className="card-header p-2">
                        <div className="d-flex justify-content-between">
                          <h5 className="text-body-emphasis mb-0">
                            Notifications
                          </h5>
                          <button className="btn btn-link p-0 fs-9 fw-normal" type="button">
                            Mark all as read
                          </button>
                        </div>
                      </div>
                      <div className="card-body p-0">
                        <div className="scrollbar-overlay" style={{ height: "27rem" }}>
                          <div className="px-2 px-sm-3 py-3 notification-card position-relative read border-bottom">
                            <div className="d-flex align-items-center justify-content-between position-relative">
                              <div className="d-flex">
                                <div className="avatar avatar-m status-online me-3">
                                  <img className="rounded-circle" src="/assets/img/team/40x40/30.webp" alt="" />
                                </div>
                                <div className="flex-1 me-sm-3">
                                  <h4 className="fs-9 text-body-emphasis">
                                    Jessie Samson
                                  </h4>
                                  <p className="fs-9 text-body-highlight mb-2 mb-sm-3 fw-normal">
                                    <span className="me-1 fs-10">
                                      💬
                                    </span>
                                    Mentioned you in a comment.
                                    <span className="ms-2 text-body-quaternary text-opacity-75 fw-bold fs-10">
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
                              <div className="dropdown notification-dropdown">
                                <button className="btn fs-10 btn-sm dropdown-toggle dropdown-caret-none transition-none" type="button" data-bs-toggle="dropdown" data-boundary="window" aria-haspopup={true} aria-expanded={false} data-bs-reference="parent">
                                  <span className="fas fa-ellipsis-h fs-10 text-body"></span>
                                </button>
                                <div className="dropdown-menu py-2">
                                  <a className="dropdown-item" href="#!">
                                    Mark as unread
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="px-2 px-sm-3 py-3 notification-card position-relative unread border-bottom">
                            <div className="d-flex align-items-center justify-content-between position-relative">
                              <div className="d-flex">
                                <div className="avatar avatar-m status-online me-3">
                                  <div className="avatar-name rounded-circle">
                                    <span>
                                      J
                                    </span>
                                  </div>
                                </div>
                                <div className="flex-1 me-sm-3">
                                  <h4 className="fs-9 text-body-emphasis">
                                    Jane Foster
                                  </h4>
                                  <p className="fs-9 text-body-highlight mb-2 mb-sm-3 fw-normal">
                                    <span className="me-1 fs-10">
                                      📅
                                    </span>
                                    Created an event.
                                    <span className="ms-2 text-body-quaternary text-opacity-75 fw-bold fs-10">
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
                              <div className="dropdown notification-dropdown">
                                <button className="btn fs-10 btn-sm dropdown-toggle dropdown-caret-none transition-none" type="button" data-bs-toggle="dropdown" data-boundary="window" aria-haspopup={true} aria-expanded={false} data-bs-reference="parent">
                                  <span className="fas fa-ellipsis-h fs-10 text-body"></span>
                                </button>
                                <div className="dropdown-menu py-2">
                                  <a className="dropdown-item" href="#!">
                                    Mark as unread
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="px-2 px-sm-3 py-3 notification-card position-relative unread border-bottom">
                            <div className="d-flex align-items-center justify-content-between position-relative">
                              <div className="d-flex">
                                <div className="avatar avatar-m status-online me-3">
                                  <img className="rounded-circle avatar-placeholder" src="/assets/img/team/40x40/avatar.webp" alt="" />
                                </div>
                                <div className="flex-1 me-sm-3">
                                  <h4 className="fs-9 text-body-emphasis">
                                    Jessie Samson
                                  </h4>
                                  <p className="fs-9 text-body-highlight mb-2 mb-sm-3 fw-normal">
                                    <span className="me-1 fs-10">
                                      👍
                                    </span>
                                    Liked your comment.
                                    <span className="ms-2 text-body-quaternary text-opacity-75 fw-bold fs-10">
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
                              <div className="dropdown notification-dropdown">
                                <button className="btn fs-10 btn-sm dropdown-toggle dropdown-caret-none transition-none" type="button" data-bs-toggle="dropdown" data-boundary="window" aria-haspopup={true} aria-expanded={false} data-bs-reference="parent">
                                  <span className="fas fa-ellipsis-h fs-10 text-body"></span>
                                </button>
                                <div className="dropdown-menu py-2">
                                  <a className="dropdown-item" href="#!">
                                    Mark as unread
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="px-2 px-sm-3 py-3 notification-card position-relative unread border-bottom">
                            <div className="d-flex align-items-center justify-content-between position-relative">
                              <div className="d-flex">
                                <div className="avatar avatar-m status-online me-3">
                                  <img className="rounded-circle" src="/assets/img/team/40x40/57.webp" alt="" />
                                </div>
                                <div className="flex-1 me-sm-3">
                                  <h4 className="fs-9 text-body-emphasis">
                                    Kiera Anderson
                                  </h4>
                                  <p className="fs-9 text-body-highlight mb-2 mb-sm-3 fw-normal">
                                    <span className="me-1 fs-10">
                                      💬
                                    </span>
                                    Mentioned you in a comment.
                                    <span className="ms-2 text-body-quaternary text-opacity-75 fw-bold fs-10"></span>
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
                              <div className="dropdown notification-dropdown">
                                <button className="btn fs-10 btn-sm dropdown-toggle dropdown-caret-none transition-none" type="button" data-bs-toggle="dropdown" data-boundary="window" aria-haspopup={true} aria-expanded={false} data-bs-reference="parent">
                                  <span className="fas fa-ellipsis-h fs-10 text-body"></span>
                                </button>
                                <div className="dropdown-menu py-2">
                                  <a className="dropdown-item" href="#!">
                                    Mark as unread
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="px-2 px-sm-3 py-3 notification-card position-relative unread border-bottom">
                            <div className="d-flex align-items-center justify-content-between position-relative">
                              <div className="d-flex">
                                <div className="avatar avatar-m status-online me-3">
                                  <img className="rounded-circle" src="/assets/img/team/40x40/59.webp" alt="" />
                                </div>
                                <div className="flex-1 me-sm-3">
                                  <h4 className="fs-9 text-body-emphasis">
                                    Herman Carter
                                  </h4>
                                  <p className="fs-9 text-body-highlight mb-2 mb-sm-3 fw-normal">
                                    <span className="me-1 fs-10">
                                      👤
                                    </span>
                                    Tagged you in a comment.
                                    <span className="ms-2 text-body-quaternary text-opacity-75 fw-bold fs-10"></span>
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
                              <div className="dropdown notification-dropdown">
                                <button className="btn fs-10 btn-sm dropdown-toggle dropdown-caret-none transition-none" type="button" data-bs-toggle="dropdown" data-boundary="window" aria-haspopup={true} aria-expanded={false} data-bs-reference="parent">
                                  <span className="fas fa-ellipsis-h fs-10 text-body"></span>
                                </button>
                                <div className="dropdown-menu py-2">
                                  <a className="dropdown-item" href="#!">
                                    Mark as unread
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="px-2 px-sm-3 py-3 notification-card position-relative read ">
                            <div className="d-flex align-items-center justify-content-between position-relative">
                              <div className="d-flex">
                                <div className="avatar avatar-m status-online me-3">
                                  <img className="rounded-circle" src="/assets/img/team/40x40/58.webp" alt="" />
                                </div>
                                <div className="flex-1 me-sm-3">
                                  <h4 className="fs-9 text-body-emphasis">
                                    Benjamin Button
                                  </h4>
                                  <p className="fs-9 text-body-highlight mb-2 mb-sm-3 fw-normal">
                                    <span className="me-1 fs-10">
                                      👍
                                    </span>
                                    Liked your comment.
                                    <span className="ms-2 text-body-quaternary text-opacity-75 fw-bold fs-10"></span>
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
                              <div className="dropdown notification-dropdown">
                                <button className="btn fs-10 btn-sm dropdown-toggle dropdown-caret-none transition-none" type="button" data-bs-toggle="dropdown" data-boundary="window" aria-haspopup={true} aria-expanded={false} data-bs-reference="parent">
                                  <span className="fas fa-ellipsis-h fs-10 text-body"></span>
                                </button>
                                <div className="dropdown-menu py-2">
                                  <a className="dropdown-item" href="#!">
                                    Mark as unread
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="card-footer p-0 border-top border-translucent border-0">
                        <div className="my-2 text-center fw-bold fs-10 text-body-tertiary text-opactity-85">
                          <a className="fw-bolder" href="/undefined">
                            Notification history
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
                <li className="nav-item dropdown">
                  <a className={'nav-link'} id="navbarDropdownNindeDots" href="#" role="button" data-bs-toggle="dropdown" aria-haspopup={true} data-bs-auto-close="outside" aria-expanded={false}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="2" cy="2" r="2" fill="currentColor"></circle>
                      <circle cx="2" cy="8" r="2" fill="currentColor"></circle>
                      <circle cx="2" cy="14" r="2" fill="currentColor"></circle>
                      <circle cx="8" cy="8" r="2" fill="currentColor"></circle>
                      <circle cx="8" cy="14" r="2" fill="currentColor"></circle>
                      <circle cx="14" cy="8" r="2" fill="currentColor"></circle>
                      <circle cx="14" cy="14" r="2" fill="currentColor"></circle>
                      <circle cx="8" cy="2" r="2" fill="currentColor"></circle>
                      <circle cx="14" cy="2" r="2" fill="currentColor"></circle>
                    </svg>
                  </a>
                  <div className="dropdown-menu dropdown-menu-end navbar-dropdown-caret py-0 dropdown-nine-dots shadow border" aria-labelledby="navbarDropdownNindeDots">
                    <div className="card bg-body-emphasis position-relative border-0">
                      <div className="card-body pt-3 px-3 pb-0 overflow-auto scrollbar" style={{ height: "20rem" }}>
                        <div className="row text-center align-items-center gx-0 gy-0">
                          <div className="col-4">
                            <a className="d-block bg-body-secondary-hover p-2 rounded-3 text-center text-decoration-none mb-3" href="#!">
                              <img src="/assets/img/nav-icons/behance.webp" alt="" width="30" />
                              <p className="mb-0 text-body-emphasis text-truncate fs-10 mt-1 pt-1">
                                Behance
                              </p>
                            </a>
                          </div>
                          <div className="col-4">
                            <a className="d-block bg-body-secondary-hover p-2 rounded-3 text-center text-decoration-none mb-3" href="#!">
                              <img src="/assets/img/nav-icons/google-cloud.webp" alt="" width="30" />
                              <p className="mb-0 text-body-emphasis text-truncate fs-10 mt-1 pt-1">
                                Cloud
                              </p>
                            </a>
                          </div>
                          <div className="col-4">
                            <a className="d-block bg-body-secondary-hover p-2 rounded-3 text-center text-decoration-none mb-3" href="#!">
                              <img src="/assets/img/nav-icons/slack.webp" alt="" width="30" />
                              <p className="mb-0 text-body-emphasis text-truncate fs-10 mt-1 pt-1">
                                Slack
                              </p>
                            </a>
                          </div>
                          <div className="col-4">
                            <a className="d-block bg-body-secondary-hover p-2 rounded-3 text-center text-decoration-none mb-3" href="#!">
                              <img src="/assets/img/nav-icons/gitlab.webp" alt="" width="30" />
                              <p className="mb-0 text-body-emphasis text-truncate fs-10 mt-1 pt-1">
                                Gitlab
                              </p>
                            </a>
                          </div>
                          <div className="col-4">
                            <a className="d-block bg-body-secondary-hover p-2 rounded-3 text-center text-decoration-none mb-3" href="#!">
                              <img src="/assets/img/nav-icons/bitbucket.webp" alt="" width="30" />
                              <p className="mb-0 text-body-emphasis text-truncate fs-10 mt-1 pt-1">
                                BitBucket
                              </p>
                            </a>
                          </div>
                          <div className="col-4">
                            <a className="d-block bg-body-secondary-hover p-2 rounded-3 text-center text-decoration-none mb-3" href="#!">
                              <img src="/assets/img/nav-icons/google-drive.webp" alt="" width="30" />
                              <p className="mb-0 text-body-emphasis text-truncate fs-10 mt-1 pt-1">
                                Drive
                              </p>
                            </a>
                          </div>
                          <div className="col-4">
                            <a className="d-block bg-body-secondary-hover p-2 rounded-3 text-center text-decoration-none mb-3" href="#!">
                              <img src="/assets/img/nav-icons/trello.webp" alt="" width="30" />
                              <p className="mb-0 text-body-emphasis text-truncate fs-10 mt-1 pt-1">
                                Trello
                              </p>
                            </a>
                          </div>
                          <div className="col-4">
                            <a className="d-block bg-body-secondary-hover p-2 rounded-3 text-center text-decoration-none mb-3" href="#!">
                              <img src="/assets/img/nav-icons/figma.webp" alt="" width="20" />
                              <p className="mb-0 text-body-emphasis text-truncate fs-10 mt-1 pt-1">
                                Figma
                              </p>
                            </a>
                          </div>
                          <div className="col-4">
                            <a className="d-block bg-body-secondary-hover p-2 rounded-3 text-center text-decoration-none mb-3" href="#!">
                              <img src="/assets/img/nav-icons/twitter.webp" alt="" width="30" />
                              <p className="mb-0 text-body-emphasis text-truncate fs-10 mt-1 pt-1">
                                Twitter
                              </p>
                            </a>
                          </div>
                          <div className="col-4">
                            <a className="d-block bg-body-secondary-hover p-2 rounded-3 text-center text-decoration-none mb-3" href="#!">
                              <img src="/assets/img/nav-icons/pinterest.webp" alt="" width="30" />
                              <p className="mb-0 text-body-emphasis text-truncate fs-10 mt-1 pt-1">
                                Pinterest
                              </p>
                            </a>
                          </div>
                          <div className="col-4">
                            <a className="d-block bg-body-secondary-hover p-2 rounded-3 text-center text-decoration-none mb-3" href="#!">
                              <img src="/assets/img/nav-icons/ln.webp" alt="" width="30" />
                              <p className="mb-0 text-body-emphasis text-truncate fs-10 mt-1 pt-1">
                                Linkedin
                              </p>
                            </a>
                          </div>
                          <div className="col-4">
                            <a className="d-block bg-body-secondary-hover p-2 rounded-3 text-center text-decoration-none mb-3" href="#!">
                              <img src="/assets/img/nav-icons/google-maps.webp" alt="" width="30" />
                              <p className="mb-0 text-body-emphasis text-truncate fs-10 mt-1 pt-1">
                                Maps
                              </p>
                            </a>
                          </div>
                          <div className="col-4">
                            <a className="d-block bg-body-secondary-hover p-2 rounded-3 text-center text-decoration-none mb-3" href="#!">
                              <img src="/assets/img/nav-icons/google-photos.webp" alt="" width="30" />
                              <p className="mb-0 text-body-emphasis text-truncate fs-10 mt-1 pt-1">
                                Photos
                              </p>
                            </a>
                          </div>
                          <div className="col-4">
                            <a className="d-block bg-body-secondary-hover p-2 rounded-3 text-center text-decoration-none mb-3" href="#!">
                              <img src="/assets/img/nav-icons/spotify.webp" alt="" width="30" />
                              <p className="mb-0 text-body-emphasis text-truncate fs-10 mt-1 pt-1">
                                Spotify
                              </p>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
                <li className="nav-item dropdown">
                  <a className={'nav-link lh-1 pe-0'} id="navbarDropdownUser" href="#!" role="button" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-haspopup={true} aria-expanded={false}>
                    <div className="avatar avatar-l ">
                      <img className="rounded-circle " src="/assets/img/team/40x40/57.webp" alt="" />
                    </div>
                  </a>
                  <div className="dropdown-menu dropdown-menu-end navbar-dropdown-caret py-0 dropdown-profile shadow border" aria-labelledby="navbarDropdownUser">
                    <div className="card position-relative border-0">
                      <div className="card-body p-0">
                        <div className="text-center pt-4 pb-3">
                          <div className="avatar avatar-xl ">
                            <img className="rounded-circle " src="/assets/img/team/72x72/57.webp" alt="" />
                          </div>
                          <h6 className="mt-2 text-body-emphasis" data-lhb-user="data-lhb-user">
                            Not signed in
                          </h6>
                          <p className="fs-10 text-body-tertiary mb-0" data-lhb-role="data-lhb-role">
                            —
                          </p>
                        </div>
                        <div className="mb-3 mx-3">
                          <input className="form-control form-control-sm" id="statusUpdateInput" type="text" placeholder="Update your status" />
                        </div>
                      </div>
                      <div className="overflow-auto scrollbar" style={{ height: "10rem" }}>
                        <ul className="nav d-flex flex-column mb-2 pb-1">
                          <li className="nav-item">
                            <a className={'nav-link px-3 d-block'} href="#!">
                              <span className="me-2 text-body align-bottom" data-feather="user"></span>
                              <span>
                                Profile
                              </span>
                            </a>
                          </li>
                          <li className="nav-item">
                            <a className={'nav-link px-3 d-block'} href="#!">
                              <span className="me-2 text-body align-bottom" data-feather="pie-chart"></span>
                              Dashboard
                            </a>
                          </li>
                          <li className="nav-item">
                            <a className={'nav-link px-3 d-block'} href="#!">
                              <span className="me-2 text-body align-bottom" data-feather="lock"></span>
                              Posts & Activity
                            </a>
                          </li>
                          <li className="nav-item">
                            <a className={'nav-link px-3 d-block'} href="#!">
                              <span className="me-2 text-body align-bottom" data-feather="settings"></span>
                              Settings & Privacy
                            </a>
                          </li>
                          <li className="nav-item">
                            <a className={'nav-link px-3 d-block'} href="#!">
                              <span className="me-2 text-body align-bottom" data-feather="help-circle"></span>
                              Help Center
                            </a>
                          </li>
                          <li className="nav-item">
                            <a className={'nav-link px-3 d-block'} href="#!">
                              <span className="me-2 text-body align-bottom" data-feather="globe"></span>
                              Language
                            </a>
                          </li>
                        </ul>
                      </div>
                      <div className="card-footer p-0 border-top border-translucent">
                        <ul className="nav d-flex flex-column my-3">
                          <li className="nav-item">
                            <a className={'nav-link px-3 d-block'} href="#!">
                              <span className="me-2 text-body align-bottom" data-feather="user-plus"></span>
                              Add another account
                            </a>
                          </li>
                        </ul>
                        <hr />
                        <div className="px-3">
                          <a className="btn btn-phoenix-secondary d-flex flex-center w-100 d-none" href="#!" data-lhb-signed-in="data-lhb-signed-in" data-lhb-signout="data-lhb-signout">
                            <span className="me-2" data-feather="log-out"></span>
                            Sign out
                          </a>
                          <a className="btn btn-primary d-flex flex-center w-100 d-none" href="/pages/authentication/sign-in/" data-lhb-signed-out="data-lhb-signed-out">
                            <span className="me-2" data-feather="log-in"></span>
                            Sign in
                          </a>
                        </div>
                        <div className="my-2 text-center fw-bold fs-10 text-body-quaternary">
                          <a className="text-body-quaternary me-1" href="#!">
                            Privacy policy
                          </a>
                          •
                          <a className="text-body-quaternary mx-1" href="#!">
                            Terms
                          </a>
                          •
                          <a className="text-body-quaternary ms-1" href="#!">
                            Cookies
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </nav>
          <div className={contentClass}>
        {children}
            <footer className="footer position-absolute">
              <div className="row g-0 justify-content-between align-items-center h-100">
                <div className="col-12 col-sm-auto text-center">
                  <p className="mb-0 mt-2 mt-sm-0 text-body">
                    LoveHeartBeat - A Product from RootVyana.
                  </p>
                </div>
                <div className="col-12 col-sm-auto text-center">
                  <p className="mb-0 text-body-tertiary text-opacity-85">
                    v1.24.0
                  </p>
                </div>
              </div>
            </footer>
          </div>
          <div className="modal fade" id="searchBoxModal" tabIndex={-1} aria-hidden={true} data-bs-backdrop="true" data-phoenix-modal="data-phoenix-modal" style={{ '--phoenix-backdrop-opacity': "1" } as React.CSSProperties}>
            <div className="modal-dialog">
              <div className="modal-content mt-15 rounded-pill">
                <div className="modal-body p-0">
                  <div className="search-box navbar-top-search-box" data-list={"{\"valueNames\":[\"title\"]}"} style={{ width: "auto" }}>
                    <form className="position-relative" data-bs-toggle="search" data-bs-display="static">
                      <input className="form-control search-input fuzzy-search rounded-pill form-control-lg" type="search" placeholder="Search..." aria-label="Search" />
                      <span className="fas fa-search search-box-icon"></span>
                    </form>
                    <div className="btn-close position-absolute end-0 top-50 translate-middle cursor-pointer shadow-none" data-bs-dismiss="search">
                      <button className="btn btn-link p-0" aria-label="Close"></button>
                    </div>
                    <div className="dropdown-menu border start-0 py-0 overflow-hidden w-100">
                      <div className="scrollbar-overlay" style={{ maxHeight: "30rem" }}>
                        <div className="list pb-3">
                          <h6 className="dropdown-header text-body-highlight fs-10 py-2">
                            24
                            <span className="text-body-quaternary">
                              results
                            </span>
                          </h6>
                          <hr className="my-0" />
                          <h6 className="dropdown-header text-body-highlight fs-9 border-bottom border-translucent py-2 lh-sm">
                            Recently Searched
                          </h6>
                          <div className="py-2">
                            <a className="dropdown-item" href="/undefined">
                              <div className="d-flex align-items-center">
                                <div className="fw-normal text-body-highlight title">
                                  <span className="fa-solid fa-clock-rotate-left" data-fa-transform="shrink-2"></span>
                                  Store Macbook
                                </div>
                              </div>
                            </a>
                            <a className="dropdown-item" href="/undefined">
                              <div className="d-flex align-items-center">
                                <div className="fw-normal text-body-highlight title">
                                  <span className="fa-solid fa-clock-rotate-left" data-fa-transform="shrink-2"></span>
                                  MacBook Air - 13″
                                </div>
                              </div>
                            </a>
                          </div>
                          <hr className="my-0" />
                          <h6 className="dropdown-header text-body-highlight fs-9 border-bottom border-translucent py-2 lh-sm">
                            Products
                          </h6>
                          <div className="py-2">
                            <a className="dropdown-item py-2 d-flex align-items-center" href="/undefined">
                              <div className="file-thumbnail me-2">
                                <img className="h-100 w-100 object-fit-cover rounded-3" src="/assets/img/products/60x60/3.png" alt="" />
                              </div>
                              <div className="flex-1">
                                <h6 className="mb-0 text-body-highlight title">
                                  MacBook Air - 13″
                                </h6>
                                <p className="fs-10 mb-0 d-flex text-body-tertiary">
                                  <span className="fw-medium text-body-tertiary text-opactity-85">
                                    8GB Memory - 1.6GHz - 128GB Storage
                                  </span>
                                </p>
                              </div>
                            </a>
                            <a className="dropdown-item py-2 d-flex align-items-center" href="/undefined">
                              <div className="file-thumbnail me-2">
                                <img className="img-fluid" src="/assets/img/products/60x60/3.png" alt="" />
                              </div>
                              <div className="flex-1">
                                <h6 className="mb-0 text-body-highlight title">
                                  MacBook Pro - 13″
                                </h6>
                                <p className="fs-10 mb-0 d-flex text-body-tertiary">
                                  <span className="fw-medium text-body-tertiary text-opactity-85">
                                    30 Sep at 12:30 PM
                                  </span>
                                </p>
                              </div>
                            </a>
                          </div>
                          <hr className="my-0" />
                          <h6 className="dropdown-header text-body-highlight fs-9 border-bottom border-translucent py-2 lh-sm">
                            Quick Links
                          </h6>
                          <div className="py-2">
                            <a className="dropdown-item" href="/undefined">
                              <div className="d-flex align-items-center">
                                <div className="fw-normal text-body-highlight title">
                                  <span className="fa-solid fa-link text-body" data-fa-transform="shrink-2"></span>
                                  Support MacBook House
                                </div>
                              </div>
                            </a>
                            <a className="dropdown-item" href="/undefined">
                              <div className="d-flex align-items-center">
                                <div className="fw-normal text-body-highlight title">
                                  <span className="fa-solid fa-link text-body" data-fa-transform="shrink-2"></span>
                                  Store MacBook″
                                </div>
                              </div>
                            </a>
                          </div>
                          <hr className="my-0" />
                          <h6 className="dropdown-header text-body-highlight fs-9 border-bottom border-translucent py-2 lh-sm">
                            Files
                          </h6>
                          <div className="py-2">
                            <a className="dropdown-item" href="/undefined">
                              <div className="d-flex align-items-center">
                                <div className="fw-normal text-body-highlight title">
                                  <span className="fa-solid fa-file-zipper text-body" data-fa-transform="shrink-2"></span>
                                  Library MacBook folder.rar
                                </div>
                              </div>
                            </a>
                            <a className="dropdown-item" href="/undefined">
                              <div className="d-flex align-items-center">
                                <div className="fw-normal text-body-highlight title">
                                  <span className="fa-solid fa-file-lines text-body" data-fa-transform="shrink-2"></span>
                                  Feature MacBook extensions.txt
                                </div>
                              </div>
                            </a>
                            <a className="dropdown-item" href="/undefined">
                              <div className="d-flex align-items-center">
                                <div className="fw-normal text-body-highlight title">
                                  <span className="fa-solid fa-image text-body" data-fa-transform="shrink-2"></span>
                                  MacBook Pro_13.jpg
                                </div>
                              </div>
                            </a>
                          </div>
                          <hr className="my-0" />
                          <h6 className="dropdown-header text-body-highlight fs-9 border-bottom border-translucent py-2 lh-sm">
                            Members
                          </h6>
                          <div className="py-2">
                            <a className="dropdown-item py-2 d-flex align-items-center" href="/undefined">
                              <div className="avatar avatar-l status-online  me-2 text-body">
                                <img className="rounded-circle " src="/assets/img/team/40x40/10.webp" alt="" />
                              </div>
                              <div className="flex-1">
                                <h6 className="mb-0 text-body-highlight title">
                                  Carry Anna
                                </h6>
                                <p className="fs-10 mb-0 d-flex text-body-tertiary">
                                  anna@technext.it
                                </p>
                              </div>
                            </a>
                            <a className="dropdown-item py-2 d-flex align-items-center" href="/undefined">
                              <div className="avatar avatar-l  me-2 text-body">
                                <img className="rounded-circle " src="/assets/img/team/40x40/12.webp" alt="" />
                              </div>
                              <div className="flex-1">
                                <h6 className="mb-0 text-body-highlight title">
                                  John Smith
                                </h6>
                                <p className="fs-10 mb-0 d-flex text-body-tertiary">
                                  smith@technext.it
                                </p>
                              </div>
                            </a>
                          </div>
                          <hr className="my-0" />
                          <h6 className="dropdown-header text-body-highlight fs-9 border-bottom border-translucent py-2 lh-sm">
                            Related Searches
                          </h6>
                          <div className="py-2">
                            <a className="dropdown-item" href="/undefined">
                              <div className="d-flex align-items-center">
                                <div className="fw-normal text-body-highlight title">
                                  <span className="fa-brands fa-firefox-browser text-body" data-fa-transform="shrink-2"></span>
                                  Search in the Web MacBook
                                </div>
                              </div>
                            </a>
                            <a className="dropdown-item" href="/undefined">
                              <div className="d-flex align-items-center">
                                <div className="fw-normal text-body-highlight title">
                                  <span className="fa-brands fa-chrome text-body" data-fa-transform="shrink-2"></span>
                                  Store MacBook″
                                </div>
                              </div>
                            </a>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="fallback fw-bold fs-7 d-none">
                            No Result Found.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="support-chat-container">
            <div className="container-fluid support-chat">
              <div className="card bg-body-emphasis">
                <div className="card-header d-flex flex-between-center px-4 py-3 border-bottom border-translucent">
                  <h5 className="mb-0 d-flex align-items-center gap-2">
                    Demo widget
                    <span className="fa-solid fa-circle text-success fs-11"></span>
                  </h5>
                  <div className="btn-reveal-trigger">
                    <button className="btn btn-link p-0 dropdown-toggle dropdown-caret-none transition-none d-flex" type="button" id="support-chat-dropdown" data-bs-toggle="dropdown" data-boundary="window" aria-haspopup={true} aria-expanded={false} data-bs-reference="parent">
                      <span className="fas fa-ellipsis-h text-body"></span>
                    </button>
                    <div className="dropdown-menu dropdown-menu-end py-2" aria-labelledby="support-chat-dropdown">
                      <a className="dropdown-item" href="#!">
                        Request a callback
                      </a>
                      <a className="dropdown-item" href="#!">
                        Search in chat
                      </a>
                      <a className="dropdown-item" href="#!">
                        Show history
                      </a>
                      <a className="dropdown-item" href="#!">
                        Report to Admin
                      </a>
                      <a className="dropdown-item btn-support-chat" href="#!">
                        Close Support
                      </a>
                    </div>
                  </div>
                </div>
                <div className="card-body chat p-0">
                  <div className="d-flex flex-column-reverse scrollbar h-100 p-3">
                    <div className="text-end mt-6">
                      <a className="mb-2 d-inline-flex align-items-center text-decoration-none text-body-emphasis bg-body-hover rounded-pill border border-primary py-2 ps-4 pe-3" href="#!">
                        <p className="mb-0 fw-semibold fs-9">
                          I need help with something
                        </p>
                        <span className="fa-solid fa-paper-plane text-primary fs-9 ms-3"></span>
                      </a>
                      <a className="mb-2 d-inline-flex align-items-center text-decoration-none text-body-emphasis bg-body-hover rounded-pill border border-primary py-2 ps-4 pe-3" href="#!">
                        <p className="mb-0 fw-semibold fs-9">
                          I can’t reorder a product I previously ordered
                        </p>
                        <span className="fa-solid fa-paper-plane text-primary fs-9 ms-3"></span>
                      </a>
                      <a className="mb-2 d-inline-flex align-items-center text-decoration-none text-body-emphasis bg-body-hover rounded-pill border border-primary py-2 ps-4 pe-3" href="#!">
                        <p className="mb-0 fw-semibold fs-9">
                          How do I place an order?
                        </p>
                        <span className="fa-solid fa-paper-plane text-primary fs-9 ms-3"></span>
                      </a>
                      <a className="false d-inline-flex align-items-center text-decoration-none text-body-emphasis bg-body-hover rounded-pill border border-primary py-2 ps-4 pe-3" href="#!">
                        <p className="mb-0 fw-semibold fs-9">
                          My payment method not working
                        </p>
                        <span className="fa-solid fa-paper-plane text-primary fs-9 ms-3"></span>
                      </a>
                    </div>
                    <div className="text-center mt-auto">
                      <div className="avatar avatar-3xl status-online">
                        <img className="rounded-circle border border-3 border-light-subtle" src="/assets/img/team/30.webp" alt="" />
                      </div>
                      <h5 className="mt-2 mb-3">
                        Eric
                      </h5>
                      <p className="text-center text-body-emphasis mb-0">
                        Ask us anything – we’ll get back to you here or by email within 24 hours.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="card-footer d-flex align-items-center gap-2 border-top border-translucent ps-3 pe-4 py-3">
                  <div className="d-flex align-items-center flex-1 gap-3 border border-translucent rounded-pill px-4">
                    <input className="form-control outline-none border-0 flex-1 fs-9 px-0" type="text" placeholder="Write message" />
                    <label className="btn btn-link d-flex p-0 text-body-quaternary fs-9 border-0" htmlFor="supportChatPhotos">
                      <span className="fa-solid fa-image"></span>
                    </label>
                    <input className="d-none" type="file" accept="image/*" id="supportChatPhotos" />
                    <label className="btn btn-link d-flex p-0 text-body-quaternary fs-9 border-0" htmlFor="supportChatAttachment">
                      <span className="fa-solid fa-paperclip"></span>
                    </label>
                    <input className="d-none" type="file" id="supportChatAttachment" />
                  </div>
                  <button className="btn p-0 border-0 send-btn">
                    <span className="fa-solid fa-paper-plane fs-9"></span>
                  </button>
                </div>
              </div>
            </div>
            <button className="btn btn-support-chat p-0 border border-translucent">
              <span className="fs-8 btn-text text-primary text-nowrap">
                Chat demo
              </span>
              <span className="ping-icon-wrapper mt-n4 ms-n6 mt-sm-0 ms-sm-2 position-absolute position-sm-relative">
                <span className="ping-icon-bg"></span>
                <span className="fa-solid fa-circle ping-icon"></span>
              </span>
              <span className="fa-solid fa-headset text-primary fs-8 d-sm-none"></span>
              <span className="fa-solid fa-chevron-down text-primary fs-7"></span>
            </button>
          </div>
        </main>
        {/* =============================================== */}
        {/* End of Main Content */}
        {/* =============================================== */}
        <div className="offcanvas offcanvas-end settings-panel border-0" id="settings-offcanvas" tabIndex={-1} aria-labelledby="settings-offcanvas">
          <div className="offcanvas-header align-items-start border-bottom flex-column border-translucent">
            <div className="pt-1 w-100 mb-6 d-flex justify-content-between align-items-start">
              <div>
                <h5 className="mb-2 me-2 lh-sm">
                  <span className="fas fa-palette me-2 fs-8"></span>
                  Theme Customizer
                </h5>
                <p className="mb-0 fs-9">
                  Explore different styles according to your preferences
                </p>
              </div>
              <button className="btn p-1 fw-bolder" type="button" data-bs-dismiss="offcanvas" aria-label="Close">
                <span className="fas fa-times fs-8"></span>
              </button>
            </div>
            <button className="btn btn-phoenix-secondary w-100" data-theme-control="reset">
              <span className="fas fa-arrows-rotate me-2 fs-10"></span>
              Reset to default
            </button>
          </div>
          <div className="offcanvas-body scrollbar px-card" id="themeController">
            <div className="setting-panel-item mt-0">
              <h5 className="setting-panel-item-title">
                Color Scheme
              </h5>
              <div className="row gx-2">
                <div className="col-4">
                  <input className="btn-check" id="themeSwitcherLight" name="theme-color" type="radio" defaultValue="light" data-theme-control="phoenixTheme" />
                  <label className="btn d-inline-block btn-navbar-style fs-9" htmlFor="themeSwitcherLight">
                    <span className="mb-2 rounded d-block">
                      <img className="img-fluid img-prototype mb-0" src="/assets/img/generic/default-light.png" alt="" />
                    </span>
                    <span className="label-text">
                      Light
                    </span>
                  </label>
                </div>
                <div className="col-4">
                  <input className="btn-check" id="themeSwitcherDark" name="theme-color" type="radio" defaultValue="dark" data-theme-control="phoenixTheme" />
                  <label className="btn d-inline-block btn-navbar-style fs-9" htmlFor="themeSwitcherDark">
                    <span className="mb-2 rounded d-block">
                      <img className="img-fluid img-prototype mb-0" src="/assets/img/generic/default-dark.png" alt="" />
                    </span>
                    <span className="label-text">
                      Dark
                    </span>
                  </label>
                </div>
                <div className="col-4">
                  <input className="btn-check" id="themeSwitcherAuto" name="theme-color" type="radio" defaultValue="auto" data-theme-control="phoenixTheme" />
                  <label className="btn d-inline-block btn-navbar-style fs-9" htmlFor="themeSwitcherAuto">
                    <span className="mb-2 rounded d-block">
                      <img className="img-fluid img-prototype mb-0" src="/assets/img/generic/auto.png" alt="" />
                    </span>
                    <span className="label-text">
                      Auto
                    </span>
                  </label>
                </div>
              </div>
            </div>
            <div className="border border-translucent rounded-3 p-4 setting-panel-item bg-body-emphasis">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="setting-panel-item-title mb-1">
                  RTL
                </h5>
                <div className="form-check form-switch mb-0">
                  <input className="form-check-input ms-auto" type="checkbox" data-theme-control="phoenixIsRTL" />
                </div>
              </div>
              <p className="mb-0 text-body-tertiary">
                Change text direction
              </p>
            </div>
            <div className="border border-translucent rounded-3 p-4 setting-panel-item bg-body-emphasis">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="setting-panel-item-title mb-1">
                  Support Chat
                </h5>
                <div className="form-check form-switch mb-0">
                  <input className="form-check-input ms-auto" type="checkbox" data-theme-control="phoenixSupportChat" />
                </div>
              </div>
              <p className="mb-0 text-body-tertiary">
                Toggle support chat
              </p>
            </div>
            <div className="setting-panel-item">
              <h5 className="setting-panel-item-title">
                Navigation Type
              </h5>
              <div className="row gx-2">
                <div className="col-6">
                  <input className="btn-check" id="navbarPositionVertical" name="navigation-type" type="radio" defaultValue="vertical" data-theme-control="phoenixNavbarPosition" data-page-url="../undefined" />
                  <label className="btn d-inline-block btn-navbar-style fs-9" htmlFor="navbarPositionVertical">
                    <span className="rounded d-block">
                      <img className="img-fluid img-prototype d-dark-none" src="/assets/img/generic/default-light.png" alt="" />
                      <img className="img-fluid img-prototype d-light-none" src="/assets/img/generic/default-dark.png" alt="" />
                    </span>
                    <span className="label-text">
                      Vertical
                    </span>
                  </label>
                </div>
                <div className="col-6">
                  <input className="btn-check" id="navbarPositionHorizontal" name="navigation-type" type="radio" defaultValue="horizontal" data-theme-control="phoenixNavbarPosition" data-page-url="../undefined" />
                  <label className="btn d-inline-block btn-navbar-style fs-9" htmlFor="navbarPositionHorizontal">
                    <span className="rounded d-block">
                      <img className="img-fluid img-prototype d-dark-none" src="/assets/img/generic/top-default.png" alt="" />
                      <img className="img-fluid img-prototype d-light-none" src="/assets/img/generic/top-default-dark.png" alt="" />
                    </span>
                    <span className="label-text">
                      Horizontal
                    </span>
                  </label>
                </div>
                <div className="col-6">
                  <input className="btn-check" id="navbarPositionCombo" name="navigation-type" type="radio" defaultValue="combo" data-theme-control="phoenixNavbarPosition" data-page-url="../undefined" />
                  <label className="btn d-inline-block btn-navbar-style fs-9" htmlFor="navbarPositionCombo">
                    <span className="rounded d-block">
                      <img className="img-fluid img-prototype d-dark-none" src="/assets/img/generic/nav-combo-light.png" alt="" />
                      <img className="img-fluid img-prototype d-light-none" src="/assets/img/generic/nav-combo-dark.png" alt="" />
                    </span>
                    <span className="label-text">
                      Combo
                    </span>
                  </label>
                </div>
                <div className="col-6">
                  <input className="btn-check" id="navbarPositionTopDouble" name="navigation-type" type="radio" defaultValue="dual-nav" data-theme-control="phoenixNavbarPosition" data-page-url="../undefined" />
                  <label className="btn d-inline-block btn-navbar-style fs-9" htmlFor="navbarPositionTopDouble">
                    <span className="rounded d-block">
                      <img className="img-fluid img-prototype d-dark-none" src="/assets/img/generic/dual-light.png" alt="" />
                      <img className="img-fluid img-prototype d-light-none" src="/assets/img/generic/dual-dark.png" alt="" />
                    </span>
                    <span className="label-text">
                      Dual nav
                    </span>
                  </label>
                </div>
              </div>
            </div>
            <div className="setting-panel-item">
              <h5 className="setting-panel-item-title">
                Vertical Navbar Appearance
              </h5>
              <div className="row gx-2">
                <div className="col-6">
                  <input className="btn-check" id="navbar-style-default" type="radio" name="config.name" defaultValue="default" data-theme-control="phoenixNavbarVerticalStyle" />
                  <label className="btn d-block w-100 btn-navbar-style fs-9" htmlFor="navbar-style-default">
                    <img className="img-fluid img-prototype d-dark-none" src="/assets/img/generic/default-light.png" alt="" />
                    <img className="img-fluid img-prototype d-light-none" src="/assets/img/generic/default-dark.png" alt="" />
                    <span className="label-text d-dark-none">
                      Default
                    </span>
                    <span className="label-text d-light-none">
                      Default
                    </span>
                  </label>
                </div>
                <div className="col-6">
                  <input className="btn-check" id="navbar-style-dark" type="radio" name="config.name" defaultValue="darker" data-theme-control="phoenixNavbarVerticalStyle" />
                  <label className="btn d-block w-100 btn-navbar-style fs-9" htmlFor="navbar-style-dark">
                    <img className="img-fluid img-prototype d-dark-none" src="/assets/img/generic/vertical-darker.png" alt="" />
                    <img className="img-fluid img-prototype d-light-none" src="/assets/img/generic/vertical-lighter.png" alt="" />
                    <span className="label-text d-dark-none">
                      Darker
                    </span>
                    <span className="label-text d-light-none">
                      Lighter
                    </span>
                  </label>
                </div>
              </div>
            </div>
            <div className="setting-panel-item">
              <h5 className="setting-panel-item-title">
                Horizontal Navbar Shape
              </h5>
              <div className="row gx-2">
                <div className="col-6">
                  <input className="btn-check" id="navbarShapeDefault" name="navbar-shape" type="radio" defaultValue="default" data-theme-control="phoenixNavbarTopShape" data-page-url="../undefined" />
                  <label className="btn d-inline-block btn-navbar-style fs-9" htmlFor="navbarShapeDefault">
                    <span className="mb-2 rounded d-block">
                      <img className="img-fluid img-prototype d-dark-none mb-0" src="/assets/img/generic/top-default.png" alt="" />
                      <img className="img-fluid img-prototype d-light-none mb-0" src="/assets/img/generic/top-default-dark.png" alt="" />
                    </span>
                    <span className="label-text">
                      Default
                    </span>
                  </label>
                </div>
                <div className="col-6">
                  <input className="btn-check" id="navbarShapeSlim" name="navbar-shape" type="radio" defaultValue="slim" data-theme-control="phoenixNavbarTopShape" data-page-url="../undefined#horizontal-navbar-slim" />
                  <label className="btn d-inline-block btn-navbar-style fs-9" htmlFor="navbarShapeSlim">
                    <span className="mb-2 rounded d-block">
                      <img className="img-fluid img-prototype d-dark-none mb-0" src="/assets/img/generic/top-slim.png" alt="" />
                      <img className="img-fluid img-prototype d-light-none mb-0" src="/assets/img/generic/top-slim-dark.png" alt="" />
                    </span>
                    <span className="label-text">
                      Slim
                    </span>
                  </label>
                </div>
              </div>
            </div>
            <div className="setting-panel-item">
              <h5 className="setting-panel-item-title">
                Horizontal Navbar Appearance
              </h5>
              <div className="row gx-2">
                <div className="col-6">
                  <input className="btn-check" id="navbarTopDefault" name="navbar-top-style" type="radio" defaultValue="default" data-theme-control="phoenixNavbarTopStyle" />
                  <label className="btn d-inline-block btn-navbar-style fs-9" htmlFor="navbarTopDefault">
                    <span className="mb-2 rounded d-block">
                      <img className="img-fluid img-prototype d-dark-none mb-0" src="/assets/img/generic/top-default.png" alt="" />
                      <img className="img-fluid img-prototype d-light-none mb-0" src="/assets/img/generic/top-style-darker.png" alt="" />
                    </span>
                    <span className="label-text">
                      Default
                    </span>
                  </label>
                </div>
                <div className="col-6">
                  <input className="btn-check" id="navbarTopDarker" name="navbar-top-style" type="radio" defaultValue="darker" data-theme-control="phoenixNavbarTopStyle" />
                  <label className="btn d-inline-block btn-navbar-style fs-9" htmlFor="navbarTopDarker">
                    <span className="mb-2 rounded d-block">
                      <img className="img-fluid img-prototype d-dark-none mb-0" src="/assets/img/generic/navbar-top-style-light.png" alt="" />
                      <img className="img-fluid img-prototype d-light-none mb-0" src="/assets/img/generic/top-style-lighter.png" alt="" />
                    </span>
                    <span className="label-text d-dark-none">
                      Darker
                    </span>
                    <span className="label-text d-light-none">
                      Lighter
                    </span>
                  </label>
                </div>
              </div>
            </div>
            <a className="bun btn-primary d-grid mb-3 text-white mt-5 btn btn-primary" href="https://themewagon.com/themes/phoenix/" target="_blank">
              Purchase template
            </a>
          </div>
        </div>
        <a className="card setting-toggle" href="#settings-offcanvas" data-bs-toggle="offcanvas">
          <div className="card-body d-flex align-items-center px-2 py-1">
            <div className="position-relative rounded-start" style={{ height: "34px", width: "28px" }}>
              <div className="settings-popover">
                <span className="ripple">
                  <span className="fa-spin position-absolute all-0 d-flex flex-center">
                    <span className="icon-spin position-absolute all-0 d-flex flex-center">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="#ffffff" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19.7369 12.3941L19.1989 12.1065C18.4459 11.7041 18.0843 10.8487 18.0843 9.99495C18.0843 9.14118 18.4459 8.28582 19.1989 7.88336L19.7369 7.59581C19.9474 7.47484 20.0316 7.23291 19.9474 7.03131C19.4842 5.57973 18.6843 4.28943 17.6738 3.20075C17.5053 3.03946 17.2527 2.99914 17.0422 3.12011L16.393 3.46714C15.6883 3.84379 14.8377 3.74529 14.1476 3.3427C14.0988 3.31422 14.0496 3.28621 14.0002 3.25868C13.2568 2.84453 12.7055 2.10629 12.7055 1.25525V0.70081C12.7055 0.499202 12.5371 0.297594 12.2845 0.257272C10.7266 -0.105622 9.16879 -0.0653007 7.69516 0.257272C7.44254 0.297594 7.31623 0.499202 7.31623 0.70081V1.23474C7.31623 2.09575 6.74999 2.8362 5.99824 3.25599C5.95774 3.27861 5.91747 3.30159 5.87744 3.32493C5.15643 3.74527 4.26453 3.85902 3.53534 3.45302L2.93743 3.12011C2.72691 2.99914 2.47429 3.03946 2.30587 3.20075C1.29538 4.28943 0.495411 5.57973 0.0322686 7.03131C-0.051939 7.23291 0.0322686 7.47484 0.242788 7.59581L0.784376 7.8853C1.54166 8.29007 1.92694 9.13627 1.92694 9.99495C1.92694 10.8536 1.54166 11.6998 0.784375 12.1046L0.242788 12.3941C0.0322686 12.515 -0.051939 12.757 0.0322686 12.9586C0.495411 14.4102 1.29538 15.7005 2.30587 16.7891C2.47429 16.9504 2.72691 16.9907 2.93743 16.8698L3.58669 16.5227C4.29133 16.1461 5.14131 16.2457 5.8331 16.6455C5.88713 16.6767 5.94159 16.7074 5.99648 16.7375C6.75162 17.1511 7.31623 17.8941 7.31623 18.7552V19.2891C7.31623 19.4425 7.41373 19.5959 7.55309 19.696C7.64066 19.7589 7.74815 19.7843 7.85406 19.8046C9.35884 20.0925 10.8609 20.0456 12.2845 19.7729C12.5371 19.6923 12.7055 19.4907 12.7055 19.2891V18.7346C12.7055 17.8836 13.2568 17.1454 14.0002 16.7312C14.0496 16.7037 14.0988 16.6757 14.1476 16.6472C14.8377 16.2446 15.6883 16.1461 16.393 16.5227L17.0422 16.8698C17.2527 16.9907 17.5053 16.9504 17.6738 16.7891C18.7264 15.7005 19.4842 14.4102 19.9895 12.9586C20.0316 12.757 19.9474 12.515 19.7369 12.3941ZM10.0109 13.2005C8.1162 13.2005 6.64257 11.7893 6.64257 9.97478C6.64257 8.20063 8.1162 6.74905 10.0109 6.74905C11.8634 6.74905 13.3792 8.20063 13.3792 9.97478C13.3792 11.7893 11.8634 13.2005 10.0109 13.2005Z" fill="#2A7BE4"></path>
                      </svg>
                    </span>
                  </span>
                </span>
              </div>
            </div>
            <small className="text-uppercase text-body-tertiary fw-bold py-2 pe-2 ps-1 rounded-end">
              customize
            </small>
          </div>
        </a>
        {/* =============================================== */}
        {/* JavaScripts */}
        {/* =============================================== */}
      <Scripts items={scripts} />
    </>
  )
}
