# Baalvion — Gap Analysis

> **Purpose:** the reconciled, itemized list of *what is missing or unfinished*,
> derived from [`SYSTEM_MAP.md`](./SYSTEM_MAP.md) (inventory) +
> [`ARCHITECTURE_FINDINGS.md`](./ARCHITECTURE_FINDINGS.md) (assessment) +
> [`PENDING_WORK.md`](./PENDING_WORK.md) (backlog), **re-checked against disk**.
> This document is the source of the status counts used everywhere else.
>
> **Generated:** 2026-05-31 · **Basis:** 61 catalog services, gate green, on-disk verification.

## Status taxonomy (used for all counts in this chain)

| Status | Meaning |
|---|---|
| **Completed** | Built and verified; do not rebuild. |
| **In Progress** | Actively being worked; partially landed this cycle. |
| **Partially Implemented** | Scaffolded / core exists, but needs compile · wire · scale · flow-build to be usable. |
| **Blocked** | Cannot finish here — needs an external input (JDK/Maven env, provider keys, a real cluster, owner review). |
| **Missing** | Not built at all. |
| **Future Enhancement** | Deferred by priority (P2+); not on the critical path. |

## Headline counts (95 tracked items)

| Status | Count |
|---|---|
| ✅ Completed | **26** |
| 🔵 In Progress | **7** |
| 🟡 Partially Implemented | **24** |
| ⛔ Blocked | **6** |
| 🔴 Missing | **28** |
| 🔭 Future Enhancement | **4** |
| **Total** | **95** |

---

## 1. Reconciliation deltas vs `PENDING_WORK.md` (status drift fixed)

| Item | PENDING_WORK said | Disk reality (2026-05-31) | New status |
|---|---|---|---|
| Deal Room | 🔴 build | `deal-room-service` exists (Java scaffold) | Partially Implemented |
| Smart Contract | 🔴 build | `smart-contract-service` exists (Java scaffold) | Partially Implemented |
| Java finance suite | "9 services" | **15** on disk (added deal-room, smart-contract, credit, fx, wallet, trade-finance) | Partially Implemented (uncompiled) |
| Logistics (freight/shipment/B-L/customs/CoO) | all 🔴 build | `trade-service` has **real CRUD**; engines/integrations missing | Partially Implemented |
| `realtime-service` | one service | **duplicated** across platform/ + infrastructure/ | Missing (dedupe work) |
| `financial-services-java;C` | n/a | empty stray dir on disk | Missing (cleanup) |

---

## 2. Master gap table (canonical — drives the counts)

### A. Foundation / cross-cutting
| ID | Item | Status |
|---|---|---|
| A1 | Auth (RS256/JWKS/BFF) | ✅ Completed |
| A2 | RBAC+ABAC authority (`rbac-service`) | ✅ Completed |
| A3 | Notification multi-channel engine (Email/Webhook/SMS/Push/In-app) | ✅ Completed |
| A4 | Notification delivery-status receipts (provider webhooks) | 🔴 Missing |
| A5 | Notification provider creds + optional deps (`twilio`/`firebase-admin`/`web-push`) | ⛔ Blocked |
| A6 | Audit log (WORM + SHA-256 hash-chain) service | ✅ Completed |
| A7 | Audit ClickHouse mirror + per-event dedup + repoint existing stores | 🔭 Future Enhancement |
| A8 | Tenancy RLS mechanism (`@baalvion/tenancy`) | ✅ Completed |
| A9 | Tenancy per-service rollout (`baalvion_app` role + per-table policies + middleware) | 🔵 In Progress |
| A10 | Search service (tenant-scoped, OpenSearch) | ✅ Completed |
| A11 | Search: real OpenSearch cluster + 50M-docs/<50ms proof | ⛔ Blocked |
| A12 | Search: per-domain indexers (push/reindex) | 🔴 Missing |
| A13 | Cache package (`@baalvion/cache`) | ✅ Completed |
| A14 | Cache adoption (migrate ad-hoc `ioredis`) | 🔵 In Progress |
| A15 | Gateway: REST routing + rate-limit + API keys | ✅ Completed |
| A16 | Gateway: GraphQL federation layer | 🔴 Missing |
| A17 | Gateway: unified WebSocket pass-through (close I1 gap) | 🔴 Missing |

