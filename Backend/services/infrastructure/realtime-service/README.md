# realtime-service

WebSocket (Socket.IO) gateway for the Baalvion platform. Fans platform events out
to connected clients in real time, tracks per-org presence, and replays missed
events on reconnect. Authentication is centralized: every connection is verified
against the canonical RS256 JWKS authority (`@baalvion/auth-node`).

## Surface

### WebSocket namespaces (Socket.IO)

Each namespace is JWT-gated and role-restricted (see `config/appConfig.js`
`namespaceRoles`):

| Namespace    | Allowed roles                                         |
| ------------ | ----------------------------------------------------- |
| `/dashboard` | member, admin, super_admin, org_admin                 |
| `/ir`        | member, admin, super_admin, org_admin, investor       |
| `/jobs`      | member, admin, super_admin, org_admin, recruiter      |
| `/admin`     | admin, super_admin                                    |
| `/ctm`       | member, admin, super_admin, org_admin, trader         |

Connections join `user:<id>`, `org:<orgId>`, and (for admins) `admin:global`
rooms. Explicit `join:room` requests are guarded so a socket can only join rooms
that belong to its own org.

The token is read from `handshake.auth.token`, the `auth`/`token` query params,
or the `Authorization: Bearer` header.

### HTTP routes

| Method | Path       | Notes                                                                 |
| ------ | ---------- | --------------------------------------------------------------------- |
| GET    | `/health`  | Public liveness probe (used by the Docker healthcheck).               |
| GET    | `/metrics` | Internal only — gated to private/loopback IPs or `INTERNAL_SERVICE_SECRET` bearer. Exposes presence + socket topology. |

### Event publishing

Other services publish events for fan-out by `PUBLISH`ing JSON to the Redis
channel `baalvion:events`:

```js
redis.publish('baalvion:events', JSON.stringify({
  namespace: '/dashboard',
  room:      `org:${orgId}`,
  type:      'kpi_update',
  data:      payload,
}));
```

The legacy channel `baalvion:events:pubsub` is also subscribed for backward
compatibility.

## Required environment variables

See `.env.example` for the full list. Key variables:

| Variable                  | Purpose                                                        |
| ------------------------- | -------------------------------------------------------------- |
| `PORT` / `REALTIME_PORT`  | HTTP + WebSocket listen port (default `3040`).                 |
| `REDIS_URL` or `REDIS_HOST`/`REDIS_PORT`/`REDIS_PASSWORD` | Redis for pub/sub fan-out and the reconnect replay buffer.     |
| `JWKS_URI`                | Auth-service JWKS endpoint (RS256 verification).               |
| `JWT_ISSUER` / `JWT_AUDIENCE` | Expected token issuer/audience.                            |
| `JWT_PUBLIC_KEY` / `JWT_PUBLIC_KEY_B64` | Static RSA public-key fallback when JWKS is unreachable. |
| `ALLOWED_ORIGINS`         | Comma-separated CORS allow-list.                              |
| `INTERNAL_SERVICE_SECRET` | Optional bearer secret admitting non-loopback `/metrics` scrapers. |
| `JWT_BYPASS_AUTH`         | Dev only — accepts all connections unverified. Forced off in production. |
| `*_SERVICE_URL`, `*_INTERVAL` | Downstream health-poll targets and push cadences.         |

## Run

```bash
pnpm install            # from the monorepo root
node index.js           # or: pnpm --filter baalvion-realtime-service start
pnpm --filter baalvion-realtime-service dev   # nodemon watch mode
```

Redis is optional at boot — if it is unavailable the gateway still serves
WebSocket traffic, but cross-instance fan-out and replay are disabled until Redis
reconnects.

## Migrate

This service is stateless (no database / no migrations). All durable state lives
in Redis as ephemeral replay buffers (`realtime:replay:<userId>`, 5-minute TTL).

## Test

```bash
node --test
```

Tests use the built-in `node:test` runner (no external test dependency) and cover
pure configuration-derivation logic without requiring a live DB or network.
