# Baalvion Backend — Pending Work, Service Purposes & Workflows

> **Purpose of this file:** the single backlog for everything **still to build or finish**.
> Completed services are listed once (so nobody re-builds them) and then *not detailed*.
> Everything **pending** and **running/partial** gets a **Purpose** + **Workflow** + **What's left**.
>
> Source of truth for "what exists" = `catalog/services/*.yaml` (40 services) + the codebase.
> This doc reconciles two plans: the **platform domains** (15-day sprint plan) and the
> **Trade microservices map** (32 services / 9 clusters).

**Legend:** ✅ Done (skip) · 🟡 Running / partial (finish it) · 🔴 Pending (build it)

## Present stack (actual — this is authoritative; ignore the decks where they differ)

| Concern | We use | Decks said | Note |
|---|---|---|---|
| Runtime | **Node.js + Express 5** (services); NestJS (`baalvion-os` kernel); Python FastAPI (`ml-service`); Java/Spring (`financial-services-java`, uncompiled) | NestJS | polyglot by domain |
| Database | **PostgreSQL**, one schema per service | PostgreSQL (RDS) | ✓ |
| Cache / sessions | **Redis (ioredis)** | Redis | ✓ |
| Queue / events | **BullMQ** (Redis) + `@baalvion/events` | Kafka + BullMQ | Kafka not in use |
| **Search** | **OpenSearch** (`@baalvion/search`) | ~~Typesense / Elasticsearch~~ | **NOT Typesense** |
| **Auth** | **RS256 JWT + JWKS** via `@baalvion/auth-node`; OAuth2 (`oauth-service`); BFF cookies (`auth-gateway`); roles via `rbac-service` | ~~Firebase Auth~~ + JWT | **NOT Firebase** |
| Realtime | **socket.io** (`realtime-service`) | WebSocket (Socket.io) | ✓ |
| Storage | **S3 / MinIO** (`@baalvion/upload`) | S3 + CloudFront | ✓ |
| Gateway | **Go `gateway`** + `proxy-gateway` + `auth-gateway` BFF | Kong/custom | ✓ |
| Payments | **Razorpay + PayU** (proxy), **Stripe** (subscriptions) | Stripe + Razorpay | ✓ |
| Push (future) | **FCM as a notification *channel* only** | Firebase FCM | channel ≠ auth |

