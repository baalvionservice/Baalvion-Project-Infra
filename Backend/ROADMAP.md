# Baalvion — Roadmap

> **Purpose:** the time-phased view — what ships in which milestone and why, with
> the dependencies between phases made explicit. Item-level detail is in
> [`TASKS.md`](./TASKS.md); strict execution order in [`EXECUTION_BACKLOG.md`](./EXECUTION_BACKLOG.md);
> status counts in [`GAP_ANALYSIS.md`](./GAP_ANALYSIS.md).
>
> **Created:** 2026-05-31 (did not previously exist). The section below is the dated
> reconciliation; future passes append a new dated section and preserve this one.

---

## Reconciliation — 2026-05-31

### Where we are
P0 cross-cutting **foundation is complete** (auth, gateway-REST, notifications,
audit, tenancy mechanism, search, cache) and the architecture gate is green at 61
services. The remaining work is **execution & operational readiness**, gated by one
environment blocker (Java compile) and one discipline gap (uncommitted work).

```
Foundation ✅ ──▶ Unblock (compile + commit + RLS) ──▶ Trade core ──▶ Depth/scale ──▶ Go-live
   (done)          M0 (now)                              M1            M2             M3
```

### M0 — Stabilize & Unblock (immediate)
*Goal: turn "built" into "buildable, committed, and isolated." Nothing new ships
until the platform can compile and the work is safely landed.*
- Compile + run the Java finance suite (B1) — **the gate for all of M1**.
- Commit uncommitted foundation + new services (B2).
- Tenancy RLS rollout begins per bounded context (A9).
- Hygiene: dedupe `realtime-service` (B3), remove stray dir (B4).
- Finish the front door: gateway GraphQL + unified WS (A16/A17).
- **Exit criteria:** `mvn verify` green for the Java suite; foundation committed & CI-gated; ≥1 service fully under RLS as the reference rollout.

### M1 — Trade Core (depends on M0 compile)
*Goal: the money + compliance spine is live behind the gateway.*
- Finance: L/C, Bank Guarantee, Invoice Finance, BNPL, FX rate-lock/forwards, Wallet (F1–F6) — wire the compiled Java services.
- Trade & Deal: Escrow, Deal Room, Smart Contract (E1–E3) — wire; Dispute + Inspection (E4/E5) — build.
- Compliance: KYC flow, AML engine, Sanctions screening, Trust Score (G1–G4).
- Payments: Payment Rails adapters (I1); Settlement + Reconciliation wired (I2/I3).
- Marketplace: AI Matching + Price Intelligence (D3/D4); Listings to 50M (D1).
- Product P0: **BillBana GST OS** (C6); Dashboard AI/analytics (C5).
- **Exit criteria:** a trade can be quoted (RFQ), financed (L/C/Invoice), screened (KYC/AML/sanctions), settled, and reconciled end-to-end on real (or simulated-by-seam) rails.

### M2 — Depth & Scale
*Goal: breadth across logistics, AI, and the frontend estate.*
- Logistics integrations + AI HS classifier on existing CRUD (H1–H5).
- Trade AI suite on `ml-service`: Credit Scoring, Demand Forecasting, Supplier Risk, NL Assistant, BTI (J1–J5).
- Marketplace: Sample Order + Tender/Auction (D5/D6).
- Compliance: Fraud Detection + Export Control (G5/G6).
- Insurance (I4).
- Frontend estate: GTI/IR/Jobs conversions, ~15 CMS sites, auth cutover, central-admin consolidation, brand-connector Firebase migration (L1–L4, C9, C14/C15, C11, B5).
- admin-platform: missing backend-backed pages + 4-new-svc console wiring (C20/C21).

### M3 — Go-Live Hardening
*Goal: flip from demo to production.*
- Real OpenSearch cluster + 50M/<50ms proof (A11); per-domain indexers (A12).
- Notification delivery receipts + real provider creds (A4/A5).
- Provider key flips: AI / payments / SMS (M1–M3).
- Cache adoption complete (A14).

### Deferred (Future Enhancement — revisit post-M3)
- Audit ClickHouse mirror + dedup + repoint (A7).
- HUB parent portal (C2); CTM ads/CPC (C8); Carbon Footprint (H6).

### Phase dependency notes
- **M1 cannot start in earnest without M0's Java compile (B1).** It is the single
  most leveraged item: clearing it advances ~11 tracked items at once.
- RLS rollout (A9) should lead each service's M1/M2 work so isolation lands with the feature, not after.
- Go-live key flips (M3) are 1-env-var operations by design (demo mode); they are *scheduling*, not *engineering*, items.
