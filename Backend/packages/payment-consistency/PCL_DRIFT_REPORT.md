# PCL Drift Report — Phase 1 (Shadow Mode)

**Package:** `@baalvion/payment-consistency` (PCL)
**Status:** Shadow mode wired into 2 services, flag-gated OFF by default. **Enforcement NOT enabled.**
**Date generated:** 2026-06-24
**Scope of this report:** what diverges today between the 5 independent payment writers and the PCL
single source of truth, which writers are still independent, whether any unsafe transition path
exists, and the safety-gate evidence that must hold before enforcement is even considered.

---

## 1. Executive summary

The Payment Consistency Layer is integrated into the monorepo and wired into **order-service** and
**ctm-service** in **shadow mode**. In shadow mode the legacy write is unchanged and authoritative;
PCL `apply()` runs *in addition*, populating `pcl.payment_state` in parallel and emitting structured
`pcl_shadow` / `pcl_drift` telemetry. PCL publishes **nothing** downstream in this phase (no relay is
started — it "emits to nobody").

There is **no measured production drift yet**, because shadow mode is OFF by default (`PCL_SHADOW`
unset) and the `pcl.*` migration has not been applied to any live database from this change. Drift is
*observed at runtime* once an operator (a) applies the migration and (b) sets `PCL_SHADOW=true` on a
staging/canary deploy. This report defines the writers, the drift probes, the safety invariants that
are already proven by tests, and the go/no-go threshold for advancing.

---

## 2. The 5 independent payment-state writers (the problem PCL converges)

| # | Writer | Table / column | Native "paid" vocabulary | Shadowed by PCL now? |
|---|--------|----------------|--------------------------|----------------------|
| 1 | CTM webhook / PayU return | `ctm.payments.status` | `succeeded` | ✅ **yes** (this PR) |
| 2 | order-service capture/fail | `orders.orders_order_payments.status` | `captured` / `failed` | ✅ **yes** (this PR) |
| 3 | proxy webhook dedupe | `public.transactions` (free string) | free-form | ❌ not yet |
| 4 | GTI razorpay webhook | `oms.order_payments` | `COMPLETED` | ❌ not yet |
| 5 | Java payment-service | `payments.gateway_payments` | `CAPTURED` (+ Kafka saga) | ❌ not yet (bridge templated in `examples/`) |

**Minimum-2-services requirement met:** writers #1 and #2 are shadowed. Writers #3–#5 remain
independent and are the backlog for Phase 1 expansion (templates exist in `examples/`). Until they
are shadowed they are **out of PCL's measured truth** — explicitly tracked here so they are not
mistaken for "converged."

> **Scope note (unchanged from the package design):** PCL owns the *external charge lifecycle* only
> (`INITIATED→AUTHORIZED→CAPTURED→SETTLED` + `FAILED`). The Java *internal ledger saga*
> (`payments.transactions`) keeps its own engine; PCL consumes its `payments.transaction.completed`
> as a `SAGA_CONFIRMED` input. Refunds are a documented v2 branch, intentionally excluded.

---

## 3. Drift probes (run once shadow mode is live on a DB)

Drift = a row where the legacy status and the PCL state disagree. Each shadowed service exposes a
direct SQL probe because `pcl.*` lives in the **same database** as the legacy table.

**order-service** (grain: `payment_id = orders_order.id`):
```sql
SELECT o.id AS order_id, o.payment_status AS legacy, s.state AS pcl
  FROM orders.orders_orders o
  JOIN pcl.payment_state s ON s.payment_id = o.id::text
 WHERE NOT ( (o.payment_status = 'paid'   AND s.state IN ('CAPTURED','SETTLED'))
          OR (o.payment_status = 'failed' AND s.state = 'FAILED')
          OR (o.payment_status NOT IN ('paid','failed')) );  -- in-flight orders are not drift
```

**ctm-service** (grain: `payment_id = ctm.payments.id`):
```sql
SELECT p.id AS payment_id, p.status AS legacy, s.state AS pcl
  FROM ctm.payments p
  JOIN pcl.payment_state s ON s.payment_id = p.id::text
 WHERE NOT ( (p.status = 'succeeded' AND s.state IN ('CAPTURED','SETTLED'))
          OR (p.status <> 'succeeded') );
```

**Live `CONFLICT` surface** (the only genuinely actionable drift — a contradiction, not a lag):
```sql
SELECT id, type, payload, created_at
  FROM pcl.payment_outbox
 WHERE type = 'PAYMENT_CONFLICT'
 ORDER BY created_at DESC;
```
Plus the application logs: every divergence is emitted as `{"evt":"pcl_shadow.warn","drift":true,...}`.

---

## 4. Expected (benign) vs unsafe drift

