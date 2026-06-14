# Baalvion Group — Enterprise Digital Ecosystem Architecture

**Stance:** Hybrid / endorsed house. One master brand (`baalvion.com`), Baalvion-branded products on `*.baalvion.com`, and independent verticals on their own apex domains with light "A Baalvion company" endorsement. This consolidates — it does not duplicate.

---

## 1. Corporate Architecture

Three concentric tiers. Each app belongs to **exactly one** tier — this is the rule that prevents front-door overlap.

```
┌─────────────────────────────────────────────────────────────────────┐
│ TIER 1 — CORPORATE LAYER  ("Who Baalvion is")                         │
│   baalvion.com (apex)         → identity + portfolio navigation hub   │
│   about.baalvion.com          → corporate depth/authority content     │
│   ir.baalvion.com             → investor relations (group-level)      │
│   baalviongroup.com           → RESERVED, 301 → apex (do not build)   │
└───────────────────────────────┬───────────────────────────────────────┘
                                 │ governs · endorses · SSO-anchors
        ┌────────────────────────┼────────────────────────────┐
        ▼                                                       ▼
┌──────────────────────────────────┐         ┌──────────────────────────────────┐
│ TIER 2 — PORTFOLIO / PRODUCT      │         │ TIER 3 — INDEPENDENT BRANDS       │
│ (Baalvion-branded, *.baalvion.com)│         │ (own apex domains, standalone     │
│                                   │         │  equity, parent-endorsed)         │
│  trade.baalvion.com   (flagship)  │         │  controlthemarket.com    (CTM)    │
│  mining.baalvion.com              │         │  amarisemaisonavenue.com          │
│  jobs.baalvion.com                │         │  lawelitenetwork.com              │
│  invest.baalvion.com  (founders)  │         │  imperialpedia.com    (knowledge) │
│  insiders.baalvion.com            │         │  proxy.baalvion.com   (BaalvionStack)│
│  app.baalvion.com     (dashboards)│         │                                   │
│  connect.baalvion.com (brand hub) │         │                                   │
│  admin.baalvion.com   (internal)  │         │                                   │
└──────────────────────────────────┘         └──────────────────────────────────┘
```

**Role of `baalvion.com` (master corporate identity):**
- The single canonical front door. Concise, high-signal — establishes who Baalvion is and routes to the portfolio.
- It **does not host a product**. (Current conflict to fix: the Trade repo declares `SITE_URL=trade.baalvion.com` — correct; but the apex is presently unowned by any built site. The corporate apex must be served by `about-baalvion-main` content or a thin apex shell, *not* by the Trade app.)
- It is the **trust + SSO anchor**: identity issuer origin, the canonical `Organization`/brand-portfolio JSON-LD, and the parent endorsement source for Tier-3 brands.

**Tier decision rules (locked logic):**
1. Corporate = the company talking about itself. Never a product surface.
2. Portfolio = a Baalvion-branded *product*, lives on a `*.baalvion.com` subdomain.
3. Independent brand = has its own market equity and apex domain; gets endorsement, not absorption. Avoid over-fragmenting corporate identity by **never** giving a Tier-2 product its own apex domain.

---

## 2. Domain Structure (canonical map, no overlaps)

