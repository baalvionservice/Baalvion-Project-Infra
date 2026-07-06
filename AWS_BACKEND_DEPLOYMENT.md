# Baalvion — Backend Services Deployed on AWS

> **Scope:** This document describes the backend services deployed to AWS. The **current
> Release-1 production target is the consolidated stack** (`deploy/consolidated/`, §2–§6).
> The repo also retains **two earlier deployment pipelines** (per-service single-host and
> the 3-service core-stack) and a **Terraform IaC** layer — those are covered in §9–§10.
>
> **Generated:** 2026-07-01 · **Region:** `ap-south-1` (Mumbai) · **Trunk:** `main`
>
> **Three deploy pipelines exist** (all build → ECR → SSH-roll EC2, all OIDC-keyless):
> 1. `deploy-consolidated.yml` — **current** Release-1 stack (1 backend image, 6 Node + 1 JVM) ← §2–§6
> 2. `deploy.yml` — earlier per-service single-host stack (18 images) ← §9
> 3. `deploy-core-stack.yml` — minimal 3-service core slice (13 images) ← §9

---

## 1. TL;DR

- **45 backend repo modules** are packed into **ONE Docker image** (`baalvion/backend`)
  and supervised by `pm2-runtime`, split across **6 Node application containers**
  (each container = one bounded context, one pm2 "personality").
- **1 JVM service** (Java payment gateway) ships as a **separate image**
  (`baalvion/payment-service`), opt-in via the `payments` compose profile.
- Everything runs on **ONE EC2 host** (`baalvion-prod-01`, ap-south-1), fronted by an
  on-box **Caddy** edge for TLS + host/path routing.
- **PostgreSQL is AWS RDS** (external, TLS-required). **Redis + Neo4j + Caddy** run as
  on-box containers.
- Deploy is **build-in-CI → push to ECR → SSH-roll on EC2** via **GitHub OIDC** (no
  static AWS keys).

### What actually gets rolled vs. what is defined-but-not-auto-rolled

| Container | Status in the automated deploy | Notes |
|---|---|---|
| `app-identity` | ✅ **Rolled** every deploy | identity core |
| `app-platform` | ✅ **Rolled** every deploy | back-office + knowledge + infra utils |
| `app-ecosystem` | ✅ **Rolled** every deploy | crm + ir + jobs (slimmed) |
| `app-commerce` | ✅ **Rolled** every deploy | commerce + marketplace (slimmed) |
| `app-edge-realtime` | ✅ **Rolled** every deploy | public BFF + websockets + dispatch |
| `admin-web` | ⚠️ **Best-effort** (Next.js console — a frontend, not a backend) | rolled if its ECR image exists |
| `caddy` | ✅ Force-recreated every deploy | edge router |
| `redis`, `neo4j` | 🟢 Left running, untouched on roll | on-box backing stores |
| **`app-trade`** | 🟡 **Defined in compose but NOT in the roll list** | trade data-plane not auto-started |
| **`app-payments`** (JVM) | 🟡 **Opt-in `--profile payments`**, not in default roll | needs PSP keys / explicit bring-up |
| `kafka`, `zookeeper` | 🟡 **Opt-in `--profile kafka`** | event-driven ledger saga only |

> The deploy job's SSH script explicitly pulls + `up -d` only:
> `app-identity app-platform app-edge-realtime app-commerce app-ecosystem` (+ best-effort
> `admin-web`, + force-recreate `caddy`). `app-trade` and `app-payments` are **not** part
> of the automatic roll. (`.github/workflows/deploy-consolidated.yml:258-262`)

---

## 2. AWS Resources

