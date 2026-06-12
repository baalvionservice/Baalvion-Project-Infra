# 06 — Implementation Tasks & Migration Roadmap

Per-surface implementation disposition and a phased plan. Tasks: **Reuse** (lift as-is into the shell), **Refactor** (rework into the shared shell/manifest), **Merge** (fold into a global module), **Deprecate** (retire behind redirect), **Build-new**.

---

## 1. Implementation tasks by surface

| Surface | Task | Effort | Rationale |
|---------|------|--------|-----------|
| `admin-platform` shell | **Refactor** | L | Make nav registry-driven; move root → `/admin/*`; add `/admin/products/[product]/[...module]` catch-all + generic renderers. The keystone. |
| Global: Identity/Users/RBAC/Sessions/OAuth/Staff | **Reuse** | S | Already canonical; add product-scope filters. |
| Global: CMS (multi-website) | **Reuse** | M | Already multi-website; onboard each product as a website. |
| Global: Commerce | **Reuse** | M | Mature; Amarise merges in as a brand/market scope. |
| Global: Audit/Security/Payments/Billing/Notifications/Developers/Infra/Ops/Feature-Flags/AI/Media/Analytics | **Reuse** | S–M | Canonical homes exist; add product scoping + ingest product events. |
| Global: **Trust & Safety** | **Build-new** | M | New module aggregating fraud/risk/abuse from Connect/Mining/Proxy/CTM. |
| Imperialpedia: Content/Knowledge/SEO/Editorial | **Refactor** | L | Rich product slice already designed (`docs/admin-cms/prd/`); port into shell. |
| Imperialpedia: analytics/users/ai/media/audit/monetization | **Merge** | M | Into global modules (dedup). |
| Jobs: ATS + Campus | **Refactor** | L | Substantial, product-specific; manifest table/detail/board views cover most. |
| Jobs: users/roles/finance/audit/analytics | **Merge** | M | Into global modules. |
| Connect: Campaigns/Creators/Acquisition/Deals | **Refactor** | M | Product-specific; reuse table/kanban renderers. |
| Connect: finance/ai/audit/notifications/support/analytics/users | **Merge** | M | Into global modules. |
| CTM: Intelligence/Rankings/Companies/Submissions/Live | **Refactor** | M | Product-specific; **decide vs MarketUnderworld first**. |
| CTM: integrations/security/revenue/ops/users | **Merge** | M | Into global modules. |
| Law: console (`/admin/[resource]`, dashboard, insights, broadcast) | **Refactor** | S | Small; dynamic-resource pattern fits manifest renderers well. |
| Mining: Marketplace/Leads/Trade/Logistics | **Refactor** | M | Product-specific. |
| Mining: fraud/finance/ai/integrations/audit/etc. | **Merge** | M | Into global modules. |
| IR: Board/Data-room/Subscribers/Voting | **Refactor** | M | Product-specific. |
| IR: pages/navigation/data-room (CMS) | **Merge** | M | Into central CMS (website=ir). |
| Proxy: Network/Providers/Marketplace/Tenants | **Refactor** | M | SaaS-specific. |
| Proxy: finance/risk/support/feature-flags/audit | **Merge** | M | Into global modules. |
| Insiders: Dashboard/Experts/CountryCAD | **Refactor** | S | Small; merge users/revenue. |
| Amarise: commerce/finance/content/seo | **Merge** | L | Heavy overlap with central Commerce/CMS — merge as brand scope (highest dedup value, most reconciliation). |
| About: local admin | **Deprecate** | S | Already retired → central CMS. |
| Company-Unified-Dashboard | **Evaluate → Merge/Deprecate** | M | Harvest exec views into platform dashboard; retire the parallel console. |
| GTI: admin/compliance/ops surfaces | **Refactor (partial)** | M | Migrate admin surfaces; leave operator workspaces in the product app. |
| MarketUnderworld | **Build-new** | L | Spec-only; build as a product slice after CTM decision. |

---

## 2. Phased roadmap