| Domain | Tier | Backing app (Frontend/) | Backing service(s) | Front-door owner |
|---|---|---|---|---|
| `baalvion.com` | Corporate | about-baalvion-main (apex shell) | about-service, cms-service | **Apex identity** |
| `about.baalvion.com` | Corporate | about-baalvion-main | about-service, cms-service | Corporate depth |
| `ir.baalvion.com` | Corporate | IR-Baalvion-main | ir-service | Investor relations |
| `trade.baalvion.com` | Product | Global-Trade-Infrastructure-main | trade-service + GTOS + Java finance suite | Flagship product |
| `mining.baalvion.com` | Product | Mining.Baalvion-main | mining-service | Product |
| `jobs.baalvion.com` | Product | Baalvion-Jobs-Portal-main | jobs-service | Product |
| `invest.baalvion.com` | Product | For Invstors and Founders / investment-platform | marketplace-service | Product |
| `insiders.baalvion.com` | Product | insiders-seo | insiders-service | Sub-ecosystem |
| `app.baalvion.com` | Product | company-unified-Dashboard-main | dashboard-service | Unified dashboards |
| `connect.baalvion.com` | Product | brand-connector-main | brand-connector-service | Brand hub |
| `admin.baalvion.com` | Internal | admin-platform | admin-service | Ops console |
| `api.baalvion.com` | Infra | — (gateway) | auth-gateway (:3099) | Single API edge |
| `controlthemarket.com` | Independent | controlthemarket-main | ctm-service | Standalone brand |
| `amarisemaisonavenue.com` | Independent | AmariseMaisonAvenue-main | crm-service, cms-service | Standalone brand |
| `lawelitenetwork.com` | Independent | Law-Elite-Network-main | law-service, law-elite | Standalone brand |
| `imperialpedia.com` | Independent | Imperialpedia-main | imperialpedia-service | Knowledge brand |
| `proxy.baalvion.com` | Independent | Proxy-BaalvionStack | proxy-service + Go gateway | Infra product |

Supporting infra subdomains (no public front door, single-purpose): `files.baalvion.com` (uploads/S3), `meet.baalvion.com`, `support.baalvion.com`, `metrics.baalvion.com`, `blog.baalvion.com` → folds into `about.baalvion.com/blog` via CMS (do not stand up a separate blog app).

**Overlap resolution (the three traps):**
- **Corporate triple front door** — `baalvion.com` vs `about.baalvion.com` vs `baalviongroup.com`: apex = identity + nav; about = depth; group = reserved 301. One homepage.
- **Knowledge vs Trade** — `imperialpedia.com` stays *public knowledge*; `trade.baalvion.com` is the *operational platform*. No shared front door.
- **Dashboards** — every product's authenticated app surface routes through **one** `app.baalvion.com` unified dashboard (company-unified-Dashboard), not N per-product dashboards.

---

## 3. Frontend Architecture

**Framework reality:** 13 of 15 apps are **Next.js** (corporate, all products, dashboards, brands). 2 are **Vite** (`Proxy-BaalvionStack`, `For Invstors and Founders`).

**Rule of thumb (locked):**
- **Next.js** for anything that needs SEO, SSR, CMS-driven content, or authenticated app shells → corporate site, all product apps, all public brands, dashboards.
- **Vite SPA** only for pure authenticated internal tools with no SEO surface (the proxy/BaalvionStack console). Do not migrate these for their own sake; do not add new Vite SPAs for public surfaces.

```
 PUBLIC / SEO              AUTHENTICATED APP            INTERNAL TOOLS
 (Next SSR/SSG)            (Next, app shell)            (Vite SPA / Next)
 ─────────────            ──────────────────           ─────────────────
 about / apex             trade workspace              admin-platform
 mining (marketing)       mining ops                   Proxy-BaalvionStack
 jobs (listings)          app.baalvion.com  ◀── one    dashboard internals
 ir / imperialpedia       unified dashboard
 brand sites (CTM…)       invest deal room
        │                         │
        └── public CMS reads ─────┴── authed BFF reads (/…-bff via gateway)
```

**Navigation strategy between apps:**
- **Shared top-bar identity strip** (a small published component or CMS-driven config consumed by every app) renders the portfolio switcher and "A Baalvion company" endorsement. Single source: served from corporate CMS so links update centrally.
- **Cross-app links are plain subdomain navigations**, not client-side routing — each app is an independent deployment. SSO (below) makes the hand-off seamless.
- **Authenticated entry always lands on `app.baalvion.com`**, which scopes the user into the right product workspace by org-type/role (the existing persona-dashboard model). Public marketing pages link *into* the app; the app never re-implements marketing pages.
- **Do not deep-link across apps' internal routes.** Cross-app links target stable public routes or the dashboard entry only — internal route shapes are owned by each app.

