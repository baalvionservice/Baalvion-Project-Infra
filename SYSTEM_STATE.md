# SYSTEM_STATE.md — Baalvion Platform Truth Model

> **Single source of truth** for the Baalvion monorepo. Evidence-based, generated from a
> full-repository audit. No assumptions; anything unverifiable is marked **UNKNOWN**.
>
> - **Generated:** 2026-06-01
> - **Method:** 17-agent evidence-based audit (14 component auditors across 6 backend domains
>   + 16 frontends + 21 packages, then 3 cross-cutting analysts for duplication, integration,
>   and infra/security). 871 tool calls, ~2M tokens of evidence. Key CRITICAL findings
>   re-verified by hand.
> - **Branch at audit time:** `feat/platform-foundation`
> - **Catalog reference:** `Backend/catalog/index.json` (lists 68 entries — see §10 for why
>   that count is misleading)
> - **Components catalogued:** 99 (61 backend service entries, 16 frontends, 21 packages, 1
>   garbage dir). After de-duplicating one double-audited service, ~98 real components.

## Legend

| Symbol | Classification | Meaning |
|---|---|---|
| 🟢 GREEN | PRODUCTION READY | Real data, builds, wired, real auth, no blocking mocks |
| 🟡 YELLOW | WORKING BUT INCOMPLETE | Runs, but mocks/gaps/missing config block full production use |
| 🔴 RED | BROKEN | Will not build/start as committed, or major breakage |
| ⚫ BLACK | NOT WIRED / MOCK-ONLY | Built but never run as a dependency, or only path is a mock |

**Integration / data labels:** `REAL` · `PARTIAL` · `SIMULATED` · `MOCK` · `MISSING` · `UNKNOWN`.

---

## 0. Readiness Snapshot

| Metric | Value |
|---|---|
| **Overall system readiness** | **≈ 63 / 100 — "Advanced prototype / pre-production"** |
| Backend services | 61 entries · avg **61/100** · 20 🟢 / 33 🟡 / 6 🔴 / 2 ⚫ |
| Frontend apps | 16 · avg **56/100** · 3 🟢 / 13 🟡 / 0 🔴 / 0 ⚫ |
| Shared packages | 21 · avg **75/100** · 16 🟢 / 2 🟡 / 3 ⚫ |
| Mocks / stubs found | **161** total — **10 CRITICAL**, 39 HIGH, 64 MEDIUM, 48 LOW |
| Duplications found | **15** — 2 CRITICAL, 4 HIGH, 6 MEDIUM, 3 LOW |
| Infra / security findings | 12 — 0 CRITICAL, 2 HIGH, 6 MEDIUM, 4 LOW |
| Data layer | 64 REAL · 18 PARTIAL · 16 UNKNOWN · 1 MOCK |

**One-paragraph truth:** The platform is a large, genuinely-built federated monorepo with a
**strong, real identity/auth core** (RS256 issuer + BFF gateway), **real shared infrastructure
libraries**, a **real multi-domain data layer** (Postgres-per-schema), and a **mature
observability + CI/CD + K8s/Helm story**. It is **not production-ready** because money, KYC,
sanctions, FX, messaging and AI flows are **simulated or partial**; several services **cannot
boot as committed** (missing `JWT_PUBLIC_KEY`); there is a **CRITICAL auth bypass** in two
duplicate Node finance services; and there is **substantial duplication** (Node-vs-Java finance
fork, twin Lovable backends, per-app admin consoles, phantom catalog entries). Most frontends
are wired to real backends for their primary surfaces but still ship mock admin/analytics
panels.

---

## 1. How to Run the System (verified from `package.json` + compose)

```bash
# 1. Install whole workspace (pnpm + Turborepo)
pnpm install

# 2. Bring up shared infra (single Postgres + Redis + pgAdmin)
pnpm run infra:up            # docker compose up -d postgres redis pgadmin
#    Postgres: localhost:5432  (db baalvion_db / user baalvion / pass baalvion_dev_pass)
#    Redis:    localhost:6379 ;  pgAdmin: localhost:5050

# 3. Generate the shared RS256 keypair (REQUIRED — many services fail-closed without it)
pnpm run generate:keys       # -> Backend/services/identity/.keys/jwt_{private,public}.pem

# 4. Run identity migrations (auth schema)
pnpm run migrate:auth

# 5. Dev (Turbo). Whole platform, or just the identity stack + admin console:
pnpm run dev                 # everything
pnpm run dev:identity        # auth + admin + session + oauth + admin-platform

# Architecture contract gate (catalog validate + enforce):
pnpm run architecture:check
```

**Java finance suite** runs from its own compose (isolated DB to avoid port clash):
```bash
cd Backend/services/commerce/financial-services-java
docker compose up           # Postgres on 5433, Redis on 6380, Kafka/Zookeeper
# Build needs Dockerized Maven with -Dapi.version=1.43 + Testcontainers 1.20.x (DooD)
```

> ⚠️ **BOOT BLOCKERS (as committed):** `about-service` and `law-service` `.env` files omit
> `JWT_PUBLIC_KEY`; their config calls `requireEnv('JWT_PUBLIC_KEY')` which **throws at
> startup**. Inject the shared RS256 public key (as sibling services do) before they will boot.

---

## 2. PHASE 1 — Full System Inventory

### 2.1 Frontend Applications (16)

