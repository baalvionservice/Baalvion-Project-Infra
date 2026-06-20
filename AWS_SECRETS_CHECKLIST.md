# AWS Secrets Checklist — Baalvion MVP (v1.0.0-mvp)

> ⚠️ **DEPRECATED — superseded by [MASTER_DEPLOYMENT_COMMANDS.md](MASTER_DEPLOYMENT_COMMANDS.md).**
> Legacy reference only (still useful as the per-service variable dictionary). The authoritative
> Secrets Manager layout is **MASTER §3–§4: 21 entries** = Stack A `baalvion/*` (14) +
> Stack B `baalvion/ctm/*` (3) + Stack C `baalvion/proxy/*` (4). The post-MVP frontend sections
> (§14–§18) below describe build-time env for sites that MASTER maps to **Stack B/C or marks
> out-of-scope**; canonical domains live in MASTER (e.g. the proxy platform is
> **`proxy.baalvionstack.com`**, not `proxy.baalvion.com`). Where this file disagrees, **MASTER wins.**

> Every secret and configuration value required to run the platform, grouped by
> consumer. 🔒 = true secret → **AWS Secrets Manager**, injected into the container at
> deploy time. ⚙ = non-secret configuration (domains, hosts, slugs) → env/SSM, safe to
> commit as `.env.production.example` defaults.
>
> **Build-time** `NEXT_PUBLIC_*` / `VITE_*` are baked into the frontend bundle at
> `docker build` — never put a real secret in a build arg. **Runtime** values are read
> by the Node/Java/nginx process at container start.
>
> Sources of truth: `deploy/mvp-production/docker-compose.yml`,
> `deploy/mvp-production/.env.production.example`, `FRONTEND_ENVIRONMENT_MASTER_LIST.md`.

---

## 0. Shared platform secrets (consumed by multiple services)

Generate once; the **same value** must reach every consumer listed.

| Variable | Type | How to generate | Consumed by |
|----------|------|-----------------|-------------|
| `JWT_PRIVATE_KEY` | 🔒 | RS256 keypair (`pnpm run generate:keys`), single-line `\n`-escaped PEM | **auth-service only** (signs tokens) |
| `JWT_PUBLIC_KEY` | 🔒 | public half of the pair | auth-service, rbac, audit, cms, commerce, inventory, order, auth-gateway (verify) |
| `JWT_ACCESS_SECRET` | 🔒 | `openssl rand -base64 48` | auth-service, inventory-service |
| `JWT_REFRESH_SECRET` | 🔒 | `openssl rand -base64 48` | auth-service |
| `INTERNAL_SERVICE_SECRET` | 🔒 | `openssl rand -hex 32` | cms, order, notification, payment, auth-gateway (shared HMAC) |
| `GATEWAY_SIGNING_SECRET` | 🔒 | `openssl rand -hex 32` (≥32) | auth-gateway (fail-closed), GTI |
| `RBAC_INTERNAL_API_KEY` | 🔒 | `openssl rand -hex 32` | rbac-service (as `INTERNAL_API_KEY`), commerce, order (must match) |
| `INVENTORY_INTERNAL_KEY` | 🔒 | `openssl rand -hex 32` | inventory-service, order-service (must match) |
| `AUDIT_INTERNAL_KEY` | 🔒 | `openssl rand -hex 32` | audit-service |
| `CMS_SECRETS_KEY` | 🔒 | `openssl rand -hex 32` | cms-service (encrypts payment-key vault); order-service decrypts via CMS |
| `CART_SESSION_SECRET` | 🔒 | `openssl rand -hex 32` | order-service (guest carts; blank disables) |
| `DB_PASSWORD` | 🔒 | RDS master password | all Node services + payment-service migration role |
| `DB_APP_PASSWORD` | 🔒 | `init-roles.sql` `baalvion_app_pw` | payment-service runtime (RLS role) |
| `REDIS_PASSWORD` | 🔒 | ElastiCache auth-token (blank if disabled) | all services using Redis |
| `JWT_ISSUER` | ⚙ | `baalvion-auth` | all |
| `JWT_AUDIENCE` | ⚙ | `baalvion-platform` | all |
| `DB_HOST` / `DB_PORT` / `DB_NAME` | ⚙ | RDS endpoint / `5432` / `baalvion_db` | all |
| `DB_USER` | ⚙ | `baalvion` (owner/migration role) | all |
| `DB_SSL` | ⚙ | `require` | all Node |
| `REDIS_HOST` / `REDIS_PORT` | ⚙ | ElastiCache endpoint / `6379` | all |
| `CORS_ORIGINS` | ⚙ | `https://baalvion.com,https://admin.baalvion.com,https://shop.baalvion.com` | all |
| `CMS_BASE_URL` | ⚙ | `http://cms-service:3018` (internal) | order, payment, cms |
| `API_BASE_URL` | ⚙ | `https://api.baalvion.com` | auth-service |

