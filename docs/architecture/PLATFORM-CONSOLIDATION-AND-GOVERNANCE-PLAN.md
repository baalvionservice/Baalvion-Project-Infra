# Platform Consolidation & Governance Plan

> **Status:** Audit complete — awaiting ratification of the 3 flagged decisions (§2.4).
> **Scope:** Banking-grade single-source-of-truth enforcement across all backend services.
> **Method:** 11 parallel domain audits over the live monorepo + adversarial verification of every
> CRITICAL/HIGH dual-writer, port-collision and second-issuer claim (file:line evidence retained).
> **Date:** 2026-06-13.

This is a governance artifact, not a code change. Nothing here has been applied. Every claim below
was reproduced against real source; severities reflect post-verification ratings (several initial
CRITICALs were downgraded because the collision is *latent* — gated behind a separate-database default
— rather than already firing).

---

## 1. Executive Summary — what is broken

The platform is **functionally rich but governance-broken**. The danger is not missing capability; it
is that several financial-grade domains have **two or three independent implementations of the same
schema**, kept apart today only by a fragile "separate database" default. The moment the stated goal —
consolidating onto one database — is executed, those latent collisions become live ledger/payment
corruption. The catalog that is supposed to prevent this records neither ports nor schemas and **is not
run in CI at all**.

The nine load-bearing problems:

| # | Problem | Severity | State |
|---|---------|----------|-------|
| 1 | **Ledger is dual-implemented** (Node `commerce/ledger-service` + Java `financial-services-java/ledger-service`). Both create `ledger.journal_entries`, both default to `localhost:5432/baalvion`, with **divergent table shapes and divergent RLS GUC names** (`app.current_tenant` vs `app.current_tenant_id`). | CRITICAL | Verified |
| 2 | **Payments is dual-implemented** (Node + Java `payment-service`, plus a 3rd Java stub in `law-elite`). Both own `payments.transactions` with incompatible column types and divergent RLS. | CRITICAL | Verified |
| 3 | **No ledger is actually immutable.** Neither ledger has append-only triggers, INSERT-only grants, or hash-chaining; reversal **mutates the original posted row in place** in both. The runtime role is granted UPDATE/DELETE. | HIGH | Verified |
| 4 | **Audit is triple-stored with a schema-name collision.** Node `audit-service` (`audit.events`, hash-chained + WORM triggers) and Java `audit-service` (`audit.audit_logs`, **no DB-enforced immutability** — its REVOKE is undone by a later blanket GRANT) both target a schema literally named `audit`; plus ~9 services write their own `*.audit_logs` tables. | CRITICAL→HIGH | Verified |
| 5 | **Single-issuer rule violated by 5+ live token minters.** `auth-service` is canonical, but `oauth-service`, `proxy-service`, `admin-service` (impersonation, holds the canonical private key directly), `investment-platform/apps/api`, and an **unsigned-token** local-auth island in `IR-Baalvion` all mint tokens. | CRITICAL | Verified |
| 6 | **Trade domain is triplicated** across three non-communicating datastores: `trade-service` (schemas `trade`+`tradeops`, 9 engines), `order-execution-service` (schema `oms`, the real money-truth successor), and a **complete embedded backend inside the GTI frontend** (28-model Prisma on its own PostgreSQL). | CRITICAL | Verified |
| 7 | **`order-execution-service` is mis-deployed into the wrong schema.** Code defaults to `oms`, but `docker-compose.gtos.yml:96` sets `DB_SCHEMA: trade` — Docker-deployed OES writes UUID-keyed money tables into trade-service's integer-keyed `trade` schema. Its ledger-client also defaults to `:3016` (account-service), not ledger (`:3014`). | CRITICAL | Verified |
| 8 | **Legacy `order-service_DEPRECATED` is orphaned-but-routable** with a live, HMAC-verified Razorpay capture path writing `orders.orders_order_payments`. Both gateways still route the generic order subtree to it at `:3013`; only `/trade/v1/orders` was migrated to OMS. A payment surface invisible to settlement/reconciliation. | CRITICAL | Verified |
| 9 | **The catalog cannot prevent any of this.** `schema.json` has no field for port or DB schema; the 6 alias groups register one codebase under many names; `enforce.mjs` exempts the nested `services/` tree (so every nested service passes unchecked) and **no CI workflow runs it** despite `CONTRACT.md` claiming it blocks merges. | HIGH | Verified |

