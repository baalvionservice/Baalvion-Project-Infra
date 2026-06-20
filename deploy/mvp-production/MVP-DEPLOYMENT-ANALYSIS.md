# Baalvion MVP — Production Deployment Analysis

> Goal: get **user registration, login, CMS publishing, product management, order
> creation, and Razorpay payments** live in production.
>
> Scope is the **critical path only**. Everything not on that path (ledger,
> session-service, media-service, dashboards, CTM, analytics, OAuth) is
> deliberately excluded and stubbed/fail-open where a service references it.

## 1. Topology overview

```
                         ┌────────────────────────── Caddy (TLS 443) ───────────────────────────┐
  Internet ── DNS ──►    │  api.baalvion.com   → auth-gateway:3099                                │
                         │  admin.baalvion.com → admin-platform:3030                              │
                         │  baalvion.com       → about-web:3020   (main website)                 │
                         │  shop.baalvion.com  → amarise-web:3033  (marketplace)                  │
                         │  api.baalvion.com/api/v1/orders/webhooks/* → order-service:3013        │
                         │  api.baalvion.com/api/payments/webhooks/*  → payment-service:3015      │
                         └───────────────────────────────────────────────────────────────────────┘
                                                   │
         auth-gateway (:3099) is the single API ingress (BFF). It injects RS256 identity
         headers and proxies to:
            /auth/*            → auth-service     :3001
            /api/rbac/*        → rbac-service     :3055
            /api/cms/*         → cms-service      :3018
            /api/commerce/*    → commerce-service :3012
            /api/inventory/*   → inventory-service:3014
            /api/orders/*      → order-service    :3013
            /api/payments/*    → payment-service  :3015
         (notification-service :3031 and audit-service :3032 are event consumers,
          not fronted by the gateway)

  Shared infra:  RDS PostgreSQL 16 (db: baalvion_db)  ·  ElastiCache Redis 7  ·  S3  ·  SES  ·  Razorpay
```

**Single shared database `baalvion_db`, one schema per service** (`auth`, `rbac`,
`audit`, `cms`, `commerce`, `inventory`, `orders`, `payments`). Tenant isolation is
enforced in-schema via RLS, not by separate databases.

**Two Postgres roles are required:**
- `baalvion` — owner / migration role (DDL, schema creation, Flyway).
- `baalvion_app` — non-superuser runtime role used by RLS policies (`@baalvion/tenancy`
  and payment-service `payments` RLS grant runtime DML to this role). It **must exist
  before payment-service migrates** or the Flyway grant fails.

---

## 2. Per-service deployment matrix

Build context for **every** backend image is the **monorepo root** (`d:/Baalvion Projects`),
because the multi-stage Dockerfiles run `turbo prune --docker` over the workspace.
Install always uses `--no-frozen-lockfile` (turbo prune drops pnpm override snapshots).

Generic build form:
```bash
docker build -f Backend/services/<domain>/<service>/Dockerfile -t baalvion/<service>:prod-latest .
```

### 2.1 auth-service  (identity core)

| | |
|---|---|
| **1. Build** | `docker build -f Backend/services/identity/auth-service/Dockerfile -t baalvion/auth-service:prod-latest .` |
| **2. Env** | `NODE_ENV=production`, `PORT=3001`, `DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD`, `DB_SSL=require`, `JWT_PRIVATE_KEY` 🔒, `JWT_PUBLIC_KEY`, `JWT_ISSUER=baalvion-auth`, `JWT_AUDIENCE=baalvion-platform`, `JWT_ACCESS_SECRET` 🔒, `JWT_REFRESH_SECRET` 🔒, `CORS_ORIGINS`, `API_BASE_URL`, `SUPERADMIN_EMAIL`, `SUPERADMIN_PASSWORD` 🔒. Optional `REDIS_HOST/PORT`, `SMTP_*`/`EMAIL_FROM` for verification mail. |
| **3. PG schema** | `auth` (created on boot) in `baalvion_db` |
| **4. Redis** | Optional — token/session cache, degrades gracefully |
| **5. Startup deps** | PostgreSQL (required); RSA keypair (required in prod); Redis (optional) |
| **6. Health** | `GET /health` → `{status, redis}` |
| **7. AWS** | RDS, (ElastiCache optional), Secrets Manager, SES (verification email) |
| **8. Secrets Mgr** | `baalvion/jwt-keys` (private+public PEM), `baalvion/jwt-symmetric` (access+refresh), `baalvion/db` (password), `baalvion/superadmin` |