---

## 4. Backend Architecture

Keep the **8 existing service domains** under `Backend/services/`. Do not regroup, do not split, do not merge. They are already cohesive:

```
identity/        auth-gateway · auth-service · oauth-service · rbac-service · session-service
platform/        admin-service · dashboard-service · realtime-service · tenant-service
knowledge/       cms-service · imperialpedia-service · law-service · ml-service
commerce/        commerce · ledger · market · order · payment · trade-service · financial-services-java (21-mod)
trade/  (GTOS)   network-graph · order-execution · product-registry · quality-inspection · supplier-lifecycle · trade-documentation
ecosystem/       about · agent · brand-connector · crm · ctm · insiders · ir · jobs · law-elite · mining · real-estate
infrastructure/  audit · developer · notification · proxy · realtime · report · search
marketplace/     marketplace-service
```

**Mapping to the request's groups:** `auth` → identity/. `cms` → knowledge/. `commerce` + `trade` → commerce/ + trade/ (commerce = money/ledger/finance; trade = GTOS operational engines). `mining`, `jobs`, `IR` → ecosystem/.

**API gateway structure & routing (already live — formalize it):**
The single edge is the **Node `auth-gateway` at `:3099`** (→ `api.baalvion.com`). It already implements the routing strategy: a service prefix map plus purpose-built **BFF prefixes**.

```
                      api.baalvion.com  (auth-gateway :3099)
                                 │
   ┌──────────────┬─────────────┼─────────────┬───────────────┐
   ▼              ▼             ▼             ▼               ▼
 /auth/*      /<svc>/*      /trade-bff/*   /finance-bff/*   /cms · /ir · /mining …
 identity     legacy svc    GTOS aggregate  Java finance     ecosystem services
 (RS256       (strip prefix, (UUID shipment  (high-port 13xxx  (one prefix per
  issue+      per-svc base   model)          jar suite)        ecosystem svc)
  verify)     path on target)
                                 │
                          unknown prefix → 404 (guard, never proxy to undefined)
```

Routing rules (locked, matches `routes/proxy.js`):
1. **One edge only.** No app talks to a service directly in prod; everything is `api.baalvion.com/<prefix>`.
2. **Legacy services**: gateway strips the `/<svc>` prefix; per-backend base path lives on the target.
3. **BFFs** (`/trade-bff`, `/finance-bff`) are *aggregation prefixes*, used where a frontend needs a composed/normalized shape (e.g. GTOS UUID model vs legacy numeric shape).
4. **Unknown prefix = 404.** Never proxy to an undefined target.
5. **Shared cross-cutting concerns live in `Backend/packages/`** (auth-node RS256, tenancy RLS-GUC, rbac, events, telemetry, resilience) — services consume, never re-implement.

---

## 5. Identity & Routing Model

**Single sign-on (one identity plane for the whole group):**
- **Issuer:** `identity/auth-service` issues **RS256** access tokens (locked — HS256 islands eliminated per R2). `auth-node` verifies everywhere with the published public key.
- **Session/refresh:** rotating refresh tokens on a cookie scoped to **`.baalvion.com`** → all Tier-1/Tier-2 subdomains share session transparently. TOTP MFA available.
- **Independent brands (Tier-3, different apex):** cannot share a cookie domain. They authenticate via **OAuth/OIDC** against `oauth-service` (federated SSO), so a Baalvion identity still works on `controlthemarket.com` etc., but cross-apex by redirect, not shared cookie.
- **Authorization:** multi-tenant **Organization + type + role** model. Access is decided by **org-type (10 types) + role (7)**, enforced at the gateway and re-checked in-service via `rbac` + **Postgres RLS** (tenancy GUC bridge, `FORCE ROW LEVEL SECURITY`, `baalvion_app` role). Tenant isolation is fail-closed.

