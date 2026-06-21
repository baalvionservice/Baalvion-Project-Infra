# FINAL MVP DEPLOYMENT READINESS REPORT

**Date:** 2026-06-20
**Scope:** Smallest production MVP only. Critical path = **registration · login · JWT · RBAC · CMS publishing · product listing · product management · order creation · Razorpay payment.**
**Excluded by design:** every service not on that path (ledger, session-service, media-service, dashboards, CTM, analytics, OAuth, Java payment-service, Redpanda/Kafka). No future services analyzed.
**Status legend:** ✅ READY · ⛔ BLOCKED (action required before launch) · ⚪ OPTIONAL (not required for the smallest MVP)

Ground truth was verified against the repo: all 13 referenced Dockerfiles exist, `deploy/mvp-production/docker-compose.yml` is complete, and the frontend build-arg gap below was confirmed by inspecting the Amarisé Dockerfile.

---

## 1. Backend services required per capability

| Capability | Service(s) on the critical path | Status |
|---|---|---|
| User registration | **auth-service** (:3001) | ✅ READY |
| Login | **auth-service** + **auth-gateway** (:3099 ingress) | ✅ READY |
| JWT auth | **auth-service** (RS256 issuer + JWKS) → **auth-gateway** (verifies, injects identity headers) | ✅ READY |
| RBAC | **rbac-service** (:3055); commerce/order call it `RBAC_FAIL_MODE=closed` | ✅ READY |
| CMS publishing | **cms-service** (:3018) — content + per-website Razorpay-key vault | ✅ READY |
| Product listing | **commerce-service** (:3012) public storefront API | ✅ READY |
| Product management | **commerce-service** + **rbac-service** | ✅ READY |
| Order creation | **order-service** (:3013) + **inventory-service** (:3014) + cms-vault lookup | ✅ READY |
| Razorpay payment | **order-service** captures Razorpay **directly** (`service/paymentProvider.js` → `api.razorpay.com`); webhook `POST /api/v1/orders/webhooks/razorpay` | ✅ READY |

**The 7 REQUIRED backend services:** auth-service, auth-gateway, rbac-service, cms-service, commerce-service, inventory-service, order-service.

**Supporting / not strictly required:**

| Service | Role | Status |
|---|---|---|
| notification-service (:3031) | Order/email notifications (BullMQ + SES). Auth verification mail can run via SMTP on auth-service directly. | ⚪ OPTIONAL |
| audit-service (:3032) | Append-only audit trail; event consumer, fail-open. | ⚪ OPTIONAL |
| **payment-service (Java, :3015)** | **Second, independent Razorpay gateway for OTHER sites. NOT on the marketplace order→pay path.** Drop it (and Redpanda) for the leanest stack. | ⚪ OPTIONAL |
| Redpanda/Kafka | Only exists to relay payment-service's outbox. | ⚪ OPTIONAL |

**Required infra:** PostgreSQL 16 (single DB `baalvion_db`, one schema per service) ✅ · Redis 7 (gateway/cms/commerce/inventory/order) ✅ · S3 (cms + commerce media) ✅ · SES/SMTP ⚪ (only if email is enabled).

---

## 2. Frontend applications required

| App | Role in MVP | Status |
|---|---|---|
| **admin-platform** (:3030) | CMS publishing UI + product management + Razorpay-key vault admin. **Required.** | ✅ READY (build via `Dockerfile.deploy`) |
| **amarise-web** — AmariseMaisonAvenue (:3033) | Storefront: product listing, cart, order creation, Razorpay checkout. **Required.** | ✅ READY |
| about-web — about-baalvion (:3020) | Marketing site, CMS-driven. Not on the commerce critical path. | ⚪ OPTIONAL |
| controlthemarket / Law Elite / Imperialpedia / GTI / Proxy-BaalvionStack | Other product surfaces. | ⚪ OPTIONAL (out of MVP scope) |

**The 2 REQUIRED frontends:** admin-platform, amarise-web.

---

## 3. Exact deployment order

```
INFRA (provision first)
  0a. RDS PostgreSQL 16  → create DB `baalvion_db` + role `baalvion` (owner)
  0b. ElastiCache Redis 7
  0c. S3 bucket (private) + IAM keys
  0d. (only if email on) SES domain verified, out of sandbox, SMTP creds
  0e. (only if payment-service kept) run init-roles.sql to create `baalvion_app` role

BACKEND (each service runs CREATE SCHEMA IF NOT EXISTS on boot — self-ordering)
  1. auth-service        (schema auth; RSA keypair; bootstraps superadmin)
  2. rbac-service        (schema rbac)        ─┐ parallel-safe after auth
  3. cms-service         (schema cms)         ─┘
  4. commerce-service    (schema commerce; needs rbac)
  5. inventory-service   (schema inventory)
  6. order-service       (schema orders; needs rbac + inventory + cms vault)
  7. auth-gateway        (needs auth-service JWKS + redis)
  --- optional ---
  8. notification-service (needs redis + SES)              ⚪
  9. audit-service        (schema audit; needs redis)      ⚪
 10. payment-service      (Flyway → schema payments; needs baalvion_app + redpanda) ⚪

FRONTEND (need gateway reachable; NEXT_PUBLIC_* baked at BUILD time)
 11. admin-platform, amarise-web  (+ about-web ⚪)

INGRESS
 12. Caddy (TLS 443) — routes api./admin./shop. (+ baalvion.com) and the
     Razorpay webhook path straight to order-service (bypasses JWT gateway)
```

