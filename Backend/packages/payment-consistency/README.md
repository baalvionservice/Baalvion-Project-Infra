# @baalvion/payment-consistency — Payment Consistency Layer (PCL)

> One deterministic payment convergence engine. Every payment state transition in the
> platform goes through **one** function — `PaymentStateMachine.apply(event)` — and every
> downstream side effect leaves through **one** transactional outbox. No service mutates
> final payment state directly anymore.

This package replaces the status quo where **webhooks, the JVM saga, reconciliation cron
jobs and retry workers all write payment state independently** (CTM `ctm.payments`,
order-service `orders.orders_order_payments`, proxy `public.transactions`, GTI
`oms.order_payments`, Java `payments.gateway_payments`) with a single source of truth.

---

## 1. Architecture

### 1.1 Before — multiple writers, no convergence

```
   Stripe/Razorpay/PayU                JVM Kafka saga              Gateway poll / cron
        webhooks                  (ledger.posted/failed)          (recon sweeps)
           │                              │                              │
           ▼                              ▼                              ▼
 ┌───────────────────┐        ┌───────────────────────┐     ┌────────────────────┐
 │ CTM webhook ctrl   │        │ PaymentSagaListener     │     │ order-svc recon     │
 │ writes ctm.payments│        │ writes payments.        │     │ BullMQ sweep writes │
 │  status=succeeded  │        │  transactions COMPLETED │     │ orders_order_payments│
 ├───────────────────┤        ├───────────────────────┤     ├────────────────────┤
 │ proxy webhookDedup │        │ Java OutboxPublisher    │     │ GTI razorpay webhook│
 │ writes transactions│        │ → Kafka (its own outbox)│     │ writes oms.payments │
 └───────────────────┘        └───────────────────────┘     └────────────────────┘
        ▲   ▲                          ▲                              ▲
        └───┴──────────────────────────┴──────────────────────────────┘
              5 tables · 5 status vocabularies · 4 dedupe schemes
   ❌ duplicate logic   ❌ independent writers race   ❌ outbox loss is permanent
   ❌ partial reconciliation   ❌ no global idempotent state machine
```

### 1.2 After — one engine, one truth, one outbox

```
  Stripe/Razorpay/PayU    JVM Kafka saga      order-svc recon      retry workers
       webhooks         (Node bridge consumer)   sweep / cron        (any source)
          │                     │                     │                   │
          │   verify + normalize (the ONLY job an adapter has)            │
          ▼                     ▼                     ▼                   ▼
        ┌──────────────────────────────────────────────────────────────────┐
        │                       PaymentEvent (one shape)                     │
        │   { type, paymentId, provider, transactionId, amount, currency }   │
        └──────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
                 ╔══════════════════════════════════════════╗
                 ║          PaymentStateMachine.apply         ║   ← single source of truth
                 ║                                            ║
                 ║   BEGIN (one DB transaction)               ║
                 ║     1. inbox.claim(dedupeKey)  ── dedupe   ║
                 ║     2. ensureAndLock(payment)  ── serialize║
                 ║     3. decide(state, event)    ── pure FSM ║
                 ║     4. advance state + enqueue outbox      ║
                 ║   COMMIT                                    ║
                 ╚══════════════════════════════════════════╝
                       │                         │
                       ▼                         ▼
            ┌────────────────────┐    ┌──────────────────────────┐
            │  pcl.payment_state  │    │     pcl.payment_outbox     │
            │ (THE source of truth)│   │ PAYMENT_CAPTURED/FAILED/   │
            └────────────────────┘    │ SETTLED  (one row / effect) │
                                       └──────────────────────────┘
                                                  │
                                  @baalvion/events relay (existing)
                                                  ▼
                                        Kafka → downstream systems
```

### 1.3 Event flow (happy path + duplicate + conflict)

