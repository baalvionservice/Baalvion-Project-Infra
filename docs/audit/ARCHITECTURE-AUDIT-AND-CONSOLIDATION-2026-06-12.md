# Baalvion Projects — Architecture Audit & Consolidation Plan

**Date:** 2026-06-12
**Scope:** Local filesystem `D:\Baalvion Projects` only. Git/GitHub deliberately ignored — current working tree is the sole source of truth.
**Method:** Read-only inventory by 20 parallel agents → 4 cross-cutting analysis passes → architecture synthesis, cross-checked against the repo's own `docs/architecture/PLATFORM-ARCHITECTURE-REFERENCE.md` (frozen baseline) and `docs/platform-admin/03-duplicates-consolidation.md`. **No files were modified.**

> Port numbers in this report follow the repo's **authoritative** registry (`PLATFORM-ARCHITECTURE-REFERENCE.md` A2/A3 + `pm2.config.js` + `docker-compose.yml`). Where an automated agent inferred a conflicting port, the authoritative value is used.

---

## PART 0 — Executive Summary

Baalvion Projects is a **pnpm + Turbo monorepo** hosting an enterprise, multi-vertical SaaS group: **16 frontends**, **~46 Node/Python backend services across 8 domains**, a **21-module Java finance suite**, a **6-service "GTOS" trade scaffold**, a **Go egress proxy**, a **NestJS "baalvion-os" kernel**, **24 shared packages**, and a **separate, isolated NestJS+Prisma `investment-platform`**. Live datastores are a **single shared PostgreSQL** (`baalvion_db`, ~20 schemas) + **Redis**. The platform is documented as *mid-consolidation* (a strangler-fig roadmap exists) but is currently **frozen pending an executive decision document**.

**Overall verdict: architecturally ambitious and broadly functional, but suffering from sprawl, drift, and duplication that block production-readiness.** The single highest-value work is not new features — it is **consolidation**: one canonical service per capability, one edge, real database-level tenant isolation, and a catalog that reflects reality.

**The 8 things that matter most:**

| # | Finding | Severity |
|---|---------|----------|
| 1 | **RLS is defined but NOT enforced** — services connect as the Postgres superuser, so multi-tenant isolation exists only in app code. `baalvion_app` role (mig 027) is created but unused. | 🔴 Critical (security) |
| 2 | **Catalog ↔ filesystem drift** — `Backend/catalog` registers **68** services; only **~50** exist. ~15 are logical aliases (`identity-platform`, `billing-platform`, `*-platform`); the "missing" finance services are actually Java modules. | 🟠 High |
| 3 | **`realtime-service` exists twice** — `infrastructure/` (Socket.IO :3040) and `platform/` (raw RFC6455 :3026), same name, different protocols, no coordination. | 🟠 High |
| 4 | **Finance split across Node + Java** — Node `ledger-service`/`payment-service` overlap the Java suite's `ledger`/`payment` modules on the same domain; Node ledger collides with `inventory-service` on **:3014**. | 🔴 Critical (money path) |
| 5 | **Two competing trade stacks** — legacy `commerce/trade-service` (monolith, 40+ routes, real clients) vs the 6-service `trade/` GTOS scaffold (built, unwired), **both owning `schema=trade`**. | 🔴 Critical (data divergence) |
| 6 | **14 duplicated admin consoles** — every product reimplements analytics/users/notifications/audit/finance/CMS. The documented fix (registry-driven `admin-platform`) is the largest dedup win. | 🟠 High |
| 7 | **4 gateways with overlapping roles** — Traefik ingress, `auth-gateway` BFF, Go proxy, `law-elite` sub-gateway (+ a "Kong planned" ADR). Responsibilities are not cleanly separated. | 🟠 High |
| 8 | **Confirmed dead artifacts** — `financial-services-java;C` (junk dir), `ARCHIVE_reconcile/global-trade`, empty `infra/gateway`, `.bak` env files, 4 Java stub modules, dead `KAFKA_ENABLED` flags. | 🟡 Medium |

---

## PART 1 — Repository Layout

```
D:\Baalvion Projects\
├── Backend\
│   ├── services\            8 domain groups → ~46 Node/Python services + Java suite + GTOS
│   │   ├── identity\        auth, auth-gateway, oauth, rbac, session
│   │   ├── platform\        admin, dashboard, realtime(:3026), tenant
│   │   ├── infrastructure\  notification, audit, search, realtime(:3040), report, developer, proxy
│   │   ├── commerce\        commerce, order, inventory, fulfillment, market, ledger, payment, trade + financial-services-java (21 Java modules)
│   │   ├── knowledge\       cms, imperialpedia, law, ml(Python)
│   │   ├── ecosystem\       about, agent, brand-connector, crm, ctm, insiders, ir, jobs, mining, real-estate, law-elite(sub-stack)
│   │   ├── marketplace\     marketplace
│   │   └── trade\           GTOS: network-graph, product-registry, trade-documentation, quality-inspection, supplier-lifecycle, order-execution
│   ├── packages\            24 shared @baalvion/* packages
│   ├── platform\            baalvion-os (NestJS kernel), cli (baalctl)
│   ├── gateway\             Go egress/forward proxy (CONNECT/SOCKS5)
│   ├── catalog\             service registry (index.json + 68 *.yaml) — DRIFTED
│   ├── database\            global SQL migrations (27 + auth-unification)
│   ├── infra\               large IaC tree (k8s, helm, terraform, mesh, observability, dr, secrets, …) — mostly aspirational
│   └── ARCHIVE_reconcile\   DEAD archive
├── Frontend\                16 web apps (15 Next.js + 2 Vite SPA; one nested git repo)
├── investment-platform\     ISOLATED NestJS 11 + Next 15 + Prisma monorepo (own DB)
├── local-env\               Caddy + zero-dep reverse-proxy + host/build scripts
├── observability\           Grafana + Prometheus config (dev)
├── docker\                  init.sql, keycloak realm (deprecated), observability stack, secrets
├── docs\                    adr/ architecture/ audit/ migration/ operations/ platform-admin/ runbooks/
├── scripts\                 build/auth-unification/CI/db scripts
├── e2e\                     Playwright (2 specs only)
├── assets\                  brand assets + screenshots
├── docker-compose.yml       ~30 services (profiles: identity/backend/admin/migrate)
├── pm2.config.js            dev/prod process fleet (backends + frontends)
├── ecosystem.config.js      lean PM2 (overlaps pm2.config.js — DUP)
├── pnpm-workspace.yaml / turbo.json / tsconfig.base.json
```

