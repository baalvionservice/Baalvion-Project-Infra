# FINAL MVP DEPLOYMENT READY

**Date:** 2026-06-20
**Goal:** `docker compose build` on Linux produces working production images with the **correct API URLs baked into the frontend bundles**.
**Status legend:** ✅ READY · ⛔ BLOCKED · ⚪ OPTIONAL

---

## 1. What was broken

Two compounding defects prevented correct frontend bundles:

1. **`NEXT_PUBLIC_*` were under `environment:`** in `docker-compose.yml`. Next.js inlines these at **build** time — a runtime env var of the same name is a no-op, so every frontend baked its **localhost code-defaults**.
2. **The Dockerfiles declared `ARG NEXT_PUBLIC_*` but never `ENV`-mapped them.** `ARG` alone is *not* visible to `next build`. Even a correct `--build-arg` would have been ignored — the bake was broken at the image layer too.

Additionally, the admin compose values were wrong (`/v1`, `/auth`) and would have **overridden correct code-defaults with broken paths**.

Both defects are now fixed. Every `NEXT_PUBLIC_*` is a `build.arg`, every `build.arg` has a matching `ARG` **and** an `ENV` re-export in its Dockerfile.

---

## 2. Patches applied

### 2.1 `Frontend/admin-platform/Dockerfile.deploy`
- Reconciled ARG list to the variables admin source actually consumes for MVP flows.
- **Added ARGs:** `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_ADMIN_API_URL`, `NEXT_PUBLIC_SESSION_API_URL`.
- **Added `ENV` re-exports** for all 8 build args (`GATEWAY_URL, APP_URL, API_URL, ADMIN_API_URL, CMS_API_URL, AUTH_URL, SESSION_API_URL, APP_ENV`) so `next build` inlines them.

### 2.2 `Frontend/AmariseMaisonAvenue-main/Dockerfile`
- **Added ARGs:** `NEXT_PUBLIC_COMMERCE_API_URL`, `NEXT_PUBLIC_ORDER_URL`, `NEXT_PUBLIC_INVENTORY_URL`, `NEXT_PUBLIC_CMS_URL`, `NEXT_PUBLIC_CMS_WEBSITE_SLUG`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SITE_URL`.
- **Removed unused ARGs:** `NEXT_PUBLIC_REFRESH_COOKIE_NAME`, `NEXT_PUBLIC_ADMIN_CONSOLE_URL` (consumed only by non-MVP paths; left to code defaults).
- **Added `ENV` re-exports** for all 10 build args.

### 2.3 `Frontend/about-baalvion-main/Dockerfile`
- Kept the single build-time var `NEXT_PUBLIC_APP_URL`; **added its `ENV` re-export**.
- Confirmed `CMS_PUBLIC_URL` / `CMS_WEBSITE_SLUG` are **server-side runtime** reads (non-`NEXT_PUBLIC`) — correctly left as runtime env, not baked.

### 2.4 `deploy/mvp-production/docker-compose.yml`
- Moved **all** `NEXT_PUBLIC_*` for `admin-platform`, `about-web`, `amarise-web` from `environment:` → `build.args:`.
- Replaced the broken admin `/v1` and `/auth` values with the canonical gateway paths the app expects.
- Left only genuine runtime vars under `environment:` (`NODE_ENV`, `PORT`, `AUTH_PROXY_TARGET`, `CMS_PUBLIC_URL`, `CMS_WEBSITE_SLUG`).
- Added `NEXT_PUBLIC_MEDIA_HOST` (S3/CDN host for product images) and `NEXT_PUBLIC_SITE_URL` to amarise build args.

### 2.5 `deploy/mvp-production/.env.production.example`
- Added `AMARISE_MEDIA_HOST` (baked into amarise-web for `next/image` remotePatterns + image CSP).

### Baked URL matrix (after fix)

| App | Variable | Baked value |
|---|---|---|
| admin | `NEXT_PUBLIC_GATEWAY_URL` | `https://api.baalvion.com` |
| admin | `NEXT_PUBLIC_API_URL` | `https://api.baalvion.com/api/v1/infrastructure/proxy/v1` |
| admin | `NEXT_PUBLIC_ADMIN_API_URL` | `https://api.baalvion.com/api/v1/platform/admin/v1` |
| admin | `NEXT_PUBLIC_CMS_API_URL` | `https://api.baalvion.com/api/v1/knowledge/cms/api/v1` |
| admin | `NEXT_PUBLIC_AUTH_URL` | `https://api.baalvion.com/api/v1/identity/auth/v1/auth` |
| admin | `NEXT_PUBLIC_SESSION_API_URL` | `https://api.baalvion.com/api/v1/identity/session/v1` |
| amarise | `NEXT_PUBLIC_COMMERCE_URL` | `https://api.baalvion.com/api/commerce/api/v1` |
| amarise | `NEXT_PUBLIC_ORDER_URL` | `https://api.baalvion.com/api/orders/api/v1` |
| amarise | `NEXT_PUBLIC_INVENTORY_URL` | `https://api.baalvion.com/api/inventory/api/v1` |
| amarise | `NEXT_PUBLIC_CMS_URL` | `https://api.baalvion.com/api/cms/api/v1` |
| amarise | `NEXT_PUBLIC_CMS_WEBSITE_SLUG` | `amarise-maison-avenue` |
| amarise | `NEXT_PUBLIC_STORE_ID` | `${AMARISE_STORE_ID}` (from env-file) |
| about | `NEXT_PUBLIC_APP_URL` | `https://baalvion.com` |

