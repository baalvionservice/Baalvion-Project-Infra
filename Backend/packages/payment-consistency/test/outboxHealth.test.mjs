import test from 'node:test';
import assert from 'node:assert/strict';
import { readOutboxHealth, createPaymentOutboxRelay } from '../dist/index.mjs';

// A fake pool that answers the one aggregate query the health check runs.
function poolReturning(row) {
  const calls = [];
  return {
    calls,
    async query(text, params) {
      calls.push({ text, params });
      return { rows: [row] };
    },
  };
}

test('an empty outbox is healthy and reports no age', async () => {
  const h = await readOutboxHealth(poolReturning({ pending: 0, failed: 0, oldest_age: null }));
  assert.equal(h.pending, 0);
  assert.equal(h.oldestPendingAgeSeconds, null);
  assert.equal(h.stalled, false);
});

test('a backlog that is moving is not a stall', async () => {
  // Pending work is normal — the relay polls. Only pending work that is OLD means trouble.
  const h = await readOutboxHealth(poolReturning({ pending: 400, failed: 0, oldest_age: 3 }));
  assert.equal(h.pending, 400);
  assert.equal(h.stalled, false);
});

test('one row stuck past the threshold is a stall, however small the backlog', async () => {
  // The failure this catches: payments record locally, the panel stays empty, and nothing says
  // why. A single row that cannot be delivered is exactly that symptom.
  const h = await readOutboxHealth(poolReturning({ pending: 1, failed: 0, oldest_age: 900 }));
  assert.equal(h.stalled, true);
  assert.equal(h.oldestPendingAgeSeconds, 900);
});

test('the threshold is configurable per service', async () => {
  const pool = poolReturning({ pending: 1, failed: 0, oldest_age: 120 });
  assert.equal((await readOutboxHealth(pool)).stalled, false); // default 300s
  assert.equal((await readOutboxHealth(pool, { lagWarnAfterSeconds: 60 })).stalled, true);
});

test('the health query is scoped to the schema it was given', async () => {
  const pool = poolReturning({ pending: 0, failed: 0, oldest_age: null });
  await readOutboxHealth(pool, { schema: 'pcl_other', table: 'outbox_x' });
  assert.match(pool.calls[0].text, /pcl_other\.outbox_x/);
});

test('failed rows are counted separately from pending ones', async () => {
  // A row the relay gave up on is a different problem from one it has not reached yet.
  const h = await readOutboxHealth(poolReturning({ pending: 2, failed: 7, oldest_age: 10 }));
  assert.equal(h.failed, 7);
  assert.equal(h.pending, 2);
});

test('a relay exposes its own backlog without a second wiring', async () => {
  const pool = poolReturning({ pending: 3, failed: 0, oldest_age: 5 });
  const relay = createPaymentOutboxRelay({
    pool,
    bus: { async publish() {} },
    logger: { error() {}, warn() {}, info() {}, debug() {} },
  });
  const h = await relay.health();
  assert.equal(h.pending, 3);
});

test('a health check that throws never takes the relay down', async () => {
  const logs = [];
  const relay = createPaymentOutboxRelay({
    pool: { async query() { throw new Error('database is gone'); } },
    bus: { async publish() {} },
    logger: { error() {}, warn(o, m) { logs.push([o, m]); }, info() {}, debug() {} },
    healthCheckMs: 0,
  });
  await assert.rejects(() => relay.health(), /database is gone/);
  // stop() is still safe to call after a failed check.
  await relay.stop();
});
