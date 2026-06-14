import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withTimeout, TimeoutError } from '../src/index.js';

const delay = (ms, value) => new Promise((r) => setTimeout(() => r(value), ms));

test('resolves when the operation finishes before the deadline', async () => {
  const result = await withTimeout(() => delay(5, 'done'), 100);
  assert.equal(result, 'done');
});

test('rejects with TimeoutError when the operation is too slow', async () => {
  await assert.rejects(withTimeout(() => delay(100, 'late'), 10), TimeoutError);
});

test('aborts the operation signal on timeout', async () => {
  let aborted = false;
  await assert.rejects(
    withTimeout(
      (signal) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () => {
            aborted = true;
            reject(new Error('aborted by signal'));
          });
        }),
      10,
    ),
  );
  assert.equal(aborted, true);
});

test('propagates a parent AbortSignal', async () => {
  const controller = new AbortController();
  let aborted = false;
  const p = withTimeout(
    (signal) =>
      new Promise(() => {
        signal.addEventListener('abort', () => {
          aborted = true;
        });
      }),
    10_000,
    { signal: controller.signal },
  );
  controller.abort();
  // The op never settles on its own; give the microtask queue a tick.
  await delay(5);
  assert.equal(aborted, true);
  // Prevent an unhandled rejection: the op promise stays pending, so race the assertion only.
  void p.catch(() => {});
});