### 2.2 auth-gateway  (BFF / API ingress)

| | |
|---|---|
| **1. Build** | `docker build -f Backend/services/identity/auth-gateway/Dockerfile -t baalvion/auth-gateway:prod-latest .` |
| **2. Env** | `NODE_ENV=production`, `PORT=3099`, `AUTH_SERVICE_URL=http://auth-service:3001`, `JWKS_URI=http://auth-service:3001/.well-known/jwks.json`, `JWT_ISSUER`, `JWT_AUDIENCE`, `GATEWAY_SIGNING_SECRET` 🔒 (≥32 chars, fail-closed), `INTERNAL_SERVICE_SECRET` 🔒 (fail-closed), `REDIS_HOST/PORT`, `CORS_ORIGINS`, `BFF_ENFORCEMENT_MODE=hybrid`, plus downstream service URLs (`SVC_CMS`, `SVC_COMMERCE`, `SVC_INVENTORY`, `SVC_ORDER`, `SVC_PAYMENT`, `SVC_RBAC`). |
| **3. PG schema** | None (stateless) |
| **4. Redis** | **Required** — session store + anomaly detection |
| **5. Startup deps** | Redis (required), auth-service JWKS reachable |
| **6. Health** | `GET /health` → `{status, redis, mode}` |
| **7. AWS** | ElastiCache (required), Secrets Manager |
| **8. Secrets Mgr** | `baalvion/gateway` (`GATEWAY_SIGNING_SECRET`, `INTERNAL_SERVICE_SECRET`) |

### 2.3 rbac-service  (authorization)

| | |
|---|---|
| **1. Build** | `docker build -f Backend/services/identity/rbac-service/Dockerfile -t baalvion/rbac-service:prod-latest .` |
| **2. Env** | `NODE_ENV=production`, `PORT=3055`, `DB_*`, `DB_SCHEMA=rbac`, `DB_SSL=require`, `JWT_PUBLIC_KEY` 🔒 (or `JWT_PUBLIC_KEYS`/`JWT_KEYS_DIR` — fail-closed in prod), `JWT_ISSUER`, `JWT_AUDIENCE`, `INTERNAL_API_KEY` 🔒 (**rbac-service reads this name**; the commerce/inventory/order callers send the same value as `RBAC_INTERNAL_API_KEY`). Redis **not used**. |
| **3. PG schema** | `rbac` |
| **4. Redis** | Not used |
| **5. Startup deps** | PostgreSQL; RS256 public key (fail-closed in prod) |
| **6. Health** | `GET /health` → `{status, rs256}` |
| **7. AWS** | RDS, Secrets Manager |
| **8. Secrets Mgr** | `baalvion/jwt-keys` (public), `baalvion/rbac` (internal api key) |

### 2.4 notification-service  (email/SMS/push workers)

| | |
|---|---|
| **1. Build** | `docker build -f Backend/services/infrastructure/notification-service/Dockerfile -t baalvion/notification-service:prod-latest .` |
| **2. Env** | `NODE_ENV=production`, `PORT=3031`, `REDIS_HOST/PORT` (required), `JWT_ISSUER`, `JWT_AUDIENCE`, `INTERNAL_SERVICE_SECRET` 🔒, **email provider (one required):** `RESEND_API_KEY` 🔒 **or** `SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS` 🔒, `EMAIL_FROM=noreply@baalvion.com`. Optional Twilio/FCM/VAPID. |
| **3. PG schema** | None (stateless; queues live in Redis) |
| **4. Redis** | **Required** — BullMQ queues + `baalvion:events` Redis Stream consumer |
| **5. Startup deps** | Redis (fail-closed); valid email provider (fail-closed in prod) |
| **6. Health** | `GET /health` → `{status, redis, queues, channels}` |
| **7. AWS** | ElastiCache, **SES** (via SMTP creds or Resend), Secrets Manager |
| **8. Secrets Mgr** | `baalvion/email` (SES SMTP user/pass or Resend key), `baalvion/gateway` (internal secret) |

