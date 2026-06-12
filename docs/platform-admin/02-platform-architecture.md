# 02 — Multi-Tenant Platform Admin Architecture

The engineering spec for the unified console: the hierarchy, the database, RBAC, the **registry-driven** design that lets a new product be added with **zero admin-frontend changes**, and the cross-product executive dashboard. Built on the real platform services (`admin-service`, `dashboard-service`, `tenant-service`, `rbac-service`, `audit-service`).

---

## 1. The hierarchy: Platform → Product → Module → Resource

```
PLATFORM (Baalvion)                     one console, one identity backbone (auth-service, RS256)
   │
   ├─ PRODUCT            e.g. imperialpedia, jobs, connect, law, ctm, marketunderworld, ir, mining, proxy
   │     │               a registered product with a manifest (modules, nav, services, permissions)
   │     ├─ MODULE        e.g. content, knowledge, seo, campaigns, ats, intelligence
   │     │     │          a feature area inside a product (or a GLOBAL module shared by all)
   │     │     └─ RESOURCE   e.g. article, glossary_term, candidate, campaign, redirect
   │     │                    the CRUD entity a module manages (the unit RBAC scopes to)
```

- **Global modules** (Dashboard, Identity, RBAC, Audit, Notifications, Analytics, Billing, Infrastructure, API, Search, AI, Media) are *platform-owned* and shared by every product.
- **Product modules** are *product-owned* (Imperialpedia → Content/Knowledge/SEO; CTM → Intelligence/Research/Reports; Jobs → ATS/Campus).
- A **Resource** is the authorization unit: permissions are `action` on `resource` within a `(tenant, product, module)` scope.

This maps cleanly onto what exists: `tenant-service` = tenancy, `admin-service` = console BFF, `rbac-service` = the PDP, `cms-service` multi-website = the per-product content scoping precedent.

---

## 2. Database architecture (`platform` schema, RLS-ready via `@baalvion/tenancy`)

```sql
-- An organization = a tenant. Workspaces partition an org (e.g. brand, region, business unit).
CREATE TABLE platform.organizations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          varchar(80) UNIQUE NOT NULL,
  name          varchar(200) NOT NULL,
  type          varchar(24) NOT NULL DEFAULT 'internal',   -- internal | customer | partner
  status        varchar(16) NOT NULL DEFAULT 'active',
  settings      jsonb NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE platform.workspaces (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES platform.organizations(id) ON DELETE CASCADE,
  slug          varchar(80) NOT NULL,
  name          varchar(200) NOT NULL,
  kind          varchar(24) NOT NULL DEFAULT 'general',     -- brand | region | unit | general
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, slug)
);

-- The product REGISTRY. Adding a row here (no frontend change) makes a product appear.
CREATE TABLE platform.products (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key           varchar(60) UNIQUE NOT NULL,                -- imperialpedia, jobs, ctm, marketunderworld…
  name          varchar(200) NOT NULL,
  status        varchar(16) NOT NULL DEFAULT 'active',      -- active | beta | retired
  icon          varchar(60),
  base_path     varchar(120) NOT NULL,                      -- /admin/products/<key>
  manifest      jsonb NOT NULL DEFAULT '{}',                -- ProductManifest (see §4) — drives nav + routes
  required_services jsonb NOT NULL DEFAULT '[]',            -- ["imperialpedia-service","cms-service"]
  sort_order    int NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- The MODULE catalog (global + product-defined).
CREATE TABLE platform.modules (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key           varchar(80) UNIQUE NOT NULL,                -- content, knowledge, seo, ats, intelligence, analytics(global)…
  name          varchar(200) NOT NULL,
  scope         varchar(12) NOT NULL DEFAULT 'product',     -- global | product
  category      varchar(60) NOT NULL,                       -- Content, SEO, Analytics, Identity…
  service       varchar(80),                                -- backing backend service
  resources     jsonb NOT NULL DEFAULT '[]',                -- ["article","glossary_term"] → RBAC resource types
  ui            jsonb NOT NULL DEFAULT '{}'                 -- {component, routes[], icon}
);

-- Which modules a product enables (and per-product overrides).
CREATE TABLE platform.product_modules (
  product_id    uuid NOT NULL REFERENCES platform.products(id) ON DELETE CASCADE,
  module_id     uuid NOT NULL REFERENCES platform.modules(id) ON DELETE CASCADE,
  enabled       boolean NOT NULL DEFAULT true,
  config        jsonb NOT NULL DEFAULT '{}',
  sort_order    int NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, module_id)
);

-- Permission registry: action on a resource within a module (verifies against rbac-service).
CREATE TABLE platform.permissions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key           varchar(120) UNIQUE NOT NULL,               -- content:publish, ats:offer.approve, analytics:view
  module_id     uuid REFERENCES platform.modules(id) ON DELETE CASCADE,
  resource      varchar(60),                                -- article, candidate…
  action        varchar(40) NOT NULL,                       -- read, create, update, delete, publish, approve…
  description   text
);

-- A subject's role bound to a tenant + (optional) product/module scope. THIS is the RBAC heart.
CREATE TABLE platform.role_assignments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id    bigint NOT NULL,                            -- user id (auth-service sub)
  org_id        uuid REFERENCES platform.organizations(id) ON DELETE CASCADE,
  workspace_id  uuid REFERENCES platform.workspaces(id),
  product_id    uuid REFERENCES platform.products(id),     -- NULL = platform-wide
  module_id     uuid REFERENCES platform.modules(id),      -- NULL = whole product
  role          varchar(40) NOT NULL,                       -- platform_super_admin … contributor (see §3)
  granted_by    bigint, granted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (subject_id, org_id, product_id, module_id, role)
);
CREATE INDEX role_assignments_subject ON platform.role_assignments (subject_id);
CREATE INDEX role_assignments_scope ON platform.role_assignments (org_id, product_id, module_id);
```

