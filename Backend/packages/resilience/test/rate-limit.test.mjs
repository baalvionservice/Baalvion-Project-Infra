import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RateLimiter } from '../src/index.js';

function fakeClock(start = 0) {
  const c = { t: start };
  c.now = () => c.t;
  c.advance = (ms) => (c.t += ms);
  return c;
}

test('allows up to max requests per window, then blocks', async () => {
  const rl = new RateLimiter({ windowMs: 1000, max: 3 });
  const results = [];
  for (let i = 0; i < 4; i++) results.push((await rl.consume('user-1')).allowed);
  assert.deepEqual(results, [true, true, true, false]);
});

test('tracks remaining and retryAfter accurately', async () => {
  const clock = fakeClock();
  const rl = new RateLimiter({ windowMs: 1000, max: 2, now: clock.now });
  assert.equal((await rl.consume('k')).remaining, 1);
  assert.equal((await rl.consume('k')).remaining, 0);
  const blocked = await rl.consume('k');
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfterMs, 1000);
});

test('resets after the window elapses', async () => {
  const clock = fakeClock();
  const rl = new RateLimiter({ windowMs: 1000, max: 1, now: clock.now });
  assert.equal((await rl.consume('k')).allowed, true);
  assert.equal((await rl.consume('k')).allowed, false);
  clock.advance(1000);
  assert.equal((await rl.consume('k')).allowed, true, 'new window — counter reset');
});

test('isolates counters per key', async () => {
  const rl = new RateLimiter({ windowMs: 1000, max: 1 });
  assert.equal((await rl.consume('a')).allowed, true);
  assert.equal((await rl.consume('b')).allowed, true, 'different key has its own budget');
  assert.equal((await rl.consume('a')).allowed, false);
});

test('middleware sends 429 with Retry-After when exhausted', async () => {
  const rl = new RateLimiter({ windowMs: 1000, max: 1 });
  const mw = rl.middleware({ keyGenerator: () => 'fixed' });

  const makeRes = () => {
    const headers = {};
    return {
      headers,
      statusCode: 200,
      setHeader: (k, v) => (headers[k] = v),
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(body) {
        this.body = body;
        return this;
      },
    };
  };

  let nextCalls = 0;
  const next = () => nextCalls++;

  const res1 = makeRes();
  await mw({}, res1, next);
  assert.equal(nextCalls, 1, 'first request passes');

  const res2 = makeRes();
  await mw({}, res2, next);
  assert.equal(res2.statusCode, 429);
  assert.equal(res2.body.error.code, 'RATE_LIMITED');
  assert.ok(res2.headers['Retry-After']);
  assert.equal(nextCalls, 1, 'blocked request does not call next');
});
