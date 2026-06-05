# 05 — Unified Structure & Sidebar

The final information architecture (`Platform → Category → Subcategory → Pages → Features`) and the unified sidebar in the requested order. Every node is role-gated (rendered from the registry + the caller's capabilities). Product nodes expand into their product-specific modules from the manifest.

---

## 1. IA: Platform → Category → Subcategory → Pages → Features

```
PLATFORM: Baalvion Admin
├── Dashboard
│   └── Executive (cross-product)   · Pages: Overview · Features: KPI band, per-product matrix, drill-down
├── Organizations
│   ├── Organizations               · Pages: list, detail · Features: tenants, workspaces, settings
│   └── Workspaces                  · Pages: list · Features: brand/region/unit partitions
├── Products                        ← dynamic, registry-driven (one node per platform.products row)
│   ├── Imperialpedia
│   │   ├── Content                 · Pages: All Content, New, Edit, Categories, Tags, Authors
│   │   ├── Knowledge Graph         · Pages: Glossary Terms, Relationships, References, Entities
│   │   ├── SEO                     · Pages: Metadata, Redirects, Sitemaps, Internal Links, Broken Links
│   │   └── Editorial               · Pages: Workflow Queue, Reviews, Legal Queue, Revisions, Calendar
│   ├── MarketUnderworld (spec)     · Market Intelligence · Research · Reports
│   ├── LawEliteNetwork             · Legal Content · Directory · Research · Insights · Broadcast
│   ├── Baalvion Jobs               · ATS (Jobs/Candidates/Applications/Interviews/Offers/Pipeline) · Campus · Documents
│   ├── Baalvion Connect            · Campaigns · Creators · Acquisition · Deals · Proposals · Outreach
│   ├── ControlTheMarket            · Intelligence · Rankings · Companies · Submissions · Live Sessions
│   ├── Mining                      · Marketplace (Catalog/Products/Companies) · Leads · Trade · Logistics
│   ├── Baalvion IR                 · IR Pages · Board Materials · Data Room · Subscribers · Voting
│   ├── Proxy / NetStack            · Network (Map/Edge/Orchestration/Routing) · Providers · Marketplace · Tenants
│   ├── Insiders                    · Dashboard · Experts · Country CAD
│   └── GTI (Trade)                 · Compliance · Customs · Deals · Discovery (operational surfaces)
├── Content (Global CMS)            · Websites · Workflows · Pages · Posts · Categories · Tags  (cms-service, multi-website)
├── Knowledge Graph (Global)        · Terms · Relationships · Categories · References  (shared term/entity graph)
├── SEO (Global)                    · Metadata · Redirects · Sitemaps · Internal Linking · Broken Links
├── Media (Global)                  · Library · Uploads · Folders  (media-service, tenant-scoped)
├── Analytics (Global)              · Traffic · Engagement · Search · Revenue · Growth · Top Content (cross-product + scoped)
├── Monetization (Global)           · Payments · Subscriptions · Invoices · Billing · Ads · Affiliates · Sponsored · Payouts
├── AI (Global)                     · Models · Agents · Prompts · Queue · Vectors · Cost  (+ product AI tools)
├── Users & Roles (Global)          · Users · Staff · RBAC Roles · Sessions · OAuth · Identity Center
├── Infrastructure (Global)         · Services · Kubernetes · Metrics · Queues · Observability · Operations · Feature Flags · Developers
├── Audit & Compliance (Global)     · Audit Logs · Audit Center · Security SOC · Trust & Safety · Compliance
└── Settings (Global)               · Platform Settings · Branding · Integrations · Notifications config · Profile
```

---

## 2. The unified sidebar (requested order, role-gated)

```
┌────────────────────────────────────────┐
│  ◆ Baalvion Admin            ⌘K  🔔  ◐  │
├────────────────────────────────────────┤
│  ▣ Dashboard                            │  all roles (scoped)
│                                         │
│  ▤ Organizations                    ▸   │  super_admin, admin
│                                         │
│  ▦ Products                         ▾   │  ← dynamic from registry
│     • Imperialpedia                 ▸   │     each expands to its modules
│     • MarketUnderworld     (beta)   ▸   │     (filtered by Product Admin scope)
│     • LawEliteNetwork               ▸   │
│     • Baalvion Jobs                 ▸   │
│     • Baalvion Connect              ▸   │
│     • ControlTheMarket              ▸   │
│     • Mining · IR · Proxy · Insiders ▸  │
│     • GTI · Amarise                  ▸  │
│                                         │
│  ── Global modules ──                   │
│  ✎ Content                          ▸   │  editor+
│  ◌ Knowledge Graph                  ▸   │  editor+
│  ◎ SEO                              ▸   │  seo, editor+
│  ◳ Media                                │  editor+
│  ◷ Analytics                        ▸   │  analyst, admin, product_admin(scoped)
│  ◐ Monetization                     ▸   │  finance, admin, owner
│  ✶ AI                               ▸   │  admin, product_admin(scoped)
│  ☷ Users & Roles                    ▸   │  admin, owner, super_admin; product_admin(scoped)
│  ⚙ Infrastructure                   ▸   │  super_admin, developer
│  🛡 Audit & Compliance               ▸   │  super_admin, owner, admin
│  ⚙ Settings                             │  admin, owner, super_admin
└────────────────────────────────────────┘
```

**Behaviors:**
- **Dynamic rendering:** the whole tree is built from `GET /v1/registry` (products + manifests) ∩ the caller's capabilities. No item is hardcoded → adding a product row makes it appear (the registry-driven design from `02 §4`).
- **Role gating:** an item renders only if the user holds ≥1 permission in it (the current `navigation.ts` already does role-array gating — we extend it to capability sets + product scope). A **Product Admin** sees Dashboard, only *their* product under Products, and the global modules **scoped to their product** (e.g. Analytics pre-filtered to their product).
- **Collapse:** groups collapse to an icon rail on narrow screens; product nodes lazy-load their module list on expand.
- **Top bar:** logo · `⌘K` command palette (jump to any product/module/resource) · environment badge · notifications · create (`⊕`) · theme · avatar/role menu. Breadcrumbs reflect `Platform ▸ Product ▸ Module ▸ Resource`.
- **Two ways to reach a product surface:** via **Products → product → module** (product-centric) or via a **global module filtered by product** (function-centric, e.g. Analytics → product=jobs). Both resolve to the same scoped data; the breadcrumb differs.

---

## 3. Why this order works

The requested order front-loads the **cross-product lenses** (Dashboard, Organizations, Products) then the **functional global modules** (Content → Settings). This matches the two mental models admins use: "show me product X" (Products group) and "show me all the Y across products" (global modules). Product Admins live mostly in the Products group; Platform Admins live in the global modules. The IA supports both without duplicating screens — every global module is product-aware via scope.