### B. Structural / hygiene (from ARCHITECTURE_FINDINGS)
| ID | Item | Status |
|---|---|---|
| B1 | Compile + run Java finance suite (15 svcs; Flyway + Testcontainers) | ✅ Completed (2026-05-31 — Dockerized Maven/JDK17; `mvn clean verify` green: 46 tests, 0 fail, 13 jars) |
| B2 | Commit uncommitted foundation + new services (reviewed batches) | 🔵 In Progress |
| B3 | Dedupe duplicate `realtime-service` (→ infrastructure/) | 🔴 Missing |
| B4 | Remove stray `financial-services-java;C` dir | 🔴 Missing |
| B5 | Migrate `brand-connector-main` Firebase shim → `@baalvion/auth-sdk`, then delete | 🔴 Missing |
| B6 | Reconcile doc status drift (this pass) | ✅ Completed |

### C. Platform product domains
| ID | Item | Status |
|---|---|---|
| C1 | Gateway / SSO / Identity OS | ✅ Completed |
| C2 | HUB parent portal (`baalviongroup.com`) | 🔭 Future Enhancement |
| C3 | Company CMS (`about.baalvion.com`) | ✅ Completed |
| C4 | Dashboard ERP (base) | ✅ Completed |
| C5 | Dashboard AI forecast/predictions + advanced analytics + equity/cap-table depth | 🔴 Missing |
| C6 | **BillBana GST Billing OS** (whole service) | 🔴 Missing |
| C7 | ControlTheMarket | ✅ Completed |
| C8 | CTM ads/CPC system | 🔭 Future Enhancement |
| C9 | Jobs board conversion (boot/keys + offers/users/payments/docs endpoints) | 🟡 Partially Implemented |
| C10 | Amarisé luxury commerce | ✅ Completed |
| C11 | Amarisé authenticity-score review pipeline | 🔴 Missing |
| C12 | Mining B2B | ✅ Completed |
| C13 | Market (crypto research) | ✅ Completed |
| C14 | IR investor portal | 🟡 Partially Implemented |
| C15 | IR KYC/accreditation + deal-room realtime depth | 🔴 Missing |
| C16 | MarketUnderworld community (insiders/elite-circle) | ✅ Completed |
| C17 | Connect (brand-connector) | ✅ Completed |
| C18 | LawElite | ✅ Completed |
| C19 | admin-platform console (real pages, ~12/25) | 🟡 Partially Implemented |
| C20 | admin-platform: build missing backend-backed pages (analytics/flags/notifications/payments/…) | 🔴 Missing |
| C21 | Wire 4 new platform svcs (report/developer/tenant/agent): commit + gateway routes + console pages | 🔵 In Progress |

### D. Trade Cluster 2 — Marketplace
| ID | Item | Status |
|---|---|---|
| D1 | Listings (scale to 50M + OpenSearch wiring) | 🟡 Partially Implemented |
| D2 | RFQ | ✅ Completed |
| D3 | AI Matching (buyer↔seller scoring) | 🔴 Missing |
| D4 | Price Intelligence (90-day benchmarks) | 🔴 Missing |
| D5 | Sample Order | 🔴 Missing |
| D6 | Tender / Auction | 🔴 Missing |

### E. Trade Cluster 3 — Trade & Deal
| ID | Item | Status |
|---|---|---|
| E1 | Deal Room (realtime negotiation) — `deal-room-service` Java scaffold | 🟡 Partially Implemented |
| E2 | Smart Contract (UCP 600/Incoterms e-sign) — `smart-contract-service` Java scaffold | 🟡 Partially Implemented |
| E3 | Escrow — Java `escrow-service` (compile + wire) | 🟡 Partially Implemented |
| E4 | Dispute (AI triage → mediator → ICC arbitration) | 🔴 Missing |
| E5 | Inspection Booking (SGS/BV/Intertek) | 🔴 Missing |

