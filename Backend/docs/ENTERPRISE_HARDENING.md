# Enterprise Hardening Layer

> Production-readiness reference for the Baalvion platform. Every cross-cutting
> hardening concern maps to a **shared package** so services are correct by
> construction instead of re-implementing (and getting wrong) auth, tenancy,
> rate limiting, logging, and resilience.

This is the consolidation pass. Most primitives already existed; this document
makes the full picture explicit and fills the two real gaps: a
**transport-agnostic resilience layer** (`@baalvion/resilience`) and a
**tenant-isolation audit** guardrail.

## At a glance — concern → implementation

| Hardening concern | Implementation | Status |
| --- | --- | --- |
| RBAC enforcement | `@baalvion/rbac` — `requireRole`, `requirePermission`, role hierarchy | existing |
| Tenant isolation | `@baalvion/tenancy` — Postgres RLS + GUC + `tenantMiddleware` | existing |
| Tenant isolation **audit** | `Backend/scripts/tenant-isolation-audit.mjs` | **new** |
| Rate limiting (edge) | `@baalvion/security` — in-memory fixed window | existing |
| Rate limiting (distributed) | `@baalvion/resilience` — `RateLimiter` (Redis, atomic Lua) | **new** |
| Structured logging | `@baalvion/telemetry` — pino + trace correlation + redaction | existing |
| Observability (metrics/tracing) | `@baalvion/telemetry` — OpenTelemetry + Prometheus | existing |
| Retry + circuit breaker | `@baalvion/resilience` — `withRetry`, `CircuitBreaker`, `Bulkhead` | **new** |
| Queue / event backbone | `@baalvion/events` — NATS JetStream / Kafka / Redis + outbox | existing |
| Error boundary | `@baalvion/errors` — `AppError` + typed factories + handler | existing |
| Golden-path wiring | `@baalvion/service-kit` — `createService()` | existing |
| Graceful shutdown | `@baalvion/graceful-shutdown` | existing |

---

## 1. RBAC enforcement

`@baalvion/rbac` is the single source of truth for authorization. A 7-level role
hierarchy (`viewer → … → super_admin`) plus permission strings, enforced as
Express guards used **after** identity middleware:

```js
const { requireRole, requirePermission } = require('@baalvion/rbac');

router.post('/v1/orgs/:id/members', requireRole('manager'), addMember);
router.delete('/v1/orgs/:id', requirePermission('delete:org'), deleteOrg);
```

`super_admin` and the `*` permission short-circuit to allow; everything else is
checked against the role's default permission set plus any explicitly granted
scopes on the JWT. **Rule:** never check roles ad hoc in a handler — always use a
guard, so authorization is visible at the route table and auditable.

## 2. Tenant isolation + audit

Isolation is enforced at the **database** layer with Postgres Row-Level Security,
not in application code (defense that survives a forgotten `WHERE` clause):

1. Migrations call `enableRlsSql(schema, table)` → `ENABLE` + `FORCE ROW LEVEL
   SECURITY` + a `tenant_isolation` policy.
2. The app connects as a **non-superuser** role (`baalvion_app`) — RLS is ignored
   for superusers.
3. `tenantMiddleware` stamps `app.current_tenant` (a transaction-local GUC) from
   `req.auth`.
4. All DB work runs inside `withTenantTransaction` → every row is filtered by
   tenant automatically. The policy is **fail-closed**: no tenant set ⇒ zero rows.

The failure mode that causes leaks is a **new table that forgets RLS**. The audit
script is the guardrail:

```sh
node Backend/scripts/tenant-isolation-audit.mjs Backend/services
# scans SQL migrations; any table with a tenant_id/org_id column that is missing
# ENABLE / FORCE / policy is reported; exit 1 → wire as a blocking CI check.
```

> Outbox / saga tables that are tenant-stamped but intentionally bypass RLS are
> expected findings — keep them in a reviewed allowlist when adopting the check
> in CI.

## 3. Rate limiting

Two layers, by deployment surface:

- **Edge / single-process** (`@baalvion/security`): per-pod fixed window, ideal
  for Next.js routes and cheap local throttles.
- **Distributed / multi-replica** (`@baalvion/resilience` `RateLimiter`): a
  **shared** Redis counter so the limit is global across all replicas at 10k+
  TPS. Atomic `INCR`+`PEXPIRE` Lua script (no read-modify-write race), standard
  `RateLimit-*` + `Retry-After` headers, and **fail-open** so a Redis blip never
  takes the API down.

