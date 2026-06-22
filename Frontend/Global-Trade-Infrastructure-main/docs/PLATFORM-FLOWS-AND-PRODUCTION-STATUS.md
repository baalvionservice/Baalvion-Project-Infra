# Baalvion Global Trade OS — Actor Flows & Production Status

> **Domain:** `trade.baalvion.com`
> **App:** `Frontend/Global-Trade-Infrastructure-main` (Next.js 15, App Router)
> **Purpose of this doc:** One place that answers — *who comes to the platform, what they do step by step, and how far each flow is built toward production* (LIVE vs MOCK vs STUB).
>
> _Last assessed: 2026-06-21 — by tracing the code, not the marketing._

---

## 1. How to read this doc

Every step is tagged with a status:

| Tag | Meaning |
|-----|---------|
| ✅ **LIVE** | Wired to a real backend over an authenticated BFF; real persistence. Production-grade. |
| 🟡 **PARTIAL** | Real backend for *reads/records*, but the business logic (state machine, decision, settlement) is mocked or incomplete. |
| 🔴 **MOCK** | UI works, data is hardcoded/simulated (`src/services/*` placeholder or `src/data`). Demo-only. |
| ⬜ **STUB** | Page/route exists but the action does nothing real (no submit handler, redirect-only, `TODO`). |

### The data-reality rule (memorize this)

The frontend has **two data worlds**:

- **LIVE world** — anything importing from **`@/api`** (the `src/api/*` React Query hooks) or **`@/lib/finance-client`** / **`@/lib/sanctions-client`**. These route through same-origin BFFs:
  - `/trade-bff/*` → **auth-gateway** → **trade-service** (`:3025`) — commerce, shipments, customs, compliance records.
  - `/finance-bff/*` → **Java financial services** — wallets (`:13039`), ledger (`:13014`).
  - `/api/sanctions/screen` → **risk-service** (`:3035`) — OFAC/EU/UN screening.
- **MOCK world** — `src/services/api.ts` is an **explicit placeholder** ("returns mock data wrapped in Promises"), and `src/data/index.ts` is **hardcoded institutional data**. Many institutional dashboards still read from here.

Auth is **cookie-based** (httpOnly session + CSRF double-submit). The browser never holds a bearer token; the gateway injects signed tenant/identity headers server-side. This part is **production-grade**.

---

## 2. Who comes to the platform (actor map)

There are **two layers**: the public *audience* you market to, and the *org types / personas* that actually log in. Each login type gets its own scoped console.

### 2a. Public audience (marketing → onboarding)

| Audience | Public page | Status |
|----------|-------------|--------|
| Banks | `/banks` | ✅ LIVE (static marketing) |
| Governments | `/governments` | ✅ LIVE (static marketing) |
| Enterprises | `/enterprises` | ✅ LIVE (static marketing) |
| Logistics providers | `/logistics` | ✅ LIVE (static marketing) |

### 2b. Organization types → their console (who logs in)

| Org type (customer) | Lands on | Console build status |
|---------------------|----------|----------------------|
| **Buyer** | `/buyer/dashboard` | ✅ LIVE (live trade-service) |
| **Seller** | `/seller/dashboard` | ✅ LIVE (live trade-service) |
| **Trade Agent (broker)** | `/agent/dashboard` | 🟡 PARTIAL (requests live; dashboard light) |
| **Logistics Provider** | `/logistics-shipment/control-tower` | 🟡 PARTIAL (shipments live; telemetry stub) |
| **Customs Authority** | `/governance/customs` → `/customs` | ✅ LIVE (customs submissions live) |
| **Bank** | `/governance/bank-admin` | 🟡 PARTIAL (wallet reads live; approvals mock) |
| **Insurance Provider** | `/insurance` | 🔴 MOCK (no underwriting backend) |
| **Compliance Agency** | `/governance/compliance-admin` | 🟡 PARTIAL (KYC + sanctions live; approval gate mock) |
| **Regulator** | `/governance` | 🔴 MOCK (oversight dashboards demo) |
| **Platform Owner (you)** | `/executive/command` | 🟡 PARTIAL (org mgmt live; exec telemetry mock) |

> **24 distinct persona consoles** exist in total (`src/core/personas.ts`), mapped to **26 roles** (`src/core/roles.ts`). The table above is the customer-facing subset.

---

## 3. The entry flow — Onboarding & Login (shared by everyone)

**Actor: any new customer.**

