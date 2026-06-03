# Global Trade Infrastructure (GTI) — Full-Stack Audit

**Date:** 2026-06-03
**Auditor scope:** GTI frontend (`Frontend/Global-Trade-Infrastructure-main`), `Backend/services/commerce/trade-service`, `Backend/services/commerce/financial-services-java`.
**Method:** Evidence-based static read + live Postgres (`baalvion_db.trade.*`) + running-process inspection. AUDIT ONLY — no code changed.

---

## Executive Summary

GTI is **substantially real full-stack**, far beyond the "Marketplace + RFQ are real, rest is mock" prior. The Node `trade-service` is a mature service: **28 typed Sequelize models, 28 route groups, 30 controllers, all 28 tables live in Postgres `trade` schema**, versioned SQL migrations, helmet + rate-limit + tenant-scoped queries, BullMQ workers, a real RS256/BFF auth model, and an HMAC-verified Java→Node finance webhook bridge. The frontend talks to it through a clean cookie-based BFF client (`/trade-bff` → auth-gateway), with **no Supabase/Firebase usage anywhere in `src`** (only stale root `firestore.rules`/`apphosting.yaml` artifacts).

**Real vs mock split (frontend service layer):** of 89 top-level service modules, **79 make real `apiClient` endpoint calls**; 17 are pure local utilities (AI/analytics/observability/validation). However, "calls apiClient" overstates feature depth: a large share of the advanced services persist to the **generic JSONB collection store** (`/:collection`) rather than a typed engine, i.e. real persistence but no domain logic/validation server-side. **Estimate: ~55–60% genuinely real end-to-end** (typed CRUD + lifecycle + DB), ~25–30% real-persistence-only (generic store, no engine), ~10–15% mock (main dashboard KPIs/hero, FX static fallback, some intelligence/AI).

**Auth model:** Canonical **RS256 via auth-gateway BFF** (`@baalvion/auth-node`). HS256 issuance is permanently retired (`utils/jwtserver.js` `signAccessToken` throws unconditionally; `dualTokenVerifier` `rejectHs256:true`). No second issuer is active. No auth bypass found.

**Java finance suite:** Now **COMPILED** — 21 `*-1.0.0-SNAPSHOT.jar` artifacts present (resolves the "historically uncompiled" status), including all 7 trade microservices (deal-room, smart-contract, payment-rails, trade-intelligence, dispute, aml, trust-score). BUT only **1 of ~20 finance containers is running** (`baalvion-payment-service`), and trade-service `FINANCE_ENABLED` defaults to **false** — so money movement, AML/sanctions engines, and trade-intelligence are built-but-dormant in this environment.

**Production-readiness verdict: NOT production-ready (limited-beta grade).** Core commerce loop (RFQ→quote→deal→order→payment-projection→shipment→document-metadata→dispute) is real and demonstrable on seed data. Blockers: no server-side input validation on trade routes, two tenant-spoofing-on-create gaps, document "vault" is metadata-only (no real file storage), finance engines not running, dashboards partly mock, `ignoreBuildErrors:true` masking type debt.

---

## Feature Matrix