Plus pervasive **port chaos**: 11 Node/Java default-port collisions on 3014–3046; the Java suite has two
contradictory port contracts (3014–3046 in standalone Docker vs 13xxx on host) that **disagree inside the
same gateway file**; `cms-service` runs on 3011 but its code/`.env` say 3018; `auth-gateway` runs on 3099
but code defaults to 3026; `baalvion-os` and `investment-platform/apps/api` both claim 4100.

---

## 2. Canonical Architecture Map

### 2.1 Schema → owning service (exactly one writer)

The core banking rule: **one writing service per schema; everyone else is a consumer (API or event).**

| Schema | Canonical owner (ONLY writer) | Today's violators to remove/convert |
|--------|-------------------------------|-------------------------------------|
| `auth` | **auth-service** | central `database/migrations/004` (oauth/api_keys); `session-service` (direct `UPDATE auth.sessions`/`auth.refresh_tokens`); `admin-service` (direct `auth.*` writes) |
| `oauth` *(new, split out of `auth`)* | **oauth-service** | currently co-mingled inside `auth` schema |
| `ledger` | **financial-services-java/ledger-service** *(see §2.4 D1)* | Node `commerce/ledger-service` |
| `payments` | **financial-services-java/payment-service** *(see §2.4 D1)* | Node `commerce/payment-service`; `law-elite/services/payment-service` stub |
| `escrow` | **financial-services-java/escrow-service** | `investment-platform` escrow (isolated DB — allowed short-term); legacy order escrow |
| `settlement` | **financial-services-java/settlement-service** | — |
| `wallet` | **financial-services-java/wallet-service** | — |
| `fx`,`credit`,`risk`,`aml`,`dispute`,`trust_score`,`reconciliation`,`trade_finance`,`smart_contract`,`invoice`,`payment_rails`,`deal_room`,`accounts`,`trade_intelligence` | respective **financial-services-java** module (distinct, keep) | — |
| `audit` | **infrastructure/audit-service** (Node, hash-chained WORM) *(see §2.4 D2)* | Java `audit-service` (rename its schema to `fin_audit` or convert to consumer); ~9 per-service `*.audit_logs` tables |
| `oms` | **order-execution-service** | fix `docker-compose.gtos.yml:96` (`trade`→`oms`) |
| `trade`, `tradeops` | **trade-service** | central `database/migrations/016_trade_full.sql` |
| `legal` | **law-service** | central `database/migrations/015_legal_full.sql`; `law-elite` legal copy |
| `marketplace` | **marketplace-service** *(see §2.4 D3)* | `investment-platform` deal/investor/opportunity models |
| `crm` | **crm-service** | — |
| `cms` | **cms-service** | — |
| `commerce` | **commerce-service** | — |
| `product`,`supplier`,`quality`,`tradedoc` | the four **`Backend/services/trade/*`** scaffolds *(complete or fold into trade-service)* | GTI-local Supplier/Buyer/Document Prisma models |
| `ir`,`about`,`mining`,`real_estate`,`imperialpedia`,`brand`,`dashboard`,`jobs`,`insiders`,`elite_circle` | respective domain service | central `migrate.js` should stop owning these |
| `os` | **baalvion-os** (NestJS kernel; Prisma confined here by enforce C7) | — |

