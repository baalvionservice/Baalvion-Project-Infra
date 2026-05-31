# Baalvion — Pending Work Summary

> **Purpose:** the one-page executive roll-up of the documentation chain. Read this
> first; drill into the linked docs for detail.
>
> **Generated:** 2026-05-31 by the dependency-chain reconciliation pass.
>
> **The chain:** [`SYSTEM_MAP.md`](./SYSTEM_MAP.md) *(inventory)* →
> [`ARCHITECTURE_FINDINGS.md`](./ARCHITECTURE_FINDINGS.md) *(assessment)* →
> [`GAP_ANALYSIS.md`](./GAP_ANALYSIS.md) *(what's missing — source of counts)* →
> [`PENDING_WORK.md`](./PENDING_WORK.md) / [`TASKS.md`](./TASKS.md) /
> [`ROADMAP.md`](./ROADMAP.md) / [`EXECUTION_BACKLOG.md`](./EXECUTION_BACKLOG.md) *(plan)*.

---

## TL;DR

The **architecture is sound and the cross-cutting foundation is done.** What remains
is **execution**: one environment blocker (the Java finance suite can't compile here)
gates the entire trade-finance/payments/compliance band, and a mass of uncommitted
work needs to be landed safely. Clear those two and the platform moves fast.

- **61** services in the catalog · architecture gate **green, 0 violations**.
- **6/6** invariants enforced; **5** fully held, **1** partial (WebSocket bypasses the gateway).
- **P0 foundation complete** (auth · gateway-REST · notifications · audit · tenancy mechanism · search · cache).
- **#1 priority:** compile + run the Java finance suite — it unblocks ~11 tracked items at once.

## Status counts (95 tracked items)

| Status | Count | Share |
|---|---|---|
| ✅ **Completed** | **26** | 27% |
| 🔵 **In Progress** | **7** | 7% |
| 🟡 **Partially Implemented** | **24** | 25% |
| ⛔ **Blocked** | **6** | 6% |
| 🔴 **Missing** | **28** | 30% |
| 🔭 **Future Enhancement** | **4** | 4% |
| **Total** | **95** | 100% |

> "Done or in-motion" (Completed + In Progress + Partially Implemented) = **57 / 95 (60%)**.
> "Not started" (Missing + Future) = **32 / 95 (34%)**. "Externally blocked" = **6 / 95 (6%)**.

## What changed in this reconciliation (disk vs docs)

- Deal Room & Smart Contract are no longer 🔴 — both exist as **Java scaffolds** → 🟡.
- The Java finance suite is **15 services**, not the "9" the older doc header implied.
- Trade-service **Logistics has real CRUD** → Cluster 6 re-classed from 🔴 to 🟡.
- Found **2 structural anomalies**: a duplicated `realtime-service` and a stray `financial-services-java;C` dir.
- A large body of **uncommitted work** is the top operational risk.

## The blockers (⛔ — need an external input, not more code)

| Gap | Blocked on |
|---|---|
| B1 Compile Java finance suite | JDK 17 + Maven CI lane |
| A11 Search 50M/<50ms proof | a real OpenSearch cluster |
| A5 Notification real sending | Twilio/FCM/VAPID creds + optional deps |
| M1/M2/M3 Live AI / payments / SMS | provider keys (1 env var each) |

## Top 20 highest-priority pending items

*(pending = not Completed; ordered by unblocking leverage + priority — see [`EXECUTION_BACKLOG.md`](./EXECUTION_BACKLOG.md))*

| # | Gap | Item | Status |
|---|---|---|---|
| 1 | B1 | Compile + run the Java finance suite (15 svcs) | ⛔ Blocked |
| 2 | B2 | Commit uncommitted foundation + new services (reviewed batches) | 🔵 In Progress |
| 3 | A9 | Tenancy RLS rollout per bounded context (`baalvion_app` role + policies + middleware) | 🔵 In Progress |
| 4 | F1/F2 | Letter of Credit + Bank Guarantee — wire `trade-finance-service` | 🟡 Partial |
| 5 | F3/F4 | Invoice Finance + Trade BNPL — wire `credit-service` | 🟡 Partial |
| 6 | F6/E3 | Multi-Currency Wallet + Escrow — wire Java services | 🟡 Partial |
| 7 | I2/I3 | Settlement + Reconciliation — wire Java services | 🟡 Partial |
| 8 | C6 | BillBana GST OS (whole service) | 🔴 Missing |
| 9 | G1 | KYC verification flow | 🟡 Partial |
| 10 | G2 | AML Monitoring engine | 🟡 Partial |
| 11 | G3 | Sanctions Screening (list ingestion + per-trade screening) | 🟡 Partial |
| 12 | G4 | Trust Score (0–1000 composite) | 🔴 Missing |
| 13 | I1 | Payment Rails adapters (SWIFT/SEPA/ACH/UPI/Pix/M-Pesa/SPEI) | 🔴 Missing |
| 14 | E1/E2 | Deal Room + Smart Contract — compile + wire | 🟡 Partial |
| 15 | A16/A17 | Gateway: GraphQL federation + unified WebSocket pass-through | 🔴 Missing |
| 16 | B3/B4 | Dedupe duplicate `realtime-service` + remove stray `;C` dir | 🔴 Missing |
| 17 | A11/A12 | Search: real OpenSearch cluster + 50M/<50ms + per-domain indexers | ⛔/🔴 |
| 18 | A4/A5 | Notification: delivery receipts + provider creds/deps | 🔴/⛔ |
| 19 | D3/D4 | Marketplace: AI Matching + Price Intelligence | 🔴 Missing |
| 20 | J1–J5 | Trade AI suite (Credit/Demand/Supplier-Risk/NL/BTI) on `ml-service` | 🔴 Missing |

## Guardrails for every pending item (unchanged)

RS256 verify-only via `@baalvion/auth-node` (no 2nd issuer) · `tenant_id`/`org_id` on
every row + query · one service = one schema (no cross-service DB) · a
`catalog/services/<name>.yaml` descriptor + green `architecture:check` · Node +
Express + Sequelize mirroring an existing service.