### F. Trade Cluster 4 — Finance (Java suite — compile + wire)
| ID | Item | Status |
|---|---|---|
| F1 | Letter of Credit (UCP 600) — `trade-finance-service` | 🟡 Partially Implemented |
| F2 | Bank Guarantee (URDG 758) — `trade-finance-service` | 🟡 Partially Implemented |
| F3 | Invoice Finance — `credit-service` | 🟡 Partially Implemented |
| F4 | Trade BNPL — `credit-service` | 🟡 Partially Implemented |
| F5 | FX Engine (rate-lock/forwards + live feed) — `fx-service` | 🟡 Partially Implemented |
| F6 | Multi-Currency Wallet — `wallet-service` | 🟡 Partially Implemented |

### G. Trade Cluster 5 — Compliance & KYC
| ID | Item | Status |
|---|---|---|
| G1 | KYC verification flow (doc + liveness → verdict → gate) | 🟡 Partially Implemented |
| G2 | AML Monitoring engine (FATF risk grade → alerts) | 🟡 Partially Implemented |
| G3 | Sanctions Screening (OFAC/UN/EU/UK/AU list ingestion + screening) | ✅ Completed (2026-05-31 — built in `risk-service`: watchlist + Jaro–Winkler screening + adjudication; 13 tests green; adversarially reviewed. Live downloaders + pg_trgm scale + ICU4J non-Latin = future) |
| G4 | Trust Score (0–1000 composite) | 🔴 Missing |
| G5 | Fraud Detection (ML on listings/identity/collusion) | 🔴 Missing |
| G6 | Export Control (dual-use + prohibited-country + license) | 🔴 Missing |

### H. Trade Cluster 6 — Logistics & Customs (CRUD real; engines/integrations missing)
| ID | Item | Status |
|---|---|---|
| H1 | Freight Booking (50+ carrier comparison) | 🟡 Partially Implemented |
| H2 | Shipment Tracking (live vessel/carrier position) | 🟡 Partially Implemented |
| H3 | Digital B/L (title transfer/surrender) | 🟡 Partially Implemented |
| H4 | Customs Filing (AI HS classifier + tariff) | 🟡 Partially Implemented |
| H5 | Certificate of Origin (auto-gen + e-stamp) | 🟡 Partially Implemented |
| H6 | Carbon Footprint (CO₂/shipment → offset → ESG) | 🔭 Future Enhancement |

### I. Trade Cluster 7 — Payments & Settlement
| ID | Item | Status |
|---|---|---|
| I1 | Payment Rails (SWIFT/SEPA/ACH/UPI/Pix/M-Pesa/SPEI adapters) | 🔴 Missing |
| I2 | Settlement Engine — Java `settlement-service` | 🟡 Partially Implemented |
| I3 | Reconciliation — Java `reconciliation-service` | 🟡 Partially Implemented |
| I4 | Insurance (cargo/credit/parametric) | 🔴 Missing |
| I5 | Subscription Billing (proxy + commerce) | ✅ Completed |

### J. Trade Cluster 8 — AI & Intelligence (`ml-service` host)
| ID | Item | Status |
|---|---|---|
| J1 | Credit Scoring (Trade Score 0–1000) | 🔴 Missing |
| J2 | Demand Forecasting (90-day) | 🔴 Missing |
| J3 | Supplier Risk (30-day early warning) | 🔴 Missing |
| J4 | NL Trade Assistant (Gemini → search/match) | 🔴 Missing |
| J5 | Trade Intelligence API / BTI (anonymised data product) | 🔴 Missing |

### K. Trade Cluster 9 — Platform & Admin (built 2026-05-31)
| ID | Item | Status |
|---|---|---|
| K1 | Admin Control (`admin-service` + proxy) | ✅ Completed |
| K2 | Reporting builder (`report-service`) | ✅ Completed |
| K3 | Developer Platform (`developer-service`) | ✅ Completed |
| K4 | White-Label Tenant (`tenant-service`) | ✅ Completed |
| K5 | Agent Management (`agent-service`) | ✅ Completed |