**Cross-cutting database rule:** today ~20+ schemas share one `baalvion_db`, financial-grade FKs reference
`auth.users`/`auth.organizations` directly (`database/migrations/007–014`), and `cms`/`commerce`/`notification`
write to `public` via ORM with no migrations. Target: **per-domain databases** (at minimum: isolate
`ledger`,`payments`,`audit` onto their own instances) with **named schemas**, **no cross-schema FKs**
(replace with event-carried org/user references), and **docker-compose DB host/port pinned** so the
bare-jar default and Node never silently co-locate.

### 2.2 Domain → canonical service

| Domain | Canonical | Notes |
|--------|-----------|-------|
| Identity / token issuance | **auth-service** (issuer) + **@baalvion/auth-node** (only verifier) | oauth-service allowed as OIDC issuer *under one JWKS federation*; all others stripped |
| Ledger (double-entry GL) | **financial-services-java/ledger-service** | the only one with outbox+relay, FORCE RLS, optimistic locking, balance/statement endpoints |
| Payments core | **financial-services-java/payment-service** | richer: Kafka choreography, maker-checker reversals, ISO8583 adapters, Resilience4j |
| Payments edge | **auth-gateway** (BFF) | auth/tenant injection boundary; no PSP logic of its own |
| Audit trail | **infrastructure/audit-service** (Node) | only DB-enforced append-only + hash chain |
| Orders / order-money | **order-execution-service** (`oms`) | R3 money-truth successor; server-computed totals |
| Trade lifecycle / engines | **trade-service** | workflow, compliance, customs, hscode, logistics engines |
| Realtime fanout | **one** WS service *(see §2.4 D… realtime)* | retire the other 5 surfaces; shared `@baalvion/realtime-client` |
| Edge / API gateway | **auth-gateway** (`:3099`) | the Go `gateway` is the proxy-*product* data plane — distinct, keep |
| Marketplace / investment | **marketplace-service** *or* **investment-platform** *(see §2.4 D3)* | one must absorb the other's deal/investor/escrow domain |
| CMS | **cms-service** | — |

### 2.3 Port → final assignment

Resolution of the audited collisions. **Principle:** one host port per live service; the Java suite uses
the **13xxx host range** (its real production contract, set by `auth-gateway/.env.example`), and its
standalone `docker-compose.yml` 3014–3046 mapping is **test/dev only** and must publish to 130xx to match.

| Service | Final host port | Fix required |
|---------|-----------------|--------------|
| auth-service | 3001 | — |
| auth-gateway (BFF / edge) | **3099** | code default 3026 → 3099 (`config/appConfig.js:7`) |
| session-service | 3022 | — |
| oauth-service | 3023 | — |
| rbac-service | 3055 | — |
| cms-service | **3011** | code/`.env` default 3018 → 3011 (align with docker/pm2/Dockerfile) |
| Java ledger | **13014** | proxy.js legacy `TARGETS` map 3014 → 13014; compose publish 13014:3014 |
| Java payment | **13015** | proxy.js dual map reconciled to 13015 |
| Java escrow | **13017** | frees 3017 for ctm-service |
| Java settlement / recon / fin-audit / reporting | **13018 / 13019 / 13020 / 13024** | compose + proxy.js aligned to 13xxx |
| Java risk / trade-finance / credit / fx / wallet | **13035 / 13036 / 13037 / 13038 / 13039** | — |
| Java deal-room / smart-contract / payment-rails / trade-intel / dispute / aml / trust-score | **13040–13046** | route payment-rails through gateway (currently unrouted) |
| ctm-service | **3017** | confirm gateway maps ctm→3017 (not 3011=cms) |
| order-execution-service | 3052 | — (fix its **schema**, not port) |
| Node ledger/payment | **decommissioned** | see migration §4 |
| inventory / law / account collisions on 3014–3016 | reassign Node side off the 13xxx-freed range | resolve per final table in catalog |
| insiders-service / elite-circle-service | 3050 / 3051 | move trade `quality`/`supplier` scaffolds to **3053/3054** |
| trade quality-inspection / supplier-lifecycle | **3053 / 3054** | currently collide with insiders/elite on 3050/3051 |
| trade network-graph / product-registry / trade-documentation | 3047 / 3048 / 3049 | — |
| baalvion-os kernel | **4100** | investment-platform/apps/api → **4200** |
| investment-platform/apps/api | **4200** | resolve 4100 collision |
| realtime (chosen canonical) | 3040 | retire the 3026 copy |
| Go proxy gateway (proxy product) | 10000 / 1080 / 9090 | distinct — keep |