**Indexing/scale:** all scope lookups are covered by `role_assignments_scope`; `products`/`modules` are tiny and cache-resident (`@baalvion/cache`). RLS (`@baalvion/tenancy`) forces `org_id` isolation on every tenant-scoped table under a non-superuser DB role.

---

## 3. RBAC (6 platform roles + product/module scope)

The 6 requested roles are **rank + scope**, layered on the existing `UserRole` ladder and resolved by `rbac-service /v1/authorize` (deny-overrides):

| Role | Scope | Capability |
|------|-------|-----------|
| **Platform Super Admin** | global | Everything; break-glass; manages products registry, infra, security. Audited. |
| **Platform Admin** | global (minus break-glass) | All products + global modules; cannot edit platform security/registry-destructive ops. |
| **Product Admin** | **one product** (`product_id` scope) | Full control of *their* product's modules + product-scoped users/roles; **cannot** see other products or global infra. |
| **Editor** | product or module scope | Review/edit/approve content within scope; no publish-to-prod unless delegated; no user management. |
| **Author** | own + module scope | Create/edit own resources; submit for review; no publish. |
| **Contributor** | own (restricted) | Draft only; everything reviewed; no delete, no media delete. |

Authorization request shape (unchanged from platform convention):

```json
POST rbac-service /v1/authorize
{ "subject": 1234,
  "action": "content:publish",
  "resource": { "type": "article", "id": "…", "scope": { "org": "…", "product": "imperialpedia", "module": "content" } } }
```

**Resolution:** a user's `role_assignments` are loaded (cached), the most specific scope wins, deny-overrides apply. A **Product Admin of `jobs`** holds `product_id=jobs` → every `jobs:*` permission, but `authorize` denies any `resource.scope.product != jobs`. This is exactly how `commerce-rbac` already scopes country→store; we generalize it to product→module.