| Drift class | Cause | Severity | Action |
|-------------|-------|----------|--------|
| **Lag** | Shadow apply runs post-commit; the probe momentarily sees legacy=paid, PCL still INITIATED | benign / self-heals | none (transient) |
| **Coverage gap** | A writer not yet shadowed (proxy/GTI/Java) updated a row PCL never saw | expected | shadow that writer next |
| **`PAYMENT_CONFLICT`** | A contradiction: success-after-FAILED, or FAILED-after-CAPTURED for the same `paymentId` | **actionable** | ops reconciles; PCL did **not** auto-flip |
| **Schema/migration absent** | `PCL_SHADOW=true` but `pcl.*` not migrated → apply() throws | operator error, **safe** | apply migration; errors are logged, never thrown into the legacy path |

**Unsafe transition paths found: NONE.** By construction (`src/decide.ts`, proven by tests):
- Terminal `SETTLED` / `FAILED` are immutable — never auto-flipped.
- A late `FAILED` after `CAPTURED` → `CONFLICT`, state stays `CAPTURED` (no payment wipe).
- A success after terminal `FAILED` → `CONFLICT`, state stays `FAILED` (no double charge).
- The success ladder is rank-monotonic — out-of-order/stale events are safe no-ops.

---

## 5. Safety-gate evidence (STEP 6) — all asserted by automated tests

| Gate | Guarantee | Test evidence |
|------|-----------|---------------|
| **No double charge** | Success after terminal `FAILED` is a `CONFLICT`, never an auto-capture | `decide.test.mjs`, `integration.pg.test.mjs` → "success after terminal FAILED is a CONFLICT" |
| **No state regression** | Terminal states immutable; late `FAILED` after `CAPTURED` keeps `CAPTURED` | `integration.pg.test.mjs` → "failure after capture surfaces PAYMENT_CONFLICT and never wipes" |
| **Inbox dedupe** | `(paymentId,type,transactionId)` applied exactly once — sequential AND concurrent | `integration.pg.test.mjs` → "duplicate redelivery", "concurrent duplicate webhooks apply exactly once" |
| **Atomic, no event loss** | A mid-`apply()` DB failure rolls back state+inbox+outbox together; retry converges | `integration.pg.test.mjs` → 2 chaos tests (fail on outbox INSERT, fail on FOR UPDATE read) |
| **Exactly-once effect** | One outbox row per applied transition; replay/duplicate/concurrency emit nothing extra | `integration.pg.test.mjs` → "full-lifecycle replay produces zero duplicate side-effects" |
| **Zero checkout regression** | Shadow is OFF by default; when ON it is post-commit, fire-and-forget, never throws | service `pclShadow.test.js` (never-throws) + full suites green (order 113/113, ctm 22/22) |

**Test totals (this PR):** PCL package **38/38** (29 pure FSM + **9 new** pgStore integration/chaos);
order-service **113/113** (incl. 5 new shadow tests, 0 regressions); ctm-service **22/22** (incl. 4 new,
0 regressions). Build + DTS type-check green. No flaky/failing tests.

> **Coverage honesty:** the integration/chaos tests run against a *faithful transactional in-memory
> Postgres fake* that models staging/COMMIT/ROLLBACK, a per-payment row lock, and fault injection —
> it exercises the real `pgStore.ts` SQL + `createPgTxRunner`. It is **not** a substitute for a real
> Postgres soak. Real-DB validation is the Phase-1 staging gate below.

---

## 6. Go / No-Go threshold to advance past shadow

Advance toward enforcement **only** when, over a representative window on staging/canary with
`PCL_SHADOW=true` and the migration applied:

1. The §3 drift probes return **~0 rows** for shadowed writers (lag-only, no persistent disagreement).
2. `PAYMENT_CONFLICT` count is **0** (or every conflict has a documented, reconciled root cause).
3. Writers #3–#5 are either shadowed or explicitly carved out of the enforcement scope.
4. The outbox relay has been wired to a **shadow topic** and observed draining exactly-once.

Enforcement (`PCL_ENFORCE`) is **not part of this PR** and must not be enabled here.

---

## 7. Current state of the world

- ✅ PCL is a first-class workspace package, builds in turbo/CI, no circular deps.
- ✅ Shadow adapters wired (order-service ×2 paths, ctm-service ×2 paths), default OFF.
- ✅ Migration verified additive/idempotent/isolated — **not applied** (no live DB in this environment).
- ✅ All safety gates proven by tests; no unsafe transition path exists.
- ⏳ Live drift numbers pending an operator enabling shadow on a real DB (see `ROLLOUT.md`).
- ⏳ proxy / GTI / Java writers still independent (Phase-1 expansion backlog).