```
 webhook(captured) ─┐
 saga(confirmed) ───┼─▶ normalize ─▶ apply ─▶ inbox.claim ─┬─ fresh ─▶ decide ─▶ APPLY ─▶ state=CAPTURED
 recon(captured) ───┘                                      │                              └▶ outbox: PAYMENT_CAPTURED
                                                           └─ seen  ─▶ return 'duplicate'  (no-op, no emit)

 late webhook(failed) after CAPTURED ─▶ apply ─▶ decide ─▶ CONFLICT ─▶ state UNCHANGED
                                                                      └▶ outbox: PAYMENT_CONFLICT (alert)
```

### 1.4 State machine

```
        ┌──────────── FAIL (pre-capture only) ─────────────┐
        ▼                                                  │
   ┌──────────┐   authorize   ┌────────────┐  capture  ┌──────────┐  settle  ┌─────────┐
   │INITIATED │ ────────────▶ │ AUTHORIZED  │ ────────▶ │ CAPTURED │ ───────▶ │ SETTLED │
   └──────────┘               └────────────┘           └──────────┘          └─────────┘
        │  capture (provider skips authorize)  ▲             │                    (terminal)
        └──────────────────────────────────────┘             │ FAIL → CONFLICT (never wipes a payment)
                                                              ▼
                                                          ┌────────┐
                                                          │ FAILED │  (terminal)
                                                          └────────┘
```

Rules (all enforced in the pure `decide()` function — see `src/decide.ts`):

| Rule | Behaviour |
|------|-----------|
| **Idempotent transitions** | Re-applying any event is a no-op; the success ladder is rank-monotonic. |
| **Same event never double-applies** | `(paymentId, eventType, transactionId)` dedupe in `pcl.payment_inbox`. |
| **Invalid / stale transitions ignored** | Lower- or equal-rank targets → safe `noop`, no state change, no emit. |
| **No money lost** | A late `FAILED` after `CAPTURED`/`SETTLED` is **not** applied — surfaced as `CONFLICT`. |
| **No double charge** | A success after a terminal `FAILED` is **not** applied — surfaced as `CONFLICT` for reconciliation. |
| **Side effects only via outbox** | Effects are rows committed in the same tx; the relay publishes them. |
| **No side effects in controllers** | Adapters only build events; the engine owns all writes/emits. |

> **Scope.** PCL owns the external **charge lifecycle** (the 5 states above). The Java
> internal `payments.transactions` ledger saga keeps its own engine; PCL simply consumes
> its `payments.transaction.completed` as a `SAGA_CONFIRMED` input. Refunds (`REFUNDED`/
> `REVERSED`) are a documented v2 terminal branch off `SETTLED`, intentionally out of the
> v1 5-state core to match the brief exactly.

---

## 2. Folder structure

```
Backend/packages/payment-consistency/
├── package.json              # @baalvion/payment-consistency (tsup, node:test, workspace:*)
├── tsconfig.json             # extends ../../tsconfig.base.json
├── tsup.config.ts            # dual CJS+ESM build, node20 target
├── migrations/
│   └── 001_pcl_core.sql      # pcl.payment_state | payment_inbox | payment_outbox
├── src/
│   ├── index.ts              # barrel
│   ├── states.ts             # PaymentState + rank/terminal rules
│   ├── events.ts             # PaymentEvent (zod) + intent map + dedupeKey
│   ├── decide.ts             # PURE deterministic decision function (the heart)
│   ├── normalize.ts          # webhook/saga/recon → PaymentEvent
│   ├── ports.ts              # PaymentStateStore / InboxStore / OutboxWriter / TxRunner
│   ├── pgStore.ts            # PostgreSQL implementation of the ports
│   ├── stateMachine.ts       # PaymentStateMachine.apply() orchestration
│   └── errors.ts
├── test/                     # node:test, run against dist (repo convention)
│   ├── decide.test.mjs
│   ├── normalize.test.mjs
│   └── stateMachine.test.mjs
└── examples/                 # thin-adapter refactor templates (not built)
    ├── ctm-webhook.adapter.js
    ├── jvm-saga.bridge.mjs
    ├── order-recon.adapter.js
    └── JvmPclEmitter.java
```