| Feature | Frontend | Backend API | DB persistence | Real/Mock | Status |
|---|---|---|---|---|---|
| Auth / login / register / MFA / sessions | `lib/api-client.ts authApi` (cookie BFF) | gateway `/auth/*` → auth-service (RS256) | `trade.users`, `refresh_tokens` (4 users) | **REAL** | Canonical RS256 BFF; local `authController` login is dead (signAccessToken throws) |
| Marketplace listings | `marketplace-service.ts` | `GET/POST /marketplace_listings` (listingController) | `marketplace_listings` (3) | **REAL** | Typed CRUD; `mockListing` fallback on empty |
| RFQ | `rfq-service.ts` | `/rfqs` + `/:id/award /:id/close` (rfqController) | `rfqs` (6) | **REAL** | Typed CRUD + lifecycle, owner-scoped mutations |
| Quotations / bids | `rfq-service.ts` | `/quotations` (price ASC) | `quotations` (2) | **REAL** | Typed CRUD |
| Deals / negotiation | `deal-service.ts` | `/deals` + finalize/commit (dealController, participant-auth) | `deals` (4) | **REAL** | Typed CRUD, dual-party scoping. Chat via `chat_messages` |
| Deal-room messages | `deal-service.ts` | `/chat_messages` (messageController) | `chat_messages` | **REAL** | Typed CRUD |
| Orders | `order-service.ts` | `/orders` (orderController) | `orders` (2) | **REAL** | Typed CRUD, tenant-stripped create |
| Payments | `payment-service.ts` | `/payments` (paymentController) | `payments` (3) | **REAL (projection)** | Local row real; real money only when `FINANCE_ENABLED` → Java payment-service. Reconciled by finance webhook |
| Escrow | `escrow-service.ts` | `/escrows` (escrowController) | `escrows` (2) | **REAL (projection)** | Typed CRUD; Java escrow-service not running |
| Wallets | `payment-service.ts` | `/wallets` (walletController) | `wallets` | **REAL** | Typed CRUD |
| FX rates / locks | `fx-service.ts` → `services/finance/fx.ts` | gateway `/finance-bff/fx/*` → Java fx-service :3038 | (Java-side) | **REAL when up, MOCK fallback** | Static-table fallback when fx-service unreachable |
| Shipments | `logistics-service.ts` | `/shipments` (shipmentController) | `shipments` (4) | **REAL** | Typed CRUD |
| Freight / carriers | `carrier-service.ts` | `/carriers`, `/shipping_quotes`, `/shipping_selections` (freightController) | `carriers` (6), `freight_quotes` | **REAL** | Typed quote engine |
| Bill of Lading (e-B/L) | `logistics-service.ts` | `/bills_of_lading` (billOfLadingController) | `bills_of_lading` (2) | **REAL** | Typed lifecycle (title-transfer/surrender) |
| Customs filing | `customs-service.ts` | `/customs_entries` (customsController) | `customs_entries` (2) | **REAL** | Typed entries + HS/tariff |
| Certificate of Origin | `certification-service.ts` | `/certificates_of_origin` | `certificates_of_origin` (2) | **REAL** | Typed issue→certify lifecycle |
| Carbon footprint | — | `/carbon_footprints` | `carbon_footprints` | **REAL** | Typed CO2e/offset |
| Insurance (policies/claims) | `insurance-service.ts` | `/insurance_policies`, `/insurance_claims` | `insurance_policies` (1) | **REAL** | Typed quote→bind, file→pay |
| Documents (B/L, CoO, invoices) | `document-service.ts` | `/documents` (documentController) | `documents` (2) | **REAL metadata, STUB storage** | No file upload; client supplies `file_url`. No S3/minio/multer |
| Disputes | `dispute-service.ts` | `/disputes` + evidence/resolve (disputeController) | `disputes` (1) | **REAL** | Typed CRUD + evidence array |
| Compliance cases | `compliance-service.ts` | `/compliance` (complianceController) | `compliance_cases` (0) | **REAL tracker, NO engine** | Case CRUD only; no KYC/AML/screening logic |
| Sanctions screening | `sanctions-service.ts` + `app/api/sanctions/screen` | (a) generic `/sanctions_signals`; (b) Next BFF → Java risk-service :3035 `/api/v1/sanctions/screen` | generic store | **MIXED** | Real engine via risk-service route (if up); generic-store CRUD otherwise |
| Notifications | `notification-dispatcher.ts` | `/notifications` + queue worker | `notifications` (0) | **REAL** | BullMQ fan-out; email/SMS simulated until provider keys |
| Main dashboard (KPI/hero/volume) | `app/(dashboard)/dashboard` → `services/api.ts` | mostly `@/data` constants | none | **MOCK** | `services/api.ts` header: "placeholder... returns mock data" |
| Advanced intelligence / AI / risk-intel | `services/intelligence/*`, `risk-intelligence-service.ts` | local + some generic store | mostly none | **MOCK / generic-store** | AI flows, analytics, oracles are client-side |
| Generic resources (alerts, risk_signals, contracts, etc.) | various | `/:collection` (collectionController) | `collections` (98) | **REAL persistence, no engine** | JSONB store, tenant-scoped |