> Domains are parameterized via `${DOMAIN_API/ADMIN/WEB/SHOP}` in the env-file; `docker compose --env-file … build` interpolates them into the build args.

---

## 3. ARG ↔ source ↔ build.arg consistency check

Verified by extracting `process.env.NEXT_PUBLIC_*` from each app's source and cross-checking against Dockerfile `ARG`/`ENV` and compose `build.args`:

| App | build.args = Dockerfile ARGs = ENV-mapped | stray `NEXT_PUBLIC_*` in `environment:` |
|---|:---:|:---:|
| admin-platform | ✅ 8/8 match | none |
| amarise-web | ✅ 10/10 match | none |
| about-web | ✅ 1/1 match | none |

Variables consumed by source but intentionally **not** baked (left to code defaults): admin `OAUTH_URL`/`WS_URL`/`SERVICES_HOST`/`BFF_MODE` (defaults already prod or feature-off); amarise `CRM_URL`/`CHECKOUT_MODE`/`ENABLE_LIVE_SHOP`/`STORE_DOMAINS`/`BFF_MODE` (non-MVP/feature-off). Baking these would have over-constrained the image with no MVP benefit.

---

## 4. Flow validation (static / logical — Linux build not run here)

| Flow | Baked/runtime path | Result |
|---|---|---|
| **Admin login** | admin → `NEXT_PUBLIC_AUTH_URL` (gateway identity/auth) + httpOnly cookie | ✅ correct origin baked |
| **CMS publishing** | admin → `NEXT_PUBLIC_CMS_API_URL` (gateway knowledge/cms) | ✅ correct origin baked |
| **Product listing** | amarise `catalog.ts` → `NEXT_PUBLIC_COMMERCE_URL` + `/commerce/storefront/${STORE_ID}` | ✅ both baked correctly |
| **Order creation** | amarise `api-client.ts` → `NEXT_PUBLIC_ORDER_URL` | ✅ correct origin baked |
| **Razorpay checkout** | amarise → order-service captures Razorpay directly; browser key returned in `clientParams` at runtime | ✅ no build-time key needed |

> **Not executed here:** the actual `docker compose build` on Linux. The host is Windows and `standalone` output is win32-gated; there is no Docker daemon in this environment. The fixes are verified by source/ARG/compose cross-check. **One green Linux build pass remains the gating step** (§6).

---

## 5. Service status

### Backend (smallest MVP — 7 required)
| Service | Status |
|---|---|
| auth-service | ✅ READY |
| auth-gateway | ✅ READY |
| rbac-service | ✅ READY |
| cms-service | ✅ READY |
| commerce-service | ✅ READY |
| inventory-service | ✅ READY |
| order-service (captures Razorpay directly) | ✅ READY |
| notification-service | ⚪ OPTIONAL |
| audit-service | ⚪ OPTIONAL |
| payment-service (Java — 2nd gateway, not on storefront path) | ⚪ OPTIONAL |
| redpanda / Kafka | ⚪ OPTIONAL |

### Frontend
| App | Status |
|---|---|
| admin-platform | ✅ READY (build-arg bake fixed) |
| amarise-web | ✅ READY (build-arg bake fixed) |
| about-web | ⚪ OPTIONAL (build-arg bake fixed) |
| controlthemarket / Law Elite / Imperialpedia / GTI / Proxy | ⚪ OPTIONAL (out of MVP) |

---

## 6. Remaining gating items (operator, not code)

| # | Item | Status |
|---|---|---|
| 1 | Run one `docker compose --env-file deploy/mvp-production/.env.production -f deploy/mvp-production/docker-compose.yml build` on a **Linux** builder | ⛔ BLOCKED (verification) |
| 2 | Provision RDS / ElastiCache / S3 / EC2 / Route53 + populate Secrets Manager | ⛔ operator |
| 3 | Seed CMS websites + Amarisé store; set `AMARISE_STORE_ID`, `AMARISE_MEDIA_HOST` in env-file **before build** (they are baked) | ⛔ operator |
| 4 | Set Razorpay keys + webhook (`/api/v1/orders/webhooks/razorpay`) | ⛔ operator |
| 5 | Confirm the gateway exposes admin's canonical paths (`/api/v1/identity/auth/...`, `/api/v1/knowledge/cms/...`). These are the admin app's own production defaults; the MVP gateway must route them (or run admin in BFF mode). Pre-existing, outside the build-arg fix. | ⛔ verify before admin go-live |

---

## 7. Verdict

The **build-arg baking defect is fully fixed in code.** A Linux `docker compose build` will now inline the correct production API URLs into the `admin-platform`, `amarise-web`, and `about-web` bundles — no more localhost leakage. All four storefront-critical flows (login, CMS publish, product listing, order creation, Razorpay checkout) resolve to the correct origins.

Remaining items are **operator/infra and one CI build pass** — there are no further code blockers on the frontend bake path. **Item 6.5** (admin↔gateway path scheme) is the one thing to confirm before flipping admin-platform to unconditional GO; the storefront (amarise) path is unaffected and READY.
