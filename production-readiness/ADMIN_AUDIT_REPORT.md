# Baalvion Central Admin Platform — QA / Full-Stack Audit

**Date:** 2026-06-03
**Auditor role:** QA Lead + full-stack auditor (read-only audit, no code changes)
**Scope:** `Frontend/admin-platform` (Next.js console, :3030) wired to `Backend/services/platform/admin-service` (:3021) and downstream domain services (commerce :3012, order :3013, inventory :3014, fulfillment :3016, cms :3018/3011, rbac :3055, audit :3032, notification :3031, identity auth/session/oauth).

---

## Executive Summary

The admin console is **substantially real** for the core platform and commerce domains, contradicting the older "half mock" assumption. Identity (users/orgs/sessions/audit), the full commerce vertical (stores/products/categories/inventory/orders/customers/returns/fulfillment/discounts/markets/media), CMS, RBAC, payments, and the audit center are wired to live backends with verified DB persistence (87 users, 68 orgs, 20 products, 33 orders, 120 billing transactions, 35 subscriptions, 18 CMS sites, 10 RBAC roles, 850 audit-log rows).

The **single biggest gap** is a freshly-introduced, **unwired backend regression**: four newly built admin-service modules — **analytics, developer, support, feature-flags** (plus an **AI** schema with no code) — exist on disk (controllers + services + SQL migrations, all uncommitted `??`) but are **NOT mounted in `routes/v1.js`**. Their route files' own header comments claim "Mounted under /v1/... (see routes/v1.js)", but v1.js is byte-identical to HEAD and references none of them. Every page that depends on them (Analytics, Developers, Support, Feature-Flags, AI) is therefore **Broken (404 on every call)**. Two of these clients additionally point at the wrong base URL (the proxy/infrastructure gateway, not admin-service), so they would fail even after mounting.

The Identity Center is **Partial**: roles (rbac-service) and risk-events (admin-service) are real, but api-keys / JWKS / SSO / MFA-policy / devices / token-revocation are unimplemented (`identityRoutes.js` explicitly: "reserved for future expansion"). Reviews is an explicit "Coming Soon" stub.

### Tally (16 audited capabilities)
- **Working:** 9 — Products, Categories, Inventory, Orders, Customers, Users, Roles/RBAC, CMS, Markets/Currencies
- **Partial:** 3 — Permissions (RBAC roles work; per-role grant/member counts not fetched), Notifications (DLQ + queue stats real; templates/full-log absent by design), Settings (hub + Profile real; Security/Appearance/Platform sub-pages missing)
- **Broken:** 3 — Reports/Analytics, plus Developers and Support (built-but-unmounted) — and AI
- **Missing:** 1 — Brands (no concept/page/backend), Media is Working (counted under CMS)
- **Feature-flags:** Broken (built-but-unmounted)

> Net of the headline modules: **9 Working / 3 Partial / 4 Broken (Analytics, Feature-Flags, Developers, Support) / 1 Broken (AI) / Brands Missing.**

---

## Master Table

