# Baalvion Unified Platform Admin — Migration PRD

> **Type:** Enterprise SaaS platform-administration PRD + evidence-based migration report.
> **Status:** v1.0. Grounded in a direct scan of the live codebase (see Methodology). Nothing in the inventory is invented.
> **Authoring lens:** Lead Product Architect + Senior UI/UX Engineer.

## 0. TL;DR

Baalvion runs **~14 product frontends, each with its own admin panel**, plus a **central `admin-platform`** console that already exists but currently represents products as *shallow stubs*. The goal is **one unified, multi-tenant Platform Admin** that absorbs every product's admin surface behind a `Platform → Product → Module → Resource` hierarchy, with a **registry-driven** design so new products need **no admin-frontend changes**.

The single most important finding: **this is a consolidation, not a greenfield build.** The target shell (`admin-platform`), the identity backbone (`auth-service` + `baalvion_refresh` cookie, RS256), the authz PDP (`rbac-service`), the multi-website CMS (`cms-service`), audit (`audit-service`), notifications, search, and the `platform` backend domain (`admin-service`, `dashboard-service`, `tenant-service`) **already exist**. The work is to (a) make the admin shell registry-driven and multi-tenant, (b) migrate ~14 product admins into it, (c) collapse massive duplication (every app re-implements analytics, users, notifications, AI, audit, finance, settings), and (d) decommission the per-app panels behind redirects.

## 1. Methodology (how this inventory was produced)

1. Enumerated all frontends (`Frontend/*`), backend domains (`Backend/services/*`), and every `admin/` route tree via direct filesystem scan (`find`/`grep`/`read`) — **not** assumptions.
2. Read the authoritative central nav (`Frontend/admin-platform/src/lib/constants/navigation.ts`), per-app middleware (auth gating), and the existing CMS/RBAC migrations.
3. A multi-agent discovery pass was attempted; its structured-output layer partially failed (read-only agents returned prose, not schema), so the inventory below was **recovered by direct scan**. Three agent results survived and are incorporated: the central `admin-platform` inventory (70 modules), the `MarketUnderworld` spec inventory (66 modules, **spec-only**), and `About Baalvion` (confirmed **RETIRED → redirects to central**).
4. Where only route-level evidence exists (secondary apps), it is labeled as such; a per-page audit is scheduled in the roadmap rather than fabricated.

## 2. Product ↔ app ↔ service map (discovered)

| Product | Frontend (real folder) | Backend service(s) | Admin size (routes) | Migration disposition |
|---------|------------------------|--------------------|---------------------|-----------------------|
| **Platform (target shell)** | `admin-platform` (`baalvion-admin-platform`) | admin-service, dashboard-service, tenant-service, rbac-service | 70 modules | **TARGET** — reuse as the unified shell |
| **Imperialpedia** | `Imperialpedia-main` | imperialpedia-service, cms-service | ~80 | Refactor → `/admin/products/imperialpedia/*` (deep slice already designed in `Frontend/Imperialpedia-main/docs/admin-cms/prd/`) |
| **Baalvion Jobs** | `Baalvion-Jobs-Portal-main` | jobs-service | ~25 (full ATS) | Refactor → `/admin/products/jobs/*` |
| **Baalvion Connect** | `brand-connector-main` (`brand-connector-web`) | brand-connector-service | ~28 | Refactor → `/admin/products/connect/*` |
| **LawEliteNetwork** | `Law-Elite-Network-main` | law-service, ecosystem/law-elite | ~6 | Refactor → `/admin/products/law/*` |
| **ControlTheMarket (CTM)** | `controlthemarket-main` | ctm-service, market-service | ~33 | Refactor → `/admin/products/ctm/*` — **reconcile vs MarketUnderworld** |
| **MarketUnderworld** | *spec only* (removed — recover from git history) | to build | 66 (spec) | **Build-new** → `/admin/products/marketunderworld/*` (decide vs CTM first) |
| **Amarise (Commerce)** | `AmariseMaisonAvenue-main` | commerce-service, order/payment/inventory | ~30 | **Merge** commerce into central `/admin/commerce`; brand-specific bits scoped |
| **Baalvion IR** | `IR-Baalvion-main` | ir-service, cms-service | ~13 | Refactor → `/admin/products/ir/*` |
| **Mining** | `Mining.Baalvion-main` | mining-service, cms-service | ~26 | Refactor → `/admin/products/mining/*` |
| **Proxy / NetStack (SaaS)** | `Proxy-BaalvionStack` | proxy-service | ~30 | Refactor → `/admin/products/proxy/*` |
| **Insiders / Investors** | `For Invstors and Founders` + `insiders-seo` | insiders-service | ~5 | Refactor + merge insiders-seo → `/admin/products/insiders/*` |
| **About Baalvion** | `about-baalvion-main` | about-service, cms-service | 14 | **Deprecate** local admin (already retired); content via central CMS |
| **Global Trade Infra (GTI)** | `Global-Trade-Infrastructure-main` | trade-service | large ops console | Migrate operational surfaces → `/admin/products/gti/*` (mostly operational, not admin) |
| **Company Unified Dashboard** | `company-unified-Dashboard-main` | multiple | ~25 | **Evaluate → merge/deprecate** (a parallel unified-dashboard attempt; overlaps platform ops/finance/analytics) |