| Resource | Value / Identifier | Source |
|---|---|---|
| **Region** | `ap-south-1` (Mumbai) | `deploy-consolidated.yml:46` |
| **Compute** | Single EC2 host `baalvion-prod-01` (~4 GiB single host) | compose header; SSH roll step |
| **On-box repo path** | `/opt/baalvion-core` | `deploy-consolidated.yml:233` |
| **Database** | **AWS RDS PostgreSQL** — `baalvion-prod.xxxxxxxx.ap-south-1.rds.amazonaws.com:5432`, DB `baalvion`, user `baalvion_app`, **TLS required** (`DB_SSL=true`, `sslmode=require`). One DB; each domain owns an isolated schema. | `.env.production.example:13-20` |
| **Container registry** | **Amazon ECR**, namespace `baalvion/*` — repos: `baalvion/backend` (Node), `baalvion/payment-service` (JVM), `baalvion/admin-web` (console) | `deploy-consolidated.yml:47,195` |
| **Image tags** | `prod-<short-sha>` (immutable rollback target) + `prod-latest` + `RELEASE_TAG` (`v1.0.1-production`) | `deploy-consolidated.yml:48,95-99` |
| **Object storage** | **S3** bucket `baalvion-prod-media` (trade/law/cms media) — uses EC2 instance role, no keys | `.env.production.example:82-84` |
| **Email** | **Amazon SES** over SMTP — `email-smtp.ap-south-1.amazonaws.com:587` (STARTTLS) | `.env.production.example:74-78` |
| **Logging** | **CloudWatch Logs**, log group `/baalvion/consolidated` (awslogs driver on every container) | `docker-compose.prod.yml:48-51` |
| **Auth to AWS** | **GitHub OIDC** role `AWS_DEPLOY_ROLE_ARN` (no static keys); EC2 instance role grants ECR pull + S3 | `deploy-consolidated.yml:16,67` |
| **Secrets** | Injected at deploy time from **SSM Parameter Store / Secrets Manager** into the box `.env` (gitignored) | `.env.production.example:3-9` |
| **Search (optional)** | OpenSearch (`OPENSEARCH_URL`) — commented; absent ⇒ documented degraded mode | `.env.production.example:86-88` |
| **Future scale-out** | Redis → ElastiCache, Kafka → MSK, OpenSearch domain | `.env.production.example` notes |

---

## 3. Deploy Mechanism

**Workflow:** `.github/workflows/deploy-consolidated.yml`
**Trigger:** push to `main` touching `Backend/**`, `Frontend/admin-platform/**`,
`deploy/consolidated/**`, or the workflow file itself (also `workflow_dispatch`).

```
git push main
  └─▶ Job 1  build-push          → build baalvion/backend  (deploy/consolidated/Dockerfile.node) → ECR
  └─▶ Job 1b build-push-admin-web → build baalvion/admin-web (Frontend/admin-platform)            → ECR  (non-fatal)
  └─▶ Job 2  deploy              → SSH baalvion-prod-01, pull + roll the app containers, reload Caddy
                                   (gated behind protected `production` environment — manual approval)
```

**Hard invariants:**
- The EC2 box **never builds** (low free disk); all image builds happen in CI.
- **OIDC only** — no static AWS keys anywhere.
- If `CORE_EC2_*` secrets are unset, the roll **skips** (stays green); the image is still
  pushed to ECR.
- An **SSL override** compose file mounts the RDS CA bundle + sets `NODE_EXTRA_CA_CERTS`
  on every app container (without it `auth-service`/`rbac-service` crash-loop against
  `force_ssl` RDS).

**Post-roll smoke test** hits: `api.baalvion.com/health`, `admin.baalvion.com/`,
`auth.baalvion.com/health`, `ws.baalvion.com/health`.

---

## 4. The Backend Services (by container)

> Image: `${ECR_REGISTRY}/baalvion/backend:${IMAGE_TAG}` — one image, `pm2-runtime` picks
> the per-container personality from `deploy/consolidated/pm2/*.config.js`.

### 4.1 `app-identity` — Identity & trust core (mem 1024 MiB) ✅ rolled
`pm2/identity.config.js`