| App | Path (`Frontend/`) | Port | Framework | Status | Score | Purpose / data reality |
|---|---|---|---|---|---|---|
| admin-platform | `admin-platform` | 3030 | Next.js 15 / React 19 | 🟢 | 88 | Central admin console; **REAL** via BFF to identity/CMS/commerce/jobs/payments/realtime |
| company-unified-Dashboard | `company-unified-Dashboard-main` | 3024 | Next.js 15 | 🟢 | 88 | Company ops dashboard; **REAL** (cookie/CSRF BFF → dashboard-service) |
| For Invstors and Founders | `For Invstors and Founders` | 8080 | Vite / React 18 | 🟢 | 88 | Insiders investor/founder SPA; **REAL** via gateway BFF → insiders-service |
| controlthemarket | `controlthemarket-main` | 3034 | Next.js 15 | 🟡 | 55 | SkillMatch talent platform; REAL via BFF → ctm-service, dev-only mock opt-in |
| Proxy-BaalvionStack | `Proxy-BaalvionStack` | 8080 | Vite / React 18 | 🟡 | 55 | Proxy-SaaS console; REAL → proxy-service; some mock save paths |
| IR-Baalvion | `IR-Baalvion-main` | 3027 | Next.js 15 | 🟡 | 55 | Investor relations portal; PARTIAL (CMS-live + mock panels) |
| insiders-seo | `insiders-seo` | 3060 | Next.js 15 | 🟡 | 62 | Public SEO surface for Insiders; REAL public reads |
| baalvion-elite-circle | `baalvion-elite-circle-main` | UNKNOWN | Vite / React 18 | 🟡 | 62 | Elite Circle social/deal-flow; REAL but legacy HS256 fallback + localStorage session |
| Law-Elite-Network | `Law-Elite-Network-main` | 9002 | Next.js 15 | 🟡 | 47 | Legal marketplace; data REAL → law-service, **payment flow MOCK** |
| about-baalvion | `about-baalvion-main` | 3020 | Next.js 15 | 🟡 | 47 | Public corporate site; CMS-live, **inquiry route in-memory + hardcoded admin key** |
| AmariseMaisonAvenue | `AmariseMaisonAvenue-main` | 3033 | Next.js 15 | 🟡 | 47 | Luxury storefront; storefront REAL, **~30-page admin console = simulation data** |
| Global-Trade-Infrastructure | `Global-Trade-Infrastructure-main` | 9003 | Next.js 15 | 🟡 | 39 | Trade OS; auth+trade REAL, **dashboard tiles from mock `services/api.ts`** |
| Imperialpedia | `Imperialpedia-main` | 3029 | Next.js 15 | 🟡 | 39 | Knowledge encyclopedia; public content REAL, **all admin/analytics mock-only** |
| Mining.Baalvion | `Mining.Baalvion-main` | 3028 | Next.js 15 | 🟡 | 39 | Mineral marketplace; **orders/leads/inventory services are MOCK** |
| brand-connector | `brand-connector-main` | 3035 | Next.js 15 | 🟡 | 39 | Influencer marketing; **email/payouts/escrow MOCK (Firestore-shaped shims)** |
| Baalvion-Jobs-Portal | `Baalvion-Jobs-Portal-main` | 3026 | Next.js 15 | 🟡 | 39 | Jobs/careers portal; **projects/teams/applications/email fully in-memory mock** |

### 2.2 Backend Services (61 entries, by domain)

Base dir: `Backend/services/<domain>/<service>`. Ports are as found in `.env` / `application.yml`
/ config (cited in audit evidence). **⚠ = port collision** (see §10).

#### identity (avg 83 🟢)
| Service | Port | Lang | Status | Score | Data | Auth | Purpose |
|---|---|---|---|---|---|---|---|
| auth-gateway | 3099 ⚠(env vs .env.example 3026) | Node/Express | 🟢 | 88 | REAL | RS256 verify + BFF cookies + HMAC identity headers | BFF / cookie trust-boundary gateway, signs server-resolved identity to ~25 backends |
| auth-service | 3001 | Node/Express 5 | 🟢 | 88 | REAL | **RS256 issuer** (canonical) | Central identity authority / SSO issuer + JWKS + MFA + refresh rotation |
| oauth-service | 3023 | Node/Express 5 | 🟢 | 88 | REAL | RS256 (shared key, federated) | OAuth2/OIDC server: auth-code+PKCE, client-creds, introspection, revocation |
| session-service | 3022 | Node/Express 5 | 🟢 | 88 | REAL | RS256 + HMAC internal | Session mgmt + login risk scoring (geo/device/impossible-travel) |
| rbac-service | 3055 ⚠(memory/catalog say 3005) | Node/Express 5 | 🟡 | 62 | REAL | RS256 verify | Hierarchical RBAC + ABAC PDP (`/v1/authorize`) |

#### commerce — Node (avg 55)
| Service | Port | Lang | Status | Score | Data | Auth | Purpose |
|---|---|---|---|---|---|---|---|
| commerce-service | 3012 | Node/Sequelize | 🟢 | 88 | REAL | RS256 | Storefront catalog: stores, products, categories, discounts |
| inventory-service | UNKNOWN | Node/Sequelize | 🟢 | 88 | REAL | RS256 | Warehouses, stock, adjustments, movements |
| fulfillment-service | UNKNOWN | Node/Sequelize | 🟢 | 88 | REAL | RS256 | Shipments, tracking, zones, rates, couriers |
| order-service | 3013 | Node/Sequelize | 🟡 | 54 | REAL | RS256 | Carts/orders/returns/invoices; **PSP adapters mock until keyed** |
| market-service | 3007 | Node/Sequelize | 🟡 | 55 | PARTIAL | RS256 | Personal investing tracker (portfolios, holdings, alerts) |
| trade-service | 3025 | Node/Sequelize | 🟡 | 54 | REAL | RS256 (+ unauth write routes) | GTI BFF/orchestrator; **7 logistics/insurance write routers have NO auth** |
| ledger-service (Node) | 3014 ⚠ | Node/Sequelize | 🔴 | 6 | REAL | **MOCK (random sub)** | **STALE DUPLICATE** of Java ledger-service; port+schema collision |
| payment-service (Node) | 3015 ⚠ | Node/Sequelize | 🔴 | 6 | REAL | **MOCK (random sub)** | **STALE DUPLICATE** of Java payment-service; no real PSP; port+schema collision |

#### commerce — `financial-services-java` suite (Spring Boot, avg 65)
> Maven multi-module suite. `ddl-auto=none` (Flyway owns schema). Documented system-of-record
> for money/KYC/risk. Pluggable `simulated|live` provider seams — **only `simulated` shipped**
> for every external rail/feed. `payment-rails-service` jar built (91 MB) but **not wired** to gateway.