### Phase 0 — Foundation (the keystone) · ~3–4 wks
- `platform` schema: `organizations, workspaces, products, modules, product_modules, permissions, role_assignments` (+ RLS).
- **Product manifest** contract + `admin-service /v1/registry` + `/v1/me/capabilities`.
- Refactor `admin-platform`: nav → registry feed; move console under `/admin/*`; add `/admin/products/[product]/[...module]` catch-all + generic renderers (`DataTable`, `Editor`, `Dashboard`, `KanbanBoard`, `DetailView`, `SettingsForm`, `Custom:<key>`).
- Extend `rbac-service` with product/module scope dimensions; 6-role model seeded.
- **Exit:** an empty product registered via manifest renders a working (scoped, audited) module with zero FE code.

### Phase 1 — Global module consolidation · ~4–6 wks
- Make every global module **product-aware** (scope filter) and ingest product events: Analytics, Users/Identity/RBAC, Notifications, Audit, Monetization/Finance, AI, Media, CMS (multi-website onboarding), Developers/Integrations, Support, Feature Flags. Build **Trust & Safety**.
- Cross-product **Executive Dashboard** (`dashboard-service` aggregation).
- **Exit:** the 12 duplicate domains have a single canonical, product-scoped home (`03-duplicates-consolidation.md`).

### Phase 2 — Product-by-product migration · ~8–12 wks (parallelizable)
Order by value/leverage: **Imperialpedia** (deep slice ready) → **Jobs** → **Connect** → **Law** (small, validates manifest) → **CTM** → **Mining** → **IR** → **Proxy** → **Insiders** → **Amarise** (commerce merge) → **GTI** (partial).
- Per product: register manifest, port product-specific modules, wire global modules (scoped), install cross-domain redirects (`04`), dual-run behind a flag, validate, cut over.
- **Exit:** each product's admin lives in the unified console; old admin behind redirects.

### Phase 3 — Decommission · ~2–3 wks
- After redirect-hit volume → ~0 per product, remove the per-app admin trees (keep public storefronts). About first (already retired). Evaluate & retire Company-Unified-Dashboard.
- **Exit:** one admin console; product repos carry no admin code.

### Phase 4 — MarketUnderworld + harden for 100M · ~4–6 wks
- Build MarketUnderworld product slice from spec (post-CTM decision); 2FA-gated, pervasive audit.
- Scale hardening: edge cache for read-heavy admin lists, read replicas, partition audit/analytics, k8s autoscale, load + chaos tests, DR drill, security review, SLOs.
- **Exit:** unified admin meets platform SLOs under load.

---

## 3. Risks & mitigations

| Risk | Mitigation |
|------|-----------|
| **MarketUnderworld vs CTM ambiguity** | Resolve before Phase 2 CTM/Phase 4 (decision below). Avoid building two market consoles. |
| Manifest renderers don't cover a bespoke screen | `Custom:<key>` lazy components escape-hatch; target ~80% declarative, 20% custom. |
| Big-bang cutover breaks editors | Dual-run + per-product feature flag + redirects; never remove old admin until hits ≈ 0. |
| Product-scope RBAC leak (cross-product IDOR) | `rbac-service` deny-overrides + RLS + adversarial authz tests per product at cutover. |
| Auth disruption | None expected — shared `auth-service` + `baalvion_refresh` on `.baalvion.com` keeps sessions valid across redirect. |
| Amarise/commerce merge complexity | Highest-effort merge; schedule late in Phase 2 with dedicated commerce review. |
| Company-Unified-Dashboard overlap | Decide merge-vs-keep early; don't migrate into it and the platform admin both. |

---

## 4. Deliverables index (this folder)

`00-MIGRATION-PRD.md` (master) · `01-module-inventory.md` · `02-platform-architecture.md` · `03-duplicates-consolidation.md` · `04-route-migration-and-redirects.md` · `05-unified-structure-and-sidebar.md` · `06-implementation-tasks-roadmap.md` (this file). Imperialpedia product slice: `Frontend/Imperialpedia-main/docs/admin-cms/prd/`.