## 3. Headline findings & decisions needed

1. **The console already exists but products are stubs.** `navigation.ts` shows Ecosystem → *Law Elite / ControlTheMarket / Imperialpedia* as single links, and Talent → *Jobs* as one overview — yet each backing app has a 6–33-route admin. The migration = deepen those stubs into full product module trees mounted from a registry.
2. **Auth/identity is already unified** (same `auth-service`, `baalvion_refresh` cookie, RS256, `rbac-service`). Migration does **not** require re-architecting login — a major risk retired.
3. **Massive duplication** to consolidate (§ `03-duplicates-consolidation.md`): analytics, users/identity, notifications, AI, audit, finance/revenue, settings, support, media, integrations, feature-flags, fraud/trust-&-safety are each re-implemented in 4–9 apps.
4. **`cms-service` is already multi-website** → product editorial content collapses into one central CMS scoped by website; Imperialpedia keeps its rich domain editorial layer.
5. **Decisions that need your call** (see `AskUser` summary at end of chat):
   - **MarketUnderworld vs ControlTheMarket** — net-new product, rebrand of CTM, or CTM becomes a module of it? They are independent in the spec.
   - **`company-unified-Dashboard`** — fold into the Platform Admin or keep as a separate exec app?
   - **Migration scope/order** — all ~14 apps now, or the 5 named products first then the rest?

## 4. Deliverable set (this folder)

| File | Contents |
|------|----------|
| [01-module-inventory.md](./01-module-inventory.md) | Complete discovered module/category/subcategory inventory (per app, with route + service + disposition). |
| [02-platform-architecture.md](./02-platform-architecture.md) | Multi-tenant `Platform→Product→Module→Resource` model, DB schema (organizations, workspaces, products, modules, product_modules, permissions, role_assignments), 6-role RBAC, **registry-driven product manifest** (add a product with zero admin-frontend changes), cross-product executive dashboard. |
| [03-duplicates-consolidation.md](./03-duplicates-consolidation.md) | Duplicate-functionality clusters across apps + canonical home + per-instance disposition. |
| [04-route-migration-and-redirects.md](./04-route-migration-and-redirects.md) | Old→new route table (reuse %, complexity) + complete redirect map (human table + machine-readable JSON). |
| [05-unified-structure-and-sidebar.md](./05-unified-structure-and-sidebar.md) | Final IA (`Platform→Category→Subcategory→Pages→Features`) + the unified sidebar in the requested order, role-gated, with ASCII. |
| [06-implementation-tasks-roadmap.md](./06-implementation-tasks-roadmap.md) | Per-module task (reuse/refactor/merge/deprecate/build-new) + phased migration roadmap + risks. |

> The **Imperialpedia product slice** (every page, editor blocks, workflow, wireframes, RBAC matrix) is fully specified in `Frontend/Imperialpedia-main/docs/admin-cms/prd/` and is referenced rather than duplicated here.
