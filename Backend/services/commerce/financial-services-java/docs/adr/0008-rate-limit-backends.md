# ADR 0008 — Pluggable rate-limit backend (in-memory + Redis)

**Status:** Accepted

## Context
Rate limiting (design §7.2) must hold cluster-wide once a service runs multiple replicas, but
must also work with zero external dependencies for local/single-replica use.

## Decision
Introduce a `RateLimiterBackend` SPI used by `RateLimitFilter`:
- **`InMemoryRateLimiterBackend`** (default) — per-instance Bucket4j token bucket.
- **`RedisRateLimiterBackend`** — cluster-wide fixed-window counter (`INCR`+`EXPIRE`) over a
  shared Redis, selected by `app.security.rate-limit.backend=redis`. It **fails open** if Redis
  is unavailable (a limiter outage must never block legitimate traffic; the outage alerts
  separately).

`spring-boot-starter-data-redis` is on every service's classpath so the Redis backend is a pure
config switch. Because Redis is unused by default, the Redis health indicator is disabled by
default (`management.health.redis.enabled=false` via the environment post-processor) so a
service without Redis never fails its readiness probe; `LettuceConnectionFactory` connects
lazily, so nothing connects until the Redis backend is actually selected.

## Consequences
- Default behaviour is unchanged (in-memory) and dependency-free.
- A single config flag + shared Redis gives a correct distributed limit across replicas.
- Token-bucket (in-memory) vs fixed-window (Redis) differ slightly in burst smoothing; both are
  acceptable production policies and bounded by the same capacity/period config.
