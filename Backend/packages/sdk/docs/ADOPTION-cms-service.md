# SDK Adoption — Reference Implementation: `cms-service`

> Step 2 of the platform standardization. cms-service is the **reference adoption**:
> every other service follows this playbook. It is migrated **strangler-style** —
> one concern per commit, behaviour-preserving, verified after each step. No
> big-bang rewrite.

## Why cms-service first

1. **It owns the keys hub** the SDK's `config-resolver` calls
   (`GET /api/v1/internal/integrations/:slug`). Adopting it standardizes the hub's
   own ad-hoc `internalAuth.js` into `sdk.internalAuth` and proves the loop.
2. It's already on `@baalvion/auth-node` (canonical RS256), so auth is a no-op.
3. It emits **zero** events today — a clean canvas to introduce the event bus.

## Current → target mapping

| Concern | cms-service today | SDK target | Phase |
|---|---|---|---|
| Bootstrap | manual Express in `index.js` | keep, attach SDK (Phase A); converge to `createPlatformService()` later | A / F |
| Env config | `config/appConfig.js` (dotenv) | unchanged (SDK doesn't mandate env config; `@baalvion/config` optional later) | — |
| Tenant secrets | **IS the source** (`integrationService`) | N/A as consumer — reads its own DB; SDK resolver points *here* | — |
| User JWT auth | `@baalvion/auth-node` ✅ | unchanged | — |
| **Internal auth** | `middleware/internalAuth.js` (ad-hoc `x-internal-secret`) | **replace** → `sdk.internalAuth.verifyMiddleware()` | C |
| **Logging** | `console.*` | **replace** → `sdk.logger` (structured, trace-stamped, redacted) | B |
| **Events** | none | **add** → `sdk.events.publish(...)` on domain changes | E |
| **Outbound HTTP** | raw `fetch()` | **replace** → `sdk.http` (retry/timeout/breaker, traced+signed) | D |
| Trace/correlation | custom `requestContext` middleware | `sdk.trace.middleware()` (reconcile/replace) | A |
| Telemetry, health, shutdown | none / partial | gained via `createPlatformService()` | F |

## Prerequisites (gate — do before any phase)

- **P0 — SDK builds green:** `pnpm install` (run `pm2 delete all` first to avoid the argon2 EPERM, then restart the stack) → `pnpm --filter @baalvion/sdk build` produces `dist/`.
- **P0 — Add dependency:** `"@baalvion/sdk": "workspace:*"` in cms-service `package.json`.
- **Env:** `INTERNAL_SERVICE_SECRET`, `CMS_SECRETS_KEY` (already used), event transport starts `noop` (NATS later). `CMS_BASE_URL=http://localhost:3018/api/v1`.
- **CJS interop check:** cms-service is CommonJS (`require`). The SDK ships dual cjs/esm (`main: dist/index.js` = CJS); `uuid` is bundled (not external) so `require('@baalvion/sdk')` works, and the `@baalvion/*` packages load via runtime `await import()`. Verify `node -e "require('@baalvion/sdk')"` in Phase A.

## Phased migration (each phase = one reviewable, revertible commit)

### Phase A — Introduce the SDK (additive; zero removals)
- In `index.js start()`: build the SDK and attach it.
  ```js
  const { createSdk } = require('@baalvion/sdk');
  const sdk = await createSdk({
    service: 'cms-service',
    cms: { baseUrl: process.env.CMS_BASE_URL, internalSecret: process.env.INTERNAL_SERVICE_SECRET },
    internalAuth: { secret: process.env.INTERNAL_SERVICE_SECRET },
    eventBus: { transport: process.env.EVENT_TRANSPORT || 'noop' },
  });
  app.locals.sdk = sdk;
  app.use(sdk.trace.middleware());   // before /api/v1
  ```
- **Verify:** service boots, `/api/v1/health` 200, every existing endpoint unchanged, logs show a `traceId`.
- **Rollback:** delete the 4 lines.

### Phase B — Logging → `sdk.logger`
- Replace `console.*` in `index.js`, `middleware/errorMiddleware.js`, `service/auditService.js`, `service/cacheService.js` with `app.locals.sdk.logger` (or a module logger from the SDK). Pass error objects, not strings.
- **Verify:** structured JSON logs, secrets redacted, `traceId`+`tenantId` present; error paths still return the same envelope.

### Phase C — Internal auth → `sdk.internalAuth`
- In `routes/v1.js`, swap `internalAuth` (the local middleware) on the resolver route for `req.app.locals.sdk.internalAuth.verifyMiddleware()`. Keep `middleware/internalAuth.js` one release as fallback, then delete.
- **Verify:** `GET /internal/integrations/:slug` still 200 with `x-internal-secret`, **401 without** (already covered by the live test from the keys-hub turn).

### Phase D — Outbound HTTP → `sdk.http`
- Replace the raw `fetch()` in `integrationService.test()` (and any future media/notification calls) with `sdk.http.get(url, { internal: true })` — gains timeout, retry, breaker, trace propagation.
- **Verify:** the integration "Test connection" button behaves identically (honest up/down result).

### Phase E — Emit domain events → `sdk.events`
Introduce the cms-service event catalog (publish via `sdk.events.publish(eventType, payload)`; `tenantId`/`traceId` auto-filled):

| Event | Emitted from | Payload | Consumers |
|---|---|---|---|
| `cms.content.published` | `workflowService.transition` (→published) | `{ websiteSlug, contentId, slug, contentType }` | analytics, notifications, cache-bust |
| `cms.content.unpublished` | same (→draft/archived) | `{ websiteSlug, contentId, slug }` | analytics, cache-bust |
| `cms.integration.updated` | `integrationService.upsert`/`remove` | `{ websiteSlug, provider, category, status }` | **SDK `config.invalidate(slug)`** in every consumer |
| `cms.member.invited` | `websiteService.addMember` | `{ websiteSlug, userId, role, invitedBy }` | notifications, audit |

- Add these to the `EventType` union in `@baalvion/types` for first-class typing (or emit as strings initially).
- **Verify:** with `noop` transport the events log; with NATS up, a test subscriber receives them. **`cms.integration.updated` closes the key-propagation loop** — the moment you save a key in the console, consumers bust their cache.

### Phase F — Converge bootstrap → `createPlatformService()` (last, optional, flagged)
- Replace the manual app construction with `createPlatformService()` to gain OpenTelemetry, `/healthz`+`/readyz`+`/metrics`, graceful shutdown. Re-layer cms-specific middleware (helmet, cors, `/uploads` static, cookie-parser, rate-limit) on the returned `app`. Keep BullMQ workers.
- **Highest blast radius → do last, behind `USE_SERVICE_KIT=1`, with the manual path retained for one release.**

## Acceptance criteria (definition of done) — STATUS 2026-06-01

The runtime adoption was done **CommonJS-native** (the live service is `node index.js`),
via a new `platform/` layer (`sdk.js` / `logger.js` / `events.js` / `trace.js` /
`bootstrap.js`) wired into `index.js`. The TS `src/` layer is retained as the
annotated **Phase-F** full-TypeScript build seed (not the runtime). Verified by
syntax check, a headless platform smoke, and a live boot on an alternate port
(health, trace propagation, resolver 401-without / 200-with-secret returning real
decrypted keys), plus a 4-perspective adversarial review whose findings were fixed.

- [x] No `console.*` in request-path/production code; logs structured with `traceId`(+`tenantId` when bound). *(The only `console` left is the logger's own pre-init/script fallback shim and CLI `scripts/`.)*
- [x] Resolver guarded by `sdk.internalAuth`. *Implementation note:* `middleware/internalAuth.js` is **kept** as a thin adapter that delegates verification to `sdk.internalAuth.verify` (timing-safe) but maps failure to the cms `AppError` envelope — so the 401 wire shape is byte-identical (deleting it would have changed the JSON). Pre-init fallback also uses `crypto.timingSafeEqual`.
- [x] Outbound calls go through `sdk.http` (`integrationService.test()`), `internal:false`/`trace:false` to third-party hosts.
- [x] **5** domain events emitted via `sdk.events`: `cms.content.published` (workflow + scheduler), `cms.content.unpublished`, `cms.integration.updated`, `cms.integration.removed`, `cms.member.invited`. `cms.integration.*` is the key-propagation loop for consumer `config.invalidate(slug)`.
- [x] **Zero external API / behaviour change** — resolver + error envelopes byte-identical; events are post-commit fire-and-forget (no added latency / failure modes).
- [x] Service boots and serves on :3018 (verified on :3998). `type-check` + `build:ts` of the Phase-F seed are **deferred to the formal `pnpm install`** (the SDK is currently linked via a workspace junction; full devDep install was intentionally not run to avoid disturbing the live stack).

> The `cms.integration.*` consumer wiring (`config.invalidate`) lands in each
> consuming service during its own adoption (payments-service next). NATS transport
> replaces `noop` when provisioned — events log today, deliver then; no code change.

## Risk & rollback
- Each phase is an independent commit → revert in isolation.
- Phases A–E are additive/surgical (low risk). Phase F is structural (gated + retained fallback).
- `noop` event transport until NATS is provisioned: events are logged, not delivered — safe to ship.

## Sequencing
`A → B → C → D → E` (mostly independent after A); **F last**. Estimated ~1 focused pass per phase. After cms-service is green, payments-service follows the same playbook (and *consumes* the resolver for its Razorpay/Stripe keys — the first real cross-service proof).
