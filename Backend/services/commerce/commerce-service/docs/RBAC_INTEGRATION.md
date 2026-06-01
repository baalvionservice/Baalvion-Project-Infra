# Commerce ⇄ RBAC Integration (Phase 1)

The RBAC service (`identity/rbac-service`, port **3055**) is the **single source of truth**
for the admin hierarchy and store-team roles. Commerce is a **Policy Enforcement Point (PEP)**:
it holds **zero** role assignments locally and resolves every store decision from RBAC.

## Why the scope chain lives in commerce

The RBAC PDP (`POST /v1/authorize`, `getUserEffective`) matches scope by **exact string +
`'*'`** — there is **no** tenant-tree expansion at decision time, and RBAC has **no concept
of a "store"**. Commerce is the only component that knows a store's `countryCode`, so it
supplies the hierarchy. For an addressed store the candidate scopes are:

```
['*' (platform), <countryCode>, <storeId>]
```

A `country_admin` grant (`scope_id = countryCode`) therefore authorizes **only** stores whose
`countryCode` matches — country isolation is automatic, not a separate check.

## Tenant model (provisioned data, not a schema change)

```
platform
 └─ country   (type=country,        external_ref = ISO-2, e.g. 'AE')
      └─ store (type=organization,  external_ref = <storeId UUID>)
```

The store tenant nesting under its country tenant is what lets RBAC's management guard
(`canManageScope`, which **does** walk the tree) authorize a **country_admin to assign
store-team roles** within their country.

## Role model

System roles (unchanged): `super_admin(400) > country_admin(300) > organization_admin(200) > end_user(100)`.

Commerce store-team roles (RBAC custom roles, `is_assignable`, scope `organization`,
assigned at `scope_id = storeId`):

| RBAC role | RBAC level | Commerce capability | Can |
|---|---|---|---|
| `store_admin` | 190 | 100 | everything in the store incl. team |
| `product_manager` | 170 | 80 | full catalogue incl. publish/delete |
| `ops_manager` | 160 | 60 | inventory / fulfilment / orders |
| `seo_manager` | 150 | 50 | SEO + product content editing |
| `store_viewer` | 110 | 20 | read-only |

"Commerce capability" is the existing 0–100 ladder that route guards
(`requireStoreRole('content_editor' | 'commerce_manager' | 'store_admin')`) compare against —
so **route files were not changed**. The mapping lives in
[`service/commerceAuthz.js`](../service/commerceAuthz.js) (`RBAC_ROLE_TO_CAPABILITY`). It is a
translation table, **not** a second store of assignments.

## Request enforcement flow (`middleware/commerceAccess.js`)

1. `authMiddleware` (RS256 via `@baalvion/auth-node`) → `req.auth`.
2. Resolve `storeId` (path param).
3. `commerceAuthz.loadStoreScope(storeId)` → `{ countryCode, organizationId, status }` (cached 5 min).
4. `rbacClient.getUserEffective(userId, callerToken)` (cached 30 s).
5. Capability = max over `['*', countryCode, storeId]` of `RBAC_ROLE_TO_CAPABILITY`; `super_admin`/level ≥ 400 short-circuits.
6. Stamp `req.storeRole` / `req.storeLevel` → `requireStoreRole(...)` unchanged.
7. **Fail-closed** on RBAC outage (`RBAC_FAIL_MODE=closed`), with a configurable
   `super_admin`-JWT break-glass (`RBAC_BREAKGLASS_SUPERADMIN`, default on).

## Service-to-service auth

- **Resolution / delegation** → commerce **forwards the caller's bearer token** so RBAC enforces
  real per-user authority (`requireScopeAdmin` / `requireTenantAdmin`).
- **System contexts** (no caller token) → optional `X-Internal-Key` service key
  (`RBAC_INTERNAL_API_KEY`, must equal rbac-service `INTERNAL_API_KEY`). Only `/authorize`
  accepts the key; provisioning needs a real super-admin token.

## What changed in Phase 1

- `middleware/commerceAccess.js` — `loadStoreRole` resolves from RBAC; `commerce_store_members`
  is no longer read. `requireStoreRole` / `STORE_ROLE_LEVEL` unchanged.
- `service/storeService.js` — `createStore` is RBAC-gated (super_admin or country_admin for the
  country), mirrors the store into RBAC, and grants the creator `store_admin`. `getStore` /
  `updateStore` / `deleteStore` no longer filter by token `orgId` (RBAC is the authority).
  Member endpoints delegate to RBAC assignments (no local writes).
- New: `service/rbacClient.js`, `service/commerceAuthz.js`, `service/rbacTenantSync.js`,
  `scripts/provisionCommerceRbac.cjs`.
- Config/env: `RBAC_*` in `config/appConfig.js` + `.env.example`.
- The `commerce_store_members` table is **retired from the authority path** (model kept; a later
  migration drops it).

## Setup / runbook

```bash
# 1. rbac-service must be seeded (platform tenant + system roles):
( cd ../../identity/rbac-service && node scripts/seed.js )

# 2. Point commerce at RBAC (in commerce-service/.env):
#    RBAC_BASE_URL=http://localhost:3055
#    RBAC_FAIL_MODE=closed

# 3. Provision commerce permissions/roles/tenants + sync existing stores (super-admin token):
RBAC_PROVISION_TOKEN="<super-admin access token>" node scripts/provisionCommerceRbac.cjs
```

### Granting the UAE country admin (example)

```bash
# Find the country_admin role id and the AE country tenant, then assign:
#   POST {RBAC}/v1/assignments
#   { "userId": "<uid>", "roleId": "<country_admin role id>", "scopeId": "AE" }
```
After this, that user manages all UAE stores and can assign `product_manager` / `seo_manager` /
`ops_manager` / `store_admin` on any UAE store — and cannot see other countries' stores.