| Service | Dir | Port |
|---|---|---|
| auth-service | identity/auth-service | **3001** |
| auth-gateway | identity/auth-gateway | **3026** |
| oauth-service | identity/oauth-service | 3023 |
| rbac-service | identity/rbac-service | 3053 |
| session-service | identity/session-service | 3022 |

### 4.2 `app-commerce` — Commerce + marketplace (mem 1280 MiB) ✅ rolled
`pm2/commerce.config.js` — *slimmed: only admin-console-managed services.
`order-service` deprecated; `trade-service` omitted.*

| Service | Dir | Port |
|---|---|---|
| commerce-service | commerce/commerce-service | **3012** |
| inventory-service | commerce/inventory-service | 3014 |
| fulfillment-service | commerce/fulfillment-service | 3016 |
| market-service | commerce/market-service | 3007 |
| marketplace-service | marketplace/marketplace-service | 3060 |

### 4.3 `app-ecosystem` — Ecosystem verticals (mem 1536 MiB) ✅ rolled
`pm2/ecosystem.config.js` — *slimmed to crm + ir + jobs. mining / brand / real-estate /
about / ctm / insiders run in their own standalone deployments, not on this box.*

| Service | Dir | Port |
|---|---|---|
| crm-service | ecosystem/crm-service | 3063 |
| ir-service | ecosystem/ir-service | **3008** (healthcheck probe) |
| jobs-service | ecosystem/jobs-service | 3002 (TalentOS backend for jobs.baalvion.com) |

### 4.4 `app-platform` — Back-office: platform + knowledge + infra utils (mem 1536 MiB) ✅ rolled
`pm2/platform.config.js`

| Service | Dir | Port | Context |
|---|---|---|---|
| admin-service | platform/admin-service | **3021** | platform |
| dashboard-service | platform/dashboard-service | 3009 | platform |
| tenant-service | platform/tenant-service | 3043 | platform |
| cms-service | knowledge/cms-service | 3018 | knowledge (central CMS, fires ISR revalidate webhooks) |
| imperialpedia-service | knowledge/imperialpedia-service | 3004 | knowledge |
| law-service | knowledge/law-service | 3015 | knowledge |
| audit-service | infrastructure/audit-service | 3032 | infra |
| developer-service | infrastructure/developer-service | 3042 | infra |
| report-service | infrastructure/report-service | 3041 | infra |
| search-service | infrastructure/search-service | 3036 | infra (OpenSearch client) |

### 4.5 `app-edge-realtime` — Public BFF + websockets + async dispatch (mem 896 MiB) ✅ rolled
`pm2/edge-realtime.config.js`

| Service | Dir | Port | Role |
|---|---|---|---|
| proxy-service | infrastructure/proxy-service | **4000** | consumer/admin BFF (sockets, payments, S3, SAML) |
| realtime-infra | infrastructure/realtime-service | 3040 | socket.io fan-out (ws.baalvion.com) |
| realtime-platform | platform/realtime-service | 3046 | hand-rolled WS telemetry |
| notification-service | infrastructure/notification-service | 3031 | 5 BullMQ workers |

### 4.6 `app-trade` — Global trade platform (mem 1024 MiB) 🟡 defined, NOT auto-rolled
`pm2/trade.config.js` — requires **Neo4j** (`network-graph-service` hard-exits without it).

| Service | Dir | Port |
|---|---|---|
| network-graph-service | trade/network-graph-service | 3047 |
| order-execution-service | trade/order-execution-service | **3052** |
| product-registry-service | trade/product-registry-service | 3048 |
| quality-inspection-service | trade/quality-inspection-service | 3050 |
| supplier-lifecycle-service | trade/supplier-lifecycle-service | 3051 |
| trade-documentation-service | trade/trade-documentation-service | 3049 |

> ⚠️ This container is in `docker-compose.prod.yml` but **not** in the deploy job's
> pull/roll list, so the trade data plane is not started by a normal deploy.

### 4.7 `app-payments` — JVM PSP gateway (mem 640 MiB) 🟡 opt-in `--profile payments`
Separate image `${ECR_REGISTRY}/baalvion/payment-service`, **not** the shared Node image.

