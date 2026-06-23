import { test } from 'node:test';
import assert from 'node:assert/strict';

import { PaymentStateMachine } from '../dist/index.mjs';

// ── In-memory port fakes (the engine depends only on the interfaces) ──────────────
function makeDeps() {
  const states = new Map(); // paymentId -> record
  const inbox = new Set(); // dedupe keys
  const outbox = []; // envelopes
  let n = 0;

  const store = {
    async ensureAndLock(_tx, event) {
      let rec = states.get(event.paymentId);
      if (!rec) {
        rec = {
          paymentId: event.paymentId,
          state: 'INITIATED',
          version: 1,
          provider: event.provider,
          transactionId: event.transactionId,
          amountMinor: event.amount,
          currency: event.currency,
        };
        states.set(event.paymentId, rec);
      }
      return { ...rec };
    },
    async advance(_tx, paymentId, toState, event) {
      const rec = states.get(paymentId);
      rec.state = toState;
      rec.version += 1;
      rec.last_event_type = event.type;
    },
  };
  const inboxStore = {
    async claim(_tx, key) {
      if (inbox.has(key)) return false;
      inbox.add(key);
      return true;
    },
  };
  const outboxWriter = {
    async enqueue(_tx, env) {
      outbox.push(env);
    },
  };
  const db = { async transaction(fn) { return fn(null); } };

  const sm = new PaymentStateMachine({
    db,
    store,
    inbox: inboxStore,
    outbox: outboxWriter,
    idGen: () => `id_${++n}`,
    clock: () => new Date('2026-06-24T00:00:00.000Z'),
  });
  return { sm, states, outbox };
}

const ev = (type, over = {}) => ({
  type,
  paymentId: over.paymentId ?? 'pay_1',
  provider: over.provider ?? 'stripe',
  transactionId: over.transactionId ?? 'txn_1',
  amount: over.amount ?? 1000,
  currency: over.currency ?? 'INR',
  ...over,
});

test('first capture event applies INITIATED -> CAPTURED and emits one PAYMENT_CAPTURED', async () => {
  const { sm, states, outbox } = makeDeps();
  const out = await sm.apply(ev('WEBHOOK_PAYMENT_SUCCESS'));
  assert.equal(out.result, 'applied');
  assert.equal(out.from, 'INITIATED');
  assert.equal(out.to, 'CAPTURED');
  assert.equal(states.get('pay_1').state, 'CAPTURED');
  assert.equal(outbox.length, 1);
  assert.equal(outbox[0].type, 'PAYMENT_CAPTURED');
  assert.equal(outbox[0].toState, 'CAPTURED');
});

test('duplicate delivery of the same event is exactly-once (no extra outbox)', async () => {
  const { sm, outbox } = makeDeps();
  const e = ev('WEBHOOK_PAYMENT_SUCCESS');
  await sm.apply(e);
  const dup = await sm.apply(e);
  assert.equal(dup.result, 'duplicate');
  assert.equal(outbox.length, 1, 'no second PAYMENT_CAPTURED emitted');
});

test('full lifecycle authorized -> captured -> settled emits exactly three side-effects', async () => {
  const { sm, states, outbox } = makeDeps();
  await sm.apply(ev('WEBHOOK_PAYMENT_AUTHORIZED', { transactionId: 'a' }));
  await sm.apply(ev('GATEWAY_CAPTURED', { transactionId: 'c' }));
  await sm.apply(ev('SETTLEMENT_PROCESSED', { transactionId: 's' }));
  assert.equal(states.get('pay_1').state, 'SETTLED');
  assert.deepEqual(outbox.map((o) => o.type), ['PAYMENT_AUTHORIZED', 'PAYMENT_CAPTURED', 'PAYMENT_SETTLED']);
});

test('out-of-order: a capture arriving AFTER settle is ignored safely', async () => {
  const { sm, states, outbox } = makeDeps();
  await sm.apply(ev('SETTLEMENT_PROCESSED', { transactionId: 's' }));
  const late = await sm.apply(ev('GATEWAY_CAPTURED', { transactionId: 'c' }));
  assert.equal(late.result, 'ignored');
  assert.equal(states.get('pay_1').state, 'SETTLED');
  assert.equal(outbox.length, 1, 'only PAYMENT_SETTLED, no late capture effect');
});

test('a failure after capture surfaces a CONFLICT without changing state', async () => {
  const { sm, states, outbox } = makeDeps();
  await sm.apply(ev('GATEWAY_CAPTURED', { transactionId: 'c' }));
  const out = await sm.apply(ev('PAYMENT_FAILED', { transactionId: 'f' }));
  assert.equal(out.result, 'conflict');
  assert.equal(states.get('pay_1').state, 'CAPTURED', 'state unchanged — real payment not wiped');
  assert.equal(outbox.at(-1).type, 'PAYMENT_CONFLICT');
});

test('replay-safety: applying the same event sequence twice converges, no duplicate effects', async () => {
  const { sm, states, outbox } = makeDeps();
  const seq = [
    ev('WEBHOOK_PAYMENT_AUTHORIZED', { transactionId: 'a' }),
    ev('GATEWAY_CAPTURED', { transactionId: 'c' }),
    ev('SETTLEMENT_PROCESSED', { transactionId: 's' }),
  ];
  for (const e of seq) await sm.apply(e);
  const after1 = outbox.length;
  for (const e of seq) await sm.apply(e); // full replay
  assert.equal(states.get('pay_1').state, 'SETTLED');
  assert.equal(outbox.length, after1, 'replay produced zero new side-effects');
});