| # | Step | Status | Evidence |
|---|------|--------|----------|
| 1 | Land on `/onboard`, pick a department (Enterprise / Banking / Customs / Logistics) | ✅ LIVE | `onboard/_lib/department-configs.ts` (config-driven) |
| 2 | Fill the wizard (account, company, trade profile) | ✅ LIVE | `department-wizard.tsx` form state |
| 3 | Upload documents (incorporation, banking ref) | 🟡 PARTIAL | UI exists; storage/encryption/AV scan not confirmed |
| 4 | **Submit application** → `POST /trade-bff/auth/onboarding-application` | ✅ LIVE | `onboarding-service.ts` real `fetch` |
| 5 | Compliance screening animation (OFAC/PEP "checking…") | 🔴 MOCK | `setInterval` walk; **real screening is server-side, async** |
| 6 | "Submitted for review" — **no client-side access granted** | ✅ LIVE | Correct fail-closed terminal state |
| 7 | Alternative path: `/access/request` form | ⬜ **STUB** | **Button links to `/access/pending`; never submits** |
| 8 | **Login** `/login` → `POST /trade-bff/auth/login` (+ MFA) | ✅ LIVE | Real auth-gateway, httpOnly cookies |
| 9 | Persona/role resolved server-side, redirected to console home | ✅ LIVE | `app-state.tsx` + `getPersonaHome()` |
| 10 | Route protection (edge middleware + client `RouteGuard`, API authoritative) | ✅ LIVE | `middleware.ts` + `route-guard.tsx` fail-closed |
| 11 | Forgot/Reset password | ✅ LIVE | `/auth/forgot-password`, `/auth/reset-password` |
| 12 | Accept invite → token validate → auto-login | ✅ LIVE | `accept-invite/page.tsx` |

**Entry-flow gaps for production:** ⬜ `/access/request` doesn't submit (CRITICAL); 🟡 document upload backend unverified; 🟡 no "track my application" status after submit (reference only in `sessionStorage`).

---

## 4. Buyer journey — ✅ mostly LIVE

**Actor: a Buyer organization.** Source → RFQ → negotiate → order → pay.

| # | Step | Route | Status | Evidence |
|---|------|-------|--------|----------|
| 1 | See dashboard (open RFQs, orders, shipments, payments KPIs) | `/buyer/dashboard` | ✅ LIVE | `buyer-service` → `/rfqs`, `/orders`, `/shipments`, `/payments` |
| 2 | Browse marketplace & discovery (AI matching) | `/marketplace`, `/discovery` | ✅ LIVE | `marketplace-service` → `/marketplace_listings` (mock only on network fail) |
| 3 | Create an RFQ | `/buyer/rfqs/new` | ✅ LIVE | `rfq-service.createRfq()` → `POST /rfqs` + event bus |
| 4 | Receive seller quotes/responses | `/buyer/rfqs/[id]` | ✅ LIVE | `rfq-service.getSellerResponses()` → `/quotations` |
| 5 | Accept a quote → deal created | (button) | ✅ LIVE | `acceptQuote()` → `POST /deals` + award RFQ |
| 6 | Negotiate in deal room (chat + offers + AI strategy) | `/deals/[id]` | ✅ LIVE | `deal-service` → `/chat_messages` |
| 7 | Finalize deal → order provisioned (server-computed money) | `/deals/[id]` | ✅ LIVE | `finalizeDeal()` → `POST /orders` (GTOS saga) |
| 8 | Track order lifecycle | `/orders`, `/orders/[id]` | ✅ LIVE | `order-service` → `/orders` saga status |
| 9 | Confirm payment (Razorpay/Stripe/PayU/bank) | `/orders/[id]` | ✅ LIVE | `confirmPayment()` → `POST /orders/{id}/confirm-payment` returns gateway intent |
| 10 | Escrow auto-provisioned on finalize | — | 🟡 PARTIAL | Best-effort `POST /escrows`; state machine hardcoded |

**Buyer verdict:** The core commerce path (browse → RFQ → quote → deal → order → pay) is **LIVE end-to-end**. Money is server-computed (anti-fraud). Escrow *creation* is live but escrow *state transitions* are mocked → see §8.

---

## 5. Seller journey — ✅ mostly LIVE

**Actor: a Seller organization.** List → win RFQs → fulfill.