---

## Backend services

### 1. auth-service (port 3001, schema `auth`)

| Variable | Type | Notes |
|----------|------|-------|
| `JWT_PRIVATE_KEY` | 🔒 | sole signer |
| `JWT_PUBLIC_KEY`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | 🔒 | shared (§0) |
| `JWT_ISSUER`, `JWT_AUDIENCE`, `API_BASE_URL` | ⚙ | |
| `SUPERADMIN_EMAIL` | ⚙ | `superadmin@baalvion.com` |
| `SUPERADMIN_PASSWORD` | 🔒 | **rotate immediately after first login** |
| `SMTP_HOST`/`SMTP_PORT`/`EMAIL_FROM` | ⚙ | SES SMTP endpoint |
| `SMTP_USER`, `SMTP_PASS` | 🔒 | SES SMTP credentials (verification email) |
| DB/Redis/JWT shared (§0) | — | |

### 2. rbac-service (port 3055, schema `rbac`)

| Variable | Type | Notes |
|----------|------|-------|
| `INTERNAL_API_KEY` | 🔒 | **set to `RBAC_INTERNAL_API_KEY`** — callers send the same value |
| `DB_SCHEMA=rbac` | ⚙ | |
| DB/Redis/JWT shared (§0) | — | |

### 3. cms-service (port 3018, schema `cms`)

| Variable | Type | Notes |
|----------|------|-------|
| `INTERNAL_SERVICE_SECRET` | 🔒 | shared (§0) |
| `CMS_SECRETS_KEY` | 🔒 | encrypts per-site payment-key vault |
| `CMS_BASE_URL` | ⚙ | internal URL |
| `EVENT_TRANSPORT=redis` | ⚙ | |
| `AWS_REGION` | ⚙ | `ap-south-1` |
| `S3_ENDPOINT` | ⚙ | blank for AWS S3 |
| `S3_BUCKET`/`S3_REGION`/`S3_PUBLIC_URL` | ⚙ | `baalvion-media-prod` |
| `S3_ACCESS_KEY`, `S3_SECRET_KEY` | 🔒 | **prefer IAM role** over static keys |
| DB/Redis/JWT shared (§0) | — | |

### 4. commerce-service (port 3012, schema `commerce`)

| Variable | Type | Notes |
|----------|------|-------|
| `RBAC_BASE_URL` | ⚙ | `http://rbac-service:3055` |
| `RBAC_INTERNAL_API_KEY` | 🔒 | shared (§0) |
| `RBAC_FAIL_MODE=closed` | ⚙ | |
| `MEDIA_DRIVER=s3` | ⚙ | |
| `S3_*` (bucket/region/url + access/secret) | ⚙/🔒 | same bucket as cms |
| DB/Redis/JWT shared (§0) | — | |

### 5. inventory-service (port 3014, schema `inventory`)

| Variable | Type | Notes |
|----------|------|-------|
| `JWT_ACCESS_SECRET` | 🔒 | shared (§0) |
| `INVENTORY_INTERNAL_KEY` | 🔒 | must match order-service |
| `INVENTORY_LOCK_TTL_MINUTES=15` | ⚙ | reservation TTL |
| DB/Redis/JWT shared (§0) | — | |