| Service | Port | Notes |
|---|---|---|
| payment-service (Spring Boot) | **3015** | `/v1/gateway/**` (Razorpay/PayU/Stripe/Cashfree create, verify, capture, refund, webhooks). Runs with `APP_KAFKA_ENABLED=false` on the 4 GiB box (Kafka outbox rows stay PENDING). |

---

## 5. On-box Backing Services (containers, not app modules)

| Container | Image | Port(s) | Purpose |
|---|---|---|---|
| redis | `redis:7-alpine` | 6379 | cache / BullMQ / sessions (256 MB cap, noeviction) |
| neo4j | `neo4j:5` | 7474 / 7687 | graph store for `app-trade` |
| caddy | `caddy:2-alpine` | **80 / 443** | TLS termination + host/path routing (only container binding public ports) |
| zookeeper | `cp-zookeeper:7.6.1` | 2181 | opt-in `kafka` profile |
| kafka | `cp-kafka:7.6.1` | 9092 | opt-in `kafka` profile (event-driven ledger saga) |

---

## 6. Public Domains → Service Routing (Caddy edge)

`deploy/consolidated/caddy/Caddyfile`

| Domain | Routes to | Notes |
|---|---|---|
| **auth.baalvion.com** | `app-identity:3026` (auth-gateway) | central auth surface |
| **api.baalvion.com** | `app-edge-realtime:4000` (proxy BFF) | session-gated, with carve-outs below |
| ↳ `/api/v1/public/*` | `app-platform:3018` (cms-service) | **unauthenticated** public CMS delivery for live sites |
| ↳ `/v1/gateway/payments`, `/v1/gateway/webhooks/*` | `app-payments:3015` | PSP charge/status/webhooks; refund/capture/actuator **denied** at edge |
| ↳ `/api/v1/internal/*` | **403 Forbidden** | per-tenant key vault never exposed |
| **ws.baalvion.com** | `app-edge-realtime:3040` | realtime websocket stream |
| **admin.baalvion.com** | `admin-web:3030` (Next.js console) | + many same-origin BFF carve-outs ↓ |
| ↳ `/auth-bff/*` | `app-identity:3001` (rewrite → `/v1/auth/*`) | auth shim |
| ↳ `/api-bff/knowledge/cms/*` | `app-platform:3018` | CMS admin API |
| ↳ `/api-bff/platform/admin/*` | `app-platform:3021` | admin-service (dashboard stats, users, orgs) |
| ↳ `/api-bff/identity/session/*` | `app-identity:3022` | session-service |
| ↳ `/api-bff/identity/oauth/*` | `app-identity:3023` | oauth-service |
| ↳ `/api-bff/identity/rbac/*` | `app-identity:3053` | rbac-service |
| ↳ `/api-bff/platform/dashboard/*` | `app-platform:3009` | dashboard-service |
| ↳ `/api-bff/knowledge/imperialpedia/*` | `app-platform:3004` | imperialpedia-service |
| ↳ `/api-bff/knowledge/law/*` | `app-platform:3015` | law-service |
| ↳ `/api-bff/infrastructure/audit/*` | `app-platform:3032` | audit-service |
| ↳ `/api-bff/infrastructure/notification/*` | `app-edge-realtime:3031` | notification-service |
| ↳ `/api-bff/commerce/commerce|market|inventory|fulfillment/*` | `app-commerce:3012/3007/3014/3016` | commerce stack |
| ↳ `/api-bff/ecosystem/jobs|ir|crm/*` | `app-ecosystem:3002/3008/3063` | ecosystem (live on box) |
| ↳ `/api-bff/ecosystem/mining|real-estate|brand-connector|about|ctm/*` | `app-ecosystem:3003/3005/3006/3010/3017` | **routes exist but these modules are not in the slimmed ecosystem config** → 502 until added |