**Subdomain routing strategy:**
```
*.baalvion.com  → DNS/edge → app per subdomain (independent deploy)
                              │
   browser ── cookie(.baalvion.com) ── SSO session shared across all subdomains
                              │
   app  ── XHR ──▶ api.baalvion.com (gateway) ──▶ service prefix ──▶ service
```
- Public marketing subdomains: SSR/SSG, no auth required, CMS-fed.
- App/admin subdomains: auth-gated, gateway-only data access.
- One subdomain = one app = one deploy unit. No subdomain serves two apps.

**Separation of concerns:**
- Frontend never holds business logic or talks to a DB.
- Gateway owns edge auth, routing, rate-limit, tenant-context injection.
- Services own domain logic + their own schema (schema-per-service, RLS-scoped).
- Cross-service communication via events (`packages/events`, outbox) — not direct DB reads.

---

## 6. Deployment Strategy

**Independent deploy units — one per app/service.** The monorepo (pnpm workspaces + turbo) is for shared code and coordinated CI, *not* a single deployable.

| Surface | Where | How |
|---|---|---|
| Corporate apex + about | Firebase App Hosting / Vercel (Next) | SSG/ISR, CMS-driven, deploys on content or code change |
| Product apps (trade, mining, jobs, invest, insiders) | Per-app Next deploy (Vercel/App Hosting), prod `next start` | Each ships independently; **never `next build` while a dev server is live** (.next race) |
| Independent brands (CTM, Amarisé, Law, Imperialpedia) | Per-brand deploy on own apex | Fully autonomous release cadence |
| Dashboards / admin | `app.` / `admin.` Next prod builds | Auth-gated, behind gateway |
| Vite SPAs (Proxy, Founders) | Static host / CDN (`dist/`) | Build → CDN |
| Backend services | Docker per service; pm2 in dev, containers in prod | Java finance suite runs prebuilt jars in JRE containers (high ports 13xxx) |
| Gateway | `api.baalvion.com` | Single edge, horizontally scalable |

**CI/CD grouping strategy (turbo affected-graph):**
1. **Path-scoped pipelines** — a change under `Frontend/<app>/` builds/deploys only that app; `Backend/services/<group>/<svc>/` deploys only that service. Turbo's dependency graph gates what rebuilds.
2. **Shared `packages/` change** → rebuild + test all dependents (fan-out), but deploy only what changed.
3. **Quality gates per unit:** `tsc` 0 errors + tests (80% target) + per-language reviewer before merge; tenant-isolation CI probe stays a blocking job.
4. **Independent brands** get their own pipelines — a CTM release never blocks a Trade release.
5. **Standardize package manager: pnpm** across the workspace (a known CTM CI break was npm-vs-pnpm; lock it to pnpm).

---

## 7. Final Output

### 7.1 Diagram-style structure

```
                              ┌───────────────────────────┐
                              │       baalvion.com        │  Master identity
                              │  about · ir (corporate)   │  + SSO anchor + portfolio nav
                              └─────────────┬─────────────┘
                                            │ endorses / governs / SSO
        ┌───────────────────────────────────┼───────────────────────────────────┐
        ▼ PRODUCTS (*.baalvion.com)                          ▼ INDEPENDENT BRANDS (own apex)
  trade · mining · jobs · invest                       controlthemarket.com
  insiders · app(dashboards) · connect                 amarisemaisonavenue.com
  admin (internal)                                     lawelitenetwork.com
        │                                              imperialpedia.com · proxy(BaalvionStack)
        │  cookie(.baalvion.com) SSO                          │  OIDC federated SSO
        ▼                                                     ▼
  ┌─────────────────────────── api.baalvion.com (auth-gateway :3099) ──────────────────────────┐
  │  /auth  /<svc>  /trade-bff  /finance-bff  /cms /ir /mining /jobs … │ unknown → 404          │
  └──────┬──────────┬───────────┬───────────┬───────────┬───────────┬──────────┬───────────────┘
   identity     platform    knowledge    commerce      trade      ecosystem  infrastructure
   (auth/rbac/  (admin/     (cms/imperial (ledger/pay/ (GTOS      (about/ir/ (audit/notif/
    session/     dashboard/  /law/ml)      order/trade  engines)   mining/    search/report/
    oauth)       tenant)                   /Java fin)              jobs/ctm…)  proxy)
        └──────────────── packages/ (auth-node·tenancy-RLS·rbac·events·telemetry·resilience) ───┘
                                            │
                              Postgres (schema-per-service, FORCE RLS, baalvion_app)
```