### 6. order-service (port 3013, schema `orders`)

| Variable | Type | Notes |
|----------|------|-------|
| `PAYMENT_PROVIDER=razorpay` | ⚙ | |
| `ALLOW_MOCK_PAYMENTS=false` | ⚙ | hard real-payment mode |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | 🔒 | env fallback when CMS vault has no per-site entry |
| `RAZORPAY_WEBHOOK_STRICT_AMOUNT=true` | ⚙ | |
| `CMS_BASE_URL` | ⚙ | per-site key lookup |
| `PAYMENT_SITE_SLUG` | ⚙ | `amarise-maison-avenue` (`AMARISE_CMS_SLUG`) |
| `CART_SESSION_SECRET` | 🔒 | guest carts |
| `RBAC_BASE_URL` + `RBAC_INTERNAL_API_KEY` + `RBAC_FAIL_MODE=closed` | ⚙/🔒 | |
| `INVENTORY_BASE_URL` + `INVENTORY_INTERNAL_KEY` | ⚙/🔒 | |
| `NOTIFICATION_BASE_URL` | ⚙ | `http://notification-service:3031` |
| `INTERNAL_SERVICE_SECRET` | 🔒 | shared (§0) |
| `LEDGER_INTERNAL_KEY` | ⚙ | **empty in MVP** (ledger fail-open/off) |
| DB/Redis/JWT shared (§0) | — | |

### 7. auth-gateway (port 3099)

| Variable | Type | Notes |
|----------|------|-------|
| `AUTH_SERVICE_URL` | ⚙ | `http://auth-service:3001` |
| `JWKS_URI` | ⚙ | `http://auth-service:3001/.well-known/jwks.json` |
| `GATEWAY_SIGNING_SECRET` | 🔒 | fail-closed |
| `INTERNAL_SERVICE_SECRET` | 🔒 | shared (§0) |
| `BFF_ENFORCEMENT_MODE=hybrid` | ⚙ | |
| `SVC_RBAC/CMS/COMMERCE/INVENTORY/ORDER/PAYMENT` | ⚙ | internal service URLs |
| `JWT_PUBLIC_KEY`, `JWT_ISSUER`, `JWT_AUDIENCE` | 🔒/⚙ | verify only |

### 8. notification-service (port 3031) — *supporting, MVP-deployed*

| Variable | Type | Notes |
|----------|------|-------|
| `INTERNAL_SERVICE_SECRET` | 🔒 | shared (§0) |
| `SMTP_HOST`/`SMTP_PORT`/`EMAIL_FROM` | ⚙ | SES |
| `SMTP_USER`, `SMTP_PASS` | 🔒 | SES creds |

### 9. audit-service (port 3032, schema `audit`) — *supporting, MVP-deployed*

| Variable | Type | Notes |
|----------|------|-------|
| `AUDIT_CONSUME_EVENTS=true`, `EVENT_BUS_STREAM=baalvion:events` | ⚙ | |
| `INTERNAL_API_KEY` | 🔒 | set to `AUDIT_INTERNAL_KEY` |

### 10. payment-service (Java, port 3015, schema `payments`)

> Separate Razorpay gateway used by other sites (Proxy etc.). The marketplace
> order→pay flow does **not** use it. In MVP scope but optional for a storefront-only stack.

| Variable | Type | Notes |
|----------|------|-------|
| `DB_MIGRATION_USER` / `DB_MIGRATION_PASSWORD` | ⚙/🔒 | = `DB_USER` / `DB_PASSWORD` (Flyway DDL) |
| `DB_APP_USER=baalvion_app` | ⚙ | RLS runtime role |
| `DB_APP_PASSWORD` | 🔒 | from `init-roles.sql` |
| `DB_JDBC_PARAMS=?sslmode=require` | ⚙ | |
| `SPRING_FLYWAY_BASELINE_ON_MIGRATE=true`, `SPRING_FLYWAY_BASELINE_VERSION=0` | ⚙ | non-empty public schema |
| `KAFKA_BROKERS=redpanda:9092` | ⚙ | |
| `PSP_MOCK=false` | ⚙ | |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | 🔒 | shared Razorpay (§Razorpay) |
| `RAZORPAY_BASE_URL`, `RAZORPAY_REPLAY_WINDOW_SECONDS` | ⚙ | |
| `INTERNAL_SERVICE_SECRET`, `CMS_BASE_URL` | 🔒/⚙ | |