| Feature | UI page | Backend API | DB persistence | RBAC-gated | Audit-trail | Status | Priority |
|---|---|---|---|---|---|---|---|
| Products | ✅ `commerce/products` | ✅ commerce-service `productRoutes` | ✅ `commerce.commerce_products` (20) | ✅ `requireStoreRole` | ✅ commerce | **Working** | — |
| Categories | ✅ `commerce/categories` | ✅ commerce-service `categoryRoutes` | ✅ `commerce.commerce_categories` (19) | ✅ store-role | ✅ | **Working** | — |
| Brands | ❌ none | ❌ none | ❌ none | — | — | **Missing** | P3 |
| Media | ✅ `media`, product media | ✅ cms-service `/cms/media/*` + commerce product media | ✅ `cms.cms_media_assets`, `commerce.commerce_product_media` | ✅ cms-role / content_editor | ✅ | **Working** | — |
| Inventory | ✅ `commerce/inventory`,`warehouses` | ✅ inventory-service `/inventory/stores/:id/*` | ✅ tables exist (`inventory_warehouses`=0 rows) | ✅ store_viewer/ops_manager | ✅ | **Working** | P2 (seed) |
| Orders | ✅ `commerce/orders` | ✅ order-service `orderRoutes` | ✅ `orders.orders_orders` (33) | ✅ optionalAuth + admin | ✅ | **Working** | — |
| Customers | ✅ `commerce/customers` | ✅ order-service `customerRoutes` | ✅ `orders.orders_customers` (1) | ✅ authMiddleware | ✅ | **Working** | P3 (search not wired) |
| Users | ✅ `users` | ✅ admin-service `/admin/users` | ✅ `auth.users` (87) | ✅ requireSuperAdmin | ✅ `auth.audit_logs` | **Working** | P2 (CSV export 404) |
| Roles (RBAC) | ✅ `rbac`, `identity` | ✅ rbac-service `/roles`,`/assignments` | ✅ `rbac.roles` (10), `rbac.tenants` (3) | ✅ requireScopeAdmin | ✅ `rbac.decision_logs` | **Working** | P2 (only 3 tenants) |
| Permissions | 🟡 within RBAC/Identity | 🟡 grants endpoint not called by list | ✅ `rbac.role_permissions`,`permissions` | ✅ | ✅ | **Partial** | P2 |
| CMS | ✅ `cms/*` (sites/content/media/wf/seo/members) | ✅ cms-service `/cms/*` | ✅ `cms.cms_websites` (18), `cms_contents` (67) | ✅ cms roles | ✅ `cms.cms_approval_logs` | **Working** | — |
| Settings | 🟡 `settings` hub + `settings/profile` | 🟡 profile real; no settings API | partial | n/a | n/a | **Partial** | P2 |
| Reports/Analytics | ✅ `analytics` | ❌ built but NOT mounted in v1.js + wrong base URL | ⚠️ migration unran; `admin` schema empty | (would-be superAdmin) | (planned) | **Broken** | **P1** |
| Notifications | ✅ `notifications/*` | 🟡 notification-service DLQ+queue stats only | n/a (Redis streams) | ✅ requireAdmin | n/a | **Partial** | P2 |
| Markets | ✅ `commerce/markets` | ✅ commerce-service `/commerce/markets` | config (markets.js) | public read | n/a | **Working** | — |
| Currencies | ✅ (within Markets) | ✅ same registry (FX/tax) | config + order tax cols | — | — | **Working** | — |
| Developers | ✅ `developers` | ❌ built but NOT mounted in v1.js | ⚠️ migration unran; `admin` schema empty | (would-be superAdmin) | (planned) | **Broken** | **P1** |
| Support | ✅ `support` | ❌ built but NOT mounted in v1.js | ⚠️ migration unran | (would-be superAdmin) | (planned) | **Broken** | **P1** |
| Feature-Flags | ✅ `feature-flags` | ❌ built but NOT mounted + wrong base URL | ⚠️ migration unran | (would-be superAdmin) | writes audit (planned) | **Broken** | **P1** |
| AI | ✅ `ai` | ❌ no routes/controller/service (only `005_ai.sql`) | ⚠️ migration unran; ml-service separate | — | — | **Broken** | P2 |
| Payments | ✅ `payments/*` | ✅ admin-service `/admin/payments/*` | ✅ `billing.*` (tx 120, subs 35) | ✅ requireSuperAdmin | partial | **Working** | — |
| Identity Center | ✅ `identity` | 🟡 only risk-events+roles; api-keys/jwks/sso/mfa/devices = 404 | partial | ✅ requireSuperAdmin | ✅ | **Partial** | P1/P2 |
| Audit Center | ✅ `audit-center`,`audit-logs` | ✅ audit-service `/audit` + admin `/admin/audit-logs` | ✅ `audit.events` (0), `auth.audit_logs` (850) | ✅ | WORM/hash-chain | **Working** | P2 (events=0) |
| Sessions / OAuth / Staff | ✅ `sessions`,`oauth`,`staff` | ✅ admin/session/oauth + admin-service staffRoutes | ✅ | ✅ | ✅ | **Working** | — |
| Operations (reconciliation) | ✅ `operations` | ✅ order-service reconciliation | ✅ | ✅ | ✅ | **Working** | — |

---

## API Client Routing Map (the key architecture fact)

`Frontend/admin-platform/src/lib/api/client.ts` defines multiple axios bases:

- `apiClient` → `NEXT_PUBLIC_API_URL` default `.../infrastructure/proxy/v1` (proxy gateway)
- `adminApiClient` → `.../platform/admin/v1` (admin-service :3021)
- `sessionApiClient`, `oauthApiClient`, `cmsApiClient`
- `serviceClients.{commerce:3012, orders:3013, inventory:3014, fulfillment:3016, rbac:3055, audit:3032, notifications:3031,...}` — dev = `localhost:<port>`, prod = `NEXT_PUBLIC_SERVICE_URLS` JSON map.

