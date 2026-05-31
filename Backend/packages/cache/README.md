# @baalvion/cache — shared Redis cache abstraction

One consistent caching layer for every service, instead of ad-hoc `ioredis` calls.
Redis/**Upstash**-compatible (`rediss://` `REDIS_URL` works as-is).

## Why
- **read-through / write-through** via `getOrSet` (the pattern you actually want)
- **single-flight stampede protection** — concurrent misses for a key run the loader **once**
- **fail-open** — if Redis is down, fall through to the loader; never break the request
- **consistent TTL profiles** — incl. the platform **FX = 30s** standard
- **tenant-scoped keys** — no cross-tenant cache bleed
- **prefix invalidation** — drop a whole key family after a write

## Use it
```js
const { createCache, TTL } = require('@baalvion/cache');

const cache = createCache({ namespace: 'fx', tenantScoped: false });

// FX rate cached for 30s, fetched once even under a stampede:
const rate = await cache.getOrSet(['rate', 'USD/EUR'], () => provider.fetch('USD/EUR'), { ttl: TTL.FX });

// tenant-scoped (reads the @baalvion/tenancy context):
const profile = await cache.getOrSet(['org-profile', orgId], () => db.loadOrg(orgId), { ttl: TTL.MEDIUM, tenantScoped: true });

// wrap a loader into a memoized fn:
const getOrg = cache.wrap(loadOrg, { ttl: TTL.MEDIUM, keyFn: (id) => ['org', id] });

// invalidate after a write:
await cache.invalidatePrefix(['org', orgId]);
```

## TTL profiles (seconds)
`REALTIME 5 · FX 30 · SHORT 30 · DEFAULT 60 · MEDIUM 300 · SESSION 1800 · LONG 3600 · DAY 86400`

## API
| Member | Purpose |
|---|---|
| `createCache({namespace, defaultTtl, tenantScoped, redis, client})` | build a cache |
| `getOrSet(parts, loader, {ttl, tenant, tenantScoped})` | read-through + single-flight + fail-open |
| `get / set / del (parts, …)` | direct ops (JSON, TTL) |
| `wrap(loader, {ttl, keyFn})` | memoize a function |
| `invalidatePrefix(parts)` | SCAN+DEL a key family |
| `ttlOf(parts)` · `ping()` · `close()` | introspection / lifecycle |
| `stats` | `{ hits, misses, errors }` |

## Notes
- `null` **is** cached (cache-penetration protection); only `undefined` is never cached.
- Single-flight is **in-process**; for cross-process stampede control add a distributed lock (future).
- Sessions: `session-service` already uses Redis directly; it can adopt this with `namespace:'session'`, `TTL.SESSION`.
