# @baalvion/commerce-rbac

The **single, shared commerce-domain RBAC Policy Enforcement Point (PEP)**. RBAC (`rbac-service`)
remains the source of truth for the admin hierarchy and store-team roles; this package holds the
*enforcement* logic **once** so `commerce-service`, `order-service` and `inventory-service` never
duplicate it. Plain CommonJS, no build step (like `@baalvion/auth-node`).

## Why a package

The RBAC PDP matches scope by **exact string + `'*'`** with no tenant-tree expansion at decision
time, and has no concept of a "store". The PEP owns the hierarchy: for an addressed store it
checks the scope chain `['*' (platform), countryCode, storeId]`. A `country_admin` grant
(`scope_id = countryCode`) therefore authorizes **only** stores in that country — automatic
country isolation. Services that don't own the store table (order, inventory) resolve a store's
country **from the RBAC tenant tree** (`createRbacStoreCountryResolver`), so no commerce-DB
dependency is needed.

## Wiring (per service)

```js
const {
  createRbacClient, createScopeResolver, createPep, createAuditEmitter,
  createRbacStoreCountryResolver,
} = require('@baalvion/commerce-rbac');

const rbacClient = createRbacClient({ ...config.rbac, AppError });        // inject your error class
const audit = createAuditEmitter({ service: 'order-service', redis });    // stdout + baalvion:events
const scope = createScopeResolver({ rbacClient, cache, config: config.rbac, audit, keyPrefix: 'orders' });

// store→country: order/inventory use the RBAC tenant resolver; commerce injects a DB resolver.
const resolveStoreScope = createRbacStoreCountryResolver({ rbacClient, cache });

const pep = createPep({ scope, resolveStoreScope, config: config.rbac, AppError, audit });
// → pep.loadStoreRole, pep.requireStoreRole(level), pep.loadAccessScope
```

Mount `authMiddleware` (authn) **before** `pep.loadStoreRole` (authz). `requireStoreRole` compares
against the 0–100 capability ladder (`store_viewer`=20 … `store_admin`=100).

## Guarantees

- **Fail-closed by default** (`RBAC_FAIL_MODE=closed`): an RBAC outage denies access. A narrow,
  audited `super_admin`-JWT **break-glass** prevents platform-owner lockout.
- **No silent service-key fallback**: the `X-Internal-Key` service key is used only with explicit
  `internal: true`; a missing caller token never escalates to a trusted internal call.
- **Audited**: `commerce.cross_scope_attempt` (boundary breach), `commerce.access_denied`
  (insufficient privilege), `commerce.rbac_breakglass` → stdout JSON (guaranteed) +
  best-effort `baalvion:events` Redis stream. Role changes are audited at the source
  (`rbac-service`, `rbac.role_change`).

## Test

```
npm test     # node --test tests/*.test.js  (cross-country/store isolation, role boundaries, outage)
```
