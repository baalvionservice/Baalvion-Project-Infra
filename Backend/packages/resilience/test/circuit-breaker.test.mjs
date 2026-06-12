import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CircuitBreaker, CircuitOpenError } from '../src/index.js';

/** A fake clock so reset-timeout transitions are deterministic. */
function fakeClock(start = 0) {
  const c = { t: start };
  c.now = () => c.t;
  c.advance = (ms) => (c.t += ms);
  return c;
}

const boom = () => Promise.reject(new Error('dependency down'));
const ok = () => Promise.resolve('ok');

test('stays closed and passes results through on success', async () => {
  const cb = new CircuitBreaker({ failureThreshold: 3 });
  assert.equal(await cb.exec(ok), 'ok');
  assert.equal(cb.state, 'closed');
});

test('opens after the failure threshold is reached', async () => {
  const transitions = [];
  const cb = new CircuitBreaker({ failureThreshold: 3, onStateChange: (t) => transitions.push(t.to) });
  for (let i = 0; i < 3; i++) await assert.rejects(cb.exec(boom));
  assert.equal(cb.state, 'open');
  assert.deepEqual(transitions, ['open']);
});

test('fails fast (without calling fn) while open', async () => {
  const clock = fakeClock();
  const cb = new CircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 1000, now: clock.now });
  await assert.rejects(cb.exec(boom));
  assert.equal(cb.state, 'open');

  let called = false;
  await assert.rejects(
    cb.exec(() => {
      called = true;
      return ok();
    }),
    CircuitOpenError,
  );
  assert.equal(called, false, 'fn must not run while the circuit is open');
});

test('half-opens after the reset window, then closes on a successful probe', async () => {
  const clock = fakeClock();
  const cb = new CircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 1000, now: clock.now });
  await assert.rejects(cb.exec(boom));
  assert.equal(cb.state, 'open');

  clock.advance(1000);
  assert.equal(cb.state, 'half_open'); // effective state, computed without mutating
  assert.equal(await cb.exec(ok), 'ok');
  assert.equal(cb.state, 'closed');
});

test('the state getter is side-effect free (metrics reads do not fire onStateChange)', async () => {
  const clock = fakeClock();
  const events = [];
  const cb = new CircuitBreaker({
    failureThreshold: 1,
    resetTimeoutMs: 1000,
    now: clock.now,
    onStateChange: (t) => events.push(`${t.from}->${t.to}`),
  });
  await assert.rejects(cb.exec(boom)); // closed -> open
  clock.advance(1000);

  // Read state/stats repeatedly during the reset window — must not transition.
  void cb.state;
  void cb.stats;
  void cb.state;
  assert.deepEqual(events, ['closed->open'], 'no transition fired from reads');

  // The real transition happens on the next exec (the probe).
  await cb.exec(ok);
  assert.deepEqual(events, ['closed->open', 'open->half_open', 'half_open->closed']);
});

test('re-opens immediately if the half-open probe fails', async () => {
  const clock = fakeClock();
  const cb = new CircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 1000, now: clock.now });
  await assert.rejects(cb.exec(boom));
  clock.advance(1000);
  assert.equal(cb.state, 'half_open');
  await assert.rejects(cb.exec(boom));
  assert.equal(cb.state, 'open');
});

test('ignores errors that isFailure() classifies as non-failures', async () => {
  const cb = new CircuitBreaker({
    failureThreshold: 1,
    isFailure: (err) => err.statusCode >= 500, // 4xx is a client error, not a dependency failure
  });
  const client4xx = () => Promise.reject(Object.assign(new Error('bad input'), { statusCode: 400 }));
  await assert.rejects(cb.exec(client4xx));
  await assert.rejects(cb.exec(client4xx));
  assert.equal(cb.state, 'closed', '4xx errors must not trip the breaker');
});