| Service | Port | Status | Score | Data | Purpose / external reality |
|---|---|---|---|---|---|
| account-service | 3016 | 🟢 | 88 | REAL | Accounts + balances + KYC (AES-256-GCM docs) |
| ledger-service (Java) | 3014 ⚠ | 🟢 | 88 | REAL | **Canonical** double-entry ledger |
| escrow-service | 3017 | 🟢 | 88 | REAL | Escrow holds/release/refund/dispute + auto-release |
| reconciliation-service | 3019 | 🟢 | 88 | REAL | Internal-vs-external advice reconciliation |
| finance-audit-service | 3020 | 🟢 | 88 | REAL | Finance audit log + DLT replay + HMAC webhooks |
| wallet-service | 3039 | 🟢 | 88 | REAL | Multi-currency wallet (balances/holds/transfers) |
| common-security (lib) | n/a | 🟢 | 88 | REAL | RS256 resource-server starter + tenant/IDOR-safe ctx |
| payment-service (Java) | 3015 ⚠ | 🟡 | 54 | REAL | Payment saga + fee engine + bulk; **scheme adapter SIMULATED** |
| settlement-service | 3018 | 🟡 | 62 | REAL | Settlement batching + scheme files (SFTP in prod) |
| reporting-service | 3024 | 🟡 | 62 | REAL | Async report render CSV/JSON/XLSX |
| trade-finance-service | 3036 | 🟡 | 54 | REAL | LC (UCP600)/Guarantee (URDG758); **SWIFT MT700/760 SIMULATED** |
| credit-service | 3037 | 🟡 | 62 | REAL | Invoice finance + BNPL; **no credit-bureau (MISSING)** |
| fx-service | 3038 | 🟡 | 54 | REAL | FX rates/locks/forwards; **rates SIMULATED (sin-drift table)** |
| deal-room-service | 3040 ⚠ | 🟡 | 62 | REAL | Realtime bilateral negotiation + WebSocket |
| smart-contract-service | 3041 ⚠ | 🟡 | 62 | REAL | Incoterms/UCP600 contracts; **e-sign SIMULATED** |
| dispute-service | 3044 ⚠ | 🟡 | 62 | REAL | 3-tier AI→mediation→ICC arbitration |
| aml-service | 3045 | 🟡 | 62 | REAL | FATF rules-engine alerts + SAR workflow |
| trust-score-service | 3046 | 🟡 | 62 | REAL | 0–1000 composite counterparty trust score |
| trade-intelligence-service | 3043 ⚠ | 🟡 | 47 | PARTIAL | Demand/supplier-risk/NL/BTI; **all outputs SIMULATED heuristics** |
| risk-service | 3035 | 🟡 | 33 | PARTIAL | Fraud scoring + sanctions screening; **sanctions = ~9-entry SEED list** |
| payment-rails-service | 3042 ⚠ | ⚫ | 5 | REAL | Multi-rail routing REAL; **clearing SIMULATED + NOT wired to gateway** |

#### ecosystem (avg 43)
| Service | Port | Lang | Status | Score | Data | Purpose |
|---|---|---|---|---|---|---|
| agent-service | 3044 ⚠ | Node/Express 5 | 🟡 | 62 | REAL | Sales/partner agents, commissions, leaderboards |
| brand-connector-service | 3006 | Node/Express 5 | 🟡 | 54 | REAL | Influencer/brand CRM; **lead "scraping" fabricated (Math.random)** |
| ctm-service | 3017 ⚠ | Node/Express 5 | 🟡 | 62 | REAL | Talent-challenge platform; REAL Stripe/Razorpay/GitHub/Judge0 |
| ir-service | 3008 | Node/Express 5 | 🟡 | 62 | REAL | Investor relations: reports/filings/earnings/votes |
| jobs-service | 3002 | Node/Express 5 | 🟡 | 62 | REAL | TalentOS recruiting + async scoring/email |
| mining-service | 3003 | Node/Express 5 | 🟡 | 62 | REAL | Mineral trading marketplace + logistics |
| real-estate-service | 3005 | Node/Express 5 | 🟡 | 62 | REAL | AmariseMaisonAvenue property platform |
| about-service | 3010 | Node/Express 5 | 🔴 | 28 | REAL | About-site CMS; **boot blocker: missing JWT_PUBLIC_KEY** |
| elite-circle-service | 3051 | Node/Express 4 | 🔴 | 5 | REAL | Supabase-replacement; **local auth throws + payments SIMULATED** |
| insiders-service | 3050 | Node/Express 4 | 🔴 | 5 | REAL | Twin of elite-circle; **local auth throws + payments SIMULATED** |
| law-elite | gw 8090 | Polyglot (Node+Java) | ⚫ | 5 | MOCK | **Dead-demo** sub-stack (in-memory users/cases); duplicates law-service |

#### infrastructure (avg 74)
| Service | Port | Lang | Status | Score | Data | Purpose |
|---|---|---|---|---|---|---|
| audit-service | 3032 | Node/Express 5 | 🟢 | 88 | REAL | Immutable SHA-256 hash-chained audit log (WORM) |
| developer-service | 3042 ⚠ | Node/Express 5 | 🟢 | 88 | REAL | API keys, signed webhooks + retry, OpenAPI catalog |
| report-service | 3041 ⚠ | Node/Express 5 | 🟢 | 88 | REAL | Parameterized SQL report builder + scheduled delivery |
| search-service | 3036 ⚠ | Node/Express 5 | 🟢 | 88 | REAL | Tenant-scoped OpenSearch wrapper (full-text/fuzzy/facets) |
| realtime-service | 3040 ⚠ | Node/socket.io | 🟢 | 88 | REAL | Namespaced socket.io fan-out (/dashboard,/ir,/jobs,/admin,/ctm) |
| notification-service | 3031 | Node/Express 5 | 🟡 | 55 | PARTIAL | Multi-channel; **SMS/push/email partial (optional deps)** |
| proxy-service | 4000 | Node/Express 5 | 🟡 | 39 | PARTIAL | Proxy-SaaS control plane (~150 endpoints); **provider adapters MOCK+orphaned, email stub** |

#### knowledge (avg 51)
| Service | Port | Lang | Status | Score | Data | Purpose |
|---|---|---|---|---|---|---|
| cms-service | 3018 | Node/Express 5 | 🟢 | 88 | REAL | Enterprise multi-website CMS + revisions/workflow/media |
| imperialpedia-service | 3004 | Node/Express 5 | 🟡 | 54 | REAL | Knowledge encyclopedia; **market prices/sentiment from seed rows** |
| ml-service | 8000 | Python/FastAPI | 🟡 | 55 | PARTIAL | scikit-learn/statsmodels inference; **HMAC fails-open if secret unset** |
| law-service | 3015 ⚠ | Node/Express 5 | 🔴 | 5 | REAL | Legal platform; **boot blocker (missing key) + payments/payouts SIMULATED** |

#### platform (avg 56)
| Service | Port | Lang | Status | Score | Data | Purpose |
|---|---|---|---|---|---|---|
| admin-service | 3021 | Node/Express 5 | 🟡 | 46 | REAL | Super-admin ops; **payments console seeded with synthetic data** |
| dashboard-service | 3009 | Node/Express 5 | 🟡 | 62 | REAL | Company unified dashboard backend |
| tenant-service | 3043 ⚠ | Node/Express 5 | 🟡 | 54 | REAL | White-label tenant registry + DNS/branding; **HS256 dev-secret fallback** |
| realtime-service (platform) | 3026 | Node (RFC6455) | 🟡 | 62 | REAL | Hand-rolled WebSocket live-metrics feed for admin Infrastructure page |

> **NOTE:** `infrastructure/realtime-service` (socket.io, :3040) and `platform/realtime-service`
> (hand-rolled RFC6455, :3026) are **two distinct physical services** with overlapping purpose
> → see Duplication D-04. One catalog descriptor conflates them.