**Enforcement (defense in depth):** (1) edge middleware requires the `baalvion_refresh` session on `/admin/*` (the pattern already in every app's `middleware.ts`); (2) the admin BFF (`admin-service`) calls `rbac-service` per request; (3) the dynamic sidebar/routes are filtered by the user's capability set (`GET /v1/me/capabilities`); (4) RLS rows.

---

## 4. Registry-driven design — add a product with **zero admin-frontend changes**

The frontend renders the console **from data**, not from hardcoded routes. The current `navigation.ts` is a static array; we replace it with a registry feed.

**Product manifest** (stored in `platform.products.manifest`, served by `admin-service`):

```jsonc
{
  "key": "marketunderworld",
  "name": "MarketUnderworld",
  "icon": "TrendingUp",
  "status": "beta",
  "basePath": "/admin/products/marketunderworld",
  "requiredServices": ["marketunderworld-service"],
  "modules": [
    { "key": "intelligence", "name": "Market Intelligence", "category": "Intelligence",
      "routes": [ { "path": "", "view": "DataTable", "resource": "signal", "api": "/v1/mu/signals" },
                  { "path": "/sources", "view": "DataTable", "resource": "source", "api": "/v1/mu/sources" } ],
      "permissions": ["mu.intelligence:read", "mu.intelligence:write"] },
    { "key": "research", "name": "Research", "category": "Content", "routes": [ /* … */ ] },
    { "key": "reports", "name": "Reports", "category": "Analytics", "routes": [ /* … */ ] }
  ],
  "nav": { "group": "Products", "sortOrder": 20 }
}
```

**How a new product goes live (no FE deploy):**
1. Register the product + manifest (`POST admin-service /v1/products`) and seed permissions/modules.
2. The admin shell fetches `/v1/registry` (products + manifests + the caller's capabilities), cached 60s.
3. The **dynamic sidebar** renders Products → MarketUnderworld → its modules from the manifest, filtered by capability.
4. A **catch-all route** `/admin/products/[product]/[...module]` resolves the manifest, maps `view` to a registered renderer component (`DataTable`, `Editor`, `Dashboard`, `KanbanBoard`, `DetailView`, `SettingsForm`, `Custom:<componentKey>`), and calls the declared `api`.
5. RBAC, audit, breadcrumbs, search registration all derive from the manifest automatically.

**Renderer contract:** the shell ships a small set of **generic, manifest-driven views** (table/editor/dashboard/board/detail/form) covering ~80% of admin screens; bespoke product screens register a `Custom:<key>` component lazily. This is the mechanism that makes "unlimited products" real — most product admin is declarative; only genuinely novel UI is custom code.

---

## 5. Cross-product Executive Dashboard

A single `/admin/dashboard` aggregating **all products**, served by `dashboard-service` from per-product rollups (never live cross-product `COUNT(*)`).

| Executive metric | Source | Aggregation |
|------------------|--------|-------------|
| **Traffic across all products** | analytics rollups (per product) + ClickHouse | sum/uniq per product, with per-product breakdown + trend |
| **Revenue across all products** | `ledger-service` + payment-service + per-product monetization | settled revenue by product + stream (subs/ads/affiliate/commerce) |
| **User growth** | auth-service / identity + per-product signups | new/active users per product, retention cohorts |
| **Content production** | `cms-service` (multi-website) + imperialpedia-service | published/in-review/drafts per product/website |
| **Infrastructure health** | `realtime-service` + operations | per-service health, queues, error budgets, incidents |

**Contract:** one GraphQL `executiveSummary(range)` resolver fans out to per-product rollups, returns a `{ product, metrics{} }[]` plus platform totals, cached per `(role, range)` for 60s in `@baalvion/cache`. Field-level authz omits products/metrics the caller can't see (a Product Admin sees only their product). Layout: KPI band (platform totals) → per-product matrix (traffic/revenue/users/content/health columns) → drill-down to that product's dashboard.

---

## 6. Why this is low-risk

- **Same identity** everywhere already (`auth-service`, `baalvion_refresh`, RS256) → no auth migration.
- **`rbac-service`** already does scoped RBAC+ABAC → we add product/module scope dimensions, not a new PDP.
- **`cms-service`** is already multi-website → product content scoping is proven.
- **`admin-platform`** already renders a grouped, role-gated console → we swap its static `navigation.ts` for the registry feed and add the catch-all product route.
- **`tenant-service` + `@baalvion/tenancy`** already provide org isolation + RLS.