---

## 4. Exact environment variables required (smallest MVP)

🔒 = secret (AWS Secrets Manager / SSM, never `NEXT_PUBLIC_*`).

### Shared (all backend)
`NODE_ENV=production` · `DB_HOST` `DB_PORT=5432` `DB_NAME=baalvion_db` `DB_USER` `DB_PASSWORD`🔒 `DB_SSL=require` · `REDIS_HOST` `REDIS_PORT=6379` `REDIS_PASSWORD`🔒 · `JWT_ISSUER=baalvion-auth` `JWT_AUDIENCE=baalvion-platform` `JWT_PUBLIC_KEY`🔒 · `CORS_ORIGINS`

### auth-service
`PORT=3001` · `JWT_PRIVATE_KEY`🔒 `JWT_ACCESS_SECRET`🔒 `JWT_REFRESH_SECRET`🔒 · `API_BASE_URL` · `SUPERADMIN_EMAIL` `SUPERADMIN_PASSWORD`🔒 · (email opt) `SMTP_HOST/PORT/USER/PASS`🔒 `EMAIL_FROM`

### auth-gateway
`PORT=3099` · `AUTH_SERVICE_URL=http://auth-service:3001` · `JWKS_URI=…/.well-known/jwks.json` · `GATEWAY_SIGNING_SECRET`🔒(≥32, fail-closed) · `INTERNAL_SERVICE_SECRET`🔒 · `BFF_ENFORCEMENT_MODE=hybrid` · `SVC_RBAC/SVC_CMS/SVC_COMMERCE/SVC_INVENTORY/SVC_ORDER` (Redis required)

### rbac-service
`PORT=3055` `DB_SCHEMA=rbac` · `INTERNAL_API_KEY`🔒 (callers send same value as `RBAC_INTERNAL_API_KEY`)

### cms-service
`PORT=3018` `DB_SCHEMA=cms` · `INTERNAL_SERVICE_SECRET`🔒 · `CMS_SECRETS_KEY`🔒 (encrypts payment-key vault) · `CMS_BASE_URL` · `EVENT_TRANSPORT=redis` · `AWS_REGION` `S3_ENDPOINT` `S3_BUCKET` `S3_REGION` `S3_ACCESS_KEY`🔒 `S3_SECRET_KEY`🔒 `S3_PUBLIC_URL`

### commerce-service
`PORT=3012` `DB_SCHEMA=commerce` · `RBAC_BASE_URL=http://rbac-service:3055` `RBAC_INTERNAL_API_KEY`🔒 `RBAC_FAIL_MODE=closed` · `MEDIA_DRIVER=s3` + S3_* (as above)