### Razorpay (shared by order-service + payment-service)

| Variable | Type | Notes |
|----------|------|-------|
| `RAZORPAY_KEY_ID` | 🔒 | `rzp_live_…` (live, KYC-approved) |
| `RAZORPAY_KEY_SECRET` | 🔒 | |
| `RAZORPAY_WEBHOOK_SECRET` | 🔒 | same value in Razorpay dashboard webhook config |
| `RAZORPAY_BASE_URL` | ⚙ | `https://api.razorpay.com` |

---

## Frontends

> All `NEXT_PUBLIC_*` / `VITE_*` are **build-time** (baked). Pass them as `--build-arg`.
> Runtime secrets (DATABASE_URL, GATEWAY_SIGNING_SECRET, REVALIDATE_SECRET, AI keys) go
> to Secrets Manager and are injected at container start — **never as build args**.

### 11. admin-platform (`admin.baalvion.com`, port 3030) — *MVP-deployed*

| Variable | Type | Value |
|----------|------|-------|
| `NEXT_PUBLIC_GATEWAY_URL` | build | `https://api.baalvion.com` |
| `NEXT_PUBLIC_APP_URL` | build | `https://admin.baalvion.com` |
| `NEXT_PUBLIC_API_URL` | build | `https://api.baalvion.com/api/v1/infrastructure/proxy/v1` |
| `NEXT_PUBLIC_ADMIN_API_URL` | build | `https://api.baalvion.com/api/v1/platform/admin/v1` |
| `NEXT_PUBLIC_CMS_API_URL` | build | `https://api.baalvion.com/api/v1/knowledge/cms/api/v1` |
| `NEXT_PUBLIC_AUTH_URL` | build | `https://api.baalvion.com/api/v1/identity/auth/v1/auth` |
| `NEXT_PUBLIC_SESSION_API_URL` | build | `https://api.baalvion.com/api/v1/identity/session/v1` |
| `NEXT_PUBLIC_APP_ENV` | build | `production` |
| `*_SERVICE_URL` health probes ×6 | runtime | add to task def (else `/api/health-check` reports down) |
| **No app secrets** | — | admin is a pure SPA over the gateway |

### 12. about-web (`baalvion.com`, port 3020) — *MVP-deployed*

| Variable | Type | Value |
|----------|------|-------|
| `NEXT_PUBLIC_APP_URL` | build | `https://baalvion.com` |
| `CMS_PUBLIC_URL` | runtime | `https://api.baalvion.com/api/cms/api/v1/public` |
| `CMS_WEBSITE_SLUG` | runtime | `about-baalvion` |
| **No app secrets** | — | reads CMS public API only |

### 13. amarise-web (`shop.baalvion.com`, port 3033) — *MVP-deployed*

| Variable | Type | Value |
|----------|------|-------|
| `NEXT_PUBLIC_COMMERCE_URL` / `_COMMERCE_API_URL` | build | `https://api.baalvion.com/api/commerce/api/v1` |
| `NEXT_PUBLIC_ORDER_URL` | build | `https://api.baalvion.com/api/orders/api/v1` |
| `NEXT_PUBLIC_INVENTORY_URL` | build | `https://api.baalvion.com/api/inventory/api/v1` |
| `NEXT_PUBLIC_CMS_URL` | build | `https://api.baalvion.com/api/cms/api/v1` |
| `NEXT_PUBLIC_CMS_WEBSITE_SLUG` | build | `amarise-maison-avenue` |
| `NEXT_PUBLIC_STORE_ID` | build | commerce store UUID (from seeding) → `AMARISE_STORE_ID` |
| `NEXT_PUBLIC_APP_URL` / `_SITE_URL` | build | `https://shop.baalvion.com` |
| `NEXT_PUBLIC_MEDIA_HOST` | build | S3/CloudFront host → `AMARISE_MEDIA_HOST` |
| `AUTH_PROXY_TARGET` | runtime | `https://api.baalvion.com/auth` (first-party cookie) |
| **No app secrets** | — | Razorpay key handled server-side by order-service |

