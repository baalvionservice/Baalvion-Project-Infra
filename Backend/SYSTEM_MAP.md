# Baalvion — System Map

> **Purpose:** the authoritative inventory of *everything that exists* in the
> platform — services, frontends, shared packages, datastores, and the wiring
> between them. This is the **input** to `ARCHITECTURE_FINDINGS.md` (what's good /
> wrong) and `GAP_ANALYSIS.md` (what's missing). Keep it descriptive, not
> aspirational: it records reality on disk + in the catalog, not the plan.
>
> **Sources of truth (in precedence order):**
> 1. `catalog/services/*.yaml` + `catalog/index.json` — the enforced registry (61 descriptors).
> 2. The codebase on disk (`Backend/services/<domain>/<service>`, `Frontend/<app>`, `Backend/packages/*`).
> 3. `Backend/ARCHITECTURE.md` (the locked 6-domain model + invariants).
> 4. `Backend/PENDING_WORK.md` + project memory for status nuance.
>
> **First generated:** 2026-05-31 (SYSTEM_MAP.md did not previously exist; created
> as the root of the documentation dependency chain).
>
> **Legend:** ✅ done · 🟡 partial / needs wiring·compile·scale · 🔴 not built · 🧩 shared library (not a service) · ☕ Java/Spring (uncompiled in this sandbox)

---

## 1. Platform at a glance

| Dimension | Count | Notes |
|---|---|---|
| Backend services (catalog descriptors) | **61** | `catalog/index.json`, generated 2026-05-31T10:46Z |
| Node/Express business + infra services | ~40 | one Postgres schema each |
| Java/Spring services (`financial-services-java`) | **15** ☕ | account, audit, credit, deal-room, escrow, fx, ledger, payment, reconciliation, reporting, risk, settlement, smart-contract, trade-finance, wallet |
| Proxy SaaS control-plane "platform" services | 8 | `*-platform` + `proxy-gateway` (event-driven) |
| Shared backend packages (`@baalvion/*`) | **21** | `Backend/packages/*` |
| Frontend apps | **16** | `Frontend/*` (Next.js / Vite) |
| Business domains | 6 | identity · commerce · knowledge · infrastructure · platform · ecosystem |
| Public ingress | 1 | Go `gateway` (rule I1 — sole `ingress: public`) |

**Stack (authoritative — overrides decks where they differ):**
Node.js + Express 5 (most services) · NestJS (`baalvion-os` kernel) · Python FastAPI (`ml-service`) · Java/Spring (`financial-services-java`) · PostgreSQL (schema-per-service) · Redis/ioredis (cache + sessions) · BullMQ + `@baalvion/events` (queue/events; **not** Kafka) · OpenSearch (`@baalvion/search`; **not** Typesense) · RS256 JWT + JWKS via `@baalvion/auth-node` (**not** Firebase) · socket.io (`realtime-service`) · S3/MinIO (`@baalvion/upload`) · Go `gateway` ingress · Razorpay/PayU/Stripe payments · FCM/Web Push as notification *channels* only.

---

## 2. The 6-domain model

Every service belongs to **exactly one** domain (decides folder + deploy
namespace + catalog grouping). Division is an orthogonal axis kept only for
CODEOWNERS routing. See `ARCHITECTURE.md` §1.

```
Backend/services/
├── identity/        auth, sessions, OAuth, RBAC, BFF, tenancy directory
├── commerce/        trade, orders, inventory, fulfillment, marketplace, billing, Java finance suite
├── knowledge/       content, encyclopedic data, legal knowledge, ML/analytics
├── infrastructure/  ingress, proxy data-plane, realtime, notifications, audit, search, reporting, developer
├── platform/        cross-cutting control plane: admin, dashboards, kernel, tenant registry
└── ecosystem/       vertical/branded products & acquired sub-stacks
```

---

## 3. Service inventory by domain

### 3.1 identity — `Backend/services/identity/`
| Service | Port | Schema | Status | Role |
|---|---|---|---|---|
| `auth-service` | 3001 | `auth` | ✅ | RS256 access+refresh issuer; the one SSO authority |
| `oauth-service` | 3023 | `oauth` | ✅ | OAuth2/OIDC, silent SSO, single-logout |
| `session-service` | 3022 | `session` | ✅ | server-side session store |
| `auth-gateway` | 3099 | — | ✅ | browser BFF (holds session cookie; bearer removed) |
| `rbac-service` | 3005 | `rbac` | ✅ | hybrid RBAC+ABAC authority; tenant tree; PDP `/v1/authorize` |

### 3.2 platform — `Backend/services/platform/`
| Service | Port | Schema | Status | Role |
|---|---|---|---|---|
| `admin-service` | 3021 | `admin` | ✅ | admin control, staff/HR module (invite→accept→login) |
| `dashboard-service` | — | `dashboard` | 🟡 | company ERP dashboard backend (AI forecast/analytics pending) |
| `tenant-service` | 3043 | `tenant` | ✅ | white-label registry, per-app branding, domain DNS-TXT verify, entitlements/quotas |
| `realtime-service` ⚠️ | — | — | 🟡 | **duplicate**: a socket.io metrics variant lives here *and* in infrastructure/ — needs dedupe |
| `baalvion-os` (kernel) | — | (Prisma) | ✅ | NestJS kernel; the ONLY place Prisma is allowed (rule K1) |

### 3.3 commerce — `Backend/services/commerce/`
| Service | Port | Schema | Status | Role |
|---|---|---|---|---|
| `commerce-service` / `billing-platform` | — | `commerce` | ✅ | Amarisé live catalog, stores, billing |
| `order-service` | — | `orders` | ✅ | order lifecycle |
| `inventory-service` | — | `inventory` | ✅ | stock |
| `fulfillment-service` | — | `fulfillment` | ✅ | fulfillment |
| `market-service` | — | `market` | ✅ | crypto research |
| `trade-service` | — | `trade` | 🟡 | Trade OS: Marketplace + RFQ **real**; Logistics CRUD real; rest mock; AML/sanctions/trust = tracker only |
| **`financial-services-java/`** ☕ | 3014–3041 | per-svc | 🟡 | 15-service Java/Spring finance suite — see §3.7 |

### 3.4 knowledge — `Backend/services/knowledge/`
| Service | Port | Schema | Status | Role |
|---|---|---|---|---|
| `cms-service` | 3018 | `cms` | ✅ | central multi-site CMS (content/website/taxonomy/revision/workflow/cache + BullMQ + MinIO) |
| `imperialpedia-service` | 3004 | `imperialpedia` | ✅ | encyclopedic structured + interactive data |
| `law-service` | 3015 | `legal` | ✅ | Law Elite Network backend (Sequelize/pg, RS256) |
| `ml-service` | — | — | 🟡 | Python FastAPI host for ML models/pipelines (models pending) |

### 3.5 infrastructure — `Backend/services/infrastructure/` (+ `gateway/`)
| Service | Port | Schema | Status | Role |
|---|---|---|---|---|
| `gateway` (Go) | — | — | 🟡 | sole public ingress; REST routing + rate-limit + API keys (GraphQL + unified WS pending) |
| `proxy-service` | — | `proxy` | ✅ | proxy data-plane (was backend-Proxy-BaalvionStack) |
| `notification-service` | 3031 | `notification` | ✅ | multi-channel engine: Email/Webhook/SMS(Twilio)/Push(FCM+WebPush)/In-app(WS); delivery receipts pending |
| `audit-service` | 3032 | `audit` | ✅ | immutable WORM + SHA-256 hash-chain audit log; event-bus consumer |
| `search-service` | 3036 | (OpenSearch) | ✅ | tenant-scoped full-text/fuzzy/autocomplete/facets; degrades 503 when OpenSearch down |
| `report-service` | 3041 | `reports` | ✅ | parameterized read-only report builder → CSV/Excel/PDF/JSON/HTML + schedules |
| `developer-service` | 3042 | `developer` | ✅ | API keys, signed webhooks + retry, OpenAPI catalog, sandbox |
| `realtime-service` ⚠️ | 3026 | — | 🟡 | socket.io live metrics/feed for admin Infrastructure page (**duplicate** — see platform/) |

### 3.6 ecosystem — `Backend/services/ecosystem/`
| Service | Port | Schema | Status | Role |
|---|---|---|---|---|
| `mining-service` | — | `mining` | ✅ | Mining B2B |
| `ir-service` | 3027 | `ir` | 🟡 | investor relations portal (KYC/accreditation + deal-room realtime pending) |
| `jobs-service` | 3002 | `jobs` | 🟡 | jobs board (boot/keys + offers/users/payments/docs endpoints pending) |
| `real-estate-service` | — | `real_estate` | ✅ | real-estate vertical |
| `brand-connector-service` | — | `brand_connector` | ✅ | influencer Connect (frontend still on Firebase shim → migrate) |
| `ctm-service` | 3034 | `ctm` | ✅ | ControlTheMarket / SkillMatch Pro |
| `about-service` | 3020 | `about` | ✅ | about.baalvion.com (CMS-backed) |
| `insiders-service` | 3050 | `insiders` | ✅ | For Investors & Founders (+ Protocol sub-app) |
| `elite-circle-service` | 3051 | `elite_circle` | ✅ | baalvion-elite-circle twin (+ Protocol) |
| `law-elite` | — | (own) | ✅ | acquired multi-service legal sub-stack (own gateway+services) |
| `agent-service` | 3044 | `agent` | ✅ | agents/hierarchy, commission plans+tracker, leaderboard, training |

### 3.7 commerce/financial-services-java ☕ — the Java/Spring finance suite
Built per Delight's Architecture PDF; **never compiled in this sandbox** (Java 1.7, no Maven). `ddl-auto=none` (Flyway owns schema), pluggable simulated|live provider seams, transactional outbox/inbox saga.

| Java service | Port | Status | Role |
|---|---|---|---|
| `ledger-service` | 3014 | 🟡 | double-entry ledger (system of record for money) |
| `payment-service` | 3015 | 🟡 | payment orchestration (Payment↔Ledger↔Account saga) |
| `account-service` | 3016 | 🟡 | accounts + KYC fields |
| `escrow-service` | 3017 | 🟡 | escrow hold→milestone→release |
| `settlement-service` | 3018 | 🟡 | settlement engine |
| `reconciliation-service` | 3019 | 🟡 | nightly reconciliation |
| `finance-audit-service` | 3020 | 🟡 | finance-specific audit |
| `reporting-service` | 3024 | 🟡 | finance reporting scaffold |
| `risk-service` | **3035** | 🟡 | risk engine (port moved 3025→3035 to clear a collision) |
| `trade-finance-service` | 3036 | 🟡 | L/C (UCP 600) + Bank Guarantee (URDG 758) |
| `credit-service` | 3037 | 🟡 | Invoice Finance + BNPL + CreditRiskEngine |
| `fx-service` | 3038 | 🟡 | FX rates/spot/rate-lock/forwards (CIP) |
| `wallet-service` | 3039 | 🟡 | multi-currency balances/holds/transfer/convert |
| `deal-room-service` | — | 🟡 | **NEW since PENDING_WORK** — realtime deal negotiation (scaffolded; PENDING_WORK still lists Deal Room as 🔴) |
| `smart-contract-service` | — | 🟡 | **NEW since PENDING_WORK** — UCP 600 / Incoterms e-sign (scaffolded; PENDING_WORK still lists Smart Contract as 🔴) |

> Java→Node bridge is **live-verified**: `POST /v1/internal/finance-events` HMAC byte-identical to the Java `WebhookSigner`; gateway finance routes + `X-Tenant-ID` wired.
> ⚠️ Stray empty dir `financial-services-java;C` (a shell artifact) should be removed.

### 3.8 Proxy SaaS control-plane "platform" services (event-driven)
Catalog descriptors, mostly event consumers (see `index.json.eventConsumers`):
`identity-platform`, `organization-platform`, `billing-platform`, `notification-platform`, `analytics-platform`, `audit-platform`, `abuse-platform`, `proxy-platform` (+ `proxy-gateway`). Status ✅ (built within the Proxy-BaalvionStack remediation program, Prompts 1–17).

---

## 4. Shared backend packages — `Backend/packages/` (21) 🧩
| Package | Purpose |
|---|---|
| `auth-node` ✅ | the ONLY home for `jsonwebtoken`; RS256/JWKS verify (rule A1) |
| `auth-sdk` ✅ | frontend auth SDK (gateway mode, AuthProvider/ProtectedRoute) |
| `tenancy` ✅ | Postgres RLS multi-tenant enforcement + AsyncLocalStorage ctx |
| `cache` ✅ | Redis read-through cache, single-flight, fail-open, TTL profiles (FX=30s), tenant-scoped keys |
| `search` ✅ | OpenSearch abstraction (now has a tsup build for CJS consumers) |
| `events` ✅ | domain-event bus (BullMQ/Redis Streams) |
| `contracts` ✅ | proto + domain-event registry (cross-service surface; rule X1) |
| `rbac` ✅ | RBAC primitives |
| `service-kit` ✅ | `createService()` http/health/logging/shutdown boilerplate |
| `response` ✅ | standard response/error envelope |
| `logger` · `telemetry` · `middleware` · `errors` · `crypto` · `security` · `validation` · `config` · `types` · `graceful-shutdown` · `upload` | cross-cutting libs |

---

## 5. Frontend apps — `Frontend/` (16)
| App | Stack | Backed by | Status |
|---|---|---|---|
| `admin-platform` | Next.js | auth/admin/cms/session/oauth/realtime/+ | 🟡 ~12/25 pages real; ~10 await missing backends |
| `about-baalvion-main` | Next.js | about + cms | ✅ live CMS-wired |
| `company-unified-Dashboard-main` | Next.js | dashboard-service (BFF) | ✅ browser-verified; some pages still mock |
| `controlthemarket-main` | — | ctm-service | ✅ live (keys→.env, commit pending) |
| `Global-Trade-Infrastructure-main` | Next.js | trade-service | 🟡 Marketplace+RFQ real; rest mock |
| `Imperialpedia-main` | Next.js | imperialpedia + cms | ✅ live editorial + structured |
| `IR-Baalvion-main` | Next.js | ir-service + cms | 🟡 editorial live; KYC/deal-room pending |
| `Baalvion-Jobs-Portal-main` | Next.js | jobs-service | 🟡 conversion in progress |
| `Law-Elite-Network-main` | Next.js | law-service | ✅ admin console live (needs JWT_PUBLIC_KEY) |
| `Mining.Baalvion-main` | — | mining-service | ✅ |
| `For Invstors and Founders` | Vite | insiders-service | ✅ gateway-wired |
| `baalvion-elite-circle-main` | Vite | elite-circle-service | ✅ Protocol converted |
| `brand-connector-main` | — | brand-connector-service | 🟡 real Firebase shim → migrate to `@baalvion/auth-sdk` |
| `AmariseMaisonAvenue-main` | — | commerce-service | ✅ |
| `Proxy-BaalvionStack` | — | proxy-service + `*-platform` | ✅ full-stack console (:8080) |
| `insiders-seo` | — | (SEO surface) | — |

> **Policy:** every app's admin/management surface consolidates into the ONE
> central `admin-platform` console wired to each owning backend; per-app `src/app/admin`
> panels retire once the central equivalent is verified live.

---

## 6. Cross-cutting topology

- **Auth:** browser → `auth-gateway` BFF (cookie) → services verify RS256 via `@baalvion/auth-node`/JWKS. One issuer; no HS256 (islands decommissioned). Roles/ABAC via `rbac-service`.
- **Ingress:** all public traffic through the Go `gateway` (rule I1). `proxy-gateway` fronts the proxy data-plane.
- **Events:** services emit domain events (`@baalvion/events` / `baalvion:events`) → consumers (`audit-service`, `notification-service`, proxy `*-platform`).
- **Data:** one Postgres schema per service (rule D1). Redis = cache/sessions (projection). OpenSearch = search projection. ClickHouse/Timescale = analytics projections.
- **Tenancy:** `@baalvion/tenancy` RLS mechanism done; per-service rollout (non-superuser `baalvion_app` role + per-table policies) pending.
- **Governance gate:** `catalog/validate.mjs` + `catalog/enforce.mjs` (rules D1/A1/X1/I1/K1/C1); `pnpm run architecture:check` is green at 61 services, 0 violations.

---

## 7. Known structural anomalies (carried into FINDINGS/GAP)
1. **Duplicate `realtime-service`** under both `platform/` and `infrastructure/` — must be deduped to one home (infrastructure per ARCHITECTURE.md §2).
2. **`financial-services-java;C`** — empty stray directory (shell artifact); remove.
3. **Java suite uncompiled** — 15 services never built here (Java 1.7, no Maven); blocks all Trade Finance/Payments/Compliance go-live.
4. **`deal-room-service` / `smart-contract-service`** now exist (Java) but PENDING_WORK still lists them as 🔴 not-built — status reconciliation needed.
5. Large amount of **uncommitted work** across services/frontends (most 2026-05-29..31 work).
