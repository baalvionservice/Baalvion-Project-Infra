// Validation tests for the no-event-loss outbox primitives.
// Run: node --test test/outbox.test.mjs   (from packages/events, after `pnpm build`)
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  relayOutbox,
  backoffMillis,
  idempotent,
  memorySeenStore,
  createPgOutboxStore,
  outboxTableDDL,
} from '../dist/index.mjs';

// ── helpers ──────────────────────────────────────────────────────────────────

const FIXED_NOW = new Date('2020-01-01T00:00:00.000Z');
const opts = (extra = {}) => ({ now: () => FIXED_NOW, ...extra });

function eventFor(id, type) {
  return { id, type, payload: { x: 1 }, orgId: null, userId: null, timestamp: 't', traceId: 'tr' };
}
function row(id, type, attempts = 0, payload) {
  return {
    id,
    type,
    payload: payload ?? JSON.stringify(eventFor(id, type)),
    attempts,
    createdAt: 'c',
  };
}

// A fake OutboxStore that hands out the given batch ONCE, then nothing, and records decisions.
function fakeStore(batch) {
  const calls = { claims: 0, lease: null, markSent: [], failures: [] };
  return {
    calls,
    async enqueue() {},
    async claimBatch(limit, _now, leaseUntil) {
      calls.claims++;
      calls.lease = leaseUntil;
      return calls.claims === 1 ? batch.slice(0, limit) : [];
    },
    async markSent(ids) { calls.markSent.push(...ids); },
    async recordFailure(id, error, nextAt, dead) { calls.failures.push({ id, error, nextAt, dead }); },
  };
}

// A publisher that throws for events whose type is in `failTypes`.
function fakePublisher(failTypes = new Set()) {
  const published = [];
  return {
    published,
    async publish(e) {
      if (failTypes.has(e.type)) throw new Error('boom:' + e.type);
      published.push(e.id);
    },
    async publishMany(es) { for (const e of es) await this.publish(e); },
  };
}

const silentLog = { error() {}, warn() {}, debug() {}, info() {} };

// ── relay: happy path ──────────────────────────────────────────────────────────

test('relayOutbox publishes all rows and marks them sent', async () => {
  const store = fakeStore([row('a', 'x'), row('b', 'x')]);
  const pub = fakePublisher();
  const res = await relayOutbox(store, pub, silentLog, opts());

  assert.deepEqual(res, { claimed: 2, sent: 2, failed: 0, dead: 0 });
  assert.deepEqual(pub.published, ['a', 'b']);
  assert.deepEqual(store.calls.markSent, ['a', 'b']);
  assert.equal(store.calls.failures.length, 0);
  // Rows are leased into the future so a concurrent tick can't re-claim them mid-publish.
  assert.ok(store.calls.lease.getTime() > FIXED_NOW.getTime());
});

test('relayOutbox returns empty result and does not call markSent when nothing is due', async () => {
  const store = fakeStore([]);
  const res = await relayOutbox(store, fakePublisher(), silentLog, opts());
  assert.deepEqual(res, { claimed: 0, sent: 0, failed: 0, dead: 0 });
  assert.equal(store.calls.markSent.length, 0);
});

// ── relay: retry / backoff ──────────────────────────────────────────────────────

test('relayOutbox defers a failed publish with backoff and does NOT mark it sent', async () => {
  const store = fakeStore([row('a', 'fail', 0)]);
  const res = await relayOutbox(store, fakePublisher(new Set(['fail'])), silentLog,
    opts({ backoffBaseMs: 2000 }));

  assert.deepEqual(res, { claimed: 1, sent: 0, failed: 1, dead: 0 });
  assert.equal(store.calls.markSent.length, 0);
  assert.equal(store.calls.failures.length, 1);
  const f = store.calls.failures[0];
  assert.equal(f.id, 'a');
  assert.equal(f.dead, false);
  // attempt 1 → base * 2^0 = 2000ms in the future
  assert.equal(f.nextAt.getTime(), FIXED_NOW.getTime() + 2000);
});

test('relayOutbox dead-letters a row once attempts reach maxAttempts', async () => {
  const store = fakeStore([row('a', 'fail', 9)]); // 9 prior failures, this is the 10th
  const res = await relayOutbox(store, fakePublisher(new Set(['fail'])), silentLog,
    opts({ maxAttempts: 10 }));

  assert.deepEqual(res, { claimed: 1, sent: 0, failed: 0, dead: 1 });
  assert.equal(store.calls.failures[0].dead, true);
});

// ── relay: a poison row must never block its siblings ───────────────────────────

test('relayOutbox publishes good rows even when a sibling poison row fails', async () => {
  const store = fakeStore([row('g1', 'ok'), row('p', 'fail'), row('g2', 'ok')]);
  const res = await relayOutbox(store, fakePublisher(new Set(['fail'])), silentLog, opts());

  assert.deepEqual(res, { claimed: 3, sent: 2, failed: 1, dead: 0 });
  assert.deepEqual(store.calls.markSent, ['g1', 'g2']);
  assert.deepEqual(store.calls.failures.map((f) => f.id), ['p']);
});