| # | Step | Route | Status | Evidence |
|---|------|-------|--------|----------|
| 1 | Seller dashboard (revenue, active deals, settlement health) | `/seller/dashboard` | ✅ LIVE | `seller-service` → `/rfqs`, `/deals`, `/orders`, `/settlements`, `/shipments` |
| 2 | Create a listing | `/seller/listings/new` | ✅ LIVE | `createListing()` → `POST /marketplace_listings` (companyId bound server-side) |
| 3 | See incoming open RFQs | `/seller/rfqs` | ✅ LIVE | `getMarketplaceRfqs()` → `/rfqs?status=open` |
| 4 | Submit a quote | RFQ detail | ✅ LIVE | `submitQuote()` → `POST /quotations` + buyer notification |
| 5 | See my responses | `/seller/responses` | ✅ LIVE | `getMyResponses()` → `/quotations?sellerId` |
| 6 | Quote accepted → deal room → negotiate | `/deals/[id]` | ✅ LIVE | shared deal room |
| 7 | Order placed → fulfill (in_fulfillment → shipped → delivered) | `/orders/[id]` | ✅ LIVE | GTOS saga states |

**Seller verdict:** **LIVE end-to-end** for listing, bidding, and fulfillment.

---

## 6. Trade Agent (broker) journey — 🟡 PARTIAL

**Actor: a Trade Agent.** Broker deals, coordinate counterparties.

| # | Step | Route | Status | Evidence |
|---|------|-------|--------|----------|
| 1 | Agent dashboard | `/agent/dashboard` | 🟡 PARTIAL | No dedicated agent-dashboard service; uses generic/mock admin data |
| 2 | View service requests | `/agent/requests` | ✅ LIVE | `agent-service.getServiceRequests()` → `/service_requests` |
| 3 | Get hired / accept request | (action) | ✅ LIVE | `hireAgent()` / `updateRequestStatus()` → `POST/PATCH /service_requests` |
| 4 | Work deals/negotiations/messages | shared routes | ✅ LIVE | Same live commerce surfaces as buyer/seller |

**Agent verdict:** Service-request lifecycle is **LIVE**; the dashboard landing is light/partly mock.

---

## 7. Logistics & Trade-Ops journey — ✅ flagship LIVE (two minor stubs)

**Actor: Logistics Provider / Operations.** This is the **most production-ready area of the whole platform.**

| # | Step | Route | Status | Evidence |
|---|------|-------|--------|----------|
| 1 | Open Trade-Ops control center — live shipment list, pagination, status filter, debounced search, 30s polling | `/trade-ops` | ✅ LIVE | `useShipments()` → `@/api/shipments` → `/trade-bff/shipments` |
| 2 | Open a shipment → detail + readiness score (0–100) | `/trade-ops/[id]` | ✅ LIVE | `useShipment` + `useReadiness` (graceful 404) |
| 3 | 8 operational tabs: Overview, Workflow, Readiness, Documents, Compliance, Logistics, Customs, Dispatch | `/trade-ops/[id]` | ✅ LIVE | All `@/api` hooks, **zero mock** in detail view |
| 4 | Create new shipment | dialog | ✅ LIVE | `useCreateShipment()` → `POST /shipments` |
| 5 | Logistics Control Tower (shipment list + topology) | `/logistics-shipment/control-tower` | 🟡 PARTIAL | Shipments live; `/system/pulse` + `/system/readiness` are **stubs** (graceful "—") |
| 6 | Booking wizard (route → carrier discovery → authorize) | `/logistics-shipment/booking` | 🟡 PARTIAL | `getCarriers()` live; **carrier `bookShipment()` adapter is a MOCK**; final `POST /shipments` is live |
| 7 | Shipment tracking timeline | `/logistics-shipment/[id]/tracking` | ✅ LIVE | `/shipments/{id}` + `/tracking_logs` |
| 8 | Carriers directory | `/carriers` | ✅ LIVE | `carrier-service` → `/carriers` |
| 9 | Customs declarations (create/retry/cancel) | `/customs`, trade-ops Customs tab | ✅ LIVE | `@/api/customs` → `/customs_submissions/*` |

**Logistics verdict:** **9/10 production-ready.** Only carrier-API integration (real Maersk/DHL booking) and infra telemetry endpoints are stubbed — both degrade gracefully.

---

## 8. Money journey (Buyer/Bank/Treasury) — 🟡 PARTIAL

**Actor: Buyer funding, Bank settling, Treasury operating.**