### 2.3 Shared Packages (`Backend/packages/`, 21)

| Package | Status | Score | Build | Notes |
|---|---|---|---|---|
| @baalvion/auth-node | 🟢 | 88 | cjs | Canonical JWT authority (RS256/JWKS) — the only home for `jsonwebtoken` |
| @baalvion/auth-sdk | 🟢 | 88 | tsup | Frontend auth SDK (gateway BFF cookie-refresh mode) — **under-adopted** (see D-10) |
| @baalvion/cache | 🟢 | 88 | cjs | Redis read-through cache, single-flight, tenant-scoped keys |
| @baalvion/config | 🟢 | 88 | tsup | Zod env validation, fail-fast |
| @baalvion/crypto | 🟢 | 88 | tsup | Tokens/HMAC/SHA-256/JWKS-kid |
| @baalvion/errors | 🟢 | 88 | tsup | AppError + typed error factories |
| @baalvion/events | 🟢 | 88 | tsup | Redis/NATS/Kafka publishers + outbox + idempotent consumers |
| @baalvion/graceful-shutdown | 🟢 | 88 | tsup | SIGTERM drain |
| @baalvion/logger | 🟢 | 88 | tsup | Pino structured logging + redaction |
| @baalvion/rbac | 🟢 | 88 | tsup | 7-level role hierarchy + Express guards |
| @baalvion/response | 🟢 | 88 | tsup | Standard HTTP envelopes |
| @baalvion/search | 🟢 | 88 | tsup | OpenSearch client/indexer/query builder |
| @baalvion/telemetry | 🟢 | 88 | tsup | OTel SDK 2.x traces+metrics + Pino correlation |
| @baalvion/tenancy | 🟢 | 88 | cjs | Postgres RLS (ENABLE+FORCE, ALS tenant ctx) |
| @baalvion/types | 🟢 | 88 | dts | Shared TS types |
| @baalvion/validation | 🟢 | 88 | tsup | Shared Zod schemas |
| @baalvion/contracts | 🟡 | 62 | proto+JSON | gRPC/event contracts; CI source-of-truth |
| @baalvion/middleware | 🟡 | 62 | tsup | Shared Express middleware (auth/CSRF/rate-limit/HMAC) |
| @baalvion/security | ⚫ | 15 | **none** | CSP/cookie/rate-limit helpers — **0 importers** (raw .ts, never built) |
| @baalvion/service-kit | ⚫ | 15 | **none** | "Golden path" bootstrap — **never built, 0 consumers** |
| @baalvion/upload | ⚫ | 15 | **none** | S3/MinIO presign + sharp — **real code, 0 importers** |

### 2.4 Infrastructure components

- **CI/CD:** 16 GitHub Actions workflows (`.github/workflows/`) — `ci.yml`, `platform-cicd.yml`,
  `domain-services.yml`, `financial-services.yml`, `deploy-staging.yml`, `codeql.yml`,
  `scorecard.yml`, `dependency-review.yml`, per-app (`jobs-service`, `ctm-*`, `law-service`),
  governance (`commitlint`, `labeler`, `stale`).
- **Docker:** `docker-compose.yml` (~30 services, profiles identity/backend/commerce),
  `docker-compose.observability.yml`, `docker-compose.baalvion-os.yml` (Keycloak+MinIO),
  `docker/observability/docker-compose.yml` (OTel/Loki/Jaeger/Alertmanager),
  `financial-services-java/docker-compose.yml` (isolated 5433/6380). 36 Dockerfiles.
- **K8s/Helm:** `Backend/infra/helm/baalvion-service` (HPA 2–10, PDB, NetworkPolicy,
  ServiceMonitor) + kustomize multi-region overlays (us-east/eu/india/sea) + ArgoCD GitOps,
  CNPG Postgres, Redis-HA, NATS JetStream, Velero DR.
- **Observability:** OTel Collector + Prometheus (+alert rules) + Loki/Promtail + Jaeger +
  Alertmanager + 5 Grafana dashboards. `@baalvion/logger` + `@baalvion/telemetry`.
- **Datastores:** single shared **Postgres** (`baalvion_db`, per-domain schemas via
  `docker/init.sql`) + single shared **Redis**. Java suite uses its own Postgres/Redis.
- **Catalog/governance:** `Backend/catalog/` (validate + enforce contract, CI-gated).

---

## 3. PHASE 2 — System Health Matrix

| Classification | Backend | Frontend | Package | Infra | Total |
|---|---|---|---|---|---|
| 🟢 PRODUCTION READY | 20 | 3 | 16 | 0 | **39** |
| 🟡 WORKING/INCOMPLETE | 33 | 13 | 2 | 0 | **48** |
| 🔴 BROKEN | 6 | 0 | 0 | 1 | **7** |
| ⚫ NOT WIRED/MOCK | 2 | 0 | 3 | 0 | **5** |

**🔴 RED (7):** `commerce/ledger-service` (Node), `commerce/payment-service` (Node),
`financial-services-java;C` (garbage dir), `about-service` (boot blocker),
`elite-circle-service` (auth throws + sim payments), `insiders-service` (same),
`law-service` (boot blocker + sim payments).

**⚫ BLACK (5):** `payment-rails-service` (sim-only + unwired), `law-elite` (dead demo),
`@baalvion/security`, `@baalvion/service-kit`, `@baalvion/upload` (built-but-unwired libs).

---

## 4. PHASE 3 — Duplication Report (15)

