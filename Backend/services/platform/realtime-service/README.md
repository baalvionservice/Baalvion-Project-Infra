# realtime-service

Realtime platform metrics and event fan-out over WebSocket for the Baalvion admin
console. It periodically collects host/infra, service-health, platform and queue
metrics and pushes them — plus a live audit-log event feed — to authenticated
admin clients. It also exposes a REST snapshot and a Prometheus scrape endpoint.

The WebSocket layer is a minimal, dependency-free RFC 6455 implementation
(`wsServer.js`); there is no `ws` package in this workspace.

## Surface

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| `GET` | `/health` | none | Liveness probe; reports connected WS client count. |
| `GET` | `/metrics` | none | Prometheus exposition (gauges for services, infra, stats, queues, WS clients). |
| `GET` | `/api/v1/infrastructure/snapshot` | `super_admin` / `admin` JWT (RS256) | Latest collected snapshot (`{ success, data }`). CORS-restricted to `ADMIN_ORIGIN`. |
| `OPTIONS` | `/api/v1/infrastructure/snapshot` | none | CORS preflight. |
| `WS` | `/?token=<jwt>` | `super_admin` / `admin` JWT (RS256) | Upgrade endpoint. Streams `service_health`, `platform_stats`, `queue_stats`, `infra_metrics`, and `event` messages; replies to `ping` with `pong`. |

Auth tokens are verified with the RS256 public key (`JWT_PUBLIC_KEY` /
`JWT_PUBLIC_KEY_PATH`) issued by the central auth-service. Only `super_admin` and
`admin` roles may read infra telemetry.

## Required / supported environment variables

| Variable | Default | Notes |
| -------- | ------- | ----- |
| `PORT` | `3026` | HTTP + WS listen port. |
| `TICK_MS` | `5000` | Metrics collection interval. |
| `ADMIN_ORIGIN` | `http://localhost:3030` | Comma-separated allow-list of CORS origins. Never falls back to `*`. |
| `JWT_ISSUER` | `baalvion-auth` | Expected token issuer. |
| `JWT_AUDIENCE` | `baalvion-platform` | Expected token audience. |
| `JWT_PUBLIC_KEY` | — | RS256 public key (PEM, `\n`-escaped allowed). |
| `JWT_PUBLIC_KEY_PATH` | — | Path to the RS256 public key file (preferred over inline). |
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` | `localhost` / `5432` / `baalvion_db` / `baalvion` | Postgres connection (read-only telemetry queries against `auth.*`). |
| `DB_PASSWORD` | dev fallback in non-prod only | **Required in production** — the service refuses to boot with the dev fallback when `NODE_ENV=production`. |
| `DB_SSL` / `DB_SSL_CA` / `DB_SSL_CA_PATH` / `DB_SSL_REJECT_UNAUTHORIZED` | TLS on by default in prod | Postgres in-transit TLS (mirrors `@baalvion/auth-node` `buildPgPoolSsl`). |
| `REDIS_HOST` / `REDIS_PORT` | `localhost` / `6379` | Redis (queue discovery, infra metrics, `realtime:events` pub/sub). |
| `COMMERCE_HEALTH_PORT` / `ORDER_HEALTH_PORT` / `INVENTORY_HEALTH_PORT` / `LEDGER_HEALTH_PORT` | `3012` / `3013` / `3016` / `3014` | Override health-probe targets for the commerce vertical. |
| `NODE_ENV` | — | `production` enables the secret guard and TLS-by-default. |

## Run

```bash
# from the repo root (workspace install) or this directory
pnpm install
node index.js        # or: pnpm --filter @baalvion/realtime-service start
```

The service connects to an existing Postgres and Redis; it owns **no schema and
runs no migrations** of its own. It reads from the `auth` schema (`auth.users`,
`auth.sessions`, `auth.audit_logs`, `auth.organizations`) provisioned by the
auth-service. Run the auth-service migrations there — no migration step is
required in this service.

## Tests

```bash
node --test            # runs *.test.js (pure-logic unit tests, no DB/network)
```

`lib.test.js` covers the pure helpers in `lib.js` (secret guard, CORS origin
allow-list, role gate) and runs without a live database or Redis.