### 7.2 Final recommended domain map

```
CORPORATE   baalvion.com ............ apex identity + portfolio nav  (served by about-baalvion shell)
            about.baalvion.com ...... corporate depth / authority content
            ir.baalvion.com ......... investor relations
            baalviongroup.com ....... RESERVED → 301 baalvion.com (build only if a holding entity exists)

PRODUCT     trade.baalvion.com ...... flagship Global Trade OS
            mining.baalvion.com ..... Baalvion Mining
            jobs.baalvion.com ....... careers / jobs portal
            invest.baalvion.com ..... investors & founders marketplace
            insiders.baalvion.com ... insiders sub-ecosystem
            app.baalvion.com ........ unified authenticated dashboards (ALL products)
            connect.baalvion.com .... brand connector hub
            admin.baalvion.com ...... internal ops console
            api.baalvion.com ........ single API edge (gateway)

INDEPENDENT controlthemarket.com .... CTM (endorsed)
            amarisemaisonavenue.com . Amarisé Maison Avenue (endorsed)
            lawelitenetwork.com ..... Law Elite Network (endorsed)
            imperialpedia.com ....... knowledge platform (endorsed)
            proxy.baalvion.com ...... BaalvionStack proxy infra product

INFRA-ONLY  files · meet · support · metrics   (single-purpose, no public front door)
            blog → folds into about.baalvion.com/blog (no separate blog app)
```

### 7.3 🔒 DO NOT CHANGE — Locked Architecture

These are invariants. Changing any one re-opens a resolved conflict or a security regression.

1. **One master front door.** `baalvion.com` is corporate identity only — it never hosts a product. `baalviongroup.com` stays a 301 to apex until a real holding entity exists.
2. **One subdomain = one app = one deploy unit.** No app serves two front doors; no product gets its own apex domain.
3. **One unified dashboard.** Authenticated product surfaces converge on `app.baalvion.com` (persona/org-type scoped). Do not spawn per-product dashboards.
4. **One API edge.** Every client reaches services only through `api.baalvion.com` (auth-gateway). Direct service calls from frontends are forbidden. Unknown prefix → 404.
5. **RS256 only** for access tokens, issued by `auth-service`, verified via `auth-node`. No HS256, no per-service signing islands.
6. **SSO model:** shared `.baalvion.com` cookie for Tier-1/Tier-2; OIDC federation for Tier-3 independent apexes. Never widen the cookie scope across apex domains.
7. **Tenant isolation is fail-closed:** Postgres `FORCE ROW LEVEL SECURITY` + GUC tenant bridge + `baalvion_app` role + blocking CI probe. RLS is never disabled to "make it work."
8. **Service domains are frozen** at the 8 existing groups under `Backend/services/`. New capability extends an existing service; it does not create a parallel platform.
9. **Shared concerns live in `packages/`** (auth, tenancy, rbac, events, telemetry, resilience). Services consume them — never fork or re-implement.
10. **Independent brands keep their own apex + release cadence.** Endorsement ("A Baalvion company"), never absorption — to avoid over-fragmenting *and* over-centralizing corporate identity.