### 2.4 Decisions requiring your ratification

Three calls are genuine product/ownership decisions, not technical defaults. I give a recommendation for each:

- **D1 — Ledger & payments runtime: Java vs Node.** The Java suite is the more mature, catalog-registered
  banking SoR (double-entry, FORCE RLS, outbox, ISO8583), **but the live wiring today routes to the Node
  copies** (OES posts to Node ledger `/api/v1/ledger/entries`; payment events flow through Node). 
  **Recommendation: Java is canonical; retire Node ledger/payment.** Requires repointing OES and the
  payment event flow. If you prefer runtime homogeneity (everything else is Node), the inverse is viable
  but loses the Java suite's stronger durability — not advised for a regulated ledger.
- **D2 — Audit canonical: Node `audit.events` (hash-chained, WORM-enforced) is the clear winner** over the
  Java `audit.audit_logs` (immutability documented but undone by a blanket GRANT). Recommendation: keep
  Node audit-service; Java audit-service either renames its schema to `fin_audit` (if its finance-specific
  rows must persist) or becomes a consumer that POSTs to audit-service.
- **D3 — Marketplace vs investment-platform.** Both implement deal-room / investor / escrow / KYC. They
  currently run on separate databases (`baalvion_invest`), so this is not yet a live collision.
  Recommendation: **pick `marketplace-service` as the platform-native canonical** and reduce
  investment-platform to either (a) a product skin over marketplace-service APIs, or (b) a deliberately
  isolated product with a hard data boundary and federated identity — never a silent third money domain.

---

## 3. Full duplicate classification & removal list

Classification per the required taxonomy. "KEEP" = canonical; "REMOVE/CONVERT" = action.

### 3.1 Catalog duplicates (one codebase, many names) — *delete the alias descriptors*

| Alias group (one codebase) | KEEP | REMOVE (catalog descriptors) | Risk |
|----------------------------|------|------------------------------|------|
| proxy-service | `proxy-platform` | `abuse-platform`, `analytics-platform`, `audit-platform` | HIGH (one of them is a phantom "audit" identity) |
| auth-service | `auth-service` | `identity-platform` | HIGH (dep graph split across 2 names) |
| admin-service | `admin-service` | `organization-platform` | MEDIUM |
| commerce-service | `commerce-service` | `billing-platform` | MEDIUM |
| notification-service | `notification-service` | `notification-platform` | MEDIUM |
| gateway (Go) | `gateway` | `proxy-gateway` | MEDIUM |
| order-service (phantom) | — | `order-service` descriptor (path renamed `_DEPRECATED`) | HIGH |

### 3.2 Code-level duplicates (same schema + responsibility) — *merge to canonical, delete loser*

