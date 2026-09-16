# 01 — Complete Module Inventory (discovered)

Evidence-based inventory of every admin surface found in the codebase. Routes are **real** (from `find` over each app's route tree). `Service` is the backing backend service (by app→service map + API-client config). `Disp.` = migration disposition (reuse / refactor / merge / deprecate / build-new). Items marked **(spec)** were found only in spec docs.

Legend for **Migrate?**: `target` = already in the unified console · `yes` = migrate · `merge` = fold into a global module · `deprecate` = retire.

---

## A. Platform (central `admin-platform`) — the TARGET (already consolidated)

Source: `Frontend/admin-platform/src/app/(dashboard)/*` + `src/lib/constants/navigation.ts`. API clients: `adminApiClient→admin-service:3021/v1`, `sessionApiClient→session-service:3022`, `oauthApiClient→oauth-service:3023`, `cmsApiClient→cms-service:3011/api/v1`, `rbac→rbac-service`, `audit→audit-service`, `notifications→notification-service`. Auth: `/auth-bff`→`auth-service:3001`, `baalvion_refresh` httpOnly cookie. Roles enum (`UserRole`): `super_admin, owner, admin, manager, editor, member, viewer, support, developer, analyst, finance, moderator, readonly`.

| Category | Module | Route | Service | Migrate? |
|----------|--------|-------|---------|----------|
| Overview | Dashboard | /dashboard | dashboard-service | target |
| Overview | Analytics | /analytics | dashboard-service | target |
| Identity | Identity Center (Risk/RBAC/Keys/API keys) | /identity | auth-service, rbac-service | target |
| Identity | Users | /users, /users/[id] | admin-service | target |
| Identity | Organizations | /organizations, /organizations/[id] | tenant-service | target |
| Identity | Sessions | /sessions | session-service | target |
| Identity | OAuth Clients | /oauth | oauth-service | target |
| Security | Security SOC (events/risk/blocked/compliance) | /security | auth-service, audit-service | target |
| Security | Audit Logs | /audit-logs | audit-service | target |
| Security | Audit Center (rbac/payments/security) | /audit-center | audit-service | target |
| Content | CMS (Websites/Workflows/Pages/Posts/Categories/Tags) | /cms/* | cms-service | target |
| Content | Media | /media | cms-service / media | target |
| Commerce | Team Management (Countries & Stores) | /rbac, /rbac/[country] | rbac-service, commerce-rbac | target |
| Commerce | Commerce (Products/Orders/Customers/Inventory/Warehouses/Discounts/Shipping/Returns/Analytics/Revenue/Markets/Reviews/Settings/Categories) | /commerce/* | commerce-service + order/payment/inventory | target |
| Talent | Jobs (overview stub) | /jobs | jobs-service | target (stub → deepen) |
| Ecosystem | Law Elite (stub) | /law | law-service | target (stub → deepen) |
| Ecosystem | ControlTheMarket (stub) | /ctm | ctm-service | target (stub → deepen) |
| Ecosystem | Imperialpedia (stub) | /imperialpedia | imperialpedia-service | target (stub → deepen) |
| Operations | Payments (Transactions/Subscriptions/Invoices/Webhooks) | /payments/* | payment-service, ledger-service | target |
| Operations | Billing | /billing | ledger-service | target |
| Operations | Notifications (Logs/Templates) | /notifications/* | notification-service | target |
| Operations | Support (Tickets/Macros) | /support | (support) | target |
| AI & Data | AI Operations (Models/Agents/Prompts/Queue/Vectors/Cost) | /ai | ml-service, agent-service | target |
| People | Staff (Employees/Departments/Invitations) | /staff | admin-service | target |
| Developers | Developer Platform (API Analytics/Webhooks/Changelog/SDKs/Sandbox) | /developers | developer-service | target |
| System | Infrastructure (Services/K8s/Metrics/Queues/Observability) | /infrastructure | realtime-service | target |
| System | Operations (Service Health/Queues/Reconciliation) | /operations | realtime-service, ledger-service | target |
| System | Feature Flags | /feature-flags | admin-service | target |
| System | Settings | /settings, /settings/profile | admin-service | target |

**→ ~71 pages already in the unified shell.** Global modules are mature; **product depth is the gap.**

---

## B. Imperialpedia — `Imperialpedia-main` (→ `/admin/products/imperialpedia/*`)

Real routes under `src/app/admin/*` (~80). Backed by `imperialpedia-service` + `cms-service`. Full per-page design exists in `docs/admin-cms/prd/`.

| Category | Modules (real routes) | Service | Disp. |
|----------|-----------------------|---------|-------|
| Content | content, content/new, content/[slug]/edit, categories, tags, pages, authors, creators | cms-service, imperialpedia-service | refactor |
| Knowledge | glossary | imperialpedia-service | refactor |
| SEO | seo, seo-audit | cms-service | merge→global SEO + product scope |
| Editorial | scheduler, moderation, community, compliance | cms-service | refactor |
| Media | media | media/cms | merge→global Media |
| Analytics | analytics/* (traffic, engagement, growth, top-content, top-keywords, seo, creators, moderation, …~25) | dashboard/analytics | merge→global Analytics + product scope |
| Monetization | ads, monetization, finance | ledger/payment | merge→global Monetization |
| AI | ai, ai-hub, news-ai | ml-service | merge→global AI + product tools |
| Users | authors, creators, roles | rbac-service | merge→global Identity |
| System | audit, audit-logs, access-logs, control/*, health, backup, api-hub, system-hub, feature-flags, notifications, settings, errors, global | platform/infra | merge→global modules |

---

## C. Baalvion Jobs — `Baalvion-Jobs-Portal-main` (→ `/admin/products/jobs/*`)

Real routes under `src/app/(admin)/*` (~25, full ATS). Backed by `jobs-service`.

| Category | Modules (real routes) | Disp. |
|----------|-----------------------|-------|
| ATS Core | jobs, jobs/[jobId], jobs/[jobId]/pipeline, candidates, candidates/[id], applications, interviews, offers, offers/[applicationId], withdrawals | refactor |
| Campus | campus (colleges, students, student-dashboard, placements, ai-matching, tier-dashboard, workflow, reports) | refactor |
| People | team, roles, users | merge→global Identity |
| Finance | banking, withdrawals | merge→global Monetization |
| Governance | project-governance, documents, audit-logs | merge→global Audit |
| Insights | analytics, reports | merge→global Analytics + scope |
| System | settings, dev-tools | merge→global Settings/Developers |

---

## D. Baalvion Connect — `brand-connector-main` (→ `/admin/products/connect/*`)

Real routes under `src/app/admin/*` (~28). Backed by `brand-connector-service`. Influencer/brand-deal marketplace.

| Category | Modules (real routes) | Disp. |
|----------|-----------------------|-------|
| Campaigns | campaigns, campaigns/[id], campaigns/[id]/analytics, outreach, proposals, deals, execution, execution/[id] | refactor |
| Creators | creators, creators/verify | refactor |
| Acquisition | acquisition, leads | refactor |
| Trust | fraud, disputes | merge→global Trust & Safety |
| Finance | finance, revenue, plans | merge→global Monetization |
| Content | content | merge→global CMS |
| AI/Automation | ai, automation | merge→global AI |
| Cross-cutting | analytics, audit, notifications, reports, settings, support, users | merge→global modules |

---

## E. ControlTheMarket (CTM) — `testrank-baalvion` (→ `/admin/products/ctm/*`)

Real routes under `src/app/(app)/admin/*` (~33). Backed by `ctm-service` + `market-service`. **Reconcile vs MarketUnderworld (spec).**

| Category | Modules (real routes) | Disp. |
|----------|-----------------------|-------|
| Intelligence | intelligence, rankings, companies, submissions, submissions/[id], discovery | refactor |
| Live | live-session, recordings, execution, tasks | refactor |
| Roles/Teams | roles, teams, users, analytics/roles, analytics/roles/[role] | merge→global Identity |
| Integrations | integrations, integration-logs, api-settings, webhooks, automation | merge→global Developer/Integrations |
| Ops/Health | dashboard, health, monitoring, load-handling, errors, logs, testing | merge→global Infrastructure/Ops |
| Security | security, alerts, activity | merge→global Security/Audit |
| Finance | revenue | merge→global Monetization |
| System | settings | merge→global Settings |

---

## F. Amarise (Commerce) — `AmariseMaisonAvenue-main` (commerce → central `/admin/commerce`)

Real routes under `src/app/admin/*` (~30). Backed by `commerce-service` + order/payment/inventory. **Commerce already heavily built in central `/commerce` → primary disposition = MERGE/dedup**, brand-specific bits scoped.

| Category | Modules (real routes) | Disp. |
|----------|-----------------------|-------|
| Commerce | commerce, sales, vendor, logistics, country, country/[code] | merge→global Commerce (scoped by market/brand) |
| Content/Brand | content, brand-integrity, heritage-archive, marketing, seo | merge→global CMS/SEO/Marketing |
| AI | ai, ai-control, ai-dashboard, automation | merge→global AI |
| Finance | finance, revenue | merge→global Monetization |
| Ops | operations, observability, qa, live-sessions, messaging | merge→global Ops/Infra |
| Cross-cutting | audit, audit-summary, compliance, integrations, notifications, support, super | merge→global modules |

---

## G. Mining — `Mining.Baalvion-main` (→ `/admin/products/mining/*`)

Real routes under `src/app/admin/*` (~26). Backed by `mining-service` + `cms-service`. B2B trade marketplace.

| Category | Modules (real routes) | Disp. |
|----------|-----------------------|-------|
| Marketplace | catalog, products, companies, leads, trade, logistics | refactor |
| Trust | fraud, disputes, reviews, security | merge→global Trust & Safety |
| Finance | finances, monetization | merge→global Monetization |
| Content | documents, localization | merge→global CMS |
| AI | ai | merge→global AI |
| Cross-cutting | dashboard, analytics(reports/performance), integrations, logs, marketing, notifications, profile, settings, support, users | merge→global modules |

---

## H. Baalvion IR — `IR-Baalvion-main` (→ `/admin/products/ir/*`)

Real routes under `src/app/admin/*` (~13). Backed by `ir-service` + `cms-service`.

| Category | Modules (real routes) | Disp. |
|----------|-----------------------|-------|
| IR Content | pages, navigation, board-materials, data-room, reports, review-queue | refactor (CMS-backed → central CMS scope) |
| Investor | subscribers, voting, intelligence, performance | refactor |
| Cross-cutting | dashboard, system-dashboard, notifications | merge→global modules |

---

## I. Proxy / NetStack (SaaS) — `Proxy-BaalvionStack` (→ `/admin/products/proxy/*`)

Real pages under `src/pages/admin/*` (~30, pages-router). Backed by `proxy-service`. SaaS/infra reseller console.

| Category | Modules (real routes) | Disp. |
|----------|-----------------------|-------|
| Network | NetworkMap, EdgeNetwork, Orchestration, SupplierRouting, Providers, Marketplace | refactor |
| Revenue | Finance, Payments, Revenue, Chargebacks, Plans, PricingSimulator | merge→global Monetization |
| Trust | RiskCenter, TrustSafety, AbuseMonitoring | merge→global Trust & Safety |
| Customers | Users, Tenants, CustomerHealth, CohortRetention, Tickets, WhiteLabel | merge→Identity/Support + scope |
| Ops | Dashboard, ControlRoom, SystemHealth, Intelligence, Growth, FeatureFlags, AuditLogs | merge→global modules |

---

## J. Insiders — `For Invstors and Founders` + `insiders-seo` (→ `/admin/products/insiders/*`)

Real pages under `src/pages/protocol/admin/*` (~5). Backed by `insiders-service`.

| Category | Modules (real routes) | Disp. |
|----------|-----------------------|-------|
| Core | AdminDashboard, AdminUsers, AdminRevenue, ExpertsManagement, CountryCAD | refactor (small); merge users/revenue→global |
| SEO | (insiders-seo app) | merge→global SEO |

---

## K. GTI (Global Trade Infrastructure) — `Global-Trade-Infrastructure-main` (→ `/admin/products/gti/*`)

Operational console under `src/app/(dashboard)/*` (large: agent, buyer, carriers, collaboration, company, compliance, compliance-regulatory, crisis-center, customs, deals, discovery, documents, escrow, …). Backed by `trade-service`. **Mostly operational (buyer/agent workflows), not platform-admin** — migrate the *admin/compliance/ops* surfaces; leave operator workspaces as the product app.

---

## L. About Baalvion — `about-baalvion-main` (**DEPRECATE local admin**)

Real routes under `src/app/admin/*` (14). **Already RETIRED** — `.env.local` redirects to the central console (`NEXT_PUBLIC_CMS_CONSOLE_URL`); several pages were static mockups. Content managed via central CMS (`cms-service`). Disposition: **deprecate** local admin, keep public site.

---

## M. Company Unified Dashboard — `company-unified-Dashboard-main` (**EVALUATE → merge/deprecate**)

Routes under `src/app/*`: ai, analytics, automation, businesses, compliance, corporate, countries, currencies, dashboard, employees, equity, finance, financials, kpis, marketing, marketplace, notifications, onboarding, operations, payments, portal, reports. A **parallel unified-dashboard attempt** that overlaps the Platform Admin's operations/finance/analytics/identity. Disposition: **harvest useful exec views, then merge into the Platform Admin executive dashboard and deprecate** (avoid two “unified” consoles).

---

## N. MarketUnderworld — **SPEC ONLY** (spec removed — recover from git history) (→ build-new)

66 spec'd admin modules across 4 phases (independent of CTM/market-service per the spec). Examples: auth + 2FA-gated admin, home dashboard, user management, investor list/enrichment, editorial/curation queue, duplicates, sources, lists, coupons, jobs, sectors/regions, SEO, campaigns, referrals, feature flags, API keys, cost dashboard, legal queue, reports/analytics, onboarding editor, pricing experiments, VA leaderboard, incidents, backups. Pervasive audit logging (actor/action/before/after/reason/ip/ua). Disposition: **build-new** as a product slice **after** deciding its relationship to CTM.

---

## Category inventory (distinct categories across the platform)

Overview · Identity · Security · Content/CMS · Knowledge Graph · SEO · Media · Commerce · Talent/Jobs · Monetization/Finance · Analytics · AI & Data · Notifications · Support · Trust & Safety · Developers/Integrations · Infrastructure/Ops · Audit & Compliance · People/Staff · Settings · **Products** (Imperialpedia, Jobs, Connect, Law, CTM, MarketUnderworld, IR, Mining, Proxy, Insiders, GTI, Amarise).

## Aggregate (discovered)

≈ **14 admin-bearing apps** + 1 target console; **~71 already-consolidated modules** + **~250 product-level admin routes** to migrate/merge; **~12 duplicate functional domains** (see `03`). Exact per-page counts are route-level for secondary apps (deep audit scheduled in roadmap Phase 2).
