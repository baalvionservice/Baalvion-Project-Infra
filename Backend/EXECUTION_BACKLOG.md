# Baalvion — Execution Backlog

> **Purpose:** the strictly-ordered, dependency-aware execution queue. Pull from the
> top. Each entry: rank · Gap ID(s) · what · why-now · blocked-by. Status taxonomy &
> counts in [`GAP_ANALYSIS.md`](./GAP_ANALYSIS.md); milestones in [`ROADMAP.md`](./ROADMAP.md);
> checkboxes in [`TASKS.md`](./TASKS.md).
>
> **Created:** 2026-05-31 (did not previously exist). The ordered list below is the
> dated reconciliation; future passes append a new dated section and preserve this one.

---

## Reconciliation — 2026-05-31 — ordered queue

| # | Gap ID | Item | Why now (leverage / dependency) | Blocked by |
|---|---|---|---|---|
| 1 | B1 | **Compile + run Java finance suite (15 svcs)** | Unblocks F1–F6, I2–I3, E3 and enables G1–G3 — ~11 items off one fix | JDK 17 + Maven CI lane |
| 2 | B2 | Commit uncommitted foundation + new services (reviewed batches) | Protects all 2026-05-29..31 work; gets CI/gate on it | — |
| 3 | A9 | Tenancy RLS rollout (`baalvion_app` role + per-table policies + middleware) | Real isolation gap masked as "done"; must lead feature work | owner reviews |
| 4 | B3 + B4 | Dedupe `realtime-service`; remove stray `;C` dir | Cheap hygiene; fixes dep-graph/deploy ambiguity | — |
| 5 | A16 + A17 | Gateway GraphQL federation + unified WebSocket pass-through | Closes the I1 ingress gap (WS currently bypasses gateway) | — |
| 6 | C6 | **BillBana GST OS** (whole service) | P0 product; whole new bounded context; watch GSTN sandbox limits | — |
| 7 | F1 + F2 | Letter of Credit + Bank Guarantee — wire `trade-finance-service` | Core trade-finance instrument; system-of-record live | #1 |
| 8 | F3 + F4 | Invoice Finance + BNPL — wire `credit-service` | Working-capital products; revenue path | #1 |
| 9 | F6 + E3 | Multi-Currency Wallet + Escrow — wire Java svcs | Money custody/release underpins settlement | #1 |
| 10 | I2 + I3 | Settlement + Reconciliation — wire Java svcs | Closes the money loop (settle → reconcile) | #1 |
| 11 | G1 | KYC verification flow | Compliance gate before any party can transact | #1 |
| 12 | G2 + G3 | AML Monitoring engine + Sanctions Screening | Regulatory must-have per trade | #1 |
| 13 | G4 | Trust Score (0–1000 composite) | Risk signal consumed by finance + matching | G1–G3 |
| 14 | I1 | Payment Rails adapters (SWIFT/SEPA/ACH/UPI/Pix/M-Pesa/SPEI) | Real settlement egress | F-suite |
| 15 | E1 + E2 | Deal Room + Smart Contract — compile + wire | Negotiation → binding contract; uses realtime + e-sign | #1, #4 |
| 16 | F5 | FX Engine: rate-lock/forwards + live feed | Multi-currency pricing for finance/wallet | #1 |
| 17 | D3 + D4 | Marketplace AI Matching + Price Intelligence | Demand-side value; needs `ml-service` | — |
| 18 | C5 | Dashboard ERP: AI forecast + analytics + equity depth | P0 product depth | — |
| 19 | E4 + E5 | Dispute (3-tier) + Inspection Booking | Completes the deal lifecycle | — |
| 20 | A11 + A12 | Search: real OpenSearch cluster + 50M/<50ms + indexers | Scale proof + wires search into every domain | cluster/ops |
| 21 | A4 + A5 | Notification delivery receipts + provider creds/deps | Production messaging | provider creds |
| 22 | D1 | Listings: scale to 50M + OpenSearch wiring | Marketplace scale | #20 |
| 23 | C21 | Wire 4 new platform svcs (report/developer/tenant/agent): commit + gateway routes + console | Make built svcs reachable + visible | — |
| 24 | C20 | admin-platform: build missing backend-backed pages | Operator visibility | owning backends |
| 25 | H1–H5 | Logistics: carrier/customs/chamber integrations + AI HS classifier | Build engines on existing CRUD | — |
| 26 | J1–J5 | Trade AI suite (Credit/Demand/Supplier-Risk/NL/BTI) on `ml-service` | Intelligence layer | ml-service models |
| 27 | A14 | Cache adoption (migrate ad-hoc `ioredis`) | Consistency + stampede protection | — |
| 28 | L1–L4 | Frontend program: GTI/IR/Jobs, ~15 CMS sites, auth cutover, central-admin, brand-connector Firebase migrate | Estate-wide mock→real | — |
| 29 | D5 + D6 | Sample Order + Tender/Auction | Marketplace breadth | — |
| 30 | G5 + G6 + I4 + C11 | Fraud Detection, Export Control, Insurance, Amarisé authenticity pipeline | Depth | — |
| — | M1–M3 | Go-live key flips (AI/payments/SMS) | Deploy-time, 1 env var each | provider keys |
| — | A7, C2, C8, H6 | Future Enhancements (audit mirror, HUB portal, CTM ads, carbon) | Post-M3 | — |

### The one rule for this queue
**Do not start #7–#16 (Trade core wiring) until #1 (Java compile) is green.** Everything
in the Finance/Payments/Compliance band is wiring on top of code that does not yet
compile in this environment; pulling those tasks early produces unverifiable work.