**Toolchain:** pnpm 9.15 workspaces, Turbo 2.x, TypeScript 5.7, Node ≥20. Next.js pinned to **15.5.18** across frontends. Dual local orchestration: **docker-compose** (containers) and **PM2** (`next start`/`node`) — with `local-env` Caddy/Node reverse proxies for `*.baalvion.local` domains.

---

## PART 2 — Inventory

### 2.1 Frontend Applications (16)

| App (folder) | package name | Framework | Dev Port | Primary backend | Notes |
|---|---|---|---|---|---|
| Global-Trade-Infrastructure-main | baalvion-eternal-absolute-singularity | Next 15 | **9003** | trade-service:3025 + Java `/finance-bff` | 704 TS/TSX files, 195 routes, **own Prisma DB `gti_orchestration`**, in-app trade orchestration kernel; **nested git repo** |
| admin-platform | baalvion-admin-platform | Next 15.5 | 3030 | admin-service:3021 (+19 svc) | Central console; consumes 18+ services; consolidation target |
| AmariseMaisonAvenue-main | amarise-maison-avenue-web | Next 15.5 | 3033 | commerce:3012 | Luxury e-commerce |
| Imperialpedia-main | imperialpedia-web | Next 15.5 | 3029 | imperialpedia:3004, cms:3011 | Rich editorial (block editor, glossary, knowledge graph) + Genkit AI flows |
| Proxy-BaalvionStack | proxy-baalvionstack-web | **Vite 6 + React 18** | 8080 | proxy-service:4000 | SPA for the proxy/NetStack product (NOT a reverse proxy) |
| Law-Elite-Network-main | law-elite-network-web | Next 15.5 | 9002 | law-service:3015 + law-elite-gw:8090 | Genkit AI; Firestore rules present |
| controlthemarket-main | controlthemarket-web | Next 15.5 | 3034 | ctm-service:3017 | Proof-of-skill hiring |
| Mining.Baalvion-main | mining-baalvion-web | Next 15.5 | 3028 | mining:3003, cms:**3018**(bug)/3011 | B2B mineral marketplace; **stale CMS port** |
| IR-Baalvion-main | ir-baalvion-web | Next 15.5 | 3027 | ir-service:3008, cms:3011, marketplace:3062 | Investor relations |
| Baalvion-Jobs-Portal-main | baalvion-jobs-portal-web | Next 15.5 | 3026 | jobs-service:3002 | References legacy Keycloak:8088 |
| For Invstors and Founders | investors-and-founders-web | **Vite 6 + React 18** | 8082 | insiders-service:3050 | **Folder name has typo + spaces**; uses Supabase directly |
| insiders-seo | baalvion-insiders-seo | Next 15.5 | 3060 | insiders-service:3050 | Public SEO surface; no deploy config |
| company-unified-Dashboard-main | company-unified-dashboard-web | Next 15.5 | 3024 | dashboard:3009, realtime:3040 | Executive BI; **overlaps admin-platform** |
| brand-connector-main | brand-connector-web | Next 15.5 | 3035 | brand-connector:3006 | Uses Firebase/Firestore; Genkit AI |
| about-baalvion-main | about-baalvion-web | Next 15.5 | 3020 | about-service:3010, cms:3011 | CMS-driven; PM2 `next start` |
| baalvion-com-main | baalvion-com-web | Next 15.5 | 3040 | cms:3011 | Corporate apex site (static/SEO) |

Deployment is mixed: **Firebase App Hosting** (~10 apps), **Docker** (admin only, compose-wired), **PM2** (most), CI only for jobs/ctm/law. Two apps (For-Investors, insiders-seo) have **no deploy config**.

### 2.2 Backend Services (~46 Node/Python + Java suite + GTOS)

**Identity (5)** — canonical auth tier
| Service | Port | Stack | Data | Role |
|---|---|---|---|---|
| auth-service | 3001 | Express/Sequelize | PG `auth.*` + Redis | **Sole RS256 issuer + JWKS**, TOTP MFA, family refresh rotation |
| auth-gateway | 3099 | Express | Redis | BFF / HttpOnly cookie boundary / CSRF / identity envelope |
| session-service | 3022 | Express/Sequelize | PG + Redis | Sessions, device fingerprint, risk scoring |
| oauth-service | 3023 | Express/Sequelize | PG `auth.oauth_*` | OAuth2/OIDC + PKCE |
| rbac-service | 3055 | Express/Sequelize | PG `rbac.*` | PDP, role hierarchy + ABAC |

**Platform (4):** admin-service:3021, dashboard-service:3009, **realtime-service:3026** (RFC6455, admin telemetry), tenant-service:3043 (orgs/workspaces/products/modules).