> **MVP email choice:** use **SES SMTP interface** (`SMTP_HOST=email-smtp.<region>.amazonaws.com`,
> port 587, SES SMTP credentials) so both auth-service verification mail and
> notification-service share one provider.

### 2.5 audit-service  (append-only audit trail)

| | |
|---|---|
| **1. Build** | `docker build -f Backend/services/infrastructure/audit-service/Dockerfile -t baalvion/audit-service:prod-latest .` |
| **2. Env** | `NODE_ENV=production`, `PORT=3032`, `DB_*`, `DB_SCHEMA=audit`, `DB_SSL=require`, `REDIS_HOST/PORT`, `JWT_ISSUER`, `JWT_AUDIENCE`, `JWT_PUBLIC_KEY`, `AUDIT_CONSUME_EVENTS=true`, `EVENT_BUS_STREAM=baalvion:events`, `INTERNAL_API_KEY` 🔒 |
| **3. PG schema** | `audit` (WORM, hash-chained, RLS) |
| **4. Redis** | **Required when** `AUDIT_CONSUME_EVENTS=true` — Redis Stream subscriber |
| **5. Startup deps** | PostgreSQL; Redis (for event consumption) |
| **6. Health** | `GET /health` (liveness), `GET /readyz` (DB), `GET /healthz` |
| **7. AWS** | RDS, ElastiCache, Secrets Manager |
| **8. Secrets Mgr** | `baalvion/db`, `baalvion/jwt-keys`, `baalvion/audit` (internal key) |

### 2.6 cms-service  (content + publishing + payment-key vault)

| | |
|---|---|
| **1. Build** | `docker build -f Backend/services/knowledge/cms-service/Dockerfile -t baalvion/cms-service:prod-latest .` |
| **2. Env** | `NODE_ENV=production`, `PORT=3018`, `DB_*`, `DB_SCHEMA=cms`, `DB_SSL=require`, `REDIS_HOST/PORT/PASSWORD`, `JWT_PUBLIC_KEY` 🔒, `JWT_ISSUER`, `JWT_AUDIENCE`, `INTERNAL_SERVICE_SECRET` 🔒, `CMS_SECRETS_KEY` 🔒 (encrypts the payment-key vault), `CMS_BASE_URL`, `CORS_ORIGINS`, `EVENT_TRANSPORT=redis`. S3 for media via `@baalvion/upload`: `AWS_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY` 🔒, `S3_SECRET_KEY` 🔒, `S3_ENDPOINT` (blank for AWS). |
| **3. PG schema** | `cms` (websites, contents, revisions, workflows, media, website_integrations) |
| **4. Redis** | **Required** — content/public/taxonomy cache, BullMQ scheduler+notification queues, `baalvion:events` transport |
| **5. Startup deps** | PostgreSQL, Redis, S3 (media), JWT public key |
| **6. Health** | `GET /health` (only — cms-service does **not** register `/readyz`; the compose healthcheck uses `/health`). Note: the Dockerfile `EXPOSE`s 3011 but the app honours `PORT`, so `PORT=3018` is authoritative. |
| **7. AWS** | RDS, ElastiCache, **S3 (media)**, Secrets Manager |
| **8. Secrets Mgr** | `baalvion/db`, `baalvion/jwt-keys`, `baalvion/cms` (`CMS_SECRETS_KEY`, `INTERNAL_SERVICE_SECRET`), `baalvion/s3` |

