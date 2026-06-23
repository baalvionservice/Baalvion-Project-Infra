# supplier-lifecycle-service

GTOS supplier lifecycle service: onboarding, qualification, risk scoring,
scorecards, and offboarding. Part of the `trade` bounded context.

Express 5 + Sequelize over PostgreSQL, with tenant Row-Level Security (RLS),
RS256/gateway authentication, and a pure lifecycle state machine.

## Overview

Suppliers move through a fixed lifecycle managed by a pure state machine
(`services/lifecycle.js`):

```
prospect → onboarding → qualified → active → suspended ⇄ active
                                          ↘ offboarded
any non-terminal stage → blacklisted (terminal)
```

`offboarded` and `blacklisted` are terminal. Illegal transitions are rejected
with `409 CONFLICT`. Every read and write runs inside a tenant transaction so
the RLS GUC is set for the request's org.

## Surface

Mounted at both `/v1` and `/api/v1`. All routes require authentication
(gateway-signed identity or RS256 bearer) and a resolved tenant.

| Method | Path                          | Notes                                   |
| ------ | ----------------------------- | --------------------------------------- |
| GET    | `/suppliers`                  | List; filters `stage`, `country`, `q`; paginated (`page`, `limit`) |
| POST   | `/suppliers`                  | Idempotent create (org_id, legal_name, country) |
| GET    | `/suppliers/:id`              | Single supplier with docs + scorecards  |
| POST   | `/suppliers/:id/transition`   | Stage transition (`toStage`, `reason`)  |
| POST   | `/suppliers/:id/docs`         | Add qualification doc                    |
| GET    | `/suppliers/:id/scorecard`    | Scorecards (optional `period`)           |
| POST   | `/suppliers/:id/blacklist`    | Blacklist (role: super_admin/admin/compliance_officer) |

Health/ops (unauthenticated): `GET /`, `GET /health`, `GET /health/live`,
`GET /health/ready`.

## Required environment

See `.env.example` for the full list. Key variables:

| Variable                  | Purpose                                   | Default                |
| ------------------------- | ----------------------------------------- | ---------------------- |
| `PORT`                    | HTTP port                                 | `3051`                 |
| `DB_HOST` / `DB_PORT`     | PostgreSQL host / port                    | `localhost` / `5432`   |
| `DB_NAME`                 | Database name                             | `baalvion_db`          |
| `DB_USER` / `DB_PASSWORD` | App role (subject to RLS)                 | `baalvion_app` / —     |
| `DB_SCHEMA`               | Owned schema                              | `supplier`             |
| `MIGRATION_DB_USER` / `MIGRATION_DB_PASSWORD` | Privileged owner role for migrations/DDL | falls back to `DB_USER` |
| `JWKS_URI`                | Issuer JWKS for RS256 verification        | `http://localhost:3001/.well-known/jwks.json` |
| `JWT_ISSUER` / `JWT_AUDIENCE` | Expected token issuer / audience      | —                      |
| `GATEWAY_SIGNING_SECRET`  | HMAC secret for gateway-signed identity   | —                      |
| `CORS_ORIGINS`            | Comma-separated allowed origins           | `http://localhost:3000`|
| `RATE_LIMIT_IP_MAX`       | Per-IP requests/min                       | `120`                  |
| `EVENT_TRANSPORT` / `EVENT_STREAM` / `EVENT_CONSUMER_GROUP` | Event bus config | `redis` / `baalvion:events` / `supplier-lifecycle-service` |
| `BOOTSTRAP_MIGRATIONS`    | Auto-run migrations on boot (non-prod)    | `true`                 |
| `EVENT_CONSUMER`          | Start the event consumer worker           | `true`                 |

Authentication is centralized RS256 via `@baalvion/auth-node`. Never hand-roll
JWT verification or introduce a second issuer.

## Run

```bash
cp .env.example .env        # then fill in DB + auth secrets
pnpm install                # from the repo root (workspace)
pnpm --filter supplier-lifecycle-service start   # or: node index.js
pnpm --filter supplier-lifecycle-service dev     # nodemon
```

## Migrate

Migrations live in `migrations/` and run as the privileged owner role so table
ownership and RLS DDL are correct.

```bash
node migrate.js             # apply pending migrations
node migrate.js status      # show applied vs. pending
```

In non-production, migrations also run automatically on boot unless
`BOOTSTRAP_MIGRATIONS=false`.

## Test

```bash
node --test                 # runs the node:test suites in this package
```

The lifecycle state machine in `services/lifecycle.js` is pure (no I/O) and is
covered by `services/lifecycle.test.js`, which runs without a live database or
network.