| # | Step | Route | Status | Evidence |
|---|------|-------|--------|----------|
| 1 | View wallet balances | `/payments` | ✅ LIVE | `payment-service` → `financeClient.get('/wallets')` → Java wallet-service `:13039` |
| 2 | Record transaction (ledger) | — | ✅ LIVE | ledger-service `:13014` via `/finance-bff` |
| 3 | Fund escrow | `/escrow` | 🟡 PARTIAL | Record write live; **escrow state machine hardcoded** (`VALID_ESCROW_TRANSITIONS`) |
| 4 | Finance settlement KPIs | `/finance-settlement` | 🔴 MOCK | `treasury-service` returns hardcoded KPIs; no real settlement ledger |
| 5 | Settlement finality → bank/wire | — | ⬜ STUB | **No bridge to real bank accounts / wire rails** |
| 6 | Trade finance / credit lines | `/financials/*` | 🟡 PARTIAL | `api/trades/[id]/finance` is live (Prisma, RLS); UI dashboards mostly mock |

**Money verdict:** Reads (wallets, ledger) are **LIVE**; escrow transitions, settlement finality, and treasury dashboards are **mock/stub**. This is the biggest money-side gap.

---

## 9. Compliance & Sanctions journey — ✅ sanctions LIVE / 🟡 KYC partial

**Actor: Compliance Officer / Agency.**

| # | Step | Route | Status | Evidence |
|---|------|-------|--------|----------|
| 1 | Submit KYC | `/compliance/kyc` | ✅ LIVE | `POST /verification_requests` (trade-service) |
| 2 | KYC approval decision | — | 🟡 PARTIAL | `approvalService` records it, but **`syncTargetEntity()` is a no-op stub** — decision isn't executed |
| 3 | **Sanctions screening (OFAC/EU/UN)** | `/sanctions-screening` | ✅ **LIVE** | `app/api/sanctions/screen` → risk-service `:3035`; returns CLEAR / POTENTIAL_MATCH / CONFIRMED_MATCH |
| 4 | Regulatory declarations / HS codes | `/compliance-regulatory/*` | ✅ LIVE | `@/api/customs` + `/hscodes` |

**Compliance verdict:** **Sanctions screening is fully LIVE and the strongest compliance feature.** KYC records persist, but the *approval enforcement* is mocked.

---

## 10. Insurance journey — 🔴 MOCK

**Actor: Insurance Provider.**

| # | Step | Route | Status | Evidence |
|---|------|-------|--------|----------|
| 1 | View policies | `/insurance/policies` | 🔴 MOCK | `insurance-service` → `/policies` (endpoint likely absent); returns mock |
| 2 | Underwrite / request policy | `/insurance` | 🔴 MOCK | Hardcoded 0.5% premium, 90-day validity; no risk engine |
| 3 | File / settle claim | `/insurance/claims` | ⬜ STUB | Claims are read-only demo data; no submission logic |

**Insurance verdict:** **Demo-only.** No real underwriting, premium engine, or claims workflow.

---

## 11. Governance / Oversight / Executive — 🟡 records live, 🔴 logic mock

**Actor: Bank Admin, Compliance Admin, Platform/Sovereign Admin, Regulator, Arbitrator, Platform Owner.**

| # | Step | Route | Status | Evidence |
|---|------|-------|--------|----------|
| 1 | Approval queue (view) | `/oversight/governance/approvals` | 🟡 PARTIAL | `approvalService.getRequests()` → `/approvals` (live read) |
| 2 | Approve/reject decision | — | 🔴 MOCK | `syncTargetEntity()` stub; **no two-key authority, no real execution** |
| 3 | Disputes / arbitration | `/oversight/disputes` | ⬜ STUB | Redirect-only; no arbitration engine |
| 4 | Audit logs | `/oversight/audit-logs` | 🟡 PARTIAL | Events to event bus; no enforced immutable audit store |
| 5 | Platform/sovereign admin telemetry | `/oversight/platform-admin`, `/sovereign-admin` | 🔴 MOCK | `adminService` heatmaps/telemetry simulated |
| 6 | Org/tenant management | `/platform/organizations`, `/organization/*` | ✅ LIVE | Real org admin + invites |
| 7 | Executive command / briefings / reports | `/executive/*` | 🟡 PARTIAL | Org data live; incident/crisis telemetry mock |
| 8 | Intelligence Hub (analytics, risk, maritime, geopolitical) | `/intelligence-hub/*` | 🔴 MOCK | `analyticsService` hardcoded KPIs; no data warehouse / real feeds |