```js
const limiter = new RateLimiter({ windowMs: 60_000, max: 1000, redis });
app.use('/v1', limiter.middleware()); // keys by org → user → ip
```

Tier limits live next to the auth context (per-org plan), not hard-coded.

## 4. Structured logging

`@baalvion/telemetry` `createLogger()` returns a pino logger that:

- emits JSON with a stable `service` field,
- **auto-correlates** every line with the active trace (`traceId`/`spanId` via a
  pino mixin), so a log line links straight to its distributed trace,
- **redacts** `password`, `token`, `secret`, `authorization`, cookies — secrets
  never reach the log sink.

`requestLogger` logs one structured line per request (method, status, latency,
requestId, ip). No `console.log` in production paths.

## 5. Observability (metrics + tracing)

OpenTelemetry is initialized **first** (`initTelemetry`) so http/express/pg/redis
are auto-instrumented before app code runs. Exports:

- **Traces** → OTLP (`/v1/traces`).
- **Metrics** → OTLP + a Prometheus scrape endpoint (`/metrics`).
- Standard service metrics (`createServiceMetrics`): request count, request
  duration histogram, DB query duration, error count, active connections.

Wrap risky spans with `withSpan(name, fn)` — it sets span status, records
exceptions, and always ends the span. Resilience state changes
(`CircuitBreaker.onStateChange`) should feed a gauge so trips are visible on the
dashboard.

## 6. Retry + circuit breaker (resilience)

`@baalvion/resilience` (new). See its README for the full API. The composition
order is deliberate:

```
bulkhead → retry → circuitBreaker → timeout → operation
```

- **timeout** bounds each attempt (no unbounded hang holding a pool connection),
- **circuitBreaker** trips after repeated failures so retries fail fast against a
  dead dependency instead of amplifying load,
- **retry** rides out transient blips with exponential backoff + **full jitter**
  (prevents synchronized retry storms),
- **bulkhead** caps total in-flight calls so one slow dependency can't exhaust
  the event loop / connection pool and sink the whole service.

Every vendor adapter (Razorpay, RazorpayX, SWIFT, OpenSanctions, Onfido,
AfterShip) should be wrapped once with `createResilient` at construction.

## 7. Queue system / event backbone

`@baalvion/events` is the durable backbone. One `EventPublisher` interface, three
interchangeable transports (swap with one line — ADR-0002):

| Transport | Role |
| --- | --- |
| **NATS JetStream** | default domain-event bus — low latency, subject wildcards, replay |
| **Kafka / Redpanda** | high-volume telemetry / log stream |
| **Redis Streams** | lightweight local/dev + simple fan-out |