| Domain | KEEP (canonical) | REMOVE / CONVERT | Risk |
|--------|------------------|------------------|------|
| ledger | Java `ledger-service` | Node `commerce/ledger-service` → **decommission** | CRITICAL |
| payments | Java `payment-service` | Node `commerce/payment-service` → **decommission or demote to PSP-adapter**; `law-elite/payment-service` stub → **delete** | CRITICAL |
| audit | Node `infrastructure/audit-service` | Java `audit-service` → **rename schema `fin_audit` or convert to consumer** | CRITICAL→HIGH |
| identity issuance | `auth-service` | strip token-minting from `proxy-service`, `admin-service`, `oauth-service` (federate under one JWKS), `investment-platform`, IR-Baalvion local-auth → **delete the unsigned-token island** | CRITICAL |
| orders / order-money | `order-execution-service` | `order-service_DEPRECATED` → **freeze + decommission**; trade-service `/v1/orders` → **proxy/retire** | CRITICAL |
| trade lifecycle | `trade-service` (engines) + `order-execution-service` (money) | GTI embedded orchestration/event-store → **convert GTI `src/server` to a thin BFF**, drop its Prisma DB | CRITICAL |
| realtime fanout | one chosen WS service | retire 5 other WS surfaces; replace embedded sockets in trade-service/law-service/proxy-service/baalvion-os with `@baalvion/realtime-client` | HIGH |

### 3.3 Partial overlaps (shared domain, different scope) — *define boundary, no full delete*

| Domain | Resolution |
|--------|-----------|
| `organizations` (auth / public / trade / GTI) | `auth.organizations` is canonical; others reference by event-carried `org_id`, drop local org tables |
| escrow (Java / investment-platform / payment-service `payment_scheme='ESCROW'`) | Java `escrow-service` canonical; investment-platform isolated short-term; remove escrow semantics from payment rows |
| sessions/refresh-tokens (auth-service vs session-service) | `auth-service` owns the tables; `session-service` calls its API, stops direct `UPDATE` |
| trade documents (4 subsystems) | `trade-documentation-service` (`tradedoc`, S3/WORM) canonical once built; collapse trade-service's two doc paths + GTI Document |
| compliance/risk (trade-service ×3 endpoints + GTI engine) | trade-service compliance engines OR Java risk/aml/trust-score suite as platform compliance; GTI calls out |
| JWKS endpoints (auth-service + oauth-service) | one federation; verifiers trust both `kid`s via a single discovery doc |

### 3.4 Legitimately distinct (name proximity only — keep both)

`report-service` (`reports`, builder) vs Java `reporting-service` (`reporting`, finance jobs); the Go
`gateway` / `proxy-service` / `Proxy-BaalvionStack` trio (three components of the proxy *product*, not
duplicates). **Action: rename for clarity, do not merge.**

---

## 4. Migration plan (zero-downtime) for the critical systems

General rule for every cutover: **freeze the secondary writer → shadow → replay/reconcile → cut reads →
decommission.** Never delete before reconciliation proves parity.

### 4.1 Ledger (CRITICAL — D1: consolidate onto Java `ledger-service`)

1. **Freeze secondary writer.** Repoint `order-execution-service` ledger-client from `:3016`→ canonical
   Java ledger (`:13014`) and fix `appConfig.js:68` default. Put Node `ledger-service` into read-only
   (revoke INSERT for its role); it stops receiving new postings.
2. **Shadow.** Dual-write window: OES posts to Java ledger; a one-off reconciler backfills historical
   Node `ledger.journal_entries` into the Java schema, normalizing the RLS GUC (`app.current_tenant` →
   `app.current_tenant_id`) and table shape. Compare running balances per tenant.
3. **Event replay validation.** Replay the `baalvion:events` payment stream through the Java ledger in a
   staging DB; assert every posting balances (sum(debits)=sum(credits)) and tenant scoping holds.
4. **Cutover.** Switch all readers (statements, balances, reconciliation-service) to Java ledger. Add the
   **append-only enforcement that neither ledger has today**: INSERT-only grant + `BEFORE UPDATE/DELETE`
   trigger + hash-chain (prev_hash) on `journal_entries`. Reversals become *new compensating postings*,
   never in-place `UPDATE`.
5. **Decommission.** Delete Node `commerce/ledger-service`, its catalog/pm2/compose entries, and the Node
   `ledger` migration history.

### 4.2 Payments (CRITICAL — D1: consolidate onto Java `payment-service`)

