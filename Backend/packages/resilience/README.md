# @baalvion/resilience

Transport-agnostic resilience primitives. Wrap **any** async operation — a DB
query, a vendor SDK call, a queue publish, an outbound HTTP request — so a
failing or slow dependency degrades gracefully instead of cascading.

> The platform's `@baalvion/sdk` already ships an HTTP-specific breaker for its
> service-to-service client. This package is the reusable core for everything
> that is **not** HTTP (and for building your own resilient clients).

Zero runtime dependencies. Plain CommonJS (`require`-able from the JS service
fleet), with TypeScript declarations.

## Primitives

| Export | What it does |
| --- | --- |
| `CircuitBreaker` | closed → open → half-open; fail fast when a dependency is down |
| `withRetry` | exponential backoff + full jitter; pluggable `retryable` predicate |
| `withTimeout` | hard per-attempt deadline; aborts the op via `AbortSignal` |
| `Bulkhead` | concurrency cap + bounded queue; sheds load with `BulkheadFullError` |
| `RateLimiter` | distributed (Redis) or in-memory fixed-window limiter + Express middleware |
| `createResilient` | composes all of the above into one wrapped callable |

## Quick start

```js
const { createResilient } = require('@baalvion/resilience');

// Wrap a flaky vendor call once; call it everywhere.
const charge = createResilient((payload) => razorpay.charge(payload), {
  timeoutMs: 4000,
  retry: { retries: 3, retryable: (e) => e.statusCode >= 500 || e.code === 'ECONNRESET' },
  circuitBreaker: { failureThreshold: 5, resetTimeoutMs: 15_000 },
  bulkhead: { maxConcurrent: 20, maxQueue: 100 },
});

const receipt = await charge({ amount: 1917_50, currency: 'INR' });
```

Each primitive is also usable on its own:

```js
const { CircuitBreaker, withRetry, withTimeout, Bulkhead } = require('@baalvion/resilience');

const breaker = new CircuitBreaker({ name: 'opensanctions', failureThreshold: 5 });
const screen = () => breaker.exec(() => sanctions.screen(name));
```

## Distributed rate limiting (10k+ TPS, multi-replica)

`@baalvion/security`'s limiter is in-memory and per-process. Across many
replicas you need a **shared** counter so the limit is global:

```js
const Redis = require('ioredis');
const { RateLimiter } = require('@baalvion/resilience');

const limiter = new RateLimiter({ windowMs: 60_000, max: 1000, redis: new Redis(process.env.REDIS_URL) });
app.use('/v1', limiter.middleware()); // keys by org → user → ip; sets RateLimit-* headers
```

The counter is incremented with an atomic Lua script (`INCR` + `PEXPIRE`), so
there is no read-modify-write race between replicas. The middleware **fails
open**: a Redis outage must not take the API down.

## Error → HTTP mapping

Every thrown error carries `code` + `statusCode` so the central error boundary
(`@baalvion/errors`) maps it without special-casing:

| Error | `code` | HTTP |
| --- | --- | --- |
| `CircuitOpenError` | `CIRCUIT_OPEN` | 503 |
| `TimeoutError` | `TIMEOUT` | 504 |
| `BulkheadFullError` | `BULKHEAD_FULL` | 429 |
| rate-limited (middleware) | `RATE_LIMITED` | 429 |

## Testing

```sh
node --test        # 28 unit tests, deterministic (injectable clock/sleep/random)
```

Clocks (`now`), `sleep`, and `random` are all injectable, so the suite runs with
zero real delay and no flakiness.
