# Baalvion Frontend Hardening Release v1.0.1

> ⚠️ **DEPRECATED — superseded by [MASTER_DEPLOYMENT_COMMANDS.md](MASTER_DEPLOYMENT_COMMANDS.md).**
> Legacy reference only — historical release notes for `v1.0.1-frontend-hardening`. Deployment
> authority is MASTER. Where this file disagrees, **MASTER wins.**

**Tag:** `v1.0.1-frontend-hardening` · **Commit:** `3f3f1b65` · **Base:** `v1.0.0-mvp` (`28761797`)
**Scope:** Frontend deployment hardening & production safeguards — **no architecture, functionality, or feature changes.**

## Summary

Production-hardening pass across the 7 MVP frontends, closing the two outstanding HIGH code issues from the v1.0.0-mvp Go/No-Go (Law-Elite wrong-domain fallback; GTI production migration wiring) and removing personal/PII data and un-guarded `localhost` fallbacks from production code paths. **33 files changed, +244 / −34.** All changed apps type-check clean; secret scan is clean.

## Changes by application

### Law-Elite-Network — fail-fast environment validation
- **New** `src/lib/env.ts` — `requireServerEnv(name, devDefault)` throws in production runtime when a required var is blank (guarded by `NEXT_PHASE` so `next build` static generation never hard-fails).
- `AUTH_SERVICE_URL` (auth BFF proxy) and `CMS_PUBLIC_URL` (CMS reader) are now **required in production**.
- Removed the wrong-domain prod fallback `https://api.baalvion.com/api/v1/knowledge/law/v1` from the API client; `NEXT_PUBLIC_API_BASE_URL` fallbacks are now dev-only (empty + fail-loud in prod) in client, sitemap, and the lawyer/category/article metadata layouts.
- Demo "testing credentials" panel on the login page is now development-only.

### Imperialpedia — privacy & localhost cleanup
- Removed personal email default `infra.baalvion@gmail.com` → configurable `NEXT_PUBLIC_CONTACT_EMAIL` (brand default `contact@imperialpedia.com`).
- Anonymized mock PII (`allenkrewzz1@gmail.com` → `deepak.kumar@example.com`).
- CMS public URLs verified and dev-guarded (fixed a port inconsistency 3011→3018); all `IMPERIALPEDIA_API`, CMS, admin-redirect, and auth-proxy `localhost` fallbacks are now dev-only (collapse to `''` in production).

### Global-Trade-Infrastructure — Prisma deployment readiness
- Verified Prisma config: `datasource.url = env("DATABASE_URL")` (no hardcoded fallback), `prisma generate` wired into `postinstall`/`build`, standalone build traces the client.
- Added production migration scripts: `prisma:deploy` (`prisma migrate deploy`) and `prisma:status`.
- `GATEWAY_PROXY_TARGET` localhost fallback dev-guarded (no localhost baked into the prod routes manifest).
- **New** `DEPLOYMENT_MIGRATION_CHECKLIST.md` — required secrets, ordered migration steps, and standalone Prisma-client verification commands.

### Proxy-BaalvionStack — security headers & PayU production routing
- Added the full production security-header set to the nginx template (the prod container serves via nginx, not `vite preview`, so the build-time CSP never applied in prod): **CSP**, **HSTS**, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-XSS-Protection.
- PayU action URL is now production-aware: prod builds default to live `secure.payu.in` instead of silently using the `test.payu.in` sandbox (still overridable via `VITE_PAYU_ACTION_URL`).
- Verified same-origin `/auth-bff` proxy path (unchanged).

### AmariseMaisonAvenue — production contact correction
- Fixed malformed footer email `info@amarisemaison@gmail.com` → `mailto:info@amarisemaisonavenue.com` (canonical brand domain).

## Verification

