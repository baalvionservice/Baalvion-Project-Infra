import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createResilient, CircuitOpenError } from '../src/index.js';

const fast = { sleep: async () => {}, random: () => 0 };

test('retries a flaky operation to eventual success', async () => {
  let calls = 0;
  const call = createResilient(
    async () => {
      calls++;
      if (calls < 2) throw new Error('flaky');
      return 'ok';
    },
    { retry: { retries: 3, ...fast }, circuitBreaker: false, bulkhead: false },
  );
  assert.equal(await call(), 'ok');
  assert.equal(calls, 2);
});

test('trips the shared breaker after repeated failures across calls', async () => {
  const call = createResilient(async () => Promise.reject(new Error('down')), {
    retry: false,
    circuitBreaker: { failureThreshold: 2 },
    bulkhead: false,
  });
  await assert.rejects(call());
  await assert.rejects(call());
  // Breaker is now open → next call fails fast.
  await assert.rejects(call(), CircuitOpenError);
  assert.equal(call.breaker.state, 'open');
});

test('enforces a per-attempt timeout', async () => {
  const call = createResilient(() => new Promise((r) => setTimeout(() => r('late'), 100)), {
    timeoutMs: 10,
    retry: false,
    circuitBreaker: false,
    bulkhead: false,
  });
  await assert.rejects(call(), { code: 'TIMEOUT' });
});

test('bulkhead limits in-flight composed calls', async () => {
  let active = 0;
  let peak = 0;
  const call = createResilient(
    async () => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((r) => setTimeout(r, 15));
      active--;
    },
    { bulkhead: { maxConcurrent: 2 }, retry: false, circuitBreaker: false },
  );
  await Promise.all([call(), call(), call(), call()]);
  assert.equal(peak, 2);
});