| # | Sev | Action | Title | Locations |
|---|---|---|---|---|
| D-01 | 🔴 CRITICAL | REMOVE | Node `commerce/payment-service` duplicates Java `payment-service` (same port 3015 + schema `payments`); Node copy is a stub with broken auth | `Backend/services/commerce/payment-service` vs `…/financial-services-java/payment-service` |
| D-02 | 🔴 CRITICAL | REMOVE | Node `commerce/ledger-service` duplicates Java `ledger-service` (same port 3014 + schema `ledger`) | `Backend/services/commerce/ledger-service` vs `…/financial-services-java/ledger-service` |
| D-03 | 🟠 HIGH | REMOVE | Identical placeholder auth middleware copy-pasted across the two Node finance stubs (accepts any Bearer, random sub) | `…/ledger-service/middleware/authMiddleware.js`, `…/payment-service/middleware/authMiddleware.js` |
| D-04 | 🟠 HIGH | MERGE | Two `realtime-service` implementations (platform RFC6455 :3026 vs infrastructure socket.io :3040) doing overlapping live-metrics fan-out | `Backend/services/platform/realtime-service` vs `…/infrastructure/realtime-service` |
| D-05 | 🟠 HIGH | REMOVE | `law-elite` dead-demo polyglot stack duplicates the real `law-service` legal domain | `Backend/services/ecosystem/law-elite` vs `…/knowledge/law-service` |
| D-06 | 🟠 HIGH | REFACTOR | `insiders-service` and `elite-circle-service` are byte-near-identical Lovable twins (identical `lib/`, differ only in schema + port) | `…/ecosystem/insiders-service` vs `…/ecosystem/elite-circle-service` |
| D-07 | 🟠 HIGH | REMOVE | Per-app admin consoles in 7+ frontends violate the ONE-central-admin-platform policy | Imperialpedia/brand-connector/Mining/Amarise/about/IR/Law-Elite `src/app/admin` |
| D-08 | 🟡 MED | REFACTOR | Three audit trails: Node `audit-service` vs Java `finance-audit-service` vs phantom catalog `audit-platform` | `infrastructure/audit-service`, `…/financial-services-java/audit-service`, `catalog/services/audit-platform.yaml` |
| D-09 | 🟡 MED | REFACTOR | Catalog phantom/aliased entries: `audit-platform` + `proxy-platform` both point at `proxy-service`; `notification-platform`≡`notification-service`; `proxy-gateway`≡`gateway`; several `*-platform` names have no dir | `Backend/catalog/services/*.yaml`, `catalog/index.json` |
| D-10 | 🟡 MED | REFACTOR | ~14 frontends re-implement the identical BFF auth client instead of using `@baalvion/auth-sdk` (which they already depend on) | `Frontend/*/src/lib/{auth-client,api-client,authClient}.ts` vs `packages/auth-sdk` |
| D-11 | 🟡 MED | MERGE | Two parallel observability compose stacks (both Prometheus :9090 + Grafana) | `docker-compose.observability.yml` vs `docker/observability/docker-compose.yml` |
| D-12 | 🟡 MED | REFACTOR | Two diverged Supabase-compat client adapters (insiders rewired to BFF; elite-circle still localStorage) | `Frontend/For Invstors and Founders/src/integrations/supabase/client.ts` vs `…/baalvion-elite-circle-main/…` |
| D-13 | 🟢 LOW | REFACTOR | Catalog lists packages (`auth-node`, `cache`, `tenancy`) as services, inflating the count | `catalog/index.json` |
| D-14 | 🟢 LOW | REMOVE | Empty/garbage dirs: `financial-services-java;C` (shell-mangled) and `Backend/infra/gateway` (empty; real config is in `infra/api-gateway`) | as listed |
| D-15 | 🟢 LOW | REMOVE | GTI & Jobs-Portal carry duplicate/legacy api-client copies in `src/services` alongside `src/lib` | `Global-Trade-Infrastructure-main`, `Baalvion-Jobs-Portal-main` |

---

## 5. PHASE 4 — Mock / Fake System Report

**Totals:** 161 mocks — **10 CRITICAL · 39 HIGH · 64 MEDIUM · 48 LOW.** Production-blocking
items below.

### 5.1 🔴 CRITICAL (10) — block production / money-safety / auth-safety

| # | Component | Location | Replaces | Risk |
|---|---|---|---|---|
| M-01 | payment-service (Node) | `middleware/authMiddleware.js:19-24` | Real RS256/JWKS verification — **accepts ANY Bearer, assigns random `sub`** | AUTH BYPASS |
| M-02 | ledger-service (Node) | `middleware/authMiddleware.js:20-30` | Same auth bypass | AUTH BYPASS |
| M-03 | risk-service (Java) | `provider/SeedSanctionsListProvider.java:30-93` (`provider=seed`) | Authoritative OFAC/UN/EU watchlists — **only ~9 hardcoded seed entries "retained for screening tests"** | COMPLIANCE |
| M-04 | payment-rails-service (Java) | `provider/SimulatedRailProvider.java` | Real SWIFT/SEPA/ACH/UPI/Pix/M-Pesa clearing — **accepts EVERY instruction, mints fake refs**; no `psp` adapter exists | MONEY |
| M-05 | elite-circle-service | `payments/index.js:19-93` | Real payment SDK calls — `// LIVE:` code **commented out**; synthetic order/charge ids even when keyed | MONEY |
| M-06 | elite-circle-service | `controller/functionsController.js:116-130,281-302` | Real settlement — marks membership `active`/`paid` with `demo_<ts>` ref, no money movement | MONEY |
| M-07 | insiders-service | `payments/index.js:19-93` | Same as M-05 (twin) | MONEY |
| M-08 | insiders-service | `controller/functionsController.js:114-130,280-302` | Same as M-06 (twin) | MONEY |
| M-09 | law-elite | `services/payment-service/.../PaymentController.java:15-22` | Real payment — `/process` returns `TX_<uuid>` SUCCESS unconditionally, no persistence | MONEY |
| M-10 | law-service | `controller/paymentController.js:109-112,138-141` | Real Razorpay charge/verify — auto-sets `status=succeeded gateway=simulated` when unconfigured | MONEY |

### 5.2 🟠 HIGH (39) — grouped

- **Java finance suite simulated rails/feeds:** `payment-service` `SimulatedSchemeAdapter` (ISO8583),
  `trade-finance-service` `SimulatedIssuingBankAdapter` (SWIFT MT700/MT760), `fx-service`
  `SimulatedFxRateProvider` (**FX rates = hardcoded anchor table + sin-drift; no live feed; no `live` bean**),
  `trade-intelligence-service` `SimulatedIntelligenceProvider` (**all ML outputs are deterministic heuristics; no ml-service adapter**).
- **Auth dead-ends:** `elite-circle-service`/`insiders-service` `utils/jwtserver.js` `signAccessToken` **throws** (breaks local login/register); `insiders` `gatewayIdentity` placeholder password_hash.
- **Tenant auth weakness:** `tenant-service` `.env`/`appConfig.js` → **shared well-known HS256 dev secret** when `JWT_PUBLIC_KEY` unset.
- **trade-service:** 7 logistics/insurance write routers (`insuranceRoutes`, `carbonRoutes`, `billOfLadingRoutes`, `carrierRoutes`, `certificateOfOriginRoutes`, `customsRoutes`, `insuranceClaimsRoutes`) **import no auth middleware** (anonymous POST quote/bind/pay/issue).
- **order-service:** `service/paymentProvider.js` mock PSP + in-memory intents.
- **proxy-service:** BrightData/Oxylabs/Smartproxy adapters fully fake **and orphaned** (not wired); `emailWorker` stub.
- **brand-connector-service:** `acquisitionController.js` fabricates "scraped" leads with `Math.random()`.
- **imperialpedia-service:** market asset prices/sentiment served from seeded DB rows (no live feed).
- **law-service:** billing worker writes simulated subscription payments; lawyer payouts settled in simulated mode (no real disbursement).
- **admin-service:** `bootstrapPayments.js` seeds 120 synthetic transactions; refunds/webhook-retry are DB-only (no provider call).
- **Frontends (mock data layers):** GTI (`services/api.ts` placeholder), Imperialpedia (`mock-api` for all admin/analytics/users/roles), Mining (orders/leads/inventory mock), brand-connector (email/payouts/escrow mock + Firestore shims), Law-Elite (`paymentService.savePaymentMock`), about (`/api/inquiry` in-memory + hardcoded admin key), Amarise (~30 admin pages on simulation hook), Jobs-Portal (projects/teams/applications/email fully in-memory).

