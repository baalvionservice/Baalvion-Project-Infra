# @baalvion/sdk — Baalvion Platform SDK v1

The **single, standard way** every Baalvion service interacts with the platform.
One import, one factory, six cross-cutting concerns wired correct-by-construction:

| # | Concern | Module | Status in v1 |
|---|---------|--------|--------------|
| 1 | Config & secret resolution (CMS hub) | `config-resolver` | **NEW** — the gap |
| 2 | Service-to-service auth + signing | `internal-auth` | **NEW** — standardizes ad-hoc `x-internal-secret` |
| 3 | Resilient inter-service HTTP | `http-client` | **NEW** — retry / timeout / circuit breaker |
| 4 | Event bus (one canonical schema) | `event-bus` | facade over `@baalvion/events` |
| 5 | Structured logging | `logger` | facade over `@baalvion/logger` (pino + redaction) |
| 6 | End-to-end trace context | `trace-context` | **NEW** glue over `@baalvion/telemetry` |

> **Design rule:** the SDK **composes** the existing `@baalvion/*` packages; it does
> not reinvent them. Services depend **only** on `@baalvion/sdk` — never on the
> pieces directly. If something conflicts, the SDK wins.

## Why this package exists

The foundation already existed — `@baalvion/service-kit`, `config`, `events`,
`logger`, `telemetry`, `rbac` — but was **adopted by ~0 services**. Every service
rolls its own `config/appConfig.js`, its own logging, its own internal-auth.
*That* is the fragmentation. The SDK exists to make adoption a one-liner and to
fill the three concerns that genuinely had no home: **CMS-hub config resolution,
service-to-service auth, and a resilient HTTP client.**

## Architecture

```
                         ┌──────────────────────────────────────────┐
   service code  ───────▶│              @baalvion/sdk                │
                         │  createSdk() / createPlatformService()    │
                         ├──────────────┬───────────────┬───────────┤
                         │ config-      │ internal-auth │ http-      │   (NEW)
                         │ resolver     │               │ client     │
                         ├──────────────┴───────────────┴───────────┤
                         │ trace-context (AsyncLocalStorage)         │   (NEW glue)
                         ├──────────────┬───────────────┬───────────┤
   composes existing  ─▶ │ event-bus    │ logger        │ telemetry  │
                         │ (@b/events)  │ (@b/logger)   │ (@b/telem.)│
                         └──────┬───────┴───────────────┴───────────┘
                                │ x-internal-secret
                                ▼
              cms-service  GET /api/v1/internal/integrations/:slug
              (Integrations & Keys hub = the ONLY source of truth for secrets)
```

One `traceId` + `tenantId` is bound per request (trace-context) and flows
automatically into **logs**, **outbound HTTP headers**, and **emitted events**.

## Canonical event envelope

```ts
interface SdkEvent<T> {
  eventType: string;     // → PlatformEvent.type
  tenantId:  string|null;// → PlatformEvent.orgId
  timestamp: string;
  traceId:   string;
  payload:   T;
}
```
Maps onto `@baalvion/types` `PlatformEvent`, so the SDK interoperates with the
existing bus. New event types should be added to the `EventType` union in
`@baalvion/types` for first-class typing.

## Example usage in a service (payments-service)

```ts
import { createPlatformService } from '@baalvion/sdk';

const svc = await createPlatformService({
  service: 'payments-service',
  version: '1.0.0',
  port: 3014,
  jwksUrl: process.env.JWKS_URL,                    // central identity (RS256)
  cms: {
    baseUrl: process.env.CMS_BASE_URL!,             // http://cms-service:3018/api/v1
    internalSecret: process.env.INTERNAL_SERVICE_SECRET!,
  },
  internalAuth: { secret: process.env.INTERNAL_SERVICE_SECRET!, scheme: 'hmac' },
  eventBus: { transport: 'nats', nats: { servers: process.env.NATS_URL } },
  http: { defaultTimeoutMs: 8000, defaultRetries: 2 },
});

const { app, sdk } = svc;

// Charge using the tenant's OWN keys from the CMS hub — no hardcoded env per site.
app.post('/v1/charge', async (req, res) => {
  const tenant = sdk.forTenant(req.trace.tenantId);          // tenant-scoped view

  const pay = await tenant.getPaymentProvider();             // razorpay | stripe | payu
  if (!pay) return res.status(409).json({ error: 'no payment provider configured' });

  // pay.secrets.keySecret / pay.config.mode resolved live from the console.
  const charge = await chargeWithProvider(pay, req.body);

  // Signed + traced internal call to the ledger.
  await sdk.http.post('http://ledger-service:3014/v1/entries', charge.ledgerEntry, {
    internal: true,
  });

  // One canonical event → analytics + notifications subscribe to it.
  await tenant.events.publish('billing.payment.succeeded', {
    chargeId: charge.id, amount: charge.amount, provider: pay.provider,
  });

  sdk.logger.info({ chargeId: charge.id }, 'charge captured');  // auto traceId+tenant
  res.json({ ok: true, chargeId: charge.id });
});

await svc.listen();
```

Everything above is **traceable end-to-end**, uses the **CMS hub as the only
secret source**, emits **one event schema**, and contains **zero duplicated
integration logic**.

## Public API

- `createSdk(config): Promise<PlatformSdk>` — the SDK handle.
- `createPlatformService(config): Promise<PlatformService>` — golden path (service-kit + SDK).
- `sdk.config` — `ConfigResolver` (CMS hub + cache).
- `sdk.internalAuth` — sign/verify service-to-service + `requireRole()`.
- `sdk.http` — `HttpClient` (retry/timeout/circuit-breaker, auto trace + internal headers).
- `sdk.events` — `SdkEventBus` (canonical envelope).
- `sdk.logger` — `SdkLogger` (trace-stamped).
- `sdk.trace` — `TraceProvider` (AsyncLocalStorage + middleware).
- `sdk.forTenant(slug)` — tenant-scoped convenience view.

See `src/types.ts` for the complete interface surface.

## Adoption (Step 2 — not done in v1)

Each service migrates by: install `@baalvion/sdk`, replace `appConfig.js`/manual
logging/manual internal calls with the SDK, route all secret reads through
`sdk.forTenant(slug).getSecret(...)`, emit via `sdk.events`. No service may
bypass the SDK once migrated.

## Known governance items (resolve during rollout)

- **Tenant identity:** CMS keys by website **slug**; events/`orgId` use **uuid**.
  The platform must standardize one tenant identifier (slug↔orgId map) — the SDK
  exposes `tenantId` as the seam.
- **EventType union** is closed in `@baalvion/types`; extend it as new domains emit.
- **Cache invalidation:** wire an `integration.updated` event from cms-service to
  `sdk.config.invalidate(slug)` so key changes propagate instantly.

## Build

```bash
pnpm --filter @baalvion/sdk build      # tsup → dist (cjs + esm + d.ts)
pnpm --filter @baalvion/sdk type-check
```
