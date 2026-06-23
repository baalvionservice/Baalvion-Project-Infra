/**
 * PCL integration + chaos tests against a FAITHFUL transactional in-memory Postgres fake.
 *
 * Unlike stateMachine.test.mjs (which swaps in trivial in-memory port fakes), this suite drives the
 * REAL production adapter — `createPgTxRunner` + `createPgPaymentStateStore` + `createPgInboxStore`
 * + `createPgOutboxWriter` from src/pgStore.ts — so the actual SQL, the BEGIN/COMMIT/ROLLBACK
 * transaction wrapper, the `ON CONFLICT DO NOTHING` dedupe and the `FOR UPDATE` serialization are all
 * exercised end-to-end.
 *
 * The fake models real Postgres semantics that the safety guarantees depend on:
 *   • TRANSACTIONAL STAGING — writes are buffered and only merged into the committed store on COMMIT;
 *     ROLLBACK discards them. This is what makes the partial-failure (atomicity) test meaningful.
 *   • PER-PAYMENT ROW LOCK — a transaction takes an async mutex on the payment_id at its first write
 *     and holds it until COMMIT/ROLLBACK, serializing concurrent events for the same payment exactly
 *     like `SELECT ... FOR UPDATE` + the inbox UNIQUE constraint do.
 *   • FAULT INJECTION — `failOn(sql)` throws inside a chosen statement to simulate a mid-apply DB
 *     failure / crash, so we can assert the whole transaction rolls back (no event loss).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  PaymentStateMachine,
  createPgTxRunner,
  createPgPaymentStateStore,
  createPgInboxStore,
  createPgOutboxWriter,
} from '../dist/index.mjs';

// ── A FIFO async mutex keyed by payment_id (models the row lock / inbox unique serialization) ─────
function makeMutex() {
  const tails = new Map();
  return {
    async acquire(key) {
      const prev = tails.get(key) || Promise.resolve();
      let release;
      const mine = new Promise((res) => { release = res; });
      tails.set(key, prev.then(() => mine));
      await prev; // wait for the previous holder to release
      return () => {
        release();
        // GC the chain once nobody is queued behind us.
        if (tails.get(key) === prev.then(() => mine)) tails.delete(key);
      };
    },
  };
}

// ── The faithful Postgres fake ────────────────────────────────────────────────────────────────────
class FakePg {
  constructor() {
    this.state = new Map(); // payment_id -> committed row
    this.inbox = new Set(); // committed dedupe_key
    this.outbox = []; // committed outbox rows
    this.mutex = makeMutex();
    this.failOn = null; // (sql) => boolean : throw inside the matching statement
  }

  // Fallback runner for the stores — never used here because every call runs inside a transaction.
  async query() {
    throw new Error('FakePg.query (autocommit) must not be used — all ops run in a transaction');
  }

  connect() {
    const pg = this;
    let stState = null; // staged state overlay: payment_id -> row
    let stInbox = null; // staged dedupe keys
    let stOutbox = null; // staged outbox rows
    let releaseLock = null;
    let lockedPayment = null;

    const maybeFail = (sql) => {
      if (pg.failOn && pg.failOn(sql)) throw new Error('injected DB failure: ' + sql.slice(0, 40));
    };
    const readState = (pid) => (stState.has(pid) ? stState.get(pid) : pg.state.get(pid)) || null;
    const ensureLock = async (pid) => {
      if (releaseLock) return; // one payment per transaction
      lockedPayment = pid;
      releaseLock = await pg.mutex.acquire(pid);
    };

    return {
      release() {},
      async query(text, params = []) {
        const sql = String(text).replace(/\s+/g, ' ').trim();

        if (sql === 'BEGIN') {
          stState = new Map();
          stInbox = new Set();
          stOutbox = [];
          return { rows: [], rowCount: 0 };
        }
        if (sql === 'COMMIT') {
          for (const [k, v] of stState) pg.state.set(k, v);
          for (const k of stInbox) pg.inbox.add(k);
          for (const r of stOutbox) pg.outbox.push(r);
          if (releaseLock) { releaseLock(); releaseLock = null; }
          return { rows: [], rowCount: 0 };
        }
        if (sql === 'ROLLBACK') {
          stState = stInbox = stOutbox = null; // discard everything staged
          if (releaseLock) { releaseLock(); releaseLock = null; }
          return { rows: [], rowCount: 0 };
        }

        // INBOX claim: INSERT ... ON CONFLICT (dedupe_key) DO NOTHING RETURNING dedupe_key
        if (sql.includes('payment_inbox') && sql.includes('INSERT')) {
          const [key, paymentId] = params;
          await ensureLock(paymentId); // serialize before we can fail/return
          maybeFail(sql);
          if (pg.inbox.has(key) || stInbox.has(key)) return { rows: [], rowCount: 0 }; // duplicate
          stInbox.add(key);
          return { rows: [{ dedupe_key: key }], rowCount: 1 };
        }

        // STATE seed: INSERT ... ON CONFLICT (payment_id) DO NOTHING
        if (sql.includes('payment_state') && sql.includes('INSERT')) {
          maybeFail(sql);
          const [paymentId, provider, transactionId, amountMinor, currency, lastEventType, orgId] = params;
          if (!pg.state.has(paymentId) && !stState.has(paymentId)) {
            stState.set(paymentId, {
              payment_id: paymentId, provider, transaction_id: transactionId,
              amount_minor: amountMinor, currency, state: 'INITIATED', version: 1,
              last_event_type: lastEventType, org_id: orgId ?? null,
            });
          }
          return { rows: [], rowCount: 0 };
        }

        // STATE lock-read: SELECT * ... WHERE payment_id = $1 FOR UPDATE
        if (sql.includes('payment_state') && sql.includes('FOR UPDATE')) {
          maybeFail(sql);
          const row = readState(params[0]);
          return { rows: row ? [{ ...row }] : [], rowCount: row ? 1 : 0 };
        }

        // STATE advance: UPDATE payment_state SET state=$2, version=version+1, ...
        if (sql.includes('payment_state') && sql.startsWith('UPDATE')) {
          maybeFail(sql);
          const [paymentId, toState, lastEventType, lastTxnId] = params;
          const cur = readState(paymentId);
          if (cur) {
            stState.set(paymentId, {
              ...cur, state: toState, version: cur.version + 1,
              last_event_type: lastEventType, last_transaction_id: lastTxnId,
            });
          }
          return { rows: [], rowCount: cur ? 1 : 0 };
        }

        // OUTBOX enqueue: INSERT INTO payment_outbox ...
        if (sql.includes('payment_outbox') && sql.includes('INSERT')) {
          maybeFail(sql);
          const [id, type, payload, orgId] = params;
          stOutbox.push({ id, type, payload, org_id: orgId ?? null, status: 'pending' });
          return { rows: [], rowCount: 1 };
        }

        throw new Error('FakePg: unhandled SQL: ' + sql);
      },
    };
  }

  // Test helpers over committed state.
  outboxTypes() { return this.outbox.map((r) => r.type); }
  stateOf(pid) { const r = this.state.get(pid); return r ? r.state : null; }
}

function makeMachine(pg) {
  const opts = { pool: pg, schema: 'pcl' };
  return new PaymentStateMachine({
    db: createPgTxRunner(pg),
    store: createPgPaymentStateStore(opts),
    inbox: createPgInboxStore(opts),
    outbox: createPgOutboxWriter(opts),
  });
}

const ev = (type, over = {}) => ({
  type,
  paymentId: over.paymentId ?? 'pay_1',
  provider: over.provider ?? 'razorpay',
  transactionId: over.transactionId ?? 'txn_1',
  amount: over.amount ?? 1000,
  currency: over.currency ?? 'INR',
  ...over,
});

// ── Happy path through the real SQL adapter ────────────────────────────────────────────────────
test('pgStore: first capture commits CAPTURED + one outbox row + one inbox key', async () => {
  const pg = new FakePg();
  const sm = makeMachine(pg);
  const out = await sm.apply(ev('WEBHOOK_PAYMENT_SUCCESS'));
  assert.equal(out.result, 'applied');
  assert.equal(out.to, 'CAPTURED');
  assert.equal(pg.stateOf('pay_1'), 'CAPTURED');
  assert.deepEqual(pg.outboxTypes(), ['PAYMENT_CAPTURED']);
  assert.equal(pg.inbox.size, 1);
});

// ── Inbox dedupe across the real ON CONFLICT statement ─────────────────────────────────────────
test('pgStore: duplicate redelivery is exactly-once (no second state change, no second outbox)', async () => {
  const pg = new FakePg();
  const sm = makeMachine(pg);
  const e = ev('WEBHOOK_PAYMENT_SUCCESS');
  const first = await sm.apply(e);
  const second = await sm.apply(e);
  assert.equal(first.result, 'applied');
  assert.equal(second.result, 'duplicate');
  assert.equal(pg.outbox.length, 1, 'exactly one PAYMENT_CAPTURED — inbox UNIQUE blocked the replay');
});

// ── Concurrency: two simultaneous identical webhooks → the row lock + inbox make it exactly-once ──
test('pgStore: concurrent duplicate webhooks apply exactly once', async () => {
  const pg = new FakePg();
  const sm = makeMachine(pg);
  const e = ev('GATEWAY_CAPTURED', { transactionId: 'cap_1' });
  const [a, b] = await Promise.all([sm.apply(e), sm.apply(e)]);
  const results = [a.result, b.result].sort();
  assert.deepEqual(results, ['applied', 'duplicate'], 'one wins, one dedupes');
  assert.equal(pg.stateOf('pay_1'), 'CAPTURED');
  assert.equal(pg.outbox.length, 1, 'no double-charge effect under concurrency');
});

// ── Out-of-order: a capture that arrives after settle is a safe no-op ──────────────────────────
test('pgStore: capture after settle is ignored, no extra outbox', async () => {
  const pg = new FakePg();
  const sm = makeMachine(pg);
  await sm.apply(ev('SETTLEMENT_PROCESSED', { transactionId: 's1' }));
  const late = await sm.apply(ev('GATEWAY_CAPTURED', { transactionId: 'c1' }));
  assert.equal(late.result, 'ignored');
  assert.equal(pg.stateOf('pay_1'), 'SETTLED');
  assert.deepEqual(pg.outboxTypes(), ['PAYMENT_SETTLED']);
});

// ── No double charge / no wipe: a late failure after capture is a CONFLICT, state preserved ─────
test('pgStore: failure after capture surfaces PAYMENT_CONFLICT and never wipes the capture', async () => {
  const pg = new FakePg();
  const sm = makeMachine(pg);
  await sm.apply(ev('GATEWAY_CAPTURED', { transactionId: 'c1' }));
  const out = await sm.apply(ev('WEBHOOK_PAYMENT_FAILED', { transactionId: 'f1' }));
  assert.equal(out.result, 'conflict');
  assert.equal(pg.stateOf('pay_1'), 'CAPTURED', 'real payment is NOT regressed by a stray failure');
  assert.equal(pg.outboxTypes().at(-1), 'PAYMENT_CONFLICT');
});

// ── Terminal immutability: a success after a terminal FAILED is a CONFLICT, never auto-captured ──
test('pgStore: success after terminal FAILED is a CONFLICT, never auto-flipped', async () => {
  const pg = new FakePg();
  const sm = makeMachine(pg);
  await sm.apply(ev('WEBHOOK_PAYMENT_FAILED', { transactionId: 'f1' }));
  const out = await sm.apply(ev('WEBHOOK_PAYMENT_SUCCESS', { transactionId: 's1' }));
  assert.equal(out.result, 'conflict');
  assert.equal(pg.stateOf('pay_1'), 'FAILED', 'terminal FAILED is immutable — no double charge');
  assert.equal(pg.outboxTypes().at(-1), 'PAYMENT_CONFLICT');
});

// ── CHAOS: a DB failure DURING apply() rolls the whole transaction back — no event loss ─────────
test('chaos: partial DB failure during apply() rolls back atomically, retry converges', async () => {
  const pg = new FakePg();
  const sm = makeMachine(pg);

  // Crash the outbox INSERT — the last write in the transaction, after inbox claim + state advance.
  pg.failOn = (sql) => sql.includes('payment_outbox');
  await assert.rejects(() => sm.apply(ev('WEBHOOK_PAYMENT_SUCCESS', { transactionId: 'c1' })));

  // Nothing committed: not the state, not the inbox dedupe key, not the outbox row.
  assert.equal(pg.state.size, 0, 'state rolled back');
  assert.equal(pg.inbox.size, 0, 'inbox claim rolled back — event is NOT lost, it can be retried');
  assert.equal(pg.outbox.length, 0, 'no partial outbox row');

  // Heal and retry the SAME event — it now applies cleanly and converges.
  pg.failOn = null;
  const retry = await sm.apply(ev('WEBHOOK_PAYMENT_SUCCESS', { transactionId: 'c1' }));
  assert.equal(retry.result, 'applied');
  assert.equal(pg.stateOf('pay_1'), 'CAPTURED');
  assert.equal(pg.outbox.length, 1, 'exactly one effect after recovery — no loss, no duplicate');
});

// ── CHAOS: failure on the state lock-read also rolls back cleanly ───────────────────────────────
test('chaos: failure on the FOR UPDATE read rolls back; no inbox key leaks (no event loss)', async () => {
  const pg = new FakePg();
  const sm = makeMachine(pg);
  pg.failOn = (sql) => sql.includes('FOR UPDATE');
  await assert.rejects(() => sm.apply(ev('GATEWAY_CAPTURED', { transactionId: 'c1' })));
  assert.equal(pg.inbox.size, 0, 'inbox claim rolled back with the failed transaction');
  assert.equal(pg.state.size, 0);

  pg.failOn = null;
  const retry = await sm.apply(ev('GATEWAY_CAPTURED', { transactionId: 'c1' }));
  assert.equal(retry.result, 'applied');
  assert.equal(pg.stateOf('pay_1'), 'CAPTURED');
});

// ── Full lifecycle replay: authorize→capture→settle twice → converges, zero duplicate effects ────
test('pgStore: full-lifecycle replay produces zero duplicate side-effects', async () => {
  const pg = new FakePg();
  const sm = makeMachine(pg);
  const seq = [
    ev('WEBHOOK_PAYMENT_AUTHORIZED', { transactionId: 'a' }),
    ev('GATEWAY_CAPTURED', { transactionId: 'c' }),
    ev('SETTLEMENT_PROCESSED', { transactionId: 's' }),
  ];
  for (const e of seq) await sm.apply(e);
  const afterFirst = pg.outbox.length;
  for (const e of seq) await sm.apply(e); // full replay
  assert.equal(pg.stateOf('pay_1'), 'SETTLED');
  assert.equal(pg.outbox.length, afterFirst, 'replay emitted nothing new');
  assert.deepEqual(pg.outboxTypes(), ['PAYMENT_AUTHORIZED', 'PAYMENT_CAPTURED', 'PAYMENT_SETTLED']);
});