> Full MEDIUM (64) + LOW (48) lists are in the audit evidence file. Most MEDIUM/LOW are dev
> fallbacks (console-log mailers, in-memory Redis fallbacks) that degrade gracefully and do not
> block production by themselves.

---

## 6. PHASE 5 — Integration Map

### 6.1 Authentication / Authorization flow (REAL, with islands)

Centralized **RS256 single issuer** = `auth-service:3001` via `@baalvion/auth-node` (signs
access+refresh with shared RSA private key, publishes JWKS; canonical claims
`sub/org_id/sid/jti` + `roles[]/permissions[]`). **`auth-gateway:3099` is the BFF front door:**
proxies login/register/refresh/logout server-to-server, sets HttpOnly access+refresh cookies +
JS-readable CSRF cookie, binds a Redis session, and **never returns the access token to the
browser**. For data calls it enforces a trust boundary on `/api/*`: strips all client-supplied
identity headers, then injects only server-resolved **signed** identity (`x-user-id/x-org-id/
x-roles/x-session-id` + HMAC `x-gateway-signature` + Phase-7 signed envelope). Modern Node
services verify via `@baalvion/auth-node createAuthMiddleware`; the Java suite verifies the same
RS256 contract via `common-security`. `oauth-service` uses the same key (federated, not a 2nd
issuer).

**Non-canonical surfaces / islands:**
- HS256 dev-fallback (verify-only) when `JWT_PUBLIC_KEY` unset: `rbac-service`, `tenant-service`,
  `agent-service`, and dev fallbacks in audit/developer/report/search. ⚠ `tenant-service` uses a
  well-known shared dev secret.
- Gateway-only BFF islands: `elite-circle-service`/`insiders-service` (Bearer removed; trust HMAC
  envelope from gateway; local HS256 issuance retired/throws).
- `law-elite` = dead in-memory demo (gateway RS256, downstream no auth).
- **CRITICAL:** Node `commerce/ledger-service`/`payment-service` placeholder middleware = **no
  verification, random principal**.
- `ml-service` HMAC service-auth **fails OPEN** if `ML_SERVICE_SECRET` unset (dev).

### 6.2 External providers (23) — real vs simulated

| Provider | Category | Status | Used by |
|---|---|---|---|
| Frankfurter / ECB | FX rates | 🟢 REAL | trade-service |
| Java `fx-service` feed | FX rates | 🔵 SIMULATED | fx-service, brand-connector FE, Amarise FE |
| Sumsub | KYC | 🟢 REAL | proxy-service |
| Stripe | Payments | 🟢 REAL | ctm-service, proxy-service |
| Razorpay | Payments | 🟢 REAL (verify computes HMAC) | ctm-service, proxy-service, law-service, elite/insiders |
| PayU / Coinbase Commerce | Payments/crypto | 🟡 PARTIAL | proxy-service, elite/insiders, brand-connector |
| SWIFT/SEPA/ACH/UPI/Pix/M-Pesa rails | Payment rails | 🔵 SIMULATED | payment-rails-service |
| Java payment scheme rails | Payment rails | 🔵 SIMULATED | payment-service (Java), trade-service |
| SWIFT MT700/MT760 + DocuSeal | Trade finance + e-sign | 🔵 SIMULATED | trade-finance-service, smart-contract-service |
| OFAC/UN/EU watchlists | Sanctions | 🟡 PARTIAL (seed list) | risk-service, GTI FE |
| Credit bureau / scoring vendor | Credit/trust | 🔴 MISSING | credit-service, trust-score-service, trade-intelligence |
| Twilio | SMS | 🟡 PARTIAL | notification-service, trade-service |
| Resend/SMTP/SES/Postmark | Email | 🟡 PARTIAL | notification, auth, jobs, law, trade, admin |
| Google Gemini / Genkit | AI/LLM | 🟡 PARTIAL (keyless fallback) | many FEs + elite/insiders, imperialpedia, trade-intel/dispute |
| FCM / Web Push | Push | 🟡 PARTIAL | notification-service, brand-connector FE |
| OpenSearch / Elasticsearch | Search | 🟢 REAL | search-service, jobs-service, finance-audit |
| MinIO / S3 / R2 | Object store | 🟢 REAL | cms, jobs, proxy, law, @baalvion/upload |
| SAML / OIDC | Enterprise SSO/SCIM | 🟢 REAL | proxy-service |
| GitHub API / Judge0 | Dev/code-exec | 🟢 REAL | ctm-service |
| DNS / TLS issuance | Domain provisioning | 🟡 PARTIAL | tenant-service |
| geoip-lite / IP reputation | Geo-IP/threat | 🟡 PARTIAL | session-service, auth-gateway |
| Daily / Jitsi | Video | 🟢 REAL | law-service |
| BrightData/Oxylabs/Smartproxy | Proxy IP upstream | ⚫ MOCK (orphaned) | proxy-service, proxy-gateway (Go) |

### 6.3 Key flows (status)

- 🟢 admin-platform / company-dashboard / controlthemarket / Proxy / Imperialpedia / Insiders /
  Amarise / Jobs-Portal → **auth-gateway BFF → auth-service** + their domain backend (cookie/CSRF).
- 🟢 **Java finance → trade-service** `POST /v1/internal/finance-events` (HMAC-SHA256 webhook,
  idempotency, projects onto Payment/Order read models + realtime fan-out).
- 🟢 auth-gateway `/api/*` → Java finance microservices :3036-3046 (FINANCE route table,
  X-Tenant-ID injected, RS256 hybrid bearer).
- 🟢 proxy-service (Node control plane) → **proxy-gateway (Go data plane)** in `Backend/gateway`.
- 🟡 GTI → trade-service (auth/trade REAL, **landing dashboard tiles MOCK**).
- 🟡 trade-service → Java payment-service :3015 (`financeClient.js` — but :3015 is **shadowed by the
  Node payment stub**, a port collision risk).