> **CORS origins** (`.env.production.example:69`) admit the live Vercel frontends:
> app/admin/auth/about/ir/mining/jobs.baalvion.com, imperialpedia.com,
> lawelitenetwork.com, amarisemaisonavenue.com, controlthemarket.com,
> proxy.baalvionstack.com.

---

## 7. Known Gaps / Caveats (from this config)

1. **Trade data plane not auto-deployed** — `app-trade` (6 modules) is defined but not in
   the roll list; `SVC_TRADE` points at `app-commerce:3025` where nothing runs. Trade
   APIs 502 until `app-trade` is brought up and routed.
2. **Payments JVM is opt-in** — `app-payments` only starts under `--profile payments` with
   real PSP keys; not part of the default roll.
3. **`admin-web` is best-effort** — requires an AWS admin to pre-create the ECR repo
   `baalvion/admin-web`; until then the admin console route 502s while backend carve-outs
   stay live.
4. **Some `/api-bff/ecosystem/*` routes have no backend on this box** (mining, real-estate,
   brand-connector, about, ctm) — those verticals deploy standalone elsewhere.
5. **Kafka off** — the JVM runs `APP_KAFKA_ENABLED=false` on the 4 GiB host; event-driven
   ledger outbox rows stay durably PENDING until the `kafka` profile is enabled on a larger
   host (→ MSK at scale).

---

## 9. Other Deployment Pipelines & Full ECR Image Inventory

The consolidated stack (§2–§6) is the current production path, but two earlier pipelines
remain in the repo and still build/push to ECR on `main`. All three share the same
OIDC-keyless build → ECR → SSH-roll pattern, ECR namespace `baalvion/*`, and tag scheme.

### 9.1 `deploy.yml` — per-service single-host stack (18 images)
`.github/workflows/deploy.yml` — builds one image per service and rolls a single EC2 host
running `deploy/ec2-single-host/docker-compose.yml` (Postgres/Redis/Redpanda on-box).

ECR images built:
`auth-service`, `rbac-service`, `audit-service`, `cms-service`, `commerce-service`,
`inventory-service`, `order-service`, `auth-gateway`, `notification-service`,
`payment-service` (Java), `controlthemarket-ctm-service`,
`proxy-baalvionstack-cms-service`, `proxy-baalvionstack-payment-service` (Java),
`proxy-baalvionstack-proxy-service`, `law-service`, `imperialpedia-service`,
`trade-service`, `gti-web` (Next.js).

### 9.2 `deploy-core-stack.yml` — minimal 3-service core slice (13 images)
`.github/workflows/deploy-core-stack.yml` — `workflow_dispatch` + push on
`deploy/core-stack/**`. A standalone auth/cms/payment slice with its own Caddy, Postgres,
Redis, Kafka/Zookeeper. ECR images: `core-auth-service`, `core-auth-baalvion` (sign-in
frontend), `core-cms-service`, `core-payment-service` (Java), `core-cms-tools`,
`core-rbac-service`, `core-audit-service`, `core-notification-service`,
`core-commerce-service`, `core-order-service`, `core-trade-service`,
`core-commerce-tools`, `core-order-tools`.

> **Note on status:** these pipelines *define and build* images; per project memory the
> core stack was retired and the consolidated stack is the live prod (`prod = main`). Treat
> §9 as the broader build surface, not a claim that all three are simultaneously serving
> traffic. Confirm with the running EC2 host / ECR `prod-latest` push times before relying
> on any one.

### 9.3 Stack topology variants (across pipelines)

| Stack | Pipeline / compose | Backends | Public surface |
|---|---|---|---|
| **A** MVP single-host | `deploy/ec2-single-host` | auth, rbac, audit, cms, commerce, inventory, order, auth-gateway, notification, payment(JVM) | api.baalvion.com |
| **B** ControlTheMarket | ecosystem (ctm-service) | ctm-service (3017), central SSO, Razorpay | controlthemarket.com / `/ctm/*` |
| **C** Proxy / BaalvionStack | `deploy/proxy-baalvionstack` | proxy-cms, proxy-payment(JVM), proxy-service | proxy.baalvionstack.com / `/proxy/*` |
| **D** Knowledge/Trade | consolidated app-platform/app-trade | law, imperialpedia, trade, gti-web | law/imperialpedia/trade domains |
| **Consolidated** Release-1 | `deploy/consolidated` (current) | 6 Node + 1 JVM (§4) | api/auth/ws/admin.baalvion.com |