DB row counts (live, 2026-06-03): seed/demo volume — collections 98, rfqs 6, carriers 6, deals 4, shipments 4, users 4, listings 3, payments 3, organizations 3; compliance_cases 0, notifications 0.

---

## Per-Area Detail (file:line evidence)

### 1. Authentication & Authorization — CANONICAL RS256, no bypass

- **Gateway-only trust boundary.** `middleware/authMiddleware.js:30-43` — `authMiddleware` requires a verified gateway identity (`bffBridge`), returns 401 `GATEWAY_REQUIRED` for direct bearer tokens. Comment: "Phase 6E-8 HARD STATE... Bearer token verification permanently removed. No HS256 path."
- **BFF bridge** `middleware/bffBridge.js:78-110` — verifies v2 HMAC identity envelope (`x-identity-envelope`/`x-envelope-sig`, 30s replay window) or v1 signed headers; `timingSafeEqual` on signatures. Default mode `hybrid` (`bffBridge.js:34`).
- **HS256 retired.** `utils/jwtserver.js:17-19` — `signAccessToken = () => { throw new Error('HS256 PERMANENTLY RETIRED...') }`. `middleware/dualTokenVerifier.js:73-75` — `rejectHs256: true` hard-coded; `verify()` throws on `alg === 'HS256'` (`dualTokenVerifier.js:104-109`).
- **Uses `@baalvion/auth-node`** for both server (`utils/jwtserver.js:7`) and JWKS verifier (`dualTokenVerifier.js:24`). `config/appConfig.js:38` reads `JWT_ACCESS_SECRET` via `requireEnv` (legacy field; not used to mint user tokens anymore).
- **Frontend** `lib/api-client.ts:1-20,42-49,62-86` — no JS bearer; httpOnly cookies + CSRF double-submit + single-flight refresh. Talks only to `/trade-bff` (next.config `next.config.ts:58-59`).
- **Dead local auth surface.** `routes/authRoutes.js` wires `/auth/register|login|refresh` → `authController` which calls `tokenFor()`→`signAccessToken()` (`controller/authController.js:14-17,38`) → **throws 500**. These endpoints are wired but non-functional; real auth is the gateway. *Cleanup candidate, not a vuln.*

### 2. Trade workflows & lifecycle

- **Real chained lifecycle** in `rfq-service.ts:acceptQuote` (lines ~205-250): `PATCH /quotations/:id {accepted}` → `POST /deals` → `PATCH /rfqs/:id/award` → notification dispatch → event-bus. All hit real persisted endpoints.
- Typed controllers all follow the same real pattern: `findAndCountAll` + pagination + `{success,data,meta}` envelope + tenant `where`. See `controller/rfqController.js`, `dealController.js`, `paymentController.js`, `disputeController.js`, `escrowController.js`, `orderController.js`.
- **Deal participant authz** `middleware/participantAuth.js:22-37` — buyer/seller-org scoping; admin bypass; 404 (not 403) on non-participant get (no existence leak, `dealController.js getDeal`).

### 3. Forms & persistence; mock vestiges

- Forms persist via real POST/PATCH (RFQ create `rfq-service.ts toApiPayload`, listing/deal/order/dispute/quote create). Verified live rows in Postgres.
- **No Supabase/Firebase in `src`** (grep returned 0). Root `firestore.rules`, `apphosting.yaml`, `.idx`-style files are stale Firebase-Studio scaffold, not imported by code.
- **Mock layer:** `services/api.ts:1-7` self-declares mock; `src/data/index.ts` (223 lines of constants) feeds dashboard KPIs/hero/volume/FX/alerts. `services/demo-service.ts` injects synthetic activity on a 4s timer.