**Infrastructure (7):** notification-service:3031 (BullMQ multi-channel), audit-service:3032 (PG append-only hash-chain/WORM), search-service:3036 (**OpenSearch**), **realtime-service:3040** (Socket.IO, 5 namespaces), report-service:3041, developer-service:3042, proxy-service:4000 (SaaS backend for NetStack; self-issues JWT today).

**Commerce — Node (8):** commerce-service:3012 (`commerce`), order-service:3013 (`orders`, Razorpay webhooks), inventory-service:3014 (`inventory`), fulfillment-service:3016 (`fulfillment`), market-service:3007 (`market`), **ledger-service:3014** (double-entry, **port collision**), payment-service:3015 (Razorpay/Stripe/PayU, Redis idempotency), trade-service:3025 (`trade`, **8000 LOC monolith**, 40+ routes, embedded realtime/notification, WebSocket, Firebase dual-auth).

**Commerce — Java finance suite (`financial-services-java`, Spring Boot 3.5, Maven, ~21 modules):** account, aml, audit, credit, deal-room, dispute, escrow, fx, invoice, ledger, payment, payment-rails, reconciliation, reporting, risk, settlement, wallet, + `common-security` lib. **4 stubs:** trust-score, smart-contract, trade-finance, trade-intelligence. Each module: Flyway migrations, Kafka, Resilience4j, OpenTelemetry.

**Knowledge (4):** cms-service:3011 (multi-website CMS, page-builder, media, IndexNow SEO, provider vault), imperialpedia-service:3004 (knowledge base + Anthropic/OpenAI), law-service:3015 (`legal` + MinIO vault), ml-service:8000 (**Python FastAPI**, scikit-learn/statsmodels, HMAC auth — not JWT).

**Ecosystem (11):** about:3010, agent:3044, brand-connector:3006, crm:3063, ctm:3017, insiders:3050 (island self-auth), ir:3008, jobs:3002, mining:3003, real-estate:3005, **law-elite** (acquired sub-stack: gateway:8090 + case-service + user-service stubs + Spring Boot payment-service on **H2 in-memory**, own docker-compose & network).

**Marketplace (1):** marketplace-service:3062 (`marketplace`, vendor storefronts/listings/commissions).

**Trade / GTOS (6, `Backend/services/trade/`, own `docker-compose.gtos.yml`):** network-graph:3047 (**Neo4j 5**), product-registry:3048 (`product`), trade-documentation:3049 (`tradedoc` + S3), quality-inspection:3050 (`quality`), supplier-lifecycle:3051 (`supplier`), order-execution:3052 (`trade`, outbox + payment→order saga). **Status: fully scaffolded, wiring incomplete** (not in catalog/gateway/nav).

**Cross-cutting platform pieces:** Go **gateway** (egress/forward proxy — CONNECT :10000 / SOCKS5 :1080 / metrics :9090; PostgreSQL+Redis), **baalvion-os** (NestJS kernel, Prisma schema `os`, replaces Firebase, :4100), **baalctl** CLI, Traefik **api-gateway** (infra ingress :80→:443, 28 routers, forwardAuth).

### 2.3 Shared Packages (24, `@baalvion/*`)

`auth-node` (universal RS256 JWT authority — consumed by 40+ services), `auth-sdk`, `sdk`, `service-kit` (service bootstrap), `tenancy` (RLS/ALS context — used by search + 6 GTOS), `events` (NATS/Redis Streams), `contracts` (gRPC + event SSOT — **placeholder**), `telemetry`, `logger`, `errors`, `response`, `validation`, `config`, `crypto`, `security`, `cache`, `middleware`, `rbac` (generic), `commerce-rbac` (store/country PEP), `resilience` (only order-execution), `search`, `upload`, `types`, `graceful-shutdown`.

⚠️ **Adoption is uneven:** `response`, `validation`, `config`, `security` have ~1 consumer each; `cache` is shallow. `rbac` vs `commerce-rbac` and `auth-node` vs `auth-sdk` vs `sdk` overlap.

### 2.4 investment-platform (isolated micro-monorepo)

- `apps/api` — **NestJS 11** REST, **port 4100** (⚠️ collides with baalvion-os:4100), own RS256/Argon2id auth, Sumsub KYC, Stripe in, Wise payouts, S3 vault, e-sign.
- `apps/web` — **Next.js 15**, port 3000, client-side auth, deal room WebSocket chat, portfolio/MOIC.
- `packages/database` — **Prisma 6.7**, **48 models**, separate DB **`baalvion_invest`** (domains: identity, investors, companies, opportunities, deals, documents, investments, payments, portfolio, compliance, notifications).
- **Integration with main platform: zero.** Re-implements auth/KYC/payments/escrow end-to-end. `INVESTMENT_PLATFORM_ARCHITECTURE.md` describes a *hybrid/reuse* future, but the code is 100% greenfield.

### 2.5 Databases & Data Stores