- **Type-check:** `tsc --noEmit` exit 0 for Law-Elite, Imperialpedia, Proxy, and GTI.
- **Secret scan (all 33 changed files):** clean — no AWS keys, Razorpay/PayU/Stripe live keys, JWT secrets, private keys, or database passwords. (Only matches: a `USER:PASS` documentation placeholder and the now-dev-gated `password123` demo string — neither is a production credential.)
- **No un-guarded production-path `localhost`** remains in the four hardened apps; remaining references are dev-guarded, fail-fast dev defaults, or comments.

## Deployment prerequisites (operator action — unchanged by this release)

This release fixes the **code**; deployment still requires wiring runtime config:
1. Supply all required `NEXT_PUBLIC_*` / `VITE_*` build args per app.
2. Law-Elite / Imperialpedia: set `AUTH_SERVICE_URL`, `CMS_PUBLIC_URL` / `NEXT_PUBLIC_CMS_PUBLIC_URL`.
3. Proxy: set `AUTH_PROXY_TARGET` / `AUTH_PROXY_HOST`; pass `VITE_PAYU_ACTION_URL=https://secure.payu.in/_payment`; if API origin ≠ `api.baalvion.com`, update the nginx CSP `connect-src`.
4. GTI: provision RDS + `DATABASE_URL`, `GATEWAY_SIGNING_SECRET` (≥32), `GATEWAY_PROXY_TARGET`; run `pnpm prisma:deploy`; verify the standalone Prisma engine per `DEPLOYMENT_MIGRATION_CHECKLIST.md`.
5. auth-service + auth-gateway live before cutover (universal hard dependency).

## Files changed (33)

```
Frontend/AmariseMaisonAvenue-main/src/components/layout/Footer.tsx
Frontend/Global-Trade-Infrastructure-main/DEPLOYMENT_MIGRATION_CHECKLIST.md   (new)
Frontend/Global-Trade-Infrastructure-main/next.config.ts
Frontend/Global-Trade-Infrastructure-main/package.json
Frontend/Imperialpedia-main/next.config.ts
Frontend/Imperialpedia-main/src/app/api/auth/register/route.ts
Frontend/Imperialpedia-main/src/app/market/MarketMovers.tsx
Frontend/Imperialpedia-main/src/app/sitemap.ts
Frontend/Imperialpedia-main/src/components/glossary/GlossaryTooltip.tsx
Frontend/Imperialpedia-main/src/config/env.ts
Frontend/Imperialpedia-main/src/lib/data/glossary.ts
Frontend/Imperialpedia-main/src/lib/data/loaders.ts
Frontend/Imperialpedia-main/src/lib/data/review-live.ts
Frontend/Imperialpedia-main/src/lib/data/term-live.ts
Frontend/Imperialpedia-main/src/lib/data/worldFeed.ts
Frontend/Imperialpedia-main/src/services/data/analytics-service.ts
Frontend/Imperialpedia-main/src/services/data/cms-public.ts
Frontend/Imperialpedia-main/src/services/data/community-service.ts
Frontend/Imperialpedia-main/src/services/data/creators-service.ts
Frontend/Imperialpedia-main/src/services/data/portfolio-service.ts
Frontend/Imperialpedia-main/src/services/data/search-service.ts
Frontend/Imperialpedia-main/src/services/mock-api/user-dashboard.ts
Frontend/Law-Elite-Network-main/src/app/api/auth/_proxy.ts
Frontend/Law-Elite-Network-main/src/app/article/[slug]/layout.tsx
Frontend/Law-Elite-Network-main/src/app/law/[categorySlug]/layout.tsx
Frontend/Law-Elite-Network-main/src/app/lawyer/[id]/page.tsx
Frontend/Law-Elite-Network-main/src/app/login/page.tsx
Frontend/Law-Elite-Network-main/src/app/sitemap.ts
Frontend/Law-Elite-Network-main/src/lib/api/client.ts
Frontend/Law-Elite-Network-main/src/lib/cms.ts
Frontend/Law-Elite-Network-main/src/lib/env.ts                                 (new)
Frontend/Proxy-BaalvionStack/nginx.conf.template
Frontend/Proxy-BaalvionStack/src/lib/gatewayCheckout.ts
```
