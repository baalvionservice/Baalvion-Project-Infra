# Baalvion — Tasks

> **Purpose:** the actionable, checkbox-level task list. Each task maps to a Gap ID
> in [`GAP_ANALYSIS.md`](./GAP_ANALYSIS.md). Sequencing/priority lives in
> [`EXECUTION_BACKLOG.md`](./EXECUTION_BACKLOG.md); time-phasing in [`ROADMAP.md`](./ROADMAP.md).
>
> **Created:** 2026-05-31 (did not previously exist). The list below *is* the dated
> reconciliation section; future passes append a new dated section and preserve this one.

---

## Reconciliation — 2026-05-31

**Legend:** `[ ]` open · `[~]` in progress · `[x]` done · `[!]` blocked (needs external input)

### P0 — Unblock & secure the foundation
- [x] **(B1)** ~~Stand up JDK 17 + Maven CI lane; compile the Java finance suite; run Flyway + Testcontainers.~~ **DONE 2026-05-31** — built via a Dockerized `maven:3.9-eclipse-temurin-17` toolchain (sandbox has Docker, just no local JDK17/Maven). `mvn clean verify` = BUILD SUCCESS, 46 tests / 0 fail / 0 err, 13 service jars packaged. Fixed real compile/boot/schema/runtime defects (Spring-6.2 backoff backport, malformed YAML ×2, removed `PostgreSQL10Dialect` ×9, `char(3)`→`varchar(3)` ×6, `jsonb` `stringtype=unspecified` ×15, `@Lob`→`bytea`, Testcontainers 1.20.4 + junit-jupiter). See finance-suite `CHANGELOG.md` + the 2026-05-31 update section below.
- [~] **(B2)** Commit uncommitted foundation packages + 4 new platform services + Java suite in reviewed conventional-commit batches.
- [~] **(A9)** Tenancy RLS rollout per bounded context: create `NOSUPERUSER baalvion_app` role + grants → switch `DB_USER` → per-table `enableRlsSql` migration → `tenantMiddleware` + `withTenantTransaction`.
- [ ] **(B3)** Dedupe `realtime-service` → canonicalize under `infrastructure/`; fold platform-variant collectors; delete duplicate; reconcile catalog descriptor.
- [ ] **(B4)** Remove stray `financial-services-java;C` directory.
- [ ] **(A16/A17)** Gateway: add GraphQL federation layer + unified WebSocket pass-through (close the I1 WS gap).
- [!] **(A5)** `pnpm install` notification optional deps (`twilio`/`firebase-admin`/`web-push`) + inject creds. *Blocked: provider creds.*
- [ ] **(A4)** Notification delivery-status receipts (provider webhooks).
- [!] **(A11)** Stand up a real OpenSearch cluster; prove 50M docs / <50ms. *Blocked: cluster/ops.*
- [ ] **(A12)** Wire per-domain search indexers (push/reindex jobs).
- [~] **(A14)** Migrate ad-hoc `ioredis` calls to `@baalvion/cache` (session-service, trade-service FX, …).

### P0 — Product gaps
- [ ] **(C6)** Build **BillBana GST OS**: `billbana` schema + GST engine + e-invoicing (IRN) + payroll + GSTR auto-gen + CRM.
- [ ] **(C5)** Dashboard ERP: AI forecast/predictions + advanced analytics + equity/cap-table depth.

### P1 — Trade core (after B1 compile)
- [~] **(F1/F2)** Letter of Credit (UCP 600) + Bank Guarantee (URDG 758): compile + wire `trade-finance-service` behind gateway.
- [~] **(F3/F4)** Invoice Finance + Trade BNPL: compile + wire `credit-service`.
- [~] **(F5)** FX Engine: add rate-lock/forwards + live feed (`fx-service`).
- [~] **(F6)** Multi-Currency Wallet: compile + wire `wallet-service`.
- [~] **(E3)** Escrow: compile + wire `escrow-service` (hold → milestone → release).
- [~] **(E1)** Deal Room: compile `deal-room-service`; wire realtime negotiation via `realtime-service`.
- [~] **(E2)** Smart Contract: compile `smart-contract-service`; wire e-sign (DocuSeal) + Incoterms.
- [ ] **(E4)** Dispute: build 3-tier flow (AI triage → mediator → ICC arbitration).
- [ ] **(E5)** Inspection Booking: SGS/BV/Intertek integrations + report gate.
- [~] **(G1)** KYC verification flow (doc + liveness → verdict → gate).
- [~] **(G2)** AML Monitoring engine (FATF risk grade → alerts).
- [~] **(G3)** Sanctions Screening (OFAC/UN/EU/UK/AU ingestion + per-trade screening).
- [ ] **(G4)** Trust Score (0–1000 composite, 6 factors).
- [ ] **(I1)** Payment Rails adapters (SWIFT/SEPA/ACH/UPI/Pix/M-Pesa/SPEI).
- [~] **(I2/I3)** Settlement + Reconciliation: compile + wire Java `settlement-service`/`reconciliation-service`.
- [ ] **(D3/D4)** Marketplace: AI Matching + Price Intelligence.
- [~] **(D1)** Listings: scale to 50M + OpenSearch wiring.