**Governance verdict:** Org/tenant administration and invites are **LIVE**; the institutional decision-making, audit enforcement, crisis ops, and intelligence dashboards are **mock/stub** (demo UI).

---

## 12. Big-picture production matrix — *where we stopped*

| Domain | Backend wired? | Business logic done? | Verdict |
|--------|---------------|----------------------|---------|
| **Auth / login / MFA / route-guard** | ✅ | ✅ | ✅ **PRODUCTION** |
| **Onboarding submit** | ✅ | 🟡 (screening async, docs unverified) | 🟡 NEAR |
| **Access request form** | ❌ | ❌ | ⬜ **BROKEN (doesn't submit)** |
| **Buyer commerce (RFQ→deal→order→pay)** | ✅ | ✅ | ✅ **PRODUCTION** |
| **Seller commerce (listing→bid→fulfill)** | ✅ | ✅ | ✅ **PRODUCTION** |
| **Agent service requests** | ✅ | ✅ | ✅ PRODUCTION (dashboard light) |
| **Trade-Ops shipment control center** | ✅ | ✅ | ✅ **PRODUCTION (flagship)** |
| **Customs declarations** | ✅ | ✅ | ✅ PRODUCTION |
| **Shipment tracking** | ✅ | ✅ | ✅ PRODUCTION |
| **Logistics control tower** | ✅ (shipments) | 🟡 (telemetry stub) | 🟡 NEAR |
| **Carrier booking (real carrier API)** | 🟡 | 🔴 (adapter mock) | 🟡 PARTIAL |
| **Payments / wallet reads** | ✅ | 🟡 | 🟡 PARTIAL |
| **Escrow state machine** | ✅ (records) | 🔴 (hardcoded transitions) | 🟡 PARTIAL |
| **Settlement finality (bank/wire)** | ❌ | ❌ | ⬜ STUB |
| **Sanctions screening (OFAC/EU/UN)** | ✅ | ✅ | ✅ **PRODUCTION** |
| **KYC records** | ✅ | 🔴 (approval gate mock) | 🟡 PARTIAL |
| **Insurance underwriting / claims** | ❌ | ❌ | 🔴 MOCK |
| **Governance approvals / 2-key / disputes** | 🟡 (records) | 🔴 | 🟡 PARTIAL |
| **Org & tenant management / invites** | ✅ | ✅ | ✅ PRODUCTION |
| **Intelligence / analytics / executive telemetry** | ❌ | ❌ | 🔴 MOCK |

---

## 13. Punch list — what's left to reach full production

**🔴 CRITICAL (blocks a real customer)**
1. **Fix `/access/request`** — wire the form to a real submit endpoint; today it persists nothing.
2. **Escrow state machine** — replace hardcoded `VALID_ESCROW_TRANSITIONS` with a real workflow engine + funding→release→refund states.
3. **Settlement finality** — build the escrow/ledger → bank/wire bridge. Money currently can't actually leave the platform.
4. **Governance decision execution** — implement `syncTargetEntity()` + two-key authority + immutable audit trail. Approvals look real but execute nothing.

**🟡 HIGH (needed per customer segment)**
5. **Insurance** — real underwriting/premium engine + claims submission (currently 0.5% hardcoded).
6. **Carrier booking adapters** — replace the mock `bookShipment()` with real Maersk/DHL/etc. integrations.
7. **KYC approval gate** — connect the screening result to an enforced approve/deny that actually grants/blocks access.
8. **Document upload** — confirm/implement storage + encryption + AV scan in onboarding.

**🟢 MEDIUM (polish / dashboards)**
9. **Intelligence Hub + executive telemetry** — connect to a real data warehouse / feeds (today all mock KPIs).
10. **Control-tower `/system/pulse` + `/system/readiness`** — wire infra telemetry endpoints.
11. **Agent dashboard** — give it a dedicated live data service.
12. **"Track my application"** — persist onboarding reference + status lookup.

---

## 14. One-line summary

> **The commerce engine (buyer/seller RFQ→deal→order→pay), the Trade-Ops shipment/customs control center, sanctions screening, and auth/tenant management are LIVE and production-grade. The money rails (escrow state, settlement finality), insurance, governance enforcement, and the intelligence/executive dashboards are still mock/stub. That's where the platform stopped — finish the §13 punch list to go fully live.**