### 14. controlthemarket (`controlthemarket.com`, port 3000) — *post-MVP, not in compose*

| Variable | Type | Value |
|----------|------|-------|
| `NEXT_PUBLIC_CTM_API_URL` | build | `https://api.baalvion.com/api/v1/ecosystem/ctm/api/v1` |
| `NEXT_PUBLIC_APP_URL` | build | `https://controlthemarket.com` |
| `NEXT_PUBLIC_USE_MOCK` | build | `false` (hard-fails in prod if true) |
| `AUTH_PROXY_TARGET` | runtime | `https://api.baalvion.com/.../auth` |
| **No app secrets** | — | requires ctm-service backend (not in MVP stack) |

### 15. law-elite (`lawelite.network`, port 9002) — *post-MVP, not in compose*

| Variable | Type | Value |
|----------|------|-------|
| `NEXT_PUBLIC_API_BASE_URL` | build | `https://<law-api-host>/v1` (mandatory — fallback is wrong-domain) |
| `NEXT_PUBLIC_APP_URL` | build | `https://lawelite.network` |
| `AUTH_SERVICE_URL` | runtime | auth-service URL |
| `CMS_PUBLIC_URL` | runtime | `https://api.baalvion.com/.../cms/api/v1/public` |
| `CMS_WEBSITE_SLUG` | runtime | `law-elite-network` |
| `NEXT_PUBLIC_ALGOLIA_APP_ID` / `_SEARCH_KEY` | build | 🔒-ish (Algolia, optional) |
| `GOOGLE_GENAI_API_KEY` | runtime | 🔒 (optional AI flows) |

### 16. imperialpedia (`imperialpedia.com`, port 3029) — *post-MVP, not in compose*

| Variable | Type | Value |
|----------|------|-------|
| `NEXT_PUBLIC_API_URL` / `_IMPERIALPEDIA_API_URL` | build | `https://api.baalvion.com/api/v1/knowledge/imperialpedia/api/v1` |
| `NEXT_PUBLIC_CMS_PUBLIC_URL` | build | `https://api.baalvion.com/.../cms/api/v1/public` |
| `NEXT_PUBLIC_SITE_URL` | build | `https://imperialpedia.com` |
| `NEXT_PUBLIC_CMS_SITE_SLUG` | build | `imperialpedia` |
| `REVALIDATE_SECRET` | runtime | 🔒 **required** (ISR revalidation) |
| `INDEXNOW_KEY` | runtime | optional |
| `GEMINI_API_KEY` / `GOOGLE_GENAI_API_KEY` / `GOOGLE_API_KEY` | runtime | 🔒 (optional AI) |

### 17. GTI — Global-Trade-Infrastructure (`trade.baalvion.com`, port 9003) — *post-MVP*

| Variable | Type | Value |
|----------|------|-------|
| `NEXT_PUBLIC_API_BASE_URL` | build | `https://api.baalvion.com/api/v1/commerce/trade/v1` |
| `NEXT_PUBLIC_APP_URL` | build | `https://trade.baalvion.com` |
| `DATABASE_URL` | runtime | 🔒 **required** — `postgresql://<user>:<pw>@<host>:5432/gti_orchestration?schema=public&sslmode=require` |
| `GATEWAY_SIGNING_SECRET` | runtime | 🔒 **required** (≥32, matches auth-gateway) |
| `GATEWAY_PROXY_TARGET` | runtime | 🔒-ish, **required** — internal auth-gateway URL |
| `SANCTIONS_API_URL` / `_TIMEOUT_MS` | runtime | optional |
| `GOOGLE_GENAI_API_KEY` | runtime | 🔒 (optional AI) |