- 🟡 Law-Elite FE → law-service (data) — but **payment is mock** and law-service won't boot without its key.
- 🟡 baalvion-elite-circle FE → auth-service RS256 with **legacy HS256 fallback + localStorage**.
- 🟡 trade-intelligence/dispute (Java) → ml-service (HMAC, replay window) — ml returns real models
  but Java side ships only the simulated provider.
- ⚫ law-elite gateway → in-memory user/case services (demo).

---

## 7. PHASE 6 — Infrastructure & Production Readiness + Security

### 7.1 Assessment

- **CI/CD (mixed):** Strong governance (always-on `architecture:check`, CodeQL JS+Java, Trivy
  pinned, gosec, Scorecard, dependency-review, commitlint). Java suite runs `mvn clean verify`
  with Testcontainers + image Trivy scans. **Gaps:** no repo-wide lint/type-check in CI; the
  `scripts/ci/check-jwt-*` auth-invariant guards exist but **are never invoked by any workflow**;
  many service jobs are `test --if-present` (no tests = silent pass); ~28 catalog services have
  no dedicated CI; overlapping image-build pipelines with inconsistent image naming; legacy flat
  paths in `jobs-service.yml`/`ctm-service.yml`.
- **Docker (mature):** multi-stage Turbo-pruned Node builds; healthchecks; resource limits.
  **Single shared Postgres with per-domain schemas** (schema isolation, not credential isolation,
  under one owner role). Only 4/36 Dockerfiles set a non-root `USER`. Compose `replicas` is
  effectively 1 (Swarm-only).
- **Env separation (inconsistent):** PROD = K8s/Helm + ArgoCD + multi-region overlays. **STAGING =
  a single VM running the dev docker-compose with dev passwords** — does not exercise the K8s path.
  No per-env `.env`/values overlays beyond region patches.