| Store | Where | Used by | Status |
|---|---|---|---|
| **PostgreSQL** `baalvion_db` | docker-compose `postgres:5432` (shared, ~20 schemas via `docker/init.sql`) | All Node/Java services (schema-per-service) | **Active**; **RLS NOT enforced** (services connect as superuser) |
| **PostgreSQL** `gti_orchestration` | GTI frontend (own Prisma) | Global-Trade-Infrastructure | Active (app-owned) |
| **PostgreSQL** `baalvion_invest` | investment-platform (Prisma) | investment-platform | Active, isolated |
| **Redis** :6379 | docker-compose | 15+ services (cache, BullMQ, sessions, idempotency, rate-limit, streams) | Active (single node; no HA in dev) |
| **Neo4j 5** | GTOS | network-graph-service | Active (graph) |
| **OpenSearch/Elasticsearch** | search-service | search-service, jobs | Partially wired |
| **H2 (in-memory)** | law-elite | law-elite payment-service | Active (anomaly — not Postgres) |
| **MinIO / S3 / R2** | law-service, GTOS trade-docs | document vaults | Active/optional |
| **ClickHouse + TimescaleDB** | infra/ manifests | analytics/metering | **Aspirational** (not wired in compose) |
| **NATS JetStream** | infra/event-bus | event backbone (prod) | **Aspirational** (dev uses Redis Streams) |

**ORM/migration fragmentation (5 mechanisms):** Sequelize CLI (most Node), Flyway (Java + ledger/payment), custom `migrate.js` (trade-service, GTOS), raw psql (`Backend/database/migrations`), Prisma (baalvion-os + investment-platform). Global migrations start at **004** and reference a **missing `001_auth_schema.sql`**; multiple services reuse `001_*.sql` names.

### 2.6 Infrastructure Components

- **Wired now (docker-compose / pm2 / local-env):** PostgreSQL, Redis, pgAdmin (:5050), ~30 service containers, Traefik api-gateway (infra), local-env Caddy + `reverse-proxy.mjs`, dev Grafana/Prometheus config.
- **Aspirational (`Backend/infra/` IaC only — real manifests, not deployed from this repo):** k8s base + multi-region overlays (4 active / 4 planned regions), Helm `baalvion-service` chart, Terraform (VPC/EKS/CNPG/edge), Istio mesh + NetworkPolicies, CloudNativePG (PITR), Redis Sentinel HA, OTel Collector → Prometheus/Loki/Tempo/Grafana/Alertmanager + Pyrra SLOs, External Secrets Operator/Vault/AWS SM, NATS JetStream, ClickHouse, TimescaleDB, ArgoCD app-of-apps, Karpenter, Velero DR, AWS Global Accelerator/Route53.
- **Deprecated but present:** Keycloak realm (`docker/keycloak/realm-baalvion.json`) — superseded by auth-service, retirement documented.
- **Duplication:** `infra/k8s` vs `infra/kubernetes`; `infra/gateway` (empty) vs `Backend/gateway`; observability defined in **3 places** (`Backend/infra/observability`, root `observability/`, `docker/observability`).

### 2.7 API Surface & Edge

- **Protocol:** REST everywhere (`/v1` or `/api/v1/<domain>/<service>`). gRPC/events defined in `@baalvion/contracts` for internal use. No client-facing GraphQL. Realtime via Socket.IO/WebSocket. Python ml-service uses **HMAC**, not JWT.
- **Edge:** **Traefik** (infra) is the intended sole public ingress (path routing + forwardAuth to auth-service, no blanket gateway JWT). Frontends use **same-origin BFF rewrites** (`/auth-bff`, `/trade-bff`, `/finance-bff`, `/brand-bff`) through `auth-gateway` to preserve HttpOnly cookies.
- **4 gateways, overlapping:** Traefik (ingress) · auth-gateway (BFF) · Go proxy (egress) · law-elite gateway (sub-stack) · "Kong planned" (ADR-0004, undeployed).

### 2.8 Docs / Scripts / E2E / Assets