### L. Frontend conversion program
| ID | Item | Status |
|---|---|---|
| L1 | GTI mock→real beyond Marketplace+RFQ | 🔵 In Progress |
| L2 | ~15 remaining CMS sites mock → `cms-service` (recipe proven) | 🟡 Partially Implemented |
| L3 | Frontend auth-unification cutover (localStorage→credentials:include) + build-test | 🔵 In Progress |
| L4 | Per-app admin → central `admin-platform` consolidation | 🔵 In Progress |

### M. Demo → Live (provider keys; flip = 1 env var each)
| ID | Item | Status |
|---|---|---|
| M1 | Live AI (`GEMINI_API_KEY`) | ⛔ Blocked |
| M2 | Live payments (`PAYMENT_PROVIDER` + `RAZORPAY_*`) | ⛔ Blocked |
| M3 | Live SMS (`SMS_PROVIDER=twilio` + `TWILIO_*`) | ⛔ Blocked |

---

## 3. Counts by group (cross-check)

| Group | Items | ✅ | 🔵 | 🟡 | ⛔ | 🔴 | 🔭 |
|---|---|---|---|---|---|---|---|
| A Foundation | 17 | 8 | 2 | 0 | 2 | 4 | 1 |
| B Structural | 6 | 1 | 1 | 0 | 1 | 3 | 0 |
| C Platform domains | 21 | 10 | 1 | 3 | 0 | 5 | 2 |
| D Marketplace | 6 | 1 | 0 | 1 | 0 | 4 | 0 |
| E Trade & Deal | 5 | 0 | 0 | 3 | 0 | 2 | 0 |
| F Finance (Java) | 6 | 0 | 0 | 6 | 0 | 0 | 0 |
| G Compliance | 6 | 0 | 0 | 3 | 0 | 3 | 0 |
| H Logistics | 6 | 0 | 0 | 5 | 0 | 0 | 1 |
| I Payments | 5 | 1 | 0 | 2 | 0 | 2 | 0 |
| J AI/Intelligence | 5 | 0 | 0 | 0 | 0 | 5 | 0 |
| K Platform & Admin | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| L Frontend program | 4 | 0 | 3 | 1 | 0 | 0 | 0 |
| M Demo→Live keys | 3 | 0 | 0 | 0 | 3 | 0 | 0 |
| **Total** | **95** | **26** | **7** | **24** | **6** | **28** | **4** |

---

## 4. Critical-path observation

**24 Partially-Implemented + 6 Blocked items were dominated by one root cause:** the
Java finance suite could not compile here (B1). That blocker is now **cleared** (2026-05-31).

> **B1 RESOLVED.** The sandbox has no local JDK17/Maven but *does* have Docker, so the suite was built
> and fully tested via a `maven:3.9-eclipse-temurin-17` container with Testcontainers against the host
> Docker daemon. `mvn -B -ntp clean verify` → **BUILD SUCCESS, 46 tests, 0 failures/errors, 13 service
> jars packaged.** A dozen real compile/boot/schema/runtime defects were fixed (see the finance-suite
> `CHANGELOG.md`). This **build-verifies** F1–F6, I2–I3, E3, G1, and the AML half of G2 — those move from
> 🟡 *Partially Implemented (uncompiled)* to 🟡→✅ *build/test-verified* (live-wiring/depth notes per item
> in [`TASKS.md`](./TASKS.md) §"Update — 2026-05-31 (b)").
>
> **Still genuinely open after B1:** G3 Sanctions Screening (no list domain at all — net-new), G2 FATF
> grading depth, F5 rate-lock/forwards + live FX feed, G1 liveness/IDV (needs an external provider →
> ⛔), I1 Payment Rails adapters, E1/E2 Deal-Room/Smart-Contract (Java scaffolds, not in the parent
> POM yet). The CI lane (`mvn clean verify` on `ubuntu-latest`) now keeps the suite green going forward.