---

## 3. Wiring it up (no new infrastructure)

```ts
import {
  PaymentStateMachine,
  createPgTxRunner, createPgPaymentStateStore, createPgInboxStore, createPgOutboxWriter,
} from '@baalvion/payment-consistency';

const opts = { pool /* existing pg Pool */, schema: 'pcl' };
const pcl = new PaymentStateMachine({
  db:     createPgTxRunner(pool),
  store:  createPgPaymentStateStore(opts),
  inbox:  createPgInboxStore(opts),
  outbox: createPgOutboxWriter(opts),
  logger,
});

// Publish PCL side-effects with the EXISTING relay — zero new delivery code:
import { createPgOutboxStore, startOutboxRelay } from '@baalvion/events';
const relay = startOutboxRelay(
  createPgOutboxStore({ runner: pool, schema: 'pcl', table: 'payment_outbox' }),
  publisher /* Kafka/Redis bus you already run */, logger, { pollMs: 2000 },
);
```

`pcl.payment_outbox` is column-compatible with `@baalvion/events` `outboxTableDDL`, so the
same battle-tested `FOR UPDATE SKIP LOCKED` relay drains it. Existing Postgres + Kafka +
Redis only — nothing new to operate.

---

## 4. Migration plan (3 phases, incremental, reversible)

### Phase 0 — land the schema (no behaviour change)
- Run `migrations/001_pcl_core.sql` (idempotent) in every DB that holds payments.
- Deploy the package + a thin **pcl-service** (or embed the relay in an existing worker)
  that runs the outbox relay. PCL tables are empty and read by nobody yet → zero risk.

### Phase 1 — Shadow mode (dual write, PCL is **not** authoritative)
- Each adapter, **in addition to** its current write, normalizes and calls `pcl.apply(event)`.
- Legacy tables remain the source of truth; `pcl.payment_state` is populated in parallel.
- Wire the relay's `PAYMENT_*` output to a **shadow topic** (or log-only sink).
- **Validation gate:** a reconciliation job compares `pcl.payment_state` against each legacy
  table. Ship the next phase only when divergence is ~0 over a representative window.
  ```sql
  -- example drift probe (order-service)
  SELECT p.id, p.status AS legacy, s.state AS pcl
    FROM orders.orders_order_payments p
    JOIN pcl.payment_state s ON s.payment_id = p.transaction_id
   WHERE NOT ( (p.status='captured' AND s.state IN ('CAPTURED','SETTLED'))
            OR (p.status='failed'   AND s.state='FAILED') );
  ```
- **Rollback:** stop calling `apply()`. Legacy path untouched. No data migration to undo.

### Phase 2 — Enforcement mode (PCL becomes authoritative)
- Flip a per-service flag (`PCL_ENFORCE=true`). Order/fulfilment decisions now read
  `pcl.payment_state` (or consume `PAYMENT_CAPTURED`/`PAYMENT_SETTLED` from the real topic).
- Legacy `status` columns become **derived/mirrored** from PCL outcomes (write-through for
  read compatibility) instead of being written independently.
- Point the relay at the **production** Kafka topics that downstreams already consume.
- **Rollback:** flip `PCL_ENFORCE=false` to fall back to legacy reads. Shadow writes continue.

### Phase 3 — Collapse the duplicate logic
- Delete the independent state-mutation code in each adapter (now dead) — webhook handlers,
  saga listener writes, recon backfill writes become thin event emitters.
- Remove per-service status enums/transition logic; keep only the legacy column as a
  PCL-mirrored read model until consumers migrate, then drop it.
- The Java service stops writing `gateway_payments` final state on webhooks and instead
  emits to the PCL inbound topic (see `examples/JvmPclEmitter.java`).

