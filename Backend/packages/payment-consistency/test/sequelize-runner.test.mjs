import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSequelizeTxRunner, sequelizeQueryRunner, createPaymentSpine } from '../dist/index.mjs';

/**
 * Regression cover for a real bug: services hold a Sequelize instance, not a node-postgres
 * Pool. Handing PCL a `{ query }` adapter satisfies the type and then throws
 * `pool.connect is not a function` on the first capture — at runtime, in production, on money.
 */
function fakeSequelize() {
  const calls = [];
  return {
    calls,
    async query(sql, options = {}) {
      calls.push({ sql: sql.trim().split('\n')[0], inTransaction: Boolean(options.transaction) });
      return [[], {}];
    },
    async transaction(fn) {
      calls.push({ sql: 'BEGIN', inTransaction: true });
      const out = await fn({ id: 'tx-1' });
      calls.push({ sql: 'COMMIT', inTransaction: true });
      return out;
    },
  };
}

test('the Sequelize runner gives the ports a tx that carries its own query', async () => {
  const sequelize = fakeSequelize();
  const runner = createSequelizeTxRunner(sequelize);
  const seen = await runner.transaction(async (tx) => {
    // runnerOf() picks the tx when it has a `query` — that is what makes the inbox claim, the
    // state write and the outbox enqueue commit together.
    assert.equal(typeof tx.query, 'function');
    await tx.query('SELECT 1');
    return 'done';
  });
  assert.equal(seen, 'done');
  assert.ok(sequelize.calls.some((c) => c.sql === 'BEGIN'));
  assert.ok(sequelize.calls.some((c) => c.sql === 'COMMIT'));
  // The statement inside must actually be bound to the transaction, not run outside it.
  assert.ok(sequelize.calls.find((c) => c.sql === 'SELECT 1').inTransaction);
});

test('a rollback propagates the original error', async () => {
  const sequelize = {
    async query() { return [[], {}]; },
    async transaction(fn) { return fn({ id: 'tx' }); },
  };
  await assert.rejects(
    () => createSequelizeTxRunner(sequelize).transaction(async () => { throw new Error('boom'); }),
    /boom/,
  );
});

test('the non-transactional runner unwraps Sequelize row results', async () => {
  const runner = sequelizeQueryRunner({
    async query() { return [[{ a: 1 }], {}]; },
    async transaction(fn) { return fn({}); },
  });
  const { rows } = await runner.query('SELECT 1');
  assert.deepEqual(rows, [{ a: 1 }]);
});

test('the spine accepts a Sequelize instance, and demands one of the two', () => {
  const sequelize = fakeSequelize();
  const spine = createPaymentSpine({ sequelize, siteId: 'community', railFor: () => 'crypto' });
  // Validation is pure, so this proves the spine constructed without needing a real connection.
  assert.equal(spine.validate({
    paymentId: 'p1', provider: 'crypto', transactionId: 't1',
    amountMinor: '1000', currency: 'INR',
  }, 'CAPTURED').siteId, 'community');

  assert.throws(
    () => createPaymentSpine({ siteId: 'community', railFor: () => 'crypto' }),
    /needs either a pg Pool or a Sequelize instance/,
  );
});