### 4. Dashboards

- Main executive dashboard = **MOCK** (`services/api.ts` + `@/data`). Domain pages (marketplace, deals, rfq, payments, shipments, documents) read **REAL** services. ~40 dashboard route folders exist under `app/(dashboard)/`.

### 5. APIs (trade-service)

- Mount: `routes/v1.js` under `/v1` and `/api/v1` (`index.js`). ~28 route groups + bespoke `/platform_stats`, `/fx`, `/providers/health`, `/system/*`, `/internal/finance-events`, generic `/:collection` catch-all (must be last, `v1.js`).
- **Envelope:** consistent `{success, data, meta:{requestId,timestamp,version}}` (`utils/response.js`). Errors: `{success:false, error:{code,message,details,requestId}}`.
- **Pagination:** `sendPaginated` → `{items,total,page,limit}` on typed lists; generic store returns bare array. Frontend `lib/api-list.ts toList()` normalizes both.
- **Validation:** **MISSING on trade routes** — only `authController` validates. `zod` is a dependency but unused for trade resources; controllers pass `req.body` straight to `Model.create/update`.

### 6. Document handling — STUB

- `routes/documentRoutes.js` has no upload route; `POST /` (documentController.createDocument) stores `req.body` only. `models/documents.js` has `file_url`/`file_hash`/`classification`/`version` but binary is **never received or stored** by trade-service. Frontend `document-service.ts vaultDocument` posts `file_url`/`uploaded_by` metadata. **No S3/minio/multer anywhere.** Lifecycle (`/:id/verify`, `/:id/reject`) is real on the metadata record.

### 7. Notifications — REAL

- `services/notification-dispatch.js` — queue-backed (`enqueue` BullMQ), in-app row persisted to `notifications`, fan-out to email/sms/ws queues, cached unread counter. Email/SMS "simulated" until provider keys. Started in-process unless `QUEUE_WORKERS=false` (`index.js`).

### 8. Java finance suite & bridge

- `financial-services-java`: 21 compiled jars (`*/target/*-1.0.0-SNAPSHOT.jar`) incl. ledger, payment, account, escrow, settlement, risk, aml, deal-room, smart-contract, payment-rails, trade-intelligence, dispute, trust-score.
- **Only `baalvion-payment-service` container running.** trade-service `config.finance.enabled` = `FINANCE_ENABLED==='true'` (default false, `appConfig.js`). So payments stay local-projection.
- **Bridge is real:** `controller/internalController.js` — HMAC-SHA256 over raw body (`verifySignature`), idempotency cache, `runAs({bypass})` system write, projects Java payment events onto `Payment` rows. `lib/financeClient.js` — real HTTP client (AbortController timeout, error.status mapping) to Java `/api/v1/payments/initiate`.

---

## Security Notes