> Every phase is independently deployable and reversible. No phase introduces double-charge
> risk: in shadow mode PCL emits to nobody; in enforcement mode the terminal-state rules make
> a stray success-after-failure a `CONFLICT`, never an auto-capture.

---

## 5. Adapter refactor plan

The pattern is identical everywhere: **verify → normalize → apply → ACK**. The adapter does
no state writes and no downstream calls. Full runnable templates live in `examples/`.

### 5.1 Webhook handler (CTM / order-service / proxy)
```js
// BEFORE: handler verified HMAC, then mutated ctm.payments.status='succeeded',
//         invoices.status='Paid', subscriptions.status='active' inline.
// AFTER:  handler verifies HMAC, normalizes, calls pcl.apply(). Downstream effects
//         (invoice paid, subscription active) become consumers of PAYMENT_CAPTURED.
const verified = pay.verifyWebhook({ rawBody, headers });          // unchanged: signature check
const event = normalizeWebhook({
  provider: verified.provider, status: verified.status,
  paymentId: verified.paymentId, transactionId: verified.eventId,  // signed-body id only
  money: { amountMinor: verified.amountMinor, currency: verified.currency },
  orgId: siteSlug,
});
if (!event) return res.json({ received: true, ignored: true });    // pending/unknown
await pcl.apply(event);                                            // the ONLY state write
return res.json({ received: true });
```

### 5.2 JVM Kafka saga → Node bridge consumer
```
BEFORE: PaymentSagaListener.onLedgerPosted() → UPDATE payments.transactions SET COMPLETED
        + its own outbox → Kafka.
AFTER:  Java emits the saga event to topic `pcl.events.inbound` (or keeps emitting
        payments.transaction.completed). A small Node consumer (examples/jvm-saga.bridge.mjs)
        consumes it, calls normalizeSagaEvent(), then pcl.apply(). The bridge consumer's
        offset commit + PCL inbox dedupe make redelivery exactly-once.
```
The Java service's *internal ledger* saga is unchanged; only the **charge-state write** is
removed and replaced by an event emission (`examples/JvmPclEmitter.java`).

### 5.3 Reconciliation / gateway-sweep worker (order-service BullMQ)
```js
// BEFORE: recon sweep diffed legacy payments vs ledger and backfilled ledger entries,
//         leaving payment status drift unresolved.
// AFTER:  sweep fetches the gateway's authoritative status and feeds it as an EVENT.
//         PCL converges state idempotently — recon becomes a healing event source, not a
//         second writer. If PCL already has the right state, apply() returns 'ignored'.
for (const charge of await gateway.listRecentCharges(store)) {
  const event = normalizeReconciliation({
    gatewayStatus: charge.status, paymentId: charge.paymentId, provider: charge.provider,
    transactionId: charge.id, money: { amountMinor: charge.amountMinor, currency: charge.currency },
  });
  if (event) await pcl.apply(event);   // self-healing, idempotent
}
```

---

## 6. Failure-safety guarantees

| Requirement | How PCL satisfies it |
|-------------|----------------------|
| **No event loss** | Inbox + state + outbox commit in one transaction; the relay is at-least-once with bounded retry + dead-letter (reused from `@baalvion/events`). A crash mid-flight re-publishes on lease expiry. |
| **No double charge** | Terminal `FAILED` is never auto-flipped to a success; contradictions surface as `CONFLICT`. PCL only converges *state*, it never initiates a charge. |
| **Replay-safe** | `decide()` is pure and rank-monotonic; the inbox makes exact replays no-ops. Tested in `test/stateMachine.test.mjs`. |
| **Eventual convergence** | Reconciliation feeds the gateway's truth as events; idempotent `apply()` heals any drift. `CONFLICT` events alert ops for the rare genuine contradiction. |

---

## 7. Test & build

```bash
pnpm --filter @baalvion/payment-consistency build
pnpm --filter @baalvion/payment-consistency test       # node:test — decide / normalize / stateMachine
pnpm --filter @baalvion/payment-consistency type-check
```