- **docs/** is unusually mature: 6 ADRs, an **authoritative frozen architecture reference**, a **duplicates-consolidation plan** (12 domains → 1 each), a **platform-admin migration PRD** (Phases 0–6), audit/operations/runbooks. The strategy is already written down — execution is the gap.
- **scripts/** auth-unification (HS256→RS256, **prepare-only**), CI auth guards, DB restore/verify, key gen, install-all.
- **e2e/** only **2 Playwright specs** (about, jobs) for 16 apps — large coverage gap.
- **assets/** brand SVGs + app screenshots.

---

## PART 3 — Cross-Cutting Findings

### 3.1 Duplicate / Overlapping Functionality (18 clusters)

| Cluster | Instances | Recommended canonical |
|---|---|---|
| **realtime-service ×2** | infra Socket.IO :3040 · platform RFC6455 :3026 | Pick one, rename survivor, decommission other |
| **Gateways ×4** | Traefik · auth-gateway · Go proxy · law-elite gw (+Kong) | Traefik=ingress, auth-gateway=BFF, Go=egress (rename `proxy-data-plane`), fold law-elite |
| **Finance/ledger/payment** | Node ledger+payment vs Java suite (account/payment/ledger/settlement/recon/escrow/fx/credit/dispute…) | **Java suite = system of record**; Node = thin gateway seams |
| **Trade ×2** | `commerce/trade-service` monolith vs GTOS 6-svc scaffold (both `schema=trade`) | Strangler-fig: legacy BFF → GTOS; never co-write |
| **Admin consoles ×14** | every product frontend | One registry-driven `admin-platform` shell |
| **Notifications ×8** | notification-service + embedded in trade/brand/law/ir/jobs/dashboard/cms/ctm | notification-service as event consumer |
| **Audit ×6–8** | audit-service + auth AuditLog + Java audit + per-product tables | audit-service (append-only, event-fed) |
| **CMS/content ×6** | cms-service + Imperialpedia/Mining/IR/About/law/brand local | cms-service multi-website (Imperialpedia keeps editorial extension) |
| **Analytics/dashboards ×8** | dashboard + report + 6 product dashboards | dashboard-service + report-service CQRS read model |
| **Identity split ×5** | auth/oauth/session/rbac/auth-gateway + self-issuers (proxy, insiders) | Crisp boundaries; kill self-issued JWTs |
| **RBAC ×2** | `@baalvion/rbac` vs `@baalvion/commerce-rbac` (+ local checks) | rbac-service = sole PDP; packages become clients/sub-policies |
| **AI/ML scattered** | Genkit in 5 frontends + ml-service + imperialpedia LLM | ml-service = canonical AI ops |
| **Commerce vs marketplace vs investment** | commerce 4-svc + marketplace + investment-platform | 3 distinct bounded contexts, no crossover |
| **Observability ×3** | infra/observability + telemetry pkg + per-svc prom-client | `@baalvion/telemetry` via service-kit |
| **Migrations ×5** | Sequelize/Flyway/migrate.js/raw psql/Prisma | One global registry, service-prefixed, DAG-ordered |
| **Orchestration configs** | docker-compose + pm2.config.js + ecosystem.config.js + gtos + law-elite compose | One compose with profiles; one PM2 config |
| **Dashboards scope** | company-unified-Dashboard vs dashboard-service vs admin-platform | Retire company-unified-Dashboard |
| **investment-platform** | fully isolated parallel SaaS | Keep isolated; contract-only SSO seam |

### 3.2 Dead / Unused Code (safe-to-remove)

| Artifact | Evidence | Action |
|---|---|---|
| `Backend/services/commerce/financial-services-java;C` | 0-byte, invalid Windows name (shell artifact) | Delete |
| `Backend/ARCHIVE_reconcile/global-trade` | 100+ orphaned AI-runtime files, no inbound refs | Delete |
| `Backend/scripts/_archive` | empty | Delete |
| `Backend/infra/gateway` | empty (Go code is in `Backend/gateway`) | Delete |
| `.bak` env files (admin-platform, Imperialpedia, IR-Baalvion) | dev backups | Delete + gitignore `*.bak` |
| `investment-platform/apps/web/.next/cache/**/*.old` | stale build cache | Delete + gitignore |
| 4 Java stub modules (trust-score, smart-contract, trade-finance, trade-intelligence) | 1–3 files, in `pom.xml`, no real code | Complete or remove from build |
| Empty placeholder dirs (`oauth/repositories`, `session/repositories`, `admin/repositories`, `network-graph/models`, FE `src/lib/admin`, `src/data`) | never populated | Delete |
| `KAFKA_ENABLED` flags + `kafka:9092` env (ledger/payment) | no Kafka deployed; events on NATS/Redis | Delete |
| Keycloak realm asset | superseded by auth-service | Archive/remove per retirement doc |

### 3.3 Port Collisions & Catalog Drift

**Port collisions / ambiguities:**
- **:3014** — `inventory-service` **and** Node `ledger-service` (different profiles, but unsafe).
- **:3003** — `mining-service` and `jobs-service` (both active).
- **:3011** — `cms-service` (host) and `ctm-service` (container) — "mutually exclusive" comment only.
- **:4100** — `baalvion-os` (NestJS) and `investment-platform` API.
- **:3050/:3051** — GTOS `quality-inspection`/`supplier-lifecycle` vs ecosystem `insiders-service`/elite-circle (separate compose mitigates).
- **cms port drift** — Mining `.env` points at deprecated **:3018**; canonical is **:3011** (latent content-fetch bug).
→ **No port allocation registry exists.** Recommend `Backend/catalog/ports.json` + CI check.

**Catalog drift:** `index.json` lists **68** services; ~50 exist. The **~15 phantom entries are aliases/aggregates**: `identity-platform`→auth, `billing-platform`→commerce, `proxy-platform`/`abuse-platform`/`analytics-platform`/`audit-platform`→proxy-service, `organization-platform`→admin, `notification-platform`→notification, `proxy-gateway`→Go gateway, plus finance services (`wallet`,`escrow`,`fx`,`settlement`,`reconciliation`,`credit`,`dispute`,`account`,`payment-rails`,`risk`,`smart-contract`,`trust-score`,`trade-finance`,`trade-intelligence`) that **do exist — as Java modules**, not Node services. The catalog should be **generated from the filesystem** with explicit `alias_of` fields.

### 3.4 Consolidated Risk Register

| ID | Sev | Item |
|---|---|---|
| RLS-1 | 🔴 Critical | Tenant isolation not enforced at DB layer (superuser connections) |
| FIN-1 | 🔴 Critical | Node/Java ledger & payment duplication on the money path |
| TRD-1 | 🔴 Critical | Legacy trade-service vs GTOS both own `schema=trade` |
| AUTH-1 | 🔴 Critical | Self-issued JWTs in proxy-service & insiders-service (rule A1 violation) |
| CAT-1 | 🟠 High | 68-vs-50 catalog drift; no port registry; collisions on 3014/3003/3011/4100 |
| RT-1 | 🟠 High | Dual realtime-service, unclear which is deployed |
| GW-1 | 🟠 High | 4 gateways, overlapping responsibilities, Kong ambiguity |
| ADM-1 | 🟠 High | 14 duplicate admin consoles |
| MIG-1 | 🟠 High | 5 migration mechanisms; missing 001; numbering collisions |
| CMS-1 | 🟡 Med | Mining points at deprecated CMS :3018 |
| E2E-1 | 🟡 Med | E2E covers 2 of 16 apps |
| FRZ-1 | 🟡 Med | Executive-decision freeze blocks Phases 0–2 |

---

## PART 4 — Target Architecture

**North star:** *One platform, one front door, one source of truth per capability.* Collapse ~50 services + 16 frontends + a drifting 68-entry catalog into a **federated-but-coherent** system: a single public edge (Traefik) + one BFF (auth-gateway), a canonical identity tier (auth-service RS256 as sole issuer), **one canonical service per capability** (one ledger, one payment-gateway, one notification, one audit, one CMS, one search, one realtime, one analytics), **one unified admin shell** absorbing the 14 product consoles via a registry manifest, and a **catalog generated from the filesystem**. Keep **schema-per-service in shared Postgres with FORCE RLS** as the canonical data story (db-per-service deferred). The Go proxy, the Java finance suite, and the investment-platform remain **deliberately bounded islands with contract-only seams.**

```
                          INTERNET
                              |
                   [ Traefik ingress :443 ]   <-- SOLE public ingress (rule I1)
                    | forwardAuth -> auth-service /v1/auth/verify
        +-----------+-----------+----------------+------------------+
        |           |           |                |                  |
   public Next.js   /api/v1/<domain>/<service>/* |          [ Go proxy-data-plane ]
   storefronts      v                            v           :10000 CONNECT/:1080 (egress)
   (about, trade,  [ auth-gateway BFF :3099 ]  [ admin-platform :3030 ]
    proxy, mining,  HttpOnly cookies / CSRF      unified shell, registry-driven
    imperialpedia,  identity-envelope sign       /admin/products/[product]/[...module]
    law, ir, jobs,  same-origin /*-bff           reads admin-service /v1/registry
    brand, ctm, ...)
  ------------------- INTERNAL MESH (NetworkPolicy deny-all) -----------------------
  [IDENTITY]      [PLATFORM]       [INFRASTRUCTURE]    [COMMERCE]      [KNOWLEDGE]
  auth:3001*      admin:3021       notification:3031   commerce:3012   cms:3011
  oauth:3023      dashboard:3009   audit:3032(chain)   order:3013      imperialpedia:3004
  session:3022    tenant:3043      search:3036         inventory:3014  law:3015
  rbac:3055(PDP)  realtime(ONE)    report:3041         fulfillment:3016 ml:8000(AI)
  *sole RS256                      developer:3042      payment(gw)
  [ECOSYSTEM] jobs mining ir brand ctm about insiders crm agent real-estate law-elite
  [TRADE/GTOS] network-graph:3047 product-registry:3048 trade-documentation:3049
              quality:3050 supplier:3051 order-execution:3052  (strangler over trade-service:3025)
  [FINANCE ISLAND — Java suite] account payment ledger settlement reconciliation invoice
              fx credit risk dispute escrow deal-room payment-rails aml wallet reporting
              (== canonical ledger/settlement system of record)
  ------------------------------ DATA & EVENTS ------------------------------------
  [ PostgreSQL baalvion_db ] schema-per-service + FORCE RLS (connect as baalvion_app)
  [ Redis ] cache/queues/streams   [ Neo4j ] GTOS graph   [ OpenSearch ] search
  [ NATS JetStream (prod) / Redis Streams (dev) ] via @baalvion/events  (NOT Kafka)
  [ ClickHouse + TimescaleDB ] analytics/metering (Phase-5, aspirational)
  --------------------------- ISLANDS (contract-only) -----------------------------
  [ investment-platform ] NestJS:4100 + Next:3000 + Prisma(baalvion_invest)  -> SSO via shared JWKS
  --------------------------- CATALOG / GOVERNANCE --------------------------------
  Backend/catalog/index.json  ==> GENERATED from filesystem (kill 68->50 drift; alias_of)
  CI rules: A1(no JWT reimpl) · R1(RLS) · K1(Prisma only in baalvion-os) · I1(one ingress)
```

**Domain decisions:**
- **Edge:** assign each gateway exactly one job; retire/treat-Kong-as-drop-in; never run overlapping gateways. Rename Go gateway → `proxy-data-plane`.
- **Identity:** auth-service = sole RS256 issuer; oauth = external OAuth only; session = sessions/refresh only; rbac = sole PDP. Kill self-issued JWTs (proxy, insiders). `@baalvion/rbac` → thin PDP client; `commerce-rbac` → sub-policy.
- **Platform:** admin/dashboard/tenant + the unified admin-platform shell. Retire company-unified-Dashboard. One realtime-service.
- **Commerce:** treat commerce/order/inventory/fulfillment as one aggregate; Amarise becomes commerce scoped to `brand=amarise`.
- **Finance (island):** Java suite is canonical system of record; Node ledger/payment become gateway seams; resolve :3014; finish/remove 4 stubs.
- **Trade/GTOS:** GTOS = future, legacy trade-service = current; strangler-fig, never co-write `schema=trade`.
- **Knowledge:** all editorial → cms-service websites (Imperialpedia keeps editorial extension); centralize Genkit behind ml-service; fix CMS :3018→:3011.
- **Ecosystem:** resolve mining/jobs :3003; Dockerize PM2-only services; decide law-elite fate.
- **investment-platform (island):** keep isolated; add SSO contract seam; revisit merge post-consolidation.

---

## PART 5 — Consolidation Plan

### Phase 0 — Quick wins & ground-truth *(1–2 weeks, ~1 eng, near-zero risk)*
Make the inventory trustworthy before any structural change.
1. Delete `financial-services-java;C`, `ARCHIVE_reconcile/global-trade`, empty `scripts/_archive` & `infra/gateway`; sweep `.bak` + `.next/cache *.old`; add `*.bak` + `.next/cache` to `.gitignore`.
2. **Generate the catalog from the filesystem**; tag the ~15 aliases with `alias_of`; add `baalctl catalog validate` to CI so drift can't return.
3. Rename Go gateway → `proxy-data-plane` in the catalog.
4. Author `Backend/catalog/ports.json` (single port registry) + CI port-collision check; reconcile 3014/3003/3011.
5. Fix Mining `.env` CMS `:3018 → :3011`.
6. Write one ADR fixing the gateway responsibility matrix (Traefik=ingress / auth-gateway=BFF / Go=egress).
7. Delete dead `KAFKA_ENABLED` flags; remove or finish the 4 Java stub modules.
8. CI lint banning `jsonwebtoken` imports outside `@baalvion/auth-node` (cheap rule-A1 enforcement).

### Phase 1 — Identity, edge & RLS hardening *(3–5 weeks, 2 eng + security; HIGH care)*
Security-critical foundation everything else depends on.
- Enforce **I1**: Traefik sole ingress; verify 28 routers map 1:1 to catalog; add route-correctness test. Constrain auth-gateway to BFF-only.
- Enforce **A1**: kill self-issued JWTs (proxy, insiders) → federate to auth-service.
- Token-type matrix: auth-service = sole RS256 access issuer; oauth = external only; session never mints access tokens.
- **MAKE RLS REAL (R1):** flip `DATABASE_USER` → `baalvion_app` everywhere; `ENABLE+FORCE ROW LEVEL SECURITY` + `tenant_isolation` policies on all ~20 schemas; set `app.current_tenant` GUC via `@baalvion/tenancy`. *Move boot-time `CREATE SCHEMA` DDL into migrations first; roll out per-schema behind a flag.*
- Add a **cross-tenant-leak E2E gate**.
- Collapse RBAC: rbac-service = sole PDP; `@baalvion/rbac` → thin client; `commerce-rbac` → sub-policy.

### Phase 2 — Canonical capability services & migration unification *(4–8 weeks, 3–4 eng; MED-HIGH risk)*
One service per capability.
- **Resolve realtime duplicate** (pick one, rename, update compose/pm2/catalog).
- **Resolve finance split:** Java suite = system of record; Node ledger/payment → thin gateway seams (webhook→event→Java settlement); fix :3014; finish/remove 4 stubs. *Require saga/outbox + reconciliation-parity tests before retiring Node ledger.*
- **Centralize notifications** onto notification-service (event consumer); strip embedded notifiers from ~8 services (dual-write window to avoid lost events).
- **Centralize audit** onto audit-service (hash-chained, event-fed); retire ~6–8 per-product audit tables.
- **Unify migrations:** `Backend/database` as single registry, service-prefixed + DAG-ordered + idempotent; restore the missing `001`. *Verify on a throwaway DB clone first.*
- **Centralize editorial** into cms-service (website-by-website, behind flags); **centralize AI** behind ml-service.
- **Dockerize PM2-only services** (crm, agent, marketplace, developer, audit, tenant).

### Phase 3 — Frontend consolidation & GTOS strangler-fig *(6–10 weeks, 3–4 eng; MED risk)*
- Stand up the **registry-driven admin-platform shell** (admin-service `/v1/registry` → generic renderers under `/admin/products/[product]/[...module]`).
- Migrate the 14 product admin slices in documented order, retiring each local admin as it lands. **Retire company-unified-Dashboard.**
- Keep public storefronts as independent Next.js apps on their executive-decided domains; standardize same-origin BFF cookie auth; **ban `NEXT_PUBLIC` bearer tokens.**
- **GTOS strangler-fig:** wire 6 services into catalog/Traefik/nav; route new flows to GTOS with legacy trade-service as BFF; enforce mutual exclusion on `schema=trade`; then deprecate the monolith.
- Decide **law-elite** fate (flatten into law-service + Java payment, or keep as isolated acquisition behind one Traefik route).
- Add the missing **E2E gates** (auth flow, payment saga, RLS isolation, admin nav).

### Phase 4 — Auth unification & investment-platform decision *(3–6 weeks, parallel)*
- Complete the prepare-only **HS256→RS256** migration island-by-island (snapshot → hash-analysis → mapping → dual-issue → import → cutover → retire) with snapshot rollback.
- **investment-platform call:** keep **isolated** near-term; add a **contract seam** (shared JWKS SSO + documented REST). Only schedule a real merge if integration value is proven.
- **Unify observability** via `@baalvion/telemetry`+`@baalvion/logger` in service-kit; promote the underused shared packages (config/response/validation/security) to mandatory; expand-or-delete `cache`.

### Phase 5 — Deferred / aspirational *(multi-quarter; do NOT start until Phases 1–3 are green)*
- **Database-per-service split** (ADR-0003) — only on a real scale/compliance driver. Schema-per-service + RLS suffices until then.
- Deploy the **analytics tier** (ClickHouse + TimescaleDB); turn audit/report/search into pure event-replayable consumers (after NATS proven in prod).
- **Rationalize `infra/`** (k8s vs kubernetes, empty planned regions, observability ×3) against what's actually wired; reconcile Traefik `dynamic.yml` with the catalog as the single routing source of truth.
- Re-evaluate Kong-vs-Traefik only if Traefik proves insufficient (it currently is sufficient).

---

### Appendix — How this audit was produced
20 read-only inventory agents (per-domain) → 4 cross-cutting analysis agents (duplicates, dead-code, databases, APIs+infra) → 1 architecture-synthesis agent; 25 agents total, ~2.27M tokens, 1,295 file reads. Findings reconciled against `docs/architecture/PLATFORM-ARCHITECTURE-REFERENCE.md` and `docs/platform-admin/03-duplicates-consolidation.md`. This document is a new artifact; no existing repository file was modified.

---

## Appendix B — Independent Second-Pass Verification (2026-06-12)

**Method:** A separate, independent audit — 15 read-only agents (6 inventory → 8 duplication/debt → 1 synthesis; 885K tokens, 550 file reads) — run *without* consulting the repo's frozen baseline (`PLATFORM-ARCHITECTURE-REFERENCE.md`) or the consolidation series. Because it reached the same major conclusions from raw filesystem evidence alone, it serves as **independent validation** of Parts 0–5 above. This appendix records only the **delta**: what it confirms, what it adds at higher resolution, one alternative, and where this second pass was *less* accurate than the authoritative registry. No content above was changed.

### B.1 Corroboration (reached independently, agrees with Parts 0–5)
Dual `realtime-service` (infra Socket.IO :3040 vs platform RFC6455 :3026) · Node↔Java finance duplication on the money path · two trade stacks both owning `schema=trade` · `financial-services-java;C` junk dir + `ARCHIVE_reconcile` + empty placeholder dirs · Keycloak realm dead (0 consumers) · investment-platform fully isolated (separate DB, re-implements auth/KYC/payments) · 16+1 frontends → far fewer · 3 ORMs / 5 migration mechanisms · catalog ↔ filesystem drift · three observability stacks · `:3014` inventory↔ledger collision. **Conclusion: the headline findings are robust under two independent methodologies.**

### B.2 Higher-resolution / net-new detail

**(a) Verified package consumption (sharpens Part 2.3's qualitative "adoption is uneven"):**

| Package | Consumers | Verdict |
|---|---|---|
| auth-node | 31–42 backend | KEEP (core) |
| auth-sdk | 13 frontends | KEEP |
| types | 8+ · sdk | 8 · tenancy | 7 · commerce-rbac | 4 | KEEP |
| **cache, config, crypto, response, security, validation** | **0 each** | **DELETE / MERGE** (crypto→auth-node, security→middleware) |
| service-kit (superseded by sdk), upload, graceful-shutdown, search, contracts (dev-only) | ~0–1 | MERGE→sdk / EVALUATE |

**(b) Engine-level money duplication (below the service level Part 3.1 lists):** FX conversion is re-implemented in **4 places** (commerce-service, order-service, trade-service, order-execution-service); tax/pricing in **3** (order-service, trade-service, `proxy-service/taxEngine.js`); payment fee logic duplicated between `payment-service/feeEngine.js` and `proxy-service/taxEngine.js`. **Proposed fix: a new `@baalvion/money` package (fx + tax + pricing)** consumed by all money services — kills 4 FX + 3 tax copies. **Escrow is triplicated** (trade-service · Java escrow-service · investment-platform escrow).

**(c) Notification transport detail (complements Part 3.1's "notifications ×8"):** beyond the per-product embedded notifiers, the *backbone* itself forks — `@baalvion/events` carries **3 transports** (Redis Streams active / Kafka unused / NATS JetStream K8s-only) and `notification-service` runs 5 BullMQ queues + a Redis-Streams consumer. Picking **one** event transport (NATS) is a prerequisite to centralizing notifications.

**(d) Money-path gap:** in the Node stack, `payment-service` and `ledger-service` are **not coupled** — ledger postings are issued separately by callers (order-service), so a payment can succeed without a guaranteed journal entry. Wire payment→ledger before retiring any Java ledger path.

### B.3 Alternative proposal — aggressive frontend collapse (17 → 7)
Part 4 keeps the public storefronts as independent apps. This second pass argues a deeper collapse is available because **`cms-service` already drives most marketing sites**: fold **about, baalvion-com, mining, IR, imperialpedia, insiders-seo, law-elite** into **one host-multiplexed `baalvion-marketing` Next.js renderer**; fold **company-unified-Dashboard, brand-connector, jobs-portal, For-Investors-and-Founders (de-Vite)** into **one persona-routed `baalvion-portals`**; keep amarise-web, controlthemarket, gti-web, admin-platform, invest-web standalone; archive Proxy-BaalvionStack. Result: **7 products**. Offered as an option to weigh against the "executive-decided domains" constraint — not a contradiction of Part 4.

### B.4 Corrections — where this second pass was LESS accurate (defer to Parts 1–3)
Recorded so the authoritative numbers win:
- **Ports:** this pass *inferred* a "`:3015` triple collision" and a "`:3019`" payment port. The authoritative registry resolves these (fulfillment **:3016**, payment **:3015**, law **:3015** container, distinct hosts). The **real** collisions are **:3014 / :3003 / :3011 / :4100** per Part 3.3 — including `:4100` baalvion-os↔investment-platform, which this pass missed.
- **investment-platform API** is **:4100** with DB **`baalvion_invest`** (Part 2.4), not the `:4000` this pass guessed.
- **Missed entirely** (present above): the `baalvion-os` NestJS kernel, law-elite on **H2 in-memory**, **Neo4j** (network-graph), **OpenSearch** (search), the separate **`gti_orchestration`** DB, **self-issued JWTs** in proxy/insiders, the missing `001` migration, and the **#1 critical "RLS defined but not enforced"** — all of which Parts 2–3 capture correctly. This pass under-weighted RLS and over-counted "active" Java modules (Part 2.2 correctly flags 4 as stubs).

**Net effect:** Parts 0–5 remain the authoritative plan. Appendix B adds the package-consumption ground truth, the `@baalvion/money` consolidation, the event-transport decision, the payment→ledger gap, and an optional deeper frontend collapse — and validates the rest via an independent second method.