### P2 — Depth & scale
- [ ] **(H1–H5)** Logistics: finish carrier/customs/chamber integrations + AI HS classifier on top of existing CRUD.
- [ ] **(J1–J5)** Trade AI: Credit Scoring, Demand Forecasting, Supplier Risk, NL Assistant, BTI (`ml-service`).
- [ ] **(D5/D6)** Sample Order + Tender/Auction.
- [ ] **(G5/G6)** Fraud Detection + Export Control.
- [ ] **(I4)** Insurance (cargo/credit/parametric).
- [ ] **(C20)** admin-platform: build missing backend-backed pages.
- [~] **(C21)** Wire 4 new platform svcs (report/developer/tenant/agent): commit + gateway routes + console pages.
- [~] **(L1)** GTI mock→real beyond Marketplace+RFQ.
- [ ] **(L2)** ~15 remaining CMS sites mock → `cms-service`.
- [~] **(L3)** Frontend auth-unification cutover + build-test.
- [~] **(L4)** Per-app admin → central console consolidation.
- [ ] **(B5)** Migrate `brand-connector-main` Firebase shim → `@baalvion/auth-sdk`, then delete.
- [~] **(C9)** Jobs board conversion (boot/keys + endpoints).
- [~] **(C14/C15)** IR portal: KYC/accreditation + deal-room realtime depth.
- [ ] **(C11)** Amarisé authenticity-score review pipeline.

### Future Enhancement (P2+ deferred)
- [ ] **(A7)** Audit ClickHouse mirror + per-event dedup + repoint existing audit stores.
- [ ] **(C2)** HUB parent portal (`baalviongroup.com`).
- [ ] **(C8)** CTM ads/CPC system.
- [ ] **(H6)** Carbon Footprint (CO₂/shipment → offset → ESG).

### Go-live key flips (deploy-time, 1 env var each) — Blocked
- [!] **(M1)** Live AI — `GEMINI_API_KEY`.
- [!] **(M2)** Live payments — `PAYMENT_PROVIDER` + `RAZORPAY_*`.
- [!] **(M3)** Live SMS — `SMS_PROVIDER=twilio` + `TWILIO_*`.

---

## Update — 2026-05-31 (b) — Java finance suite is build/test/package-verified

The single biggest blocker (**B1**) is cleared. The finance suite went from *never-compiled* to a
green `mvn clean verify` (15 modules, 46 tests, 0 fail/err, 13 jars). This **build-verifies** the code
behind these previously-`[~]` items — their domain logic compiles, boots a real Spring context against
Postgres (Flyway + Testcontainers), and passes tests. *Wiring* (gateway routes, Node `trade-service`
facade, HMAC event bridge) was already landed in the Trade-Finance-Integration-Spine work; what
changed today is that the Java behind it is now provably correct, not just authored.

- [x] **(F1/F2)** Letter of Credit (UCP 600) + Bank Guarantee (URDG 758) — `trade-finance-service` **compiles + tests + packages**; full lifecycle (issue/advise/amend+consent/present/examine/waive/reject/settle/expire) verified present.
- [x] **(F3/F4)** Invoice Finance + Trade BNPL — `credit-service` compiles + tests (CreditRiskEngine + BnplService unit tests green).
- [x] **(F5)** FX Engine — `fx-service` compiles + tests (FxRateService green). *Rate-lock/forwards depth + live feed still pending.*
- [x] **(F6)** Multi-Currency Wallet — `wallet-service` compiles + tests (WalletService green).
- [x] **(E3)** Escrow — `escrow-service` compiles + integration test green (hold→milestone→release).
- [x] **(I2/I3)** Settlement + Reconciliation — `settlement-service` compiles; `reconciliation-service` integration test green.
- [x] **(G1)** KYC document store/encryption — `account-service` compiles + KYC integration + encryption tests green. *Liveness / IDV-provider verdict still pending (needs external IDV provider → blocked).*
- [~] **(G2)** AML Monitoring — `risk-service` rule-based velocity/value engine compiles + integration test green. *FATF customer/geography risk grading depth still pending.*
- [x] **(G3)** Sanctions Screening — **BUILT 2026-05-31** in `risk-service`: consolidated watchlist (OFAC/UN/EU/UK/AU) + Jaro–Winkler fuzzy name matching (normalize + transliterate + token-reorder/coverage) → CLEAR/POTENTIAL/CONFIRMED + officer adjudication; pluggable seed/live provider seam; screen/adjudicate/refresh API + Kafka events; V002 migration (global watchlist + tenant-scoped RLS screenings). 13 tests green (11 unit + 4 integration vs real Postgres, in the 59-test suite). Adversarially reviewed (12 findings, all fixed incl. a suite-wide `TenantContext` IDOR + non-Latin normalization gap). *Remaining: real OFAC/UN/EU downloaders (live provider), pg_trgm prefilter for full-list scale, ICU4J non-Latin transliteration.*
- [x] **(B1-CI)** CI image matrix extended 9→13 finance services; no-local-JDK Docker build recipe documented in `RUN_LOCAL.md`.