| # | Severity | Finding | Evidence |
|---|---|---|---|
| S1 | **HIGH** | **No server-side input validation** on any trade route. `req.body` flows directly into Sequelize `create/update`. `zod` declared but unused outside auth. Mass-assignment + invalid-enum 500 risk (partially mitigated in dealController status guard). | `controller/*.js` (e.g. `createDocument`, `createListing`, `createDeal`); `package.json` zod dep |
| S2 | **HIGH** | **Tenant/owner spoofing on create — Deal & Listing.** `createDeal` (`dealController.js`) and `createListing` (`listingController.js`) do NOT strip client-supplied fields the way rfq/payment/order/escrow/dispute do. A caller can set `buyer_org_id`/`seller_org_id`/`tenant_id`/`companyId` arbitrarily (listing partially binds `companyId` from auth only when present). | `controller/dealController.js createDeal`; `controller/listingController.js:createListing` |
| S3 | **MEDIUM** | **RFQ list/get and Listing list/get are unauthenticated and cross-tenant** by design (marketplace discovery). Intentional, but exposes all RFQ/listing content org-wide with no rate-tiering. | `routes/listingRoutes.js` (no auth on GET), `rfqController.js listRfqs` "intentionally public" |
| S4 | **MEDIUM** | **Document access not tenant/owner-scoped.** `getDocument`/`verifyDocument`/`rejectDocument` do `findByPk` with no tenant or participant check → IDOR: any authenticated user can read/verify/reject any document by id. | `controller/documentController.js` (no `tenant_id` filter) |
| S5 | **MEDIUM** | **Compliance cases not tenant-scoped.** `complianceController` get/update/clear/escalate `findByPk` with no tenant filter → cross-tenant IDOR. | `controller/complianceController.js` |
| S6 | LOW | tenantContext accepts a raw RS256 bearer (`verify(token)`) for scoping even though authMiddleware is gateway-only — asymmetric, but RS256 is still validated (no bypass). | `middleware/tenantContext.js:31-40` |
| S7 | LOW | Dead `/auth/login|register|refresh` endpoints 500 (signAccessToken throws) — confusing surface, remove. | `controller/authController.js` |
| S8 | INFO | `next.config.ts typescript.ignoreBuildErrors:true` masks @types/react 18-vs-19 type debt; prod CSP is strict and good (`next.config.ts securityHeaders`). | `next.config.ts` |

Positives: helmet, CORS allow-list, express-rate-limit + per-account lockout, MFA/TOTP, rotating refresh tokens with reuse-detection, HMAC bridge with `timingSafeEqual`, tenant ALS hooks, immutable audit via `recordAudit`, strict prod CSP, versioned transactional migrations.

---

## Prioritized Findings

### P0 (block production)
- **P0-1 (S1):** Add schema validation (zod) at every trade write route before `Model.create/update`. Currently zero validation on trade resources.
- **P0-2 (S4, S5):** Fix document & compliance IDOR — add tenant/participant scoping to `documentController` and `complianceController` reads and mutations.
- **P0-3 (S2):** Strip client-supplied `tenant_id`/org ids on `createDeal` and `createListing`; derive participants from authenticated identity (match rfq/payment pattern).
- **P0-4 (Documents):** Implement real document storage (S3/minio + signed upload) or explicitly descope the "Sovereign Vault" — today it is a metadata registry with client-supplied URLs.

### P1 (must fix before GA)
- **P1-1:** Stand up the Java finance suite (only payment-service runs) and set `FINANCE_ENABLED=true`; without it payments/escrow are local projections and AML/risk/trade-intelligence engines are dormant.
- **P1-2:** Replace mock dashboard (`services/api.ts` + `@/data`) with real aggregation (`/platform_stats`, real KPI queries).
- **P1-3:** Remove dead `/auth/*` local endpoints (S7) to avoid a confusing/throwing surface.
- **P1-4:** Confirm/standardize sanctions: the real engine is the Next `app/api/sanctions/screen` → risk-service route; the generic `/sanctions_signals` store path should not be mistaken for screening.

### P2 (quality)
- **P2-1:** Resolve type debt and drop `ignoreBuildErrors:true` (S8).
- **P2-2:** Add tenant scoping/rate-tiering to public RFQ/listing discovery (S3) if cross-tenant exposure is not desired.
- **P2-3:** Seed → production data; current volumes are demo (≤6 rows/table).

### P3 (housekeeping)
- **P3-1:** Delete stale Firebase scaffold at GTI root (`firestore.rules`, `apphosting.yaml`).
- **P3-2:** Generic-store-backed "advanced" services should graduate to typed controllers where domain logic is expected (contracts, risk_signals, alerts).

---

*End of report.*