- **Secrets (good):** `.gitignore` covers `.env`/keys/certs; `git ls-files` confirms **no tracked
  secrets**; only matches are RFC test vectors / dev defaults / a masked Slack token in CTM mock
  data. CI uses GitHub secrets + OIDC. (Push-protection setting can't be confirmed from the tree.)
- **Observability (strong):** full OTel/Prometheus/Loki/Jaeger/Alertmanager stack + 5 Grafana
  dashboards; `@baalvion/telemetry` (OTel 2.x). Gap: two parallel observability stacks; per-service
  `/metrics` adoption partial.
- **Security (well-designed, enforcement gaps):** centralized RS256, rbac-service PDP, `@baalvion/
  tenancy` RLS, Zod validation, helmet/cors, Go-gateway rate limiter. **Weaknesses below.**
- **Scalability (good at K8s, bottlenecked at data):** HPA 2–10 + PDB + NetworkPolicy + CNPG +
  Redis-HA + NATS. **Single shared Postgres + single shared Redis are the platform-wide
  bottleneck/blast-radius; no PgBouncer visible.** App-layer rate limiting is per-process.

### 7.2 Infra/security findings

| Sev | Area | Finding |
|---|---|---|
| 🟠 HIGH | cicd | RS256-only auth-invariant guard scripts exist but **no workflow runs them** (islands go uncaught) |
| 🟠 HIGH | security | **6 production DB configs set `ssl.rejectUnauthorized:false`** (order/inventory/fulfillment-service + proxy-service ×3) → DB MITM exposure |
| 🟡 MED | security | App-layer rate limiter is per-process in-memory (won't hold across HPA replicas) |
| 🟡 MED | docker | Most images run as root |
| 🟡 MED | scalability | Single shared Postgres + Redis = platform bottleneck/blast radius |
| 🟡 MED | security | Single shared DB owner role with `GRANT ALL` undermines RLS tenant isolation (tenancy needs NOSUPERUSER role) |
| 🟡 MED | envSeparation | Staging = dev compose on one VM; diverges from prod K8s/Helm |
| 🟡 MED | cicd | Service CI lacks lint/type-check; several jobs build-only |
| 🟢 LOW | cicd | Overlapping image pipelines, inconsistent image naming |
| 🟢 LOW | cicd | ~28 catalog services have no dedicated CI |
| 🟢 LOW | observability | Two parallel observability stacks; partial /metrics scraping |
| 🟢 LOW | cicd | GitOps deploy commits image-tag bumps directly to repo from CI |

---

## 8. PHASE 7 — Gap Analysis (Critical First)

### 🔴 CRITICAL
1. **Auth bypass in Node `commerce/payment-service` + `ledger-service`** — accept any Bearer,
   assign a random principal. Remove the services (they are stale duplicates of the Java ones).
2. **Money never moves** — every payment "live" path is simulated or commented out:
   `payment-rails-service`, Java `payment-service` scheme adapter, `elite-circle`/`insiders`
   checkout, `law-service` billing/payouts, `law-elite` PaymentController. No real PSP settlement.
3. **Sanctions screening is a ~9-entry seed list** (`risk-service`), not authoritative OFAC/UN/EU
   data — a compliance gap if any trade flow relies on it.
4. **FX rates are simulated** (`fx-service` sin-drift table; no live feed/bean) — any pricing/
   forward built on it is fictional.

### 🟠 HIGH
5. **Boot blockers:** `about-service` and `law-service` throw at startup (missing `JWT_PUBLIC_KEY`).
6. **Broken local auth:** `elite-circle-service` / `insiders-service` login/register/refresh throw
   (`signAccessToken` retired) — only work behind the gateway.
7. **Unauthenticated write routes** in `trade-service` (insurance/logistics/customs POST endpoints).
8. **DB TLS verification disabled** in 6 production configs.
9. **CI does not enforce the RS256-only invariant** (guard scripts unwired) → HS256 islands persist.
10. **`tenant-service` falls back to a shared well-known HS256 dev secret.**
11. **Trade intelligence is fake** (`trade-intelligence-service` all-heuristic; no ml-service link;
    credit-bureau MISSING for credit/trust scoring).

### 🟡 MEDIUM
12. Major **duplication** (Node-vs-Java finance fork; twin Lovable backends; two realtime services;
    `law-elite` vs `law-service`; per-app admin consoles; phantom catalog entries).
13. **Port collisions** (Java trade suite 3040–3046 overlaps Node infra/ecosystem; 3014/3015 Node
    vs Java; rbac 3055-vs-3005 doc drift) — only some can run together.
14. **Single shared Postgres/Redis** bottleneck + single-owner role weakening RLS.
15. **Frontend mock data layers** in ~9 apps (admin/analytics/orders/leads/email panels).
16. **Staging ≠ prod topology**; root-running containers; per-process rate limiting.

### 🟢 LOW
17. Garbage dirs (`financial-services-java;C`, `Backend/infra/gateway`); duplicate api-clients;
    catalog counts packages as services; two observability stacks; ~28 services without CI.

---

## 9. PHASE 8 — Readiness Scores (0–100)

**Scoring rubric:** base by classification (🟢88/🟡62/🔴28/⚫15), then −22 for any CRITICAL mock,
−8 per HIGH mock (cap −16), −14 MOCK data / −7 PARTIAL data; clamped 5–98.

| Layer / domain | Avg score | n |
|---|---|---|
| Backend — identity | **83** | 5 |
| Backend — infrastructure | **74** | 7 |
| Backend — finance-java suite | **65** | 21 |
| Backend — platform | **56** | 4 |
| Backend — commerce-node | **55** | 8 |
| Backend — knowledge | **51** | 4 |
| Backend — ecosystem | **43** | 11 |
| **Backend (all)** | **61** | 61 |
| **Frontend (all)** | **56** | 16 |
| **Packages (all)** | **75** | 21 |
| Infrastructure layer | **~70** (strong design, enforcement gaps) | — |
| **OVERALL SYSTEM** | **≈ 63** | — |

**Why not higher:** money/KYC/sanctions/FX simulated (−); CRITICAL auth bypass + boot blockers
(−); duplication & port collisions (−); frontend mock panels (−); CI doesn't enforce auth
invariants; single-DB bottleneck. **Why not lower:** real RS256 auth core, real shared libs,
real per-domain data layer, mature observability/CI/K8s, most primary frontend surfaces wired
to real backends.

---

## 10. PHASE 9 — Execution Roadmap (production path)

### Stage 0 — Critical blockers (do first)
1. **Delete** Node `commerce/ledger-service` + `commerce/payment-service` (D-01/02/03) — kill the
   auth bypass and port/schema collisions; route `trade-service.financeClient` to the Java suite.
2. **Add `JWT_PUBLIC_KEY`** to `about-service` and `law-service` `.env` (unblock boot).
3. **Fix local auth** in `elite-circle`/`insiders` (route auth through gateway or restore a
   verify-only path so login/register don't 500).
4. **Add auth middleware** to `trade-service` insurance/logistics/customs write routers.
5. **Delete garbage dirs** `financial-services-java;C` and `Backend/infra/gateway`.

### Stage 1 — Replace mocks with real integrations (money & compliance)
6. Implement real PSP/settlement adapters (Stripe/Razorpay/rail providers) behind the existing
   `simulated|live` seams; remove `demo_<ts>`/auto-success paths in elite/insiders/law/law-elite.
7. Wire **real sanctions data** (OFAC SDN + UN + EU full lists, scheduled refresh) into
   `risk-service`; flip `provider` off `seed`.
8. Wire **live FX feed** into `fx-service` (`live` bean); wire `trade-intelligence` to `ml-service`
   and integrate a credit-bureau for credit/trust scoring.
9. Replace proxy provider adapters (BrightData/Oxylabs/Smartproxy) + real email sending.

### Stage 2 — Fix broken / harden
10. Set `ssl.rejectUnauthorized:true` (with proper CA) on the 6 DB configs; remove `tenant-service`
    HS256 dev-secret fallback; make `ml-service` HMAC fail-closed.
11. **Wire `scripts/ci/check-jwt-*` guards into CI**; add repo-wide lint + type-check jobs; add
    tests to `--if-present` services; give the ~28 uncovered services CI.

### Stage 3 — De-duplicate / consolidate
12. Resolve `law-elite` vs `law-service` (remove the demo); merge the two `realtime-service`s;
    extract the Lovable twin into a shared library; retire per-app admin consoles into
    `admin-platform`; adopt `@baalvion/auth-sdk` across frontends (D-10).
13. Clean the catalog: drop phantom `*-platform` entries, fix duplicate descriptor paths, stop
    listing packages as services (D-08/09/13); **re-assign the Java-trade-suite ports** (3040–3046)
    to avoid Node collisions.

### Stage 4 — Standardize architecture
14. Build + adopt `@baalvion/service-kit` (or delete it); build/wire or remove `@baalvion/security`
    and `@baalvion/upload`. Replace frontend mock data layers with real backend calls.

### Stage 5 — Infra maturity
15. Make staging exercise the K8s/Helm path (not dev compose); run containers as non-root;
    move rate limiting to Redis; add PgBouncer + evaluate per-domain DB credentials / NOSUPERUSER
    app role to honor RLS; consolidate the two observability stacks; standardize image naming.

---

## 11. Appendix — Anomalies & Catalog Discrepancies

- **Catalog index lists 68 "services"** but this includes 3 packages (`auth-node`, `cache`,
  `tenancy`) and several **phantom `*-platform` names with no directory** (`audit-platform`,
  `notification-platform`, `proxy-platform`, `analytics-platform`, `billing-platform`,
  `identity-platform`, `organization-platform`, `abuse-platform`) plus duplicate descriptors
  pointing at one path. Real distinct deployable backends ≈ **58**.
- **`audit-platform.yaml` and `proxy-platform.yaml` both point at `proxy-service`** (copy-paste).
  `proxy-gateway.yaml` ≡ `gateway.yaml` (both → `Backend/gateway`, the Go data plane).
- **Port collisions (3040–3046):** Java `deal-room`(3040)↔infra `realtime`(3040);
  `smart-contract`(3041)↔`report`(3041); `payment-rails`(3042)↔`developer`(3042);
  `dispute`(3044)↔`agent-service`(3044); `trade-intelligence`(3043)↔`tenant-service`(3043).
  Plus `ledger` 3014 and `payment` 3015 (Node vs Java). `rbac-service` `.env`=3055 vs
  catalog/memory 3005.
- **`auth-gateway` port discrepancy:** active `.env`=3099 vs `.env.example`/config default=3026.
- **Two physical `realtime-service` dirs** (one was audited twice; ~98 truly-distinct components).
- **Java finance suite** is uncompiled in the sandbox by default; builds only via Dockerized Maven
  (`-Dapi.version=1.43` + Testcontainers 1.20.x DooD) per its `RUN_LOCAL.md`.
- **Working-tree changes at audit time:** `Backend/catalog/index.json` (M),
  `Backend/services/identity/auth-gateway/routes/proxy.js` (M — adds §3 trade-service routes).

---

*This document is regenerated wholesale from repository evidence. Treat it as authoritative for
the audit date above; re-run the audit after material changes.*