1. **Freeze.** Stop the legacy Razorpay path in `order-service_DEPRECATED`: remove its gateway routes at
   `:3013` (both gateways), so no new `orders.orders_order_payments` rows are created.
2. **Shadow.** Route all new payment intents through OES→Java payment-service. Backfill the deprecated
   `orders.orders_order_payments` and Node `payments.transactions` into the Java `payments` schema,
   reconciling column-type drift (`NUMERIC(19,4)` vs Java type) and RLS GUC.
3. **Replay.** Re-drive the payment outbox/Kafka choreography against the Java ledger in staging; confirm
   every captured payment has a matching GL posting (closes the gap where 404s silently settle money with
   no ledger record — verified claim #11).
4. **Cutover.** All payment reads/PSP callbacks (Razorpay/Stripe/Wise) terminate at Java payment-service
   (or the demoted Node service acting purely as a PSP webhook adapter that forwards to Java). Route
   `payment-rails-service` through the gateway (currently unrouted).
5. **Decommission.** Delete Node `commerce/payment-service` writes, the `law-elite` payment stub, and
   `order-service_DEPRECATED` entirely once parity holds.

### 4.3 Audit (CRITICAL — D2: consolidate onto Node `audit-service`, preserve hash-chain)

1. **Freeze.** Stop new direct `*.audit_logs` writes service-by-service; replace each with an emit to
   `audit-service` (POST `/v1/audit` or the `baalvion:events` stream it already consumes).
2. **Shadow.** Mirror existing per-service audit rows into `audit.events` with a backfill job, preserving
   original timestamps; **recompute the hash chain** over the merged, time-ordered set.
3. **Validation.** Verify chain integrity end-to-end (each row's `prev_hash` matches); verify no gaps.
   Add the missing **RLS + write-time tenant validation** to `audit.events` (verified claim #20 — it
   currently trusts client-supplied `tenant_id`).
4. **Cutover.** All audit reads point at `audit-service`. Java `audit-service` either renames its schema
   to `fin_audit` (finance-specific retention) or is retired.
5. **Decommission.** Drop redundant `*.audit_logs` tables after retention window; keep the schema-`audit`
   name owned solely by Node audit-service.

### 4.4 Orders / OMS (CRITICAL — fix mis-deploy, then retire legacy)

1. **Fix the deploy bug first** (non-negotiable, do before anything else): `docker-compose.gtos.yml:96`
   `DB_SCHEMA: trade` → `oms`. Confirm no OES rows have leaked into `trade.*`.
2. Freeze `order-service_DEPRECATED` (covered by §4.2 step 1) and trade-service `/v1/orders`.
3. Shadow/backfill legacy + trade orders into `oms.orders`; reconcile money-truth (server-computed totals).
4. Cut all order reads/writes to OES; trade-service `/v1/orders` becomes a proxy or is removed.
5. Decommission legacy order paths.

### 4.5 Identity / single-issuer (CRITICAL)

1. Inventory every minter (done — 5+). Move the canonical RS256 private key **out of admin-service**;
   admin impersonation tokens must be requested from auth-service via a privileged grant, not minted locally.
2. Federate `oauth-service` under one JWKS discovery so verifiers trust both `kid`s; strip `proxy-service`'s
   parallel login/signup/refresh (migrate its `public.users` to `auth`).
3. **Delete the IR-Baalvion `local-auth` island** (mints *unsigned* tokens with hardcoded passwords) — no
   migration, just removal + env cleanup.
4. Decide investment-platform federation (D3): either issue via auth-service or keep a hard-isolated IdP
   with a documented trust boundary; never share the `baalvion_refresh` cookie name across issuers.

### 4.6 Embedded frontend backends (CRITICAL)

- **GTI (`Global-Trade-Infrastructure-main`):** convert `src/server` + 28-model Prisma DB into a thin BFF
  over trade-service + order-execution-service + Java finance. This is the largest single piece of work;
  stage it: read-path proxy first (frontend reads backend APIs), then move writes, then drop the Prisma DB.
- **investment-platform/apps/api:** resolve via D3.
- All other 14 Frontend apps verified as pure API consumers — no action.

---

## 5. Risk assessment

### 5.1 Confirmed CRITICAL (block consolidation until mitigated)

1. **Ledger dual-write corruption on DB merge** — two migration histories + divergent RLS on `ledger.*`.
   The consolidation goal itself triggers it. *Mitigate: §4.1 before any DB merge.*
2. **Payments dual-write** on `payments.transactions` — same shape. *§4.2.*
3. **Auth schema split-brain** — `auth-service` raw-`psql` chain (no migration tracking) + central `004`
   + `session-service` direct UPDATEs, all on one `auth` schema with no shared ordering. *§4.5.*
4. **5+ token issuers incl. an unsigned-token island** — auth bypass surface. *§4.5.*
5. **Legacy order-service live Razorpay path** invisible to settlement/reconciliation. *§4.2/4.4.*
6. **OES mis-deployed to `trade` schema** + ledger-client pointing at account-service — money posts can
   404 and silently settle with no GL record. *§4.4 step 1 (do first).*
7. **Trade triplication incl. GTI embedded banking backend** on its own DB. *§4.6.*

### 5.2 Confirmed HIGH

- No DB-enforced ledger immutability / hash-chaining (convention only).
- Audit `audit` schema-name collision; Java audit not immutable; Node audit has no RLS/tenant validation.
- `organizations` split across 4 stores; cross-schema FKs to `auth.*` block per-domain DB isolation.
- 6 WS fanout servers, 3-way deploy disagreement on which realtime-service is canonical.
- 11 default-port collisions on 3014–3046; Java suite's two contradictory port contracts inside one gateway.
- payment-rails-service built but unrouted (callers must bypass the gateway trust boundary).
- enforce.mjs never scans nested `services/`, `investment-platform/`, or `Frontend/`, and **runs in no CI**.

### 5.3 Severity corrections made during verification (intellectual honesty)

Several initial CRITICALs were **downgraded** because the collision is *latent* (separate-DB default), not
firing: the Node/Java default-port collisions (CRITICAL→HIGH), cms/auth-gateway port-default mismatches
(HIGH→MEDIUM), and one "ledger saga topic mismatch" claim was largely **refuted** (HIGH→LOW — the `.v1`
suffix topic is unused but the live money-path uses the synchronous ledger client, so nothing is silently
broken). The latent ones still matter because **the consolidation makes them live.**

---

## 6. Governance enforcement layer (prevents recurrence)

The catalog must become **executable truth**, enforced in CI. Required changes:

### 6.1 Catalog schema (`Backend/catalog/schema.json`)

Add required, **globally-unique** fields:
- `port` — integer, unique across all descriptors (CI fails on collision).
- `schemas_owned` — string[], **unique across the catalog** (a schema may appear in exactly one descriptor).
- `token_issuer` — boolean (default false); only descriptors with `true` may mint tokens.
- `database` — logical DB name (enables per-domain DB enforcement).
- One descriptor per codebase: forbid two descriptors sharing a `metadata.path` (kills alias groups).

### 6.2 `enforce.mjs` rules (new + fixed)

- **Fix the scan blind spot:** recurse into `Backend/services/**`, and also scan `investment-platform/`
  and `Frontend/*` for embedded backends. Remove the `services`-dir exemption.
- **One-writer-per-schema:** grep all migrations + ORM models; any schema with `CREATE TABLE`/migrations in
  a service whose descriptor doesn't `own` that schema → **FAIL**.
- **Port uniqueness:** cross-check `schemas_owned`/`port` against pm2 configs, docker-compose, `.env.example`,
  Dockerfile EXPOSE; any divergence between declared and deployed port → **FAIL**.
- **Single-issuer:** grep `jwt.sign(`, `new SignJWT`, `Jwts.builder`, `JWT.create` across Backend + Java +
  investment-platform; any hit outside a `token_issuer:true` descriptor → **FAIL**.
- **No embedded frontend datastores:** any `Frontend/*` app with `@prisma/client`/`pg`/`knex`/`mongoose`
  + a write-path `app/api` route → **FAIL** (allowlist baalvion-os; investment-platform pending D3).
- **No new pm2 manifest:** exactly one root pm2 manifest is permitted.

### 6.3 CI wiring (the missing piece)

Add `.github/workflows/architecture.yml` that runs `pnpm run architecture:check`
(`validate.mjs` + `enforce.mjs`) on every PR and **blocks merge on failure**. Today no workflow invokes
it — `CONTRACT.md`'s claim that the contract gates merges is currently false.

### 6.4 Forbidden patterns (codified)

| Forbidden | Detection |
|-----------|-----------|
| Two services writing one schema | `schemas_owned` uniqueness + migration grep |
| Embedded ledger/payment/audit/identity | service writing `ledger`/`payments`/`audit`/`auth` it doesn't own |
| Second token issuer | `jwt.sign`/`Jwts.builder` outside allowlist |
| `CREATE SCHEMA` in >1 service | migration grep, single-owner check |
| Cross-schema FK to `auth.*` | migration AST scan (replace with event-carried refs) |
| New `app/api` write route in a Frontend app | Frontend scan |
| In-place `UPDATE`/`DELETE` on ledger/audit tables | grep + DB grant audit |
| Raw cross-service DB connection string | `.env` scan for another domain's schema/DB |

### 6.5 Service registration requirement

No service is deployable (no pm2/compose entry accepted) without a catalog descriptor that declares its
`port`, `database`, `schemas_owned`, and `token_issuer`. The deploy census must be **derivable from the
catalog**, not from three divergent pm2 manifests + docker. Consolidate to one pm2 manifest and one compose
topology, both generated from / validated against the catalog.

---

## Appendix — evidence index

Every CRITICAL/HIGH item above was reproduced at file:line during adversarial verification (20 claims
verified individually; 24 carried at parent level). Key anchors:

- Ledger dual-write: `commerce/ledger-service/migrations/001_create_journal_entries_table.sql:4,42` vs
  `financial-services-java/ledger-service/.../V001__create_journal_entries_table`.
- Payments drift: `commerce/payment-service/migrations/001_create_transactions_table.sql:10,14` vs
  Java `domain/Transaction.java:22-23`.
- Ledger mutability: `commerce/ledger-service/controllers/entriesController.js:221-224` (in-place UPDATE).
- Audit: `infrastructure/audit-service/migrations/001_audit_schema.sql:7,10,53-66` (WORM triggers) vs
  Java `audit-service/.../V001:27-29` REVOKE undone by `V005__grant_baalvion_app.sql:14`.
- Identity issuers: `auth-service/utils/jwtRsa.js`, `oauth-service/utils/keys.js`,
  `proxy-service/utils/jwtserver.js`, `admin-service` (`jwt.sign` w/ isolated issuer),
  `IR-Baalvion-main/src/lib/auth/local-auth.ts` (unsigned).
- OES mis-deploy: `order-execution-service/config/appConfig.js:19,68` vs `docker-compose.gtos.yml:96`.
- Legacy payments: `order-service_DEPRECATED/service/paymentProvider.js:95-148` (live Razorpay HMAC).
- Ports: `auth-gateway/routes/proxy.js:28-36` (30xx) vs `:58-67` (13xxx); `cms-service/config/appConfig.js:9`
  (3018) vs `docker-compose.yml:69,71` (3011); `auth-gateway/config/appConfig.js:7` (3026) vs `.env.example:2` (3099).
- Catalog: 6 alias groups + phantom `order-service`; `schema.json` has no port/schema field;
  no `.github/workflows` runs `enforce.mjs`.