**Routing defect:** `analytics.ts` (`/admin/analytics/*`) and `feature-flags.ts` (`/admin/feature-flags`) use **`apiClient`** (the proxy base), not `adminApiClient`. Even if the backend routers were mounted on admin-service, these two would still hit the proxy gateway. `developers.ts` and `support.ts` correctly use `adminApiClient`, so they only need the v1.js mount fix.

---

## Per-Feature Detail (evidence)

### Working — core identity
- Users: client `src/lib/api/users.ts:45` → `adminApiClient GET /admin/users`; route `admin-service/routes/adminRoutes.js:13`; service queries `auth.users` (87 rows). Suspend/unsuspend/delete/impersonate all mapped. **CSV export is broken**: `users.ts:104` calls `/admin/users/export` but `adminRoutes.js` has no such route → 404.
- Orgs/Sessions/Audit-logs/Stats: `identity-admin.ts` → `/admin/orgs`,`/admin/sessions`,`/admin/audit-logs`,`/admin/stats`, all present in `adminRoutes.js:24-36`. `auth.audit_logs` = 850 rows; `adminService.js` writes 22 audit INSERTs.

### Working — commerce vertical
- commerce-service `routes/v1.js:18-24` mounts markets (public), stores, categories, products, collections, discounts; product media + publish/duplicate/bulk in `productRoutes.js:16-35` with `loadStoreRole`/`requireStoreRole` RBAC. order-service `routes/v1.js:13-24` mounts analytics, reconciliation, orders, customers, carts, returns. inventory-service and fulfillment-service `routes/v1.js` mount warehouses/stock/movements and zones/couriers/shipments with store-role RBAC + Zod `validate()`. Frontend clients (`commerce-products.ts`, `commerce-stores.ts`, `orders.ts`, `inventory.ts`, `commerce-markets.ts`, `product-media.ts`) target these paths exactly via `serviceClients.*`.

### Working — CMS / Payments / Audit / RBAC
- CMS: `cms-websites.ts` → cms-service `/cms/websites/*`; `cms.cms_websites`=18, `cms_contents`=67. Members/SEO/workflows/integrations pages all have query modules.
- Payments: `payments.ts` → `adminApiClient /admin/payments/*`; `paymentsRoutes.js` covers summary/transactions/subscriptions/invoices/refunds/webhooks; `paymentsService.js` queries `billing.*` (tx 120, subs 35) — real, not stub.
- Audit Center: `audit-center.ts` → audit-service `/audit`,`/audit/verify`,`/audit/export` (WORM hash-chain). NOTE `audit.events` = 0 rows (consumer not ingesting yet) — viewer works but shows empty.
- RBAC: `rbac.ts` + `identity.ts listRoles` → rbac-service `/tenants`,`/roles`,`/assignments`,`/users/:id/effective`. `rbac.roles`=10, `rbac.tenants`=3 (only 3 of the intended platform/country tenants → store-team hierarchy is sparse).

### Broken — Analytics / Developers / Support / Feature-Flags (built-but-unmounted)
- Files exist (uncommitted): `controller/{analytics,developer,featureFlags,support}Controller.js`, `service/*Service.js`, `routes/*Routes.js`, `migrations/00{1..5}_*.sql`.
- `routes/v1.js` mounts ONLY `/admin`, `/identity`, `/staff` (+ payments sub-route). It does NOT `require` any of the four new routers. `git diff HEAD routes/v1.js` = empty (unchanged from HEAD).
- Services are genuinely DB-backed (self-provisioning `admin` schema via `ensureSchema()`, audit writes to `auth.audit_logs`), but the `admin` schema currently has **zero tables** in the live DB (services have never run / migrations unran).
- Frontend pages actively query them: `analytics/page.tsx`, `developers/page.tsx:224-233`, `support/page.tsx`, `feature-flags/page.tsx` → all 404 today.
- Extra: `developers.ts:40-44` calls `/developer/rate-limits` which has no route even in `developerRoutes.js` (orphan client method).

### Broken — AI
- `ai.ts` → `adminApiClient /ai/*` (models/prompts/agents/usage/queue/vectors/sandbox). admin-service has `migrations/005_ai.sql` but **no aiRoutes/aiController/aiService** and no mount. A separate `Backend/services/knowledge/ml-service` exists but the client does not target it. `ai/page.tsx:171-176` queries all of these → 404.