test('relayOutbox dead-letters an unparseable payload immediately without blocking siblings', async () => {
  const store = fakeStore([row('bad', 'x', 0, '{not valid json'), row('g', 'x')]);
  const res = await relayOutbox(store, fakePublisher(), silentLog, opts());

  assert.equal(res.dead, 1);
  assert.equal(res.sent, 1);
  assert.deepEqual(store.calls.markSent, ['g']);
  const f = store.calls.failures.find((x) => x.id === 'bad');
  assert.ok(f && f.dead === true);
});

// ── backoff math ────────────────────────────────────────────────────────────────

test('backoffMillis grows exponentially and is capped', () => {
  assert.equal(backoffMillis(1, 2000, 300000), 2000);
  assert.equal(backoffMillis(2, 2000, 300000), 4000);
  assert.equal(backoffMillis(3, 2000, 300000), 8000);
  assert.equal(backoffMillis(100, 2000, 300000), 300000); // capped, no overflow
  assert.equal(backoffMillis(0, 2000, 300000), 2000);     // floor at base
});

// ── idempotent consumer ────────────────────────────────────────────────────────

test('idempotent runs the handler once per event id and skips duplicates', async () => {
  const seen = memorySeenStore();
  let count = 0;
  const handler = idempotent(() => { count++; }, seen);
  await handler({ id: 'evt-1' });
  await handler({ id: 'evt-1' }); // duplicate delivery
  await handler({ id: 'evt-2' });
  assert.equal(count, 2);
});

// ── PG store: SQL shape + row mapping (fake driver, no real DB) ──────────────────

function fakeRunner(resultRows = []) {
  const queries = [];
  return { queries, async query(text, params) { queries.push({ text, params }); return { rows: resultRows }; } };
}

test('createPgOutboxStore.claimBatch uses FOR UPDATE SKIP LOCKED and maps rows', async () => {
  const runner = fakeRunner([
    { id: 'a', type: 'x', payload: JSON.stringify(eventFor('a', 'x')), attempts: '3', created_at: FIXED_NOW },
  ]);
  const store = createPgOutboxStore({ runner, schema: 'orders', table: 'event_outbox' });
  const lease = new Date(FIXED_NOW.getTime() + 60000);
  const rows = await store.claimBatch(5, FIXED_NOW, lease);

  assert.match(runner.queries[0].text, /FOR UPDATE SKIP LOCKED/);
  assert.match(runner.queries[0].text, /"orders"\."event_outbox"/);
  assert.deepEqual(runner.queries[0].params, [5, FIXED_NOW.toISOString(), lease.toISOString()]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].attempts, 3);              // coerced to Number
  assert.equal(typeof rows[0].payload, 'string'); // stays a string for JSON.parse in the relay
});

test('createPgOutboxStore.enqueue writes through the provided transaction runner', async () => {
  const base = fakeRunner();
  const tx = fakeRunner();
  const store = createPgOutboxStore({ runner: base, schema: 'orders' });
  await store.enqueue(eventFor('a', 'x'), tx);

  assert.equal(tx.queries.length, 1, 'enqueue must use the tx runner');
  assert.equal(base.queries.length, 0, 'enqueue must NOT touch the base runner inside a tx');
  assert.match(tx.queries[0].text, /INSERT INTO/);
  assert.match(tx.queries[0].text, /ON CONFLICT \(id\) DO NOTHING/);
});

test('createPgOutboxStore.markSent is a no-op for an empty id list', async () => {
  const runner = fakeRunner();
  const store = createPgOutboxStore({ runner });
  await store.markSent([]);
  assert.equal(runner.queries.length, 0);
});

test('createPgOutboxStore.recordFailure bumps attempts and conditionally fails the row', async () => {
  const runner = fakeRunner();
  const store = createPgOutboxStore({ runner });
  const nextAt = new Date(FIXED_NOW.getTime() + 5000);
  await store.recordFailure('a', 'boom', nextAt, true);

  assert.match(runner.queries[0].text, /attempts = attempts \+ 1/);
  assert.match(runner.queries[0].text, /CASE WHEN \$4 THEN 'failed'/);
  assert.deepEqual(runner.queries[0].params, ['a', 'boom', nextAt.toISOString(), true]);
});

test('createPgOutboxStore rejects an injection-y identifier', () => {
  assert.throws(() => createPgOutboxStore({ runner: fakeRunner(), schema: 'orders"; DROP' }),
    /invalid SQL identifier/);
});

// ── DDL ──────────────────────────────────────────────────────────────────────

test('outboxTableDDL declares the expected columns, a claim index, and no RLS', () => {
  const ddl = outboxTableDDL('orders', 'event_outbox');
  assert.match(ddl, /"orders"\."event_outbox"/);
  assert.match(ddl, /payload\s+text NOT NULL/);
  assert.match(ddl, /available_at timestamptz/);
  assert.match(ddl, /event_outbox_claim_idx/);
  assert.doesNotMatch(ddl, /ROW LEVEL SECURITY/); // relay reads cross-tenant — no RLS on the relay table
});