## Phase 2 — country-scoped data enforcement (backend)

Every cross-store read is filtered at the **query level** from RBAC-derived scope; no endpoint
returns raw rows.

**Scope resolution** — `commerceAuthz.resolveAccessScope({ userId, token, jwtRoles })` derives,
from the (cached) effective grants:

| field | meaning |
|---|---|
| `unrestricted` | super_admin / platform-level commerce grant → sees ALL stores |
| `allowedCountries[]` | ISO-2 codes where the user holds a commerce-capable role at country scope |
| `allowedStoreIds[]` | store ids where the user holds a commerce-capable role at store scope |

A scope only counts when the role maps to **commerce capability > 0**, so a non-commerce role
never widens data visibility.

**Where it's applied** — the only cross-store list in this service is `GET /commerce/stores`.
`middleware/loadAccessScope` injects `req.accessScope`; `storeService.listStores` filters:

```
unrestricted        → no country/store filter (all stores)
else                → WHERE (countryCode IN allowedCountries) OR (id IN allowedStoreIds)
no countries/stores → empty page (never raw rows)
```

**Per-store lists are already scoped by Phase 1.** Products / categories / collections /
discounts / variants are reached only via `/commerce/stores/:storeId/...`, where `loadStoreRole`
authorizes the store against RBAC first — a UAE admin can't reach an India store's route at all,
and each query is `WHERE storeId = :storeId`. Defense map:

| query path | how it's scoped |
|---|---|
| `listStores` | RBAC `req.accessScope` (country + store) at the query |
| `listProducts/Categories/Collections/Discounts`, `listVariants`, `getProduct` | `loadStoreRole` gate + `WHERE storeId` |
| storefront (`/commerce/storefront/:storeId/*`) | **intentionally public**, anonymous, `WHERE storeId AND published/public` — not RBAC-scoped by design |

> **Orders** are owned by the separate `order-service` (:3013), not commerce-service. It needs the
> same Phase-1 RBAC wiring before this scope filter can be ported there — tracked as a follow-up.

**Fail policy (consistent with Phase 1):** RBAC unreachable → `RBAC_FAIL_MODE=closed` denies the
list (403); `=open` degrades to an empty result. A `super_admin` JWT break-glass resolves to
`unrestricted`. Never fail-open to raw data.

### Performance & caching

- **One RBAC call per request, at most once per 30 s per user.** `resolveAccessScope` and
  `resolveStoreCapability` both read `getUserEffective`, cached in Redis
  (`CACHE_RBAC_EFFECTIVE_TTL`, default 30 s). Scope is **derived in-process** from that cached
  payload — never a per-row or per-record RBAC call.
- Store→country context cached `CACHE_RBAC_SCOPE_TTL` (5 min); role-id lookups cached 1 h.
- **Staleness window:** a role grant/revocation takes effect within the effective-TTL (≤30 s).
  Mutations performed *through commerce* call `commerceAuthz.invalidateUser(userId)` for immediacy;
  out-of-band RBAC changes converge on TTL expiry. Tune `CACHE_RBAC_EFFECTIVE_TTL` down for tighter
  revocation latency at the cost of more RBAC calls.

## Adversarial security review (post Phase 2)

A multi-agent adversarial review (4 attack-vector lenses + completeness critic, each finding
independently verified) was run against the Phase 1+2 enforcement. Applied fixes:

| Fix | Why |
|---|---|
| `rbacClient` no longer silently falls back to the service key when a token is missing — the key is used **only** with explicit `internal: true` | closed a privilege-escalation footgun (a tokenless path could have acted as a trusted internal caller) |
| `createStore` asserts caller `token` (401) and `orgId` (400) | fail-closed identity, clean errors instead of a 500 |
| `upsertPricing` explicitly verifies the product belongs to the store | makes the cross-store isolation boundary explicit (was implicitly safe via the `storeId` filter) |
| member revocation uses `Promise.allSettled`, tolerates 404, propagates other failures | no partial revocation under concurrent admins |
| `loadStoreRole` fail-mode branch simplified | `'open'` degrades to **denied**, never to data; removed dead/confusing code |
| break-glass activations now emit an audit log (`rbac_breakglass_activation`) | SOC visibility when auth falls back to JWT-only during an RBAC outage |

**Reviewed and intentionally NOT changed** (by-design or out of scope):
- `'*'` (platform) scope is accepted for commerce-capable roles — intentional: only a super_admin
  can create a platform-scoped grant, and a platform commerce role *should* reach all stores.
- Unknown `scopeType` is silently skipped in `resolveAccessScope` — fail-safe toward **less**
  access (the RBAC schema constrains `scope_type` to the three handled values anyway).
- Route guards reference `commerce_manager`/`content_editor` as **level thresholds** (80/40), not
  role keys; `product_manager`(80)/`seo_manager`(50) satisfy them by level. Functionally correct.

**Deferred — pre-existing, NOT part of country scoping (recommended follow-up):**
- ⚠️ **`commerce_product_variants.sku` is globally UNIQUE**, not per-store/per-product. This is a
  cross-tenant concern (SKU squatting / existence enumeration via 409) that predates this work and
  requires a reviewed schema migration (drop the global constraint → add composite `(product_id, sku)`
  + scope the app-level SKU checks in `variantService.js`). Not bundled here because it is a data-model
  change needing a duplicate-SKU data check, and is unrelated to RBAC country scoping.

## Not in Phase 2 (next)

- **Phase 3** — "Country & Store Team Management" UI (:3030) calling RBAC APIs directly.
- **Phase 4** — enforcement guard tests.
- **Phase 5** — product image upload.
- **Follow-up** — per-store SKU uniqueness migration (above); port the scope filter to `order-service`.