### Partial
- Identity Center: `identityRoutes.js` implements only `/identity/risk-events[/:id/resolve]`. `identity.ts` also calls api-keys, jwks, sso, mfa-policy, devices, login-heatmap, token-revocation → all 404 ("reserved for future expansion"). Page uses `retry:false` and `isError` flags to degrade gracefully, so it renders but most panels are empty/error.
- Notifications: `notifications.ts` honestly maps only DLQ (`/notifications/queues/dlq`) + queue stats + retry; templates resolve to `[]` (no backend endpoint), full delivery log absent by design, `dispatch` is internalAuth-only (commented out). Functional but limited.
- Settings: `settings/page.tsx` is a static hub of 4 link cards → `/settings/{security,appearance,platform,notifications}`, but only `settings/profile` exists as a page; the other three sub-routes are dead links. Profile is real.
- Permissions: RBAC role list renders with `permissions:[]` and `memberCount:0` because the list view never calls the per-role grants/assignment-count endpoints (`identity.ts:42-43` comments). Data exists in `rbac.role_permissions`/`permissions` but isn't surfaced.

### Missing
- Brands: no page, no client, no backend route, no table. Products carry no first-class brand entity in commerce schema.

---

## Findings by Priority

### P0 (block release) — none strictly data-destructive
No CRITICAL data-loss/security defect found in this audit pass. (The newer security-hardening commit `1a0cae31` already addressed IDOR/SSRF/mass-assignment across services.) The unmounted modules fail closed (404), not open.

### P1 (must fix before the console is presentable as "complete")
1. **Wire the 4 built admin-service modules into `routes/v1.js`.** Add mounts (the route headers prescribe): `/admin/feature-flags` (before generic `/admin`), `/admin/analytics`, `/developer`, `/support`. Then run `migrations/00{1..4}_*.sql` so the `admin` schema tables exist. Without this, Analytics/Developers/Support/Feature-Flags are 100% non-functional.
2. **Fix base-URL mismatch** for Analytics + Feature-Flags clients: `analytics.ts` and `feature-flags.ts` import `apiClient` (proxy gateway) but the routes live on admin-service — switch to `adminApiClient` (or route them through the proxy and add proxy passthrough). This is independent of fix #1.
3. **Identity Center**: either implement the `/identity/*` surfaces (api-keys, jwks, sso, mfa-policy, devices, token-revocation) in admin-service or hide those panels in the UI; currently they 404 and present an empty/error console to admins.

### P2 (quality / completeness)
4. **AI page**: build admin-service AI routes/controller/service (or repoint `ai.ts` to ml-service) — `005_ai.sql` exists but no code. Until then, hide the AI nav item.
5. **Users CSV export 404**: add `GET /admin/users/export` to `adminRoutes.js` or remove the export button.
6. **Audit events = 0**: the audit-service WORM log has no events ingested; verify the Redis-Streams consumer (`baalvion:events`) is running so the Audit Center isn't empty.
7. **RBAC tenants = 3**: provision the full platform→country (US/UK/AE/IN/SG) tenant tree so store-team management reflects all 5 markets.
8. **Settings sub-pages**: create `settings/{security,appearance,platform}` pages or remove the dead link cards.
9. **Permissions surfacing**: fetch per-role grants/member counts in the RBAC list view (endpoints exist).
10. **Notifications templates / delivery log**: add backend endpoints if template management and full delivery history are required.
11. **Inventory empty**: `inventory.inventory_warehouses` has 0 rows — seed for demo.

### P3 (minor)
12. **Brands**: decide whether a Brands entity is in scope; if so, model it in commerce.
13. **Customers search**: the search input on `commerce/customers` is `readOnly` (non-functional) — wire it or remove.
14. **Reviews stub**: `commerce/reviews` shows "Reviews Coming Soon" though `commerce.commerce_product_reviews` exists — wire the moderation UI.
15. **Orphan client method**: `developers.ts listRateLimits` calls `/developer/rate-limits` with no backing route.

---

## Verification Notes
- DB read-only queries run against `baalvion-postgres` (db `baalvion_db`). Schemas present: auth, billing, cms, commerce, orders, inventory, fulfillment, audit, rbac, + many per-app. `admin` schema NOT present (the new modules' self-provisioning has never executed).
- `routes/v1.js` confirmed identical to `git show HEAD:...v1.js` — the new modules are uncommitted and unmounted.
- All four new module files carry header comments asserting they are mounted in v1.js; they are not. Treat those comments as aspirational, not factual.
