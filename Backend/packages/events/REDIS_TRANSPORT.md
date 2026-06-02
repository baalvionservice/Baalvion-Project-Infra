# Redis Streams transport (`sdk.events` real delivery)

`@baalvion/events` ships a **Redis Streams** transport so `sdk.events` performs real
delivery onto the platform's live event backbone — the stream **`baalvion:events`**
already consumed by `notification-service` and `audit-service` (XREADGROUP).

## No SDK API change

The `@baalvion/sdk` public API is unchanged. The SDK passes only `{ transport }`
to `createEventBus`; the redis transport self-configures from `REDIS_*` env. A
service switches on real delivery with one env var:

```
EVENT_TRANSPORT=redis
REDIS_HOST=localhost
REDIS_PORT=6379
# REDIS_PASSWORD=...
```

`sdk.events.publish(eventType, payload)` and `sdk.events.subscribe(pattern, durable, handler)`
keep working exactly as before. Startup logs report the active transport:
`redis-streams transport ACTIVE (baalvion:events)`. In `NODE_ENV=production` the
service **fails fast** if `EVENT_TRANSPORT=redis` but Redis is unavailable.

## Wire format (compatible with existing consumers)

Each event is `XADD baalvion:events MAXLEN ~ 100000 *` with fields:

| field | meaning |
|---|---|
| `_type` | event type (read by notification + audit) |
| `_payload` | JSON of the domain payload (read by notification + audit) |
| `_correlationId` | `traceId` (read by audit; correlation) |
| `_orgId` | tenant (website slug) — audit tenant fallback |
| `_userId`, `_eventId`, `_timestamp`, `_source` | metadata |
| `_event` | full `PlatformEvent` JSON → SDK subscribers reconstruct it exactly |

Legacy consumers read `_type`/`_payload`/`_correlationId` and ignore the rest, so
they work **unchanged**. The full `PlatformEvent` (traceId + tenantId) round-trips
via `_event`.

## Subscribe semantics

`subscribe(pattern, durable, handler)` creates a consumer group `durable`, reclaims
unacked PEL entries on start (`XAUTOCLAIM`, survives pod restarts), and filters by
NATS-style pattern (`cms.>`, `payment.*`, exact, or `>`). **One durable group per
pattern** — reusing a group name with a different pattern throws (a shared group
would ACK the other pattern's messages). Non-matching messages are ACKed (debug-logged).

## Install note

`ioredis` is an **optional peer** of `@baalvion/events`. A normal `pnpm install`
makes it resolvable; in this workspace it is also linked via junction
(`packages/events/node_modules/ioredis`) since the full install is deferred.
`nats`/`kafka` transports remain available for the domain-bus / telemetry split.