### inventory-service
`PORT=3014` `DB_SCHEMA=inventory` · `JWT_ACCESS_SECRET`🔒 · `INVENTORY_INTERNAL_KEY`🔒 (must equal order-service's) · `INVENTORY_LOCK_TTL_MINUTES=15`

### order-service
`PORT=3013` `DB_SCHEMA=orders` · `PAYMENT_PROVIDER=razorpay` `ALLOW_MOCK_PAYMENTS=false` · `RAZORPAY_KEY_ID`🔒 `RAZORPAY_KEY_SECRET`🔒 `RAZORPAY_WEBHOOK_SECRET`🔒 `RAZORPAY_WEBHOOK_STRICT_AMOUNT=true` · `CMS_BASE_URL` `PAYMENT_SITE_SLUG=amarise-maison-avenue` `INTERNAL_SERVICE_SECRET`🔒 · `CART_SESSION_SECRET`🔒 · `RBAC_BASE_URL` `RBAC_INTERNAL_API_KEY`🔒 `RBAC_FAIL_MODE=closed` · `INVENTORY_BASE_URL=http://inventory-service:3014` `INVENTORY_INTERNAL_KEY`🔒 · `LEDGER_INTERNAL_KEY=""` (fail-open/off)

### Frontends — **BUILD ARGS** (NEXT_PUBLIC_* are baked, NOT runtime)
- **admin-platform:** `NEXT_PUBLIC_GATEWAY_URL=https://api.baalvion.com` · `NEXT_PUBLIC_API_URL=…/v1` · `NEXT_PUBLIC_AUTH_URL=…/auth` · `NEXT_PUBLIC_APP_URL=https://admin.baalvion.com`
- **amarise-web:** `NEXT_PUBLIC_COMMERCE_URL` · `NEXT_PUBLIC_ORDER_URL` · `NEXT_PUBLIC_INVENTORY_URL` · `NEXT_PUBLIC_CMS_URL` · `NEXT_PUBLIC_CMS_WEBSITE_SLUG=amarise-maison-avenue` · **`NEXT_PUBLIC_STORE_ID`🔴 (no default — build fails/breaks if omitted)** · `NEXT_PUBLIC_AUTH_URL` · `NEXT_PUBLIC_APP_URL=https://shop.baalvion.com` · `AUTH_PROXY_TARGET` (runtime)

---

## 5. Final Docker Compose stack

`deploy/mvp-production/docker-compose.yml` exists and is complete (12 services + redpanda + caddy). For the **smallest MVP**, run with a profile/override that excludes the optional services:

**Keep:** redpanda❌(drop) · auth-service · rbac-service · cms-service · commerce-service · inventory-service · order-service · auth-gateway · admin-platform · amarise-web · caddy
**Drop for smallest MVP:** payment-service, redpanda, notification-service, audit-service, about-web (remove from `caddy: depends_on` too).

| Item | Status |
|---|---|
| Compose file present & structurally valid | ✅ READY |
| All 13 referenced Dockerfiles exist on disk | ✅ READY |
| Backend build context = monorepo root, `--no-frozen-lockfile` | ✅ READY |
| Caddyfile / redis.conf / init-roles.sql / .env.production.example present | ✅ READY |
| **Frontend `NEXT_PUBLIC_*` passed as runtime `environment:` not `build.args:`** | ⛔ BLOCKED |
| Linux `docker build` never executed (host is Windows; standalone is win32-gated) | ⛔ BLOCKED (verification gate) |

> **⛔ Blocker (compose):** the `admin-platform`, `amarise-web`, `about-web` services list `NEXT_PUBLIC_*` under `environment:`. These are **build-time** values — verified against `Frontend/AmariseMaisonAvenue-main/Dockerfile` (`ARG NEXT_PUBLIC_STORE_ID`, etc.). As written, a `compose build` bakes the **localhost defaults**; the storefront ships pointed at localhost. **Fix:** add a `build.args:` block to each frontend service mirroring the `environment` values (or build the images out-of-band with `--build-arg` and reference by tag).

---

## 6. Final AWS deployment checklist

| # | Item | Status |
|---|---|---|
| 1 | RDS PostgreSQL 16 (`db.t4g.medium`, 50 GB gp3), DB `baalvion_db`, owner role `baalvion` | ⛔ provision |
| 2 | ElastiCache Redis 7 (`cache.t4g.small`) | ⛔ provision |
| 3 | S3 bucket `baalvion-media-prod` (private) + IAM access keys | ⛔ provision |
| 4 | EC2 `t3.large` (or ECS Fargate) for compose + Caddy | ⛔ provision |
| 5 | Route 53: `api.` `admin.` `shop.` (+ `baalvion.com`) | ⛔ provision |
| 6 | TLS via Caddy auto-ACME (ports 80/443 open) | ✅ config ready |
| 7 | Secrets Manager: JWT keypair, JWT access/refresh, DB password, gateway secrets, internal keys, Razorpay keys, S3 keys, superadmin | ⛔ populate |
| 8 | Generate RS256 keypair (`pnpm run generate:keys`) → `JWT_PRIVATE_KEY`/`JWT_PUBLIC_KEY` | ⛔ operator |
| 9 | Razorpay live/test keys → order-service env **and/or** CMS per-website vault (admin panel) | ⛔ operator |
| 10 | Razorpay webhook → `https://api.baalvion.com/api/v1/orders/webhooks/razorpay` (set `RAZORPAY_WEBHOOK_SECRET`) | ⛔ operator |
| 11 | SES domain verified + out of sandbox (**only if** email enabled) | ⚪ optional |
| 12 | Seed CMS websites (`about-baalvion`, `amarise-maison-avenue`) + Amarisé store; capture `NEXT_PUBLIC_STORE_ID` | ⛔ operator |
| 13 | **Run one Linux CI `docker build` for all 7 backend + 2 frontend images** | ⛔ verification gate |
| 14 | Fix compose frontend build-args (§5) before building frontends | ⛔ blocker |
| 15 | `init-roles.sql` (`baalvion_app` role) — **only if** keeping Java payment-service | ⚪ optional |

---

## 7. Verdict

**CONDITIONAL GO** for the smallest MVP (7 backend + 2 frontend services).

All code, Dockerfiles, compose, and config are **structurally READY**. Launch is gated on **operator/infra actions only** — no code blockers on the critical path. Two items must be cleared before flipping to unconditional GO:

1. **⛔ Compose frontend build-args** — move `NEXT_PUBLIC_*` from `environment:` to `build.args:` (§5), or pre-build images with `--build-arg`. Without this the storefront bakes localhost URLs.
2. **⛔ One green Linux build pass** — `docker build` was never executed here (Windows host, standalone win32-gated). Build all 9 MVP images on a Linux/CI builder, then deploy.

Everything marked ⚪ OPTIONAL (payment-service, Redpanda, notification, audit, about-web, the other 5 frontends) can be omitted from the first launch and added later without touching the critical path.