### ❌ Delete / not in our stack — Typesense & Firebase
- **Typesense** → **0 references in code.** It was only in the decks. Action: **remove from all plans/decks; use OpenSearch.** Nothing to delete in the repo.
- **Firebase** → not an auth provider here (`CLAUDE.md` forbids a 2nd issuer). To delete:
  1. ✅ **DONE — dead dependency removed** (`"firebase"` had no source imports) from all 8 frontends:
     `about-baalvion-main`, `AmariseMaisonAvenue-main`, `company-unified-Dashboard-main`, `controlthemarket-main`, `Global-Trade-Infrastructure-main`, `Imperialpedia-main`, `IR-Baalvion-main`, `Mining.Baalvion-main`. → run `pnpm install` to drop it from the lockfile.
  2. **`brand-connector-main`** has a *real* Firebase shim (`src/firebase/config.ts`, `src/firebase/index.ts`, `src/lib/fb-compat/app.ts`, `src/lib/fb-compat/auth.ts`) — **migrate to `@baalvion/auth-sdk` first, then delete.** Do NOT blind-delete (it's wired).
  3. Backend: only harmless doc-string mentions ("replaces Firebase") in `baalvion-os` + `auth-sdk` — optional cleanup.
- **FCM** may stay as a *push channel* inside the Notification Engine (§1.3) — that is not "Firebase auth" and is fine.

---

## 0. Already DONE — do NOT rebuild

| Area | Services (status ✅) |
|---|---|
| Identity | `auth-service`, `oauth-service`, `session-service`, `auth-gateway`, **`rbac-service`** (new RBAC+ABAC) |
| Platform/Admin | `admin-service`, `baalvion-os` (kernel), most of `dashboard-service` |
| Commerce | `commerce-service`/`billing-platform` (Amarisé live catalog), `order-service`, `inventory-service`, `fulfillment-service` |
| Talent | `jobs-service`, `ctm-service` |
| Domains | `mining-service`, `market-service`, `ir-service`, `about-service`, `imperialpedia-service`, `cms-service` |
| Legal / Community | `law-service`, `law-elite`, `insiders-service`, `elite-circle-service`, `brand-connector-service` |
| Proxy SaaS | `proxy-platform`, `proxy-gateway`, Go `gateway` |
| Realtime | `realtime-service` (socket.io, 5 namespaces, RS256) |

These may still need wiring/keys/commits, but the **service itself exists** — treat as done.

---

## 1. Foundation / Cross-cutting (the 7 P0 "Critical")

### 1.1 Auth Service — ✅ (canonical, not Firebase)
- **Purpose:** issue + verify identity for every platform; one SSO, one token.
- **Workflow:** login → `auth-service` mints RS256 access+refresh → services verify via JWKS through `@baalvion/auth-node` → `auth-gateway` BFF holds the session cookie for browsers.
- **Pending:** none structural. (Spec's "Firebase + 9 roles" → satisfied by RS256 + the new `rbac-service` role model.)

### 1.2 API Gateway — 🟡 finish
- **Purpose:** one front door — routing, rate limiting, API keys, request auth.
- **Workflow:** client → gateway (authN + rate-limit + key check) → routed to the owning service; never service-to-service direct.
- **Done:** REST routing, rate limiting, API keys (Go `gateway` + `auth-gateway` BFF + `proxy-gateway`).
- **🔴 Pending:** **GraphQL** federation layer; **WebSocket** pass-through unified with `realtime-service` (today WS is a separate service).

### 1.3 Notification Engine — ✅ channels done (2026-05-31); creds/install + delivery-receipts remain
- **Purpose:** deliver every transactional/marketing message across channels.
- **Workflow:** producer emits event → `notification-service` consumer → template render → enqueue (BullMQ) → channel worker sends → delivery/audit recorded.
- **Done:** **Email + Webhook** (pre-existing) **+ SMS (Twilio) + Push (FCM **and** Web Push, both optional/lazy — no required Firebase) + In-app/WebSocket (Redis pub/sub → realtime-service + per-user inbox)**, device-token registry, per-user channel **preferences** (opt-out honored), a **unified multi-channel dispatcher** (`/v1/dispatch`), and security-event in-app fan-out. Also fixed two pre-existing event-consumer bugs (`xreadgroup` bogus `CONSUMER` keyword + `NOACK false`) and the BullMQ-v5 `:`-in-queue-name incompatibility. Live-verified: 9/9 channel smoke tests + event→in-app E2E.
- **🔴 Pending:** `pnpm install` the optional deps (`twilio`, `firebase-admin`, `web-push`) + set provider creds (Twilio / FCM service-account / VAPID) for real sending — dev uses "log" providers; **delivery-status receipts** (provider webhooks) still to add.

### 1.4 Audit Log Service — ✅ done (2026-05-31)
- **Purpose:** one immutable, append-only trail across all domains for compliance.
- **Workflow:** any state-changing action → emits audit event → append-only store (no update/delete) → queryable by admin/compliance.
- **Done:** new **`audit-service`** (`services/infrastructure/audit-service`, :3032, `audit` schema). **Append-only WORM** (Postgres triggers reject UPDATE/DELETE/TRUNCATE) + **SHA-256 hash-chain** (`GET /v1/audit/verify` detects content edits *and* inserted/removed rows). **Event-bus consumer** on `baalvion:events` auto-captures every domain event; plus direct `POST /v1/audit[/batch]`, query/filter, CSV export. Live-verified: append/chain/query/verify-ok + WORM-rejection + tamper-detection + event→audit. The 4 existing audit stores are left intact (this aggregates, doesn't replace). Catalog green (50 svcs, 0 err), enforce 0 violations.
- **🔴 Remaining (deferred):** ClickHouse analytics mirror; per-event-id dedup for exactly-once; gradually point each service's existing audit at this service.

### 1.5 Multi-Tenancy Layer — 🟡 mechanism done + proven; per-service rollout remains
- **Purpose:** hard tenant isolation on every data access.
- **Workflow:** request carries tenant context → every query is scoped by `tenant_id`/`org_id` → cross-tenant reads impossible.
- **Done:** the **enforcement mechanism** — new **`@baalvion/tenancy`** package: Postgres **RLS** policy builders (`enableRlsSql` → ENABLE+**FORCE** RLS + fail-closed policy on `app.current_tenant`/`app.tenant_bypass`), per-request tenant context (AsyncLocalStorage), `tenantMiddleware`, and `withTenantTransaction`/`withTenantClient` (set the tenant GUC `LOCAL` to a tx). **Live-proven** under a non-superuser role: tenant-A sees only A, B only B, no-context → 0 (fail-closed), bypass → all, cross-tenant INSERT rejected. Catalog/enforce green (51 descriptors). Also formalized tenant tree in `rbac-service`.
- **🔴 Remaining (per bounded context — needs each owner's review):** (1) create the `baalvion_app` **non-superuser** DB role + grants and switch each service's `DB_USER` (RLS is ignored for superusers!); (2) add a migration calling `enableRlsSql(...)` for every tenant table; (3) add `tenantMiddleware()` after auth + wrap DB access in `withTenantTransaction`. See `packages/tenancy/README.md` rollout playbook.

### 1.6 Search Service — ✅ service done (2026-05-31); scale/indexers remain
- **Purpose:** sub-50ms search over large catalogs (listings, articles, jobs…).
- **Workflow:** service writes → indexer syncs to OpenSearch → query API (multi-match + fuzzy) → ranked results.
- **Done:** gave `@baalvion/search` a **tsup build** (was TS-only `main`, unconsumable from CJS — the reason it was stuck) and built a new deployable **`search-service`** (`services/infrastructure/search-service`, :3036) wrapping it: full-text + fuzzy search, autocomplete, facets, indexing/bulk/delete, ensure-indices. **Tenant-scoped** — every query auto-filters by `orgId` via `@baalvion/tenancy` (super_admin bypass; `scoped=false` opt-out). Boots + degrades gracefully when OpenSearch is down (503). Verified: 5/5 tenant-scope unit tests + **5/5 live E2E against a real OpenSearch container** (per-tenant isolation, bypass, fuzzy, autocomplete). Catalog green (56), enforce 0 violations.
- **🔴 Remaining:** run a real **OpenSearch cluster** + prove **50M docs / <50ms** (cluster-sizing/ops); wire each domain's **indexers** (push docs / reindex jobs) — services emit to `POST /v1/index/:index`; add `opensearch` to the catalog `datastores` enum.

### 1.7 Cache Service — ✅ done (2026-05-31)
- **Purpose:** hot-path cache + sessions + short-TTL market data.
- **Workflow:** read-through/write-through cache in front of Postgres; sessions in Redis; FX/price keys with short TTL.
- **Done:** new **`@baalvion/cache`** package — `getOrSet` read-through/write-through with **single-flight stampede protection**, **fail-open** (Redis down → loader runs, request survives), **consistent TTL profiles** incl. the **FX = 30s** standard, **prefix invalidation**, and **tenant-scoped keys** (no cross-tenant cache bleed, via `@baalvion/tenancy`). Upstash-compatible (`rediss://` URL). Verified: 8/8 unit + 6/6 live against the running Redis. Catalog Library descriptor; validate 57 svcs 0 err.
- **🔴 Remaining (adoption):** services migrate ad-hoc `ioredis` calls to `@baalvion/cache` (e.g. `session-service` → `namespace:'session'`/`TTL.SESSION`; `trade-service` FX → `TTL.FX`); optional cross-process distributed lock for stampede across replicas.

> **P0 foundation (§1.1–1.7) is now COMPLETE** — all seven built/proven live. Remaining platform work is §2 (product domains) and §3 (trade microservices).

---

## 2. Platform Product Domains (Sprint-plan verticals)

Most domains have a backing service (see §0). Remaining gaps:

| Vertical / Domain | Backing service | Status | Pending |
|---|---|---|---|
| Gateway / SSO / Identity OS (`baalvion.com`) | auth + gateway + rbac | ✅ | — |
| HUB parent portal (`baalviongroup.com`) | — | 🔴 | thin marketing/showcase API (low priority) |
| Company CMS (`about.baalvion.com`) | about + cms | ✅ | — |
| **Dashboard ERP** (`dashboard.baalvion.com`) | dashboard-service | 🟡 | **AI forecast/predictions**, advanced analytics, equity/cap-table depth |
| **BillBana GST OS** (`shop.balvion.com`) | — | 🔴 | **whole service** — see §2.1 |
| ControlTheMarket | ctm-service | ✅ | (ads/CPC system minor) |
| Jobs board | jobs-service | ✅ | — |
| Amarisé luxury commerce | commerce-service +co | ✅ | luxury **authenticity-score** review pipeline |
| Mining B2B | mining-service | ✅ | — |
| Market (crypto research) | market-service | ✅ | — |
| IR investor portal | ir-service | 🟡 | **KYC/accreditation**, deal-room realtime depth |
| MarketUnderworld community | insiders/elite-circle | ✅ | — |
| Connect (influencer) | brand-connector | ✅ | — |
| LawElite | law-service / law-elite | ✅ | — |

### 2.1 BillBana — GST Billing OS — 🔴 build
- **Purpose:** multi-tenant Indian GST billing/accounting SaaS (invoicing, e-invoicing, payroll, CRM).
- **Workflow:** tenant onboards → creates GST invoice → **IRN/e-invoice** generated via GSTN → ledger/accounting entry → GSTR auto-prep → payroll run → CRM follow-ups.
- **Pending:** dedicated service + `billbana` schema; **GST engine**, **e-invoicing (IRN)**, **payroll**, **GSTR auto-gen**, **CRM**. (GST/tax primitives exist in `commerce-service` + Java finance, but the product service is not built. Watch GSTN sandbox rate limits — budget ~3 days.)

---

## 3. Trade Platform — 32 microservices (9 clusters)

Backed by `trade-service` (Marketplace + RFQ are **real**; the rest is mock) and the
Java `financial-services-java` suite (9 services **built but never compiled** — Java 1.7, no Maven here). Treat Java pieces as 🟡 "scaffolded, needs compile + wiring."

### Cluster 2 — Marketplace Engine
| Service | Status | Purpose → Workflow | Pending |
|---|---|---|---|
| Listings | 🟡 | List products at scale → CRUD + cursor pagination + search index | scale to 50M, OpenSearch wiring |
| RFQ | ✅ | Buyer request → seller quotes → award → deal | — (real in trade-service) |
| AI Matching | 🔴 | Score buyer↔seller 0–100 → rank → suggest | build (Vertex/ml-service) |
| Price Intelligence | 🔴 | 90-day commodity benchmarks → show fair price | build ingestion + analytics |
| Sample Order | 🔴 | Order 1–5 units → track | build |
| Tender / Auction | 🔴 | Reverse auction → bids → award | build |

### Cluster 3 — Trade & Deal Engine
| Service | Status | Purpose → Workflow | Pending |
|---|---|---|---|
| Deal Room | 🔴 | Realtime negotiation → counter-offers → term sheet | build (WebSocket via realtime-service) |
| Smart Contract | 🔴 | UCP 600 / Incoterms 2020 contract → e-sign (DocuSeal) | build |
| Escrow | 🟡 | Hold funds → milestone release → payout | Java `escrow`/`account` scaffolded; compile + wire |
| Dispute | 🔴 | AI triage → human mediator → ICC arbitration | build 3-tier flow |
| Inspection Booking | 🔴 | Book SGS/BV/Intertek → report → gate release | build integrations |

### Cluster 4 — Finance Module
| Service | Status | Purpose → Workflow | Pending |
|---|---|---|---|
| Letter of Credit | 🔴 | Issue digital L/C → bank API → presentation → settle | build (only a model field exists) |
| Bank Guarantee | 🔴 | Performance/advance/bid bond issuance | build |
| Invoice Finance | 🔴 | Upload invoice → risk score → 90% fund in 24h | build |
| Trade BNPL | 🔴 | 30/60/90-day terms → risk engine → instant seller pay | build |
| FX Engine | 🟡 | 150+ pairs, 30s rates, rate-lock, forwards | `fxController` exists; add rate-lock/forwards + live feed |
| Multi-Currency Wallet | 🟡 | Per-user balances → payout | Java `ledger`/`account` scaffolded; compile + wire |

### Cluster 5 — Compliance & KYC
| Service | Status | Purpose → Workflow | Pending |
|---|---|---|---|
| KYC | 🟡 | Doc + liveness (Onfido/Digio) → verdict → gate access | Java account-service has KYC fields; build verification flow |
| AML Monitoring | 🟡 | Watch transactions → FATF risk grade → alerts | trade-service has compliance *model* only; build engine |
| Sanctions Screening | 🟡 | Screen parties vs OFAC/UN/EU/UK/AU on every trade | model only; build list ingestion + screening |
| Trust Score | 🔴 | 0–1000 composite (6 factors) recomputed per trade | build |
| Fraud Detection | 🔴 | ML on listings/identity/collusion | build (ml-service) |
| Export Control | 🔴 | Dual-use + prohibited-country + license check | build |

### Cluster 6 — Logistics & Customs (all 🔴 build)
- **Freight Booking** — compare 50+ carriers (sea/air/road/rail) → book.
- **Shipment Tracking** — live vessel/carrier position → exceptions.
- **Digital B/L** — electronic bill of lading → title transfer/surrender.
- **Customs Filing** — AI HS classifier + tariff calc → 5-country templates.
- **Certificate of Origin** — auto-gen + e-stamp → chamber submission.
- **Carbon Footprint** (P2) — CO₂/shipment → offset → ESG report.

### Cluster 7 — Payments & Settlement
| Service | Status | Purpose → Workflow | Pending |
|---|---|---|---|
| Payment Rails | 🔴 | Route to SWIFT/SEPA/ACH/UPI/Pix/M-Pesa/SPEI | build adapters |
| Settlement Engine | 🟡 | 24h settle + nightly reconciliation, 150+ ccy | Java `settlement`/`reconciliation` scaffolded; compile + wire |
| Insurance | 🔴 | Cargo/credit/parametric (Lloyd's/Allianz) | build |
| Subscription Billing | ✅ | Plan tiers → Stripe/Razorpay → entitlements | done in proxy + commerce (reuse) |

### Cluster 8 — AI & Intelligence (mostly 🔴; `ml-service` is the home)
- **Credit Scoring** (Trade Score 0–1000), **Demand Forecasting** (90-day), **Supplier Risk** (30-day early warning), **NL Trade Assistant** (Gemini → search/match), **Trade Intelligence API (BTI)** (anonymised data product). `ml-service` exists as the host; the models/pipelines are pending.

### Cluster 9 — Platform & Admin
| Service | Status | Pending |
|---|---|---|
| Admin Control | ✅ | (kill-switch/user/fee/moderation in `admin-service` + proxy) |
| Reporting | 🟡 | builder + PDF/CSV/Excel export (Java `reporting` scaffolded) |
| Developer Platform | 🟡 | OpenAPI/sandbox/webhooks/SDKs (proxy has API keys + webhooks) — package it |
| White-Label Tenant | 🟡 | proxy has reseller/white-label (P17); generalize |
| Agent Management | 🔴 | commission tracker + leaderboard + training |

---

## 4. Prioritized pending backlog (build order)

**P0 — finish the foundation (unblocks everything):**
1. Notification Engine → add **SMS + FCM + in-app push**.
2. API Gateway → **GraphQL** + unified **WebSocket**.
3. Audit → **unify into one immutable append-only service**.
4. Multi-tenancy → **global per-query enforcement** (Postgres RLS).
5. Search → **deploy as a service**, OpenSearch cluster, 50M/<50ms.
6. Cache → **shared abstraction** + FX 30s TTL standard.

**P0 — product gaps:**
7. **BillBana GST OS** (whole service).
8. **Compile + wire `financial-services-java`** (escrow, ledger, settlement, reconciliation, account/KYC, payment, audit, reporting, risk) — unblocks Trade Finance/Payments/Compliance.

**P1 — Trade core:**
9. Trade & Deal: **Deal Room, Smart Contract, Dispute, Inspection**.
10. Finance: **L/C, Bank Guarantee, Invoice Finance, BNPL**; finish **FX rate-lock/forwards** + **Multi-Currency Wallet**.
11. Compliance: build **AML, Sanctions, KYC flow, Trust Score**.
12. Payments: **Payment Rails** adapters + finish **Settlement**.
13. Marketplace: **AI Matching, Price Intelligence**.

**P2 — depth & scale:**
14. Logistics & Customs (6 services).
15. AI/Intelligence (credit, demand, supplier risk, NL assistant, BTI).
16. Platform: Reporting builder, Developer Platform packaging, White-Label, Agent Mgmt.
17. Dashboard ERP: AI forecast; IR KYC/deal-room; HUB portal; Amarisé authenticity pipeline; CTM ads.

---

### Guardrails (apply to every new service here)
- **Auth:** verify-only via `@baalvion/auth-node` (RS256/JWKS). **No second issuer. No hand-rolled JWT.**
- **Tenancy:** `tenant_id`/`org_id` on every row + every query.
- **Isolation:** one service = one schema; communicate via gateway/contracts, **never** cross-service DB access.
- **Governance:** add a `catalog/services/<name>.yaml` descriptor and keep `pnpm run architecture:check` green.
- **Conventions:** Node + Express + Sequelize, port in the identity/infra range, mirror an existing service's layout.
