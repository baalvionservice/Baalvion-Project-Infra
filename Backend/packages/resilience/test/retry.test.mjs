import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withRetry } from '../src/index.js';

// Deterministic, instant retries: no real sleep, jitter folded to delay=0.
const fast = { sleep: async () => {}, random: () => 0 };

test('returns on first success without retrying', async () => {
  let calls = 0;
  const result = await withRetry(
    async () => {
      calls++;
      return 'value';
    },
    fast,
  );
  assert.equal(result, 'value');
  assert.equal(calls, 1);
});

test('retries transient failures then succeeds', async () => {
  let calls = 0;
  const onRetry = [];
  const result = await withRetry(
    async () => {
      calls++;
      if (calls < 3) throw new Error('transient');
      return 'ok';
    },
    { ...fast, retries: 5, onRetry: (i) => onRetry.push(i.attempt) },
  );
  assert.equal(result, 'ok');
  assert.equal(calls, 3);
  assert.deepEqual(onRetry, [1, 2]);
});

test('throws the last error after exhausting retries', async () => {
  let calls = 0;
  await assert.rejects(
    withRetry(
      async () => {
        calls++;
        throw new Error(`fail ${calls}`);
      },
      { ...fast, retries: 2 },
    ),
    /fail 3/,
  );
  assert.equal(calls, 3, 'initial attempt + 2 retries');
});

test('does not retry when retryable() returns false', async () => {
  let calls = 0;
  await assert.rejects(
    withRetry(
      async () => {
        calls++;
        throw Object.assign(new Error('bad request'), { statusCode: 400 });
      },
      { ...fast, retries: 5, retryable: (err) => err.statusCode >= 500 },
    ),
  );
  assert.equal(calls, 1, 'non-retryable error fails fast');
});

test('honours exponential backoff schedule via injected random', async () => {
  const delays = [];
  let calls = 0;
  await assert.rejects(
    withRetry(
      async () => {
        calls++;
        throw new Error('x');
      },
      {
        retries: 3,
        minDelayMs: 100,
        factor: 2,
        random: () => 1, // full jitter at the ceiling → delay == exp window
        sleep: async (ms) => {
          delays.push(ms);
        },
        onRetry: () => {},
      },
    ),
  );
  // exp window grows 100, 200, 400
  assert.deepEqual(delays, [100, 200, 400]);
});

test('aborts immediately when the signal is already aborted', async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(withRetry(async () => 'never', { ...fast, signal: controller.signal }), {
    code: 'ABORTED',
  });
});