> **Why CMS is on the payment critical path:** Razorpay keys are stored per-website in
> the CMS vault (`website_integrations`, encrypted with `CMS_SECRETS_KEY`). payment-service
> resolves them via the CMS internal API when run in multi-tenant mode. For the simplest
> MVP you can instead set global Razorpay env keys on payment-service and leave the vault unused.

### 2.7 commerce-service  (catalog / product management)

| | |
|---|---|
| **1. Build** | `docker build -f Backend/services/commerce/commerce-service/Dockerfile -t baalvion/commerce-service:prod-latest .` |
| **2. Env** | `NODE_ENV=production`, `PORT=3012`, `DB_*`, `DB_SCHEMA=commerce`, `DB_SSL=require`, `REDIS_HOST/PORT/PASSWORD`, `JWT_PUBLIC_KEY` 🔒, `JWT_ISSUER`, `JWT_AUDIENCE`, `RBAC_BASE_URL=http://rbac-service:3055`, `RBAC_INTERNAL_API_KEY` 🔒, `RBAC_FAIL_MODE=closed`, `MEDIA_DRIVER=s3`, `S3_ENDPOINT`, `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY` 🔒, `S3_SECRET_KEY` 🔒, `S3_PUBLIC_URL`, `CORS_ORIGINS`. |
| **3. PG schema** | `commerce` (stores, products, variants, pricing, media, categories, collections) |
| **4. Redis** | **Required** — catalog cache, RBAC scope cache, BullMQ product queue |
| **5. Startup deps** | PostgreSQL, Redis, rbac-service, JWT public key |
| **6. Health** | `GET /health`, `GET /readyz`, `GET /metrics`; public storefront `GET /api/v1/commerce/storefront/:storeId/*` |
| **7. AWS** | RDS, ElastiCache, **S3 (product media)**, Secrets Manager |
| **8. Secrets Mgr** | `baalvion/db`, `baalvion/jwt-keys`, `baalvion/rbac`, `baalvion/s3` |

### 2.8 inventory-service  (stock + reservations)

