# quality-inspection-service

GTOS quality & inspection domain service: inspection orders, AQL sampling, defects,
CAPA (corrective/preventive action), and certificate issuance.

Part of the Baalvion monorepo (`Backend/services/trade/`). Express 5 + Sequelize on an
isolated PostgreSQL schema (`quality`) with tenant Row-Level Security enforced inside
every transaction via `@baalvion/tenancy`. Authentication is centralized RS256
(`@baalvion/auth-node`) — gateway HMAC identity or RS256 bearer, no second issuer.

## Surface

Routes are mounted under both `/v1` and `/api/v1`. All routes require authentication
(`authMiddleware`) and a resolved tenant context (`requireTenant`).

| Method | Path                          | Description                                  |
| ------ | ----------------------------- | -------------------------------------------- |
| GET    | `/v1/inspections`             | List inspections (paginated; `limit` capped) |
| POST   | `/v1/inspections`             | Schedule an inspection                       |
| GET    | `/v1/inspections/:id`         | Get one inspection (with defects + CAPA)     |
| POST   | `/v1/inspections/:id/start`   | Move `scheduled` → `in_progress`             |
| POST   | `/v1/inspections/:id/result`  | Submit result (`passed`/`failed` + defects)  |
| POST   | `/v1/inspections/:id/capa`    | Open a CAPA against an inspection            |

Operational endpoints (no auth): `GET /`, `GET /health`, `GET /health/live`,
`GET /health/ready`.

Inspection lifecycle: `scheduled → in_progress → passed | failed` (also `cancelled`).

## Required environment variables

See [`.env.example`](./.env.example) for the full list. Key variables:

| Variable                 | Purpose                                           |
| ------------------------ | ------------------------------------------------- |
| `PORT`                   | HTTP port (default `3050`)                        |
| `DB_HOST` / `DB_PORT`    | PostgreSQL host / port                            |
| `DB_NAME`                | Database name                                     |
| `DB_USER` / `DB_PASSWORD`| App role (subject to RLS)                         |
| `DB_SCHEMA`              | Owned schema (default `quality`)                  |
| `MIGRATION_DB_USER` / `MIGRATION_DB_PASSWORD` | Privileged owner role for migrations |
| `JWKS_URI`               | Auth JWKS endpoint for RS256 verification         |
| `JWT_ISSUER` / `JWT_AUDIENCE` | Expected token issuer / audience             |
| `GATEWAY_SIGNING_SECRET` | HMAC secret for gateway BFF identity headers      |
| `INTERNAL_SERVICE_SECRET`| Shared secret for internal service-to-service auth|
| `CMS_BASE_URL`           | CMS base URL (via `@baalvion/sdk`)                |
| `EVENT_TRANSPORT` / `REDIS_URL` | Event bus transport + Redis connection     |
| `CORS_ORIGINS`           | Comma-separated allowed origins                   |
| `RATE_LIMIT_IP_MAX`      | Per-IP requests/minute (default `120`)            |
| `LOG_LEVEL`              | Log level (default `info`)                        |

Never commit real secrets — `.env*` is gitignored and injected at deploy time.

## Run

```bash
pnpm install            # from the repo root (workspace install)
cp .env.example .env    # then fill in DB + auth values

pnpm start              # node index.js
pnpm dev                # nodemon (auto-reload)
```

## Migrate

Migrations are plain SQL in [`migrations/`](./migrations) and run as the privileged
owner role (`MIGRATION_DB_USER`) so table ownership and RLS-enabling DDL are correct.

```bash
pnpm migrate            # apply pending migrations (each in its own transaction)
pnpm migrate:status     # show applied vs pending
node migrate.js down    # revert the most recent (requires a *.down.sql)
```

In non-production, pending migrations are also applied automatically on boot
(`BOOTSTRAP_MIGRATIONS=true`, the default).

## Test

Unit tests use the built-in Node test runner (`node --test`) — no extra runner needed.
Schema/validation tests are pure and run without a database or network.

```bash
pnpm test               # node --test (runs test/**/*.test.js)
```