**Delivery guarantees.** Producers use the **transactional outbox**
(`outbox.ts`): the domain row and the event are written in the **same DB
transaction**, then a relay publishes from the outbox. This gives at-least-once
delivery with no dual-write inconsistency (the classic "DB committed but the
event was lost" bug). Consumers must therefore be **idempotent** — key on the
event id / a dedupe table. This pattern is already live in the ledger and
order-execution services (txn-outbox + redrive).

**RabbitMQ-style semantics** (work queues, acks, DLQ, redelivery) are provided by
JetStream consumers with `max_deliver` + a dead-letter subject; a stuck message
lands in the DLQ after N redeliveries for human/redrive handling.

## 8. Error boundary system

`@baalvion/errors` defines `AppError` (`code`, `statusCode`, `details`,
`isOperational`) and typed factories (`Errors.forbidden()`, `Errors.notFound()`,
…). The boundary is a terminal Express error handler that:

1. distinguishes **operational** errors (expected — map to their `statusCode`)
   from **programmer** errors (unexpected — log full context, return a generic
   500, and never leak internals),
2. attaches the `requestId` / `traceId` for support correlation,
3. maps resilience errors transparently (circuit-open → 503, timeout → 504,
   bulkhead-full / rate-limited → 429) because they already carry `statusCode`.

Unhandled rejections / uncaught exceptions are treated as non-operational: log,
flush telemetry, and let the orchestrator restart the (now-suspect) process.

## 9. Test suite

| Layer | Tooling | Where |
| --- | --- | --- |
| Unit | `node --test` (built-in runner — survives the repo-wide jest breakage) | `packages/*/test/*.mjs` |
| Integration | service-level harnesses against a real Postgres/Redis | `services/*/tests/*.verify.*` |
| E2E | Playwright for critical user flows | frontends |

`@baalvion/resilience` ships **28 deterministic unit tests** (`node --test`) with
injectable clock / sleep / random — zero real delay, no flake. Run per package
with `npm test`.

---

## Load handling — 10k+ TPS

Designed as **horizontal-first**; no single component is the throughput ceiling.

1. **Stateless services.** All session/identity state is in the JWT or Redis, so
   any replica can serve any request → scale out behind the load balancer. Target
   ~1–2k TPS per replica × N replicas (autoscaled on CPU + p95 latency).
2. **Connection pooling.** Postgres sits behind **PgBouncer** (transaction
   pooling). App pools are small and bounded; the **bulkhead** caps in-flight DB
   work per service so a query spike can't open unbounded connections.
3. **Read/write split.** Reads served from replicas; writes to primary. Hot reads
   cached in Redis (`@baalvion/cache`) with short TTLs + stale-while-revalidate.
4. **Async over sync.** Anything not needed for the response (notifications,
   indexing, settlement side-effects) is published to the event bus and processed
   off the request path → the synchronous path stays short and predictable.
5. **Shared rate limiting** (§3) sheds abusive load at the edge before it reaches
   business logic; **bulkheads** shed internally to protect dependencies.
6. **Backpressure, not collapse.** At saturation the system returns `429`/`503`
   with `Retry-After` (load shedding) rather than degrading every request — fast
   honest failure beats slow universal failure.

**Capacity math (illustrative):** 10k TPS ÷ ~1.5k TPS/replica ≈ 7 replicas, run 10
for headroom + rolling deploys. PgBouncer fronts ~200 server connections serving
thousands of client connections. Redis (limiter + cache) is the only shared hot
path — cluster it and keep operations O(1).

**Verify before claiming the number:** run a k6/Gatling soak at 1.2× target,
watch p99 latency, error rate, DB pool saturation, and GC pauses. The number is
not real until the soak holds it.

---

## Failure recovery strategy

| Failure | Detection | Recovery |
| --- | --- | --- |
| Dependency down (vendor/DB/redis) | circuit breaker trips; readiness probe fails | fail fast (503), shed load; auto half-open probe restores when healthy |
| Slow dependency | per-attempt timeout | abort the attempt, free the pool slot, retry with backoff |
| Transient blip | retryable error predicate | exponential backoff + full jitter (bounded retries) |
| Lost event / dual-write | outbox relay lag / consumer dedupe | transactional outbox + at-least-once + idempotent consumers + **redrive** |
| Poison message | `max_deliver` exceeded | route to DLQ; alert; manual or scripted redrive |
| Pod crash | k8s liveness probe | restart; in-flight work drained by graceful shutdown; events replay from JetStream |
| Bad deploy | error-rate / latency SLO breach | rolling deploy + automated rollback; DB migrations are backward-compatible (expand/contract) |
| Region / DR | health checks, backups | restore-tested backups (DR drill proven), documented RTO/RPO, failover runbook |

**Principles**

- **Graceful shutdown** (`@baalvion/graceful-shutdown`): on `SIGTERM`, stop
  accepting new work, drain in-flight requests, close the event bus and server —
  no truncated transactions, no lost in-flight events.
- **Idempotency everywhere on the write path.** Every consumer and every
  money-moving operation keys on an idempotency token so a retry / redelivery is
  safe. (Already enforced in ledger + order-execution sagas.)
- **Backward-compatible migrations** (expand → migrate → contract) so a rollback
  never strands the database in an unreadable shape.
- **Restore-tested backups.** A backup that has never been restored is a
  hypothesis, not a recovery plan — the DR drill restores into a throwaway DB and
  diffs row counts.

---

## Adoption checklist (per service)

- [ ] Boots via `@baalvion/service-kit` `createService()` (telemetry, logging,
      health/ready/metrics, identity, graceful shutdown for free).
- [ ] Every route has an explicit `requireRole` / `requirePermission` guard.
- [ ] Every tenant-scoped table passes `tenant-isolation-audit.mjs`.
- [ ] `RateLimiter.middleware()` mounted on public route groups (Redis-backed in
      prod).
- [ ] Every outbound vendor/DB-adjacent call wrapped with `createResilient`.
- [ ] Producers use the transactional outbox; consumers are idempotent.
- [ ] Terminal error handler installed; no raw `throw`/`console.log` on the hot
      path.
- [ ] Unit tests via `node --test`; integration harness green; critical flow has
      an E2E.