---

## 10. Terraform IaC — Wider AWS Footprint

`Backend/infra/terraform/` defines a fuller AWS environment. **Much of it is
feature-flagged OFF** in `terraform.tfvars.example`; the live consolidated stack runs the
single-EC2 + RDS topology, not the EKS topology. Sizing values below are from the
Terraform variables and `AWS_DEPLOYMENT_RUNBOOK.md` (agent-sourced — verify against the
running account before acting).

### 10.1 Provisioned / in-use (single-host MVP)
| Resource | Spec |
|---|---|
| **RDS PostgreSQL 16** | `db.t4g.medium`, 50 GB gp3, encrypted, 7-day backups, **not** publicly accessible, no Multi-AZ in MVP (Terraform default `db.t3.small` / 20 GB; runbook overrides) |
| **ElastiCache Redis 7.1** | `cache.t4g.small`, single node, transit encryption + auth token, `noeviction` (Terraform default `cache.t3.micro`) — note the consolidated stack currently uses an **on-box Redis** container instead |
| **S3** | `baalvion-media-prod`, all public access blocked, SSE-S3 (AES256), CORS for baalvion.com / shop / admin |
| **SES** | `baalvion.com` + `noreply@baalvion.com`, DKIM via Route53, sandbox until prod access granted |
| **VPC** | `10.0.0.0/16`, AZs `ap-south-1a/1b`, public `10.0.1/2.0/24`, private `10.0.10/11.0/24`, IGW + NAT |
| **Secrets Manager** | ~14 secrets (`baalvion/jwt-keys`, `/jwt-symmetric`, `/gateway`, `/rbac`, `/inventory`, `/order`, `/cms`, `/audit`, `/db`, `/redis`, `/superadmin`, `/s3`, `/email`, `/razorpay`) |
| **Route53 + ACME** | A records → EC2 Elastic IP; Caddy auto-provisions Let's Encrypt TLS |

### 10.2 Defined but feature-flagged OFF (not deployed)
- **EKS** (`modules/eks`) — Kubernetes topology, off
- **ALB** (`enable_alb=false`)
- **WAF** (`enable_waf=false`)
- **CloudFront CDN** (`enable_cloudfront=false`)
- **Global edge** (Global Accelerator + GeoDNS, `edge_regions=[]`)
- **Kafka/MSK** — only via consolidated `--profile kafka`, default off

---

## 11. Source Files

| File | What it defines |
|---|---|
| `.github/workflows/deploy-consolidated.yml` | CI build → ECR → EC2 roll, smoke test |
| `deploy/consolidated/docker-compose.prod.yml` | container topology, mem limits, profiles, awslogs |
| `deploy/consolidated/docker-compose.ssl-override.yml` | RDS CA bundle / `NODE_EXTRA_CA_CERTS` |
| `deploy/consolidated/pm2/identity.config.js` | app-identity modules |
| `deploy/consolidated/pm2/commerce.config.js` | app-commerce modules |
| `deploy/consolidated/pm2/ecosystem.config.js` | app-ecosystem modules |
| `deploy/consolidated/pm2/platform.config.js` | app-platform modules |
| `deploy/consolidated/pm2/edge-realtime.config.js` | app-edge-realtime modules |
| `deploy/consolidated/pm2/trade.config.js` | app-trade modules |
| `deploy/consolidated/caddy/Caddyfile` | domain → service routing |
| `deploy/consolidated/.env.production.example` | AWS resource wiring (RDS, S3, SES, ECR, secrets) |