| | |
|---|---|
| **1. Build** | `docker build -f Backend/services/commerce/inventory-service/Dockerfile -t baalvion/inventory-service:prod-latest .` |
| **2. Env** | `NODE_ENV=production`, `PORT=3014`, `DB_*`, `DB_SCHEMA=inventory`, `DB_SSL=require`, `REDIS_HOST/PORT/PASSWORD`, `JWT_ACCESS_SECRET` 🔒, `INVENTORY_INTERNAL_KEY` 🔒 (**must equal** order-service's value), `INVENTORY_LOCK_TTL_MINUTES=15`, `CORS_ORIGINS`. |
| **3. PG schema** | `inventory` (warehouses, stock, movements, reservations) |
| **4. Redis** | Required — RBAC scope cache (no queues) |
| **5. Startup deps** | PostgreSQL, Redis |
| **6. Health** | `GET /health`, `GET /readyz`, `GET /metrics` |
| **7. AWS** | RDS, ElastiCache, Secrets Manager |
| **8. Secrets Mgr** | `baalvion/db`, `baalvion/inventory` (`JWT_ACCESS_SECRET`, `INVENTORY_INTERNAL_KEY`) |

### 2.9 order-service  (cart / checkout / order creation)

| | |
|---|---|
| **1. Build** | `docker build -f Backend/services/commerce/order-service/Dockerfile -t baalvion/order-service:prod-latest .` |
| **2. Env** | `NODE_ENV=production`, `PORT=3013`, `DB_*`, `DB_SCHEMA=orders`, `DB_SSL=require`, `REDIS_HOST/PORT/PASSWORD`, `JWT_PUBLIC_KEY` 🔒, `JWT_ISSUER`, `JWT_AUDIENCE`, `PAYMENT_PROVIDER=razorpay`, `ALLOW_MOCK_PAYMENTS=false`, **`RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET`/`RAZORPAY_WEBHOOK_SECRET` 🔒** (env fallback — see note), `RAZORPAY_WEBHOOK_STRICT_AMOUNT=true`, `CMS_BASE_URL` + `PAYMENT_SITE_SLUG` (CMS-vault key lookup), `INTERNAL_SERVICE_SECRET` 🔒 (vault auth), `CART_SESSION_SECRET` 🔒, `RBAC_BASE_URL`, `RBAC_INTERNAL_API_KEY` 🔒, `RBAC_FAIL_MODE=closed`, `INVENTORY_BASE_URL=http://inventory-service:3014`, `INVENTORY_INTERNAL_KEY` 🔒, `NOTIFICATION_BASE_URL=http://notification-service:3031`. **MVP: leave `LEDGER_INTERNAL_KEY` empty → ledger posting fail-open (off).** |
| **3. PG schema** | `orders` (customers, carts, orders, items, payments, invoices, event_outbox) |
| **4. Redis** | **Required** — order/cart cache, BullMQ reconciliation queue, ledger outbox relay |
| **5. Startup deps** | PostgreSQL, Redis, rbac-service, inventory-service, cms-service (vault key resolution, fail-open to env); notification-service (optional, ops alerts). **Does NOT depend on the Java payment-service.** |
| **6. Health** | `GET /health`, `GET /readyz`, `GET /metrics` |
| **7. AWS** | RDS, ElastiCache, Secrets Manager |
| **8. Secrets Mgr** | `baalvion/db`, `baalvion/jwt-keys`, `baalvion/rbac`, `baalvion/inventory`, `baalvion/razorpay`, `baalvion/order` (`CART_SESSION_SECRET`, `INTERNAL_SERVICE_SECRET`) |

> **order-service IS the storefront payment path.** It captures Razorpay **directly**
> (`service/paymentProvider.js` → `https://api.razorpay.com/v1`); it does **not** call the
> Java payment-service. Per-site keys resolve from the CMS vault via `getPaymentCreds('razorpay')`
> (admin-panel rotatable, encrypted with `CMS_SECRETS_KEY`); if the vault has no entry the call
> **fails open to the `RAZORPAY_*` env keys**. The capture backstop is a signature-verified
> webhook at **`POST /api/v1/orders/webhooks/razorpay`** (`X-Razorpay-Signature`, strict-amount),
> routed straight to order-service by Caddy — bypassing the JWT gateway.

### 2.10 payment-service  (Java / Spring Boot — Razorpay)

> **Role on the MVP path:** this is a **second, independent** Razorpay gateway used by other
> sites (Proxy, etc.). The marketplace order→pay flow does **not** route through it — order-service
> (§2.9) captures Razorpay itself. It is included because it is in the requested scope, but the
> six MVP acceptance criteria are satisfied **without** it. The leanest storefront-only stack can
> omit payment-service **and** Redpanda/Kafka entirely.

| | |
|---|---|
| **1. Build** | `docker build -f Backend/services/commerce/financial-services-java/Dockerfile --build-arg SERVICE=payment-service -t baalvion/payment-service:prod-latest Backend/services/commerce/financial-services-java` (Maven multi-stage; JAR built with `mvn -pl payment-service -am package`) |
| **2. Env** | `PORT=3015`, `DB_HOST/DB_PORT/DB_NAME`, `DB_APP_USER=baalvion_app`, `DB_APP_PASSWORD` 🔒, `DB_JDBC_PARAMS=?sslmode=require`, `SPRING_FLYWAY_BASELINE_ON_MIGRATE=true`, `SPRING_FLYWAY_BASELINE_VERSION=0`, `RAZORPAY_KEY_ID` 🔒, `RAZORPAY_KEY_SECRET` 🔒, `RAZORPAY_WEBHOOK_SECRET` 🔒, `RAZORPAY_BASE_URL=https://api.razorpay.com`, `RAZORPAY_REPLAY_WINDOW_SECONDS=600`, `PSP_MOCK=false`, `app.psp.webhook-strict-amount=true`, `REDIS_HOST/PORT`, `KAFKA_BROKERS`, optional CMS vault: `CMS_BASE_URL`, `INTERNAL_SERVICE_SECRET`. |
| **3. PG schema** | `payments` (Flyway-managed: gateway_payments, gateway_webhook_events, transactions, outbox_events; RLS on `baalvion_app`) |
| **4. Redis** | Optional — idempotency-key dedup cache (DB UNIQUE constraint is the real guard) |
| **5. Startup deps** | PostgreSQL with `baalvion_app` role pre-created; Kafka (outbox relay); Redis (optional) |
| **6. Health** | `GET /actuator/health`; metrics `GET /actuator/prometheus` |
| **7. AWS** | RDS, ElastiCache (optional), **MSK / self-managed Kafka (or Redpanda)**, Secrets Manager |
| **8. Secrets Mgr** | `baalvion/razorpay` (key id/secret/webhook), `baalvion/payment-db` (`DB_APP_PASSWORD`) |

> **Razorpay flow:** `POST /v1/gateway/payments` (header `Idempotency-Key`, optional
> `?site=<slug>`) creates a Razorpay order and returns `clientParams` for the browser SDK.
> Webhook `POST /v1/gateway/webhooks/razorpay` verifies `x-razorpay-signature`
> (HMAC-SHA256, constant-time), enforces a replay window, and dedupes on a body-derived
> `event:entityId` key. Webhooks are **signature-authenticated, not JWT** — route them
> directly to payment-service, bypassing the gateway.

> **Kafka note:** payment-service polls an outbox to Kafka. For MVP, run a single-node
> **Redpanda** (Kafka API-compatible, in the compose file) rather than standing up MSK.

### 2.11 admin-platform  (Next.js admin UI)

| | |
|---|---|
| **1. Build** | `docker build -f Frontend/admin-platform/Dockerfile.deploy -t baalvion/admin-platform:prod-latest .` (use **Dockerfile.deploy** — monorepo/turbo-aware; the plain Dockerfile is npm-only and broken) |
| **2. Env** | `NEXT_PUBLIC_GATEWAY_URL=https://api.baalvion.com`, `NEXT_PUBLIC_API_URL=https://api.baalvion.com/v1`, `NEXT_PUBLIC_AUTH_URL=https://api.baalvion.com/auth`, `NEXT_PUBLIC_APP_URL=https://admin.baalvion.com`, `PORT=3030`, `NODE_ENV=production` |
| **3. PG schema** | None |
| **4. Redis** | None |
| **5. Startup deps** | auth-gateway reachable at build/runtime (client-side calls) |
| **6. Health** | `GET /` (Next.js) — front by Caddy health route |
| **7. AWS** | None beyond compute + Caddy TLS |
| **8. Secrets Mgr** | None (all values are public `NEXT_PUBLIC_*`) |

### 2.12 main website — about-baalvion-main  (Next.js, CMS-driven)

| | |
|---|---|
| **1. Build** | `docker build -f Frontend/about-baalvion-main/Dockerfile -t baalvion/about-web:prod-latest .` (monorepo/turbo standalone Dockerfile **created in this pass** — the app previously had none; also added `output: 'standalone'` to `next.config.ts`. Package name: `about-baalvion-web`.) |
| **2. Env** | `CMS_PUBLIC_URL=https://api.baalvion.com/api/cms/api/v1/public` (or direct cms-service public API), `CMS_WEBSITE_SLUG=about-baalvion`, `NEXT_PUBLIC_APP_URL=https://baalvion.com`, `PORT=3020` |
| **3. PG schema** | None (reads CMS delivery API server-side) |
| **4. Redis** | None |
| **5. Startup deps** | cms-service public API reachable |
| **6. Health** | `GET /` |
| **7. AWS** | None beyond compute + Caddy (or host on Vercel) |
| **8. Secrets Mgr** | None |

### 2.13 marketplace — AmariseMaisonAvenue-main  (Next.js storefront)

| | |
|---|---|
| **1. Build** | `docker build -f Frontend/AmariseMaisonAvenue-main/Dockerfile -t baalvion/amarise-web:prod-latest .` (monorepo-aware Dockerfile already present) |
| **2. Env** | `NEXT_PUBLIC_COMMERCE_URL=https://api.baalvion.com/api/commerce/api/v1`, `NEXT_PUBLIC_INVENTORY_URL=…/api/inventory/api/v1`, `NEXT_PUBLIC_ORDER_URL=…/api/orders/api/v1`, `NEXT_PUBLIC_AUTH_URL=https://api.baalvion.com/auth`, `NEXT_PUBLIC_CMS_URL=…/api/cms/api/v1`, `NEXT_PUBLIC_CMS_WEBSITE_SLUG=amarise-maison-avenue`, `NEXT_PUBLIC_STORE_ID=<store uuid>`, `NEXT_PUBLIC_APP_URL=https://shop.baalvion.com`, `AUTH_PROXY_TARGET=https://api.baalvion.com/auth`, `PORT=3033`. Razorpay browser key is returned at runtime in `clientParams` from payment-service (no build-time key needed). |
| **3. PG schema** | None |
| **4. Redis** | None |
| **5. Startup deps** | auth-gateway, commerce, inventory, order, payment reachable |
| **6. Health** | `GET /` |
| **7. AWS** | None beyond compute + Caddy |
| **8. Secrets Mgr** | None |

---

## 3. Consolidated dependency / boot order

```
infra:   RDS (baalvion_db + roles)  →  ElastiCache Redis  →  Redpanda(Kafka)  →  S3/SES ready
                    │
boot 1:  auth-service        (creates schema auth, RSA keypair)
boot 2:  rbac-service        (schema rbac)          ─┐
boot 3:  audit-service       (schema audit)          │ parallel-safe after auth
boot 4:  cms-service         (schema cms)            ─┘
boot 5:  commerce-service    (schema commerce; needs rbac)
boot 6:  inventory-service   (schema inventory)
boot 7:  order-service       (schema orders; needs rbac+inventory+cms; Razorpay direct)
boot 8:  payment-service     (Flyway → schema payments; needs baalvion_app role) — parallel path, optional for storefront
boot 9:  auth-gateway        (needs auth-service JWKS + redis)
boot 10: notification-service(needs redis + SES)
boot 11: admin-platform, about-web, amarise-web  (need gateway)
```

Each Node service runs `CREATE SCHEMA IF NOT EXISTS` on its own schema, so schema
creation is idempotent and self-ordering. The only hard pre-req is the **`baalvion_app`
role existing before payment-service migrates** (see runbook §3).

---

## 4. AWS resource summary (MVP)

| Resource | Spec (MVP) | Used by |
|---|---|---|
| **RDS PostgreSQL 16** | `db.t4g.medium`, 50 GB gp3, Multi-AZ optional | all stateful services (`baalvion_db`) |
| **ElastiCache Redis 7** | `cache.t4g.small`, 1 node | gateway, notification, audit, cms, commerce, inventory, order |
| **EC2** | 1× `t3.large` (or ECS Fargate) running docker-compose + Caddy | all containers |
| **S3 bucket** | `baalvion-media-prod` (private, CloudFront optional) | cms + commerce media |
| **SES** | verified domain `baalvion.com` + SMTP creds, out of sandbox | auth + notification email |
| **Secrets Manager** | entries listed per service (§2) | injected at deploy |
| **Redpanda** | single container on the EC2 host (Kafka API) | payment-service outbox |
| **Route 53** | `baalvion.com`, `api.`, `admin.`, `shop.` | DNS |
| **ACM / Caddy** | TLS (Caddy auto-ACME on the host, or ACM+ALB) | ingress |

---

## 5. Files generated alongside this analysis

| File | Purpose |
|---|---|
| `docker-compose.yml` | full MVP stack (12 services + redpanda + caddy) |
| `.env.production.example` | every variable above, ready to fill |
| `Caddyfile` | TLS + host routing |
| `redis.conf` | production Redis config |
| `init-roles.sql` | creates `baalvion_app` role + grants (run before payment-service) |
| `RUNBOOK.md` | step-by-step AWS execution, schema order, S3/SES/Razorpay setup |
