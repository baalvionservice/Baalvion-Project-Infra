import { checkRateLimit, AUTH_RATE_LIMIT, API_RATE_LIMIT } from '../rate-limit';

describe('checkRateLimit', () => {
  it('allows the first request', () => {
    const result = checkRateLimit(`user-${Date.now()}-1`, { windowMs: 60_000, max: 5 });
    expect(result.allowed).toBe(true);
  });

  it('decrements remaining on each call', () => {
    const id = `user-${Date.now()}-decrement`;
    const opts = { windowMs: 60_000, max: 5 };
    const r1 = checkRateLimit(id, opts);
    const r2 = checkRateLimit(id, opts);
    expect(r2.remaining).toBe(r1.remaining - 1);
  });

  it('returns remaining = 0 when limit is exactly reached', () => {
    const id = `user-${Date.now()}-exact`;
    const opts = { windowMs: 60_000, max: 3 };
    checkRateLimit(id, opts);
    checkRateLimit(id, opts);
    const last = checkRateLimit(id, opts);
    expect(last.allowed).toBe(true);
    expect(last.remaining).toBe(0);
  });

  it('blocks requests exceeding max', () => {
    const id = `user-${Date.now()}-block`;
    const opts = { windowMs: 60_000, max: 2 };
    checkRateLimit(id, opts);
    checkRateLimit(id, opts);
    const overLimit = checkRateLimit(id, opts);
    expect(overLimit.allowed).toBe(false);
    expect(overLimit.remaining).toBe(0);
  });

  it('uses keyPrefix to namespace keys', () => {
    const ts = Date.now();
    const id = `ns-test-${ts}`;
    const optsA = { windowMs: 60_000, max: 1, keyPrefix: 'prefixA' };
    const optsB = { windowMs: 60_000, max: 10, keyPrefix: 'prefixB' };
    // exhaust prefix A
    checkRateLimit(id, optsA);
    const blockedA = checkRateLimit(id, optsA);
    expect(blockedA.allowed).toBe(false);
    // prefix B is independent
    const allowedB = checkRateLimit(id, optsB);
    expect(allowedB.allowed).toBe(true);
  });

  it('resets after the window expires', () => {
    const id = `user-${Date.now()}-reset`;
    // Use a very short window
    const opts = { windowMs: 1, max: 1 };
    checkRateLimit(id, opts);
    const blocked = checkRateLimit(id, opts);
    expect(blocked.allowed).toBe(false);

    // Simulate window expiry by waiting slightly more than 1ms
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const fresh = checkRateLimit(id, opts);
        expect(fresh.allowed).toBe(true);
        resolve();
      }, 10);
    });
  });

  it('returns a resetAt timestamp in the future', () => {
    const before = Date.now();
    const result = checkRateLimit(`user-${Date.now()}-ts`, { windowMs: 60_000, max: 10 });
    expect(result.resetAt).toBeGreaterThan(before);
  });
});

describe('AUTH_RATE_LIMIT preset', () => {
  it('has windowMs of 15 minutes', () => {
    expect(AUTH_RATE_LIMIT.windowMs).toBe(15 * 60 * 1000);
  });

  it('has max of 10 requests', () => {
    expect(AUTH_RATE_LIMIT.max).toBe(10);
  });

  it('has keyPrefix auth', () => {
    expect(AUTH_RATE_LIMIT.keyPrefix).toBe('auth');
  });
});

describe('API_RATE_LIMIT preset', () => {
  it('has windowMs of 1 minute', () => {
    expect(API_RATE_LIMIT.windowMs).toBe(60 * 1000);
  });

  it('has max of 100 requests', () => {
    expect(API_RATE_LIMIT.max).toBe(100);
  });

  it('has keyPrefix api', () => {
    expect(API_RATE_LIMIT.keyPrefix).toBe('api');
  });
});
