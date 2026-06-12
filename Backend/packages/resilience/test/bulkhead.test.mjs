import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Bulkhead, BulkheadFullError, AbortError } from '../src/index.js';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

test('caps concurrency at maxConcurrent', async () => {
  const b = new Bulkhead({ maxConcurrent: 2 });
  let active = 0;
  let peak = 0;
  const task = () =>
    b.exec(async () => {
      active++;
      peak = Math.max(peak, active);
      await delay(20);
      active--;
    });
  await Promise.all([task(), task(), task(), task(), task()]);
  assert.equal(peak, 2, 'never more than 2 in flight');
  assert.equal(b.active, 0);
  assert.equal(b.queued, 0);
});

test('queues work beyond the limit and drains it', async () => {
  const b = new Bulkhead({ maxConcurrent: 1 });
  const order = [];
  const task = (id) =>
    b.exec(async () => {
      order.push(id);
      await delay(10);
    });
  await Promise.all([task('a'), task('b'), task('c')]);
  assert.deepEqual(order, ['a', 'b', 'c'], 'serialized through the single slot');
});

test('a queued caller that aborts leaves the queue without consuming a slot', async () => {
  const b = new Bulkhead({ maxConcurrent: 1 });
  let release;
  const inFlight = b.exec(() => new Promise((r) => (release = r)));

  const controller = new AbortController();
  let waiterRan = false;
  const waiter = b.exec(
    async () => {
      waiterRan = true;
    },
    { signal: controller.signal },
  );
  assert.equal(b.queued, 1);

  controller.abort();
  await assert.rejects(waiter, AbortError);
  assert.equal(b.queued, 0, 'aborted waiter removed from the queue');

  release();
  await inFlight;
  // Slot accounting is intact: a fresh call is admitted immediately.
  assert.equal(await b.exec(async () => 'ok'), 'ok');
  assert.equal(waiterRan, false, 'aborted work never executed');
  assert.equal(b.active, 0);
});

test('sheds load with BulkheadFullError when the queue is full', async () => {
  const b = new Bulkhead({ maxConcurrent: 1, maxQueue: 0 });
  let release;
  const inFlight = b.exec(() => new Promise((r) => (release = r)));

  await assert.rejects(b.exec(async () => 'second'), BulkheadFullError);

  release();
  await inFlight;
  // After draining, new work is accepted again.
  assert.equal(await b.exec(async () => 'ok'), 'ok');
});