> GTI owns a **dedicated database** `gti_orchestration` (separate from `baalvion_db`) via
> Prisma — provision it before deploying GTI.

### 18. proxy platform — Proxy-BaalvionStack (`proxy.baalvion.com`) — *post-MVP, Vite SPA*

| Variable | Type | Value |
|----------|------|-------|
| `VITE_API_PLATFORM_BASE_URL` | build (baked) | `https://api.baalvion.com/api/v1/infrastructure/proxy/v1` |
| `VITE_API_AUTH_BASE_URL` | build (baked) | `https://api.baalvion.com/api/v1/identity/auth/v1/auth` |
| `VITE_GATEWAY_URL` | build (baked) | `https://api.baalvion.com` |
| `VITE_BFF_MODE` | build (baked) | `on` |
| `VITE_PROXY_GATEWAY_HOST` / `_HTTP_PORT` / `_SOCKS_PORT` | build (baked) | `gw.baalvion.net` / `10000` / `1080` |
| `VITE_PAYU_ACTION_URL` | build (baked) | `https://secure.payu.in/_payment` |
| `AUTH_PROXY_TARGET` | runtime (nginx envsubst) | `https://api.baalvion.com/.../auth` |
| `AUTH_PROXY_HOST` | runtime (nginx envsubst) | `api.baalvion.com` |
| **No app secrets** | — | SPA over gateway; payment keys held server-side (payment-service CMS vault) |

---

## Fleet-wide secret rules

1. **Never rely on a build-arg fallback** — every required `NEXT_PUBLIC_*` / `VITE_*`
   must be passed explicitly in CI. A missing arg silently bakes a wrong/localhost URL.
2. **Secrets are runtime only** → Secrets Manager / SSM, injected into the task. Never
   bake a secret into an image layer as a build arg.
3. **`DB_PASSWORD` / `DB_APP_PASSWORD` in `baalvion/db` must equal** the passwords passed
   to `init-roles.sql` and the RDS master password.
4. **`RBAC_INTERNAL_API_KEY` and `INVENTORY_INTERNAL_KEY`** must be byte-identical on both
   sides (rbac↔commerce/order; inventory↔order), or RLS/internal calls fail closed.
5. **`SUPERADMIN_PASSWORD`** is bootstrap-only — rotate immediately after first login.
6. **Prefer an EC2/ECS IAM role** for S3 over static `S3_ACCESS_KEY/SECRET`.

---

## Pre-flight secrets gate (must all be ✅ before `up -d`)

```
[ ] RS256 keypair generated; JWT_PRIVATE_KEY (auth only) + JWT_PUBLIC_KEY (all) set
[ ] JWT_ACCESS_SECRET, JWT_REFRESH_SECRET (≥48B base64) set
[ ] INTERNAL_SERVICE_SECRET, GATEWAY_SIGNING_SECRET (≥32) set
[ ] RBAC_INTERNAL_API_KEY identical in rbac + commerce + order
[ ] INVENTORY_INTERNAL_KEY identical in inventory + order
[ ] AUDIT_INTERNAL_KEY, CMS_SECRETS_KEY, CART_SESSION_SECRET set
[ ] DB_PASSWORD, DB_APP_PASSWORD set + match init-roles.sql
[ ] REDIS_PASSWORD set (or blank if auth disabled)
[ ] SUPERADMIN_EMAIL/PASSWORD set (rotation planned)
[ ] S3 access via IAM role OR S3_ACCESS_KEY/S3_SECRET_KEY set
[ ] SMTP_USER, SMTP_PASS (SES) set; SES out of sandbox
[ ] RAZORPAY_KEY_ID (rzp_live_), KEY_SECRET, WEBHOOK_SECRET set
[ ] All frontend NEXT_PUBLIC_*/VITE_* build args prepared per app
```
