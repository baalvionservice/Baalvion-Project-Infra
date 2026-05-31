# developer-service

The **Developer Platform** — the packaged, platform-wide home for everything an
API consumer needs: **API keys**, **webhooks** (signed delivery + retries), an
**OpenAPI spec catalog**, and a **test-mode sandbox**. Generalizes the per-tenant
API-key/webhook bits that lived inside `proxy-service` (Cluster 9, *Developer
Platform*).

- **Port:** `3042` · **Schema:** `developer` · **Domain:** infrastructure
- **Auth:** verify-only RS256/JWKS via `@baalvion/auth-node` (HS256 dev fallback). No second issuer.

## Capabilities

### API keys
Issue `bk_live_…` / `bk_test_…` keys (test = sandbox mode). The full key is shown
**once**; only its SHA-256 hash + prefix/last4 are stored. Rotate, revoke, scope.
The gateway calls `POST /v1/keys/verify` (internal-key only) on the hot path:
prefix lookup → constant-time hash compare → scope/expiry gate.

### Webhooks
Org-scoped endpoints subscribe to event types (`*`, exact, or `prefix.*`).
`dispatch()` fans an event out as queued deliveries; the worker signs each with a
**Stripe-style** header and POSTs it, retrying with exponential backoff up to
`WEBHOOK_MAX_ATTEMPTS`:

```
X-Baalvion-Signature: t=<unix>,v1=<hex HMAC-SHA256(secret, `${t}.${body}`)>
```

An **event-bus consumer** bridges every `baalvion:events` domain event to
subscribed webhooks automatically — services don't integrate webhooks directly.

### OpenAPI catalog
Services register their OpenAPI docs; the portal lists them and serves public
specs raw at `GET /v1/public/specs/:service` (no auth) for a docs site.

### Sandbox
`ALL /v1/sandbox/echo` + `bk_test_` keys let a developer validate signing/keys
end-to-end without touching live data.

## API (`/v1`)

| Area | Routes |
|---|---|
| Keys | `POST /keys`, `GET /keys`, `GET /keys/:id`, `POST /keys/:id/rotate`, `POST /keys/:id/revoke`, `PATCH /keys/:id/scopes`, `POST /keys/verify` *(internal)* |
| Webhooks | `POST/GET /webhooks`, `GET/PATCH/DELETE /webhooks/:id`, `POST /webhooks/:id/roll-secret`, `POST /webhooks/:id/test`, `GET /webhooks/:id/deliveries` |
| Deliveries | `GET /deliveries`, `POST /deliveries/:id/redeliver` |
| Events | `POST /events/dispatch` *(service-to-service)*, `GET/POST /event-types` |
| Specs | `POST/GET /specs`, `GET/DELETE /specs/:service`, `GET /public/specs[/:service]` *(no auth)* |
| Sandbox | `ALL /sandbox/echo` |

## Run locally

```bash
node index.js               # :3042 against Postgres 5432 / Redis 6379
node scripts/smoke.mjs      # keys + signed webhook delivery + catalog + sandbox
```
