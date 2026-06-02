# tenant-service

The **White-Label / Tenant** platform — generalizes the white-label config that
lived inside `proxy-service` into a platform-wide service every app can use
(Cluster 9, *White-Label Tenant*).

- **Port:** `3043` · **Schema:** `tenant` · **Domain:** platform
- **Auth:** verify-only RS256/JWKS via `@baalvion/auth-node` (HS256 dev fallback). No second issuer.
- **Events:** emits `tenant.provisioned`, `tenant.suspended`, `tenant.domain_verified`.

## Model

- **Tenant** — the white-label unit: slug, name, status, plan, optional
  `parent_tenant_id` (reseller hierarchy), owner org/user.
- **Branding** — per tenant **per app** (`default` + per-app overrides): brand
  name, logos, color tokens, login background, custom CSS, support/email-from.
- **Domain** — a custom domain with a DNS-TXT **verification token**; `verify()`
  does a real `dns.resolveTxt` check before marking it verified (admins may
  force-verify in non-prod).
- **Entitlement** — feature flags + quotas per tenant; `check()`/`consume()` gate
  features and enforce limits atomically.

## Key flows

- **Provision** a complete white-label tenant in one call
  (`POST /v1/tenants/provision`): tenant + default branding + seed entitlements.
- **Resolve** branding by domain — the public, no-auth endpoint every frontend
  login page / app shell calls to theme itself:
  `GET /v1/resolve?domain=acme.example.com&app=login` → brand/colors/CSS (cached
  briefly in Redis). This replaces the proxy's `resolveByDomain` and works for any
  app, not just proxy.

## API (`/v1`)

| Area | Routes |
|---|---|
| Tenants | `POST /tenants`, `POST /tenants/provision`, `GET /tenants`, `GET/PATCH/DELETE /tenants/:id`, `POST /tenants/:id/status` |
| Branding | `GET/PUT /tenants/:id/branding` |
| Domains | `GET/POST /tenants/:id/domains`, `POST /tenants/:id/domains/:domainId/verify`, `.../primary`, `DELETE …` |
| Entitlements | `GET/PUT /tenants/:id/entitlements`, `GET …/:featureKey/check`, `POST …/:featureKey/consume`, `DELETE …` |
| Public | `GET /resolve?domain=&app=` *(no auth)* |

## Run locally

```bash
node index.js               # :3043 against Postgres 5432 / Redis 6379
node scripts/smoke.mjs      # provision → branding → domain verify → resolve → quotas
```
