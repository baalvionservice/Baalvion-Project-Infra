# product-registry-service

GTOS canonical product master for the **trade** bounded context: SKU/GTIN identity,
HS classification, and HS-code → document-requirement lookups. Multi-tenant with
PostgreSQL row-level security (RLS); RS256-only authentication via `@baalvion/auth-node`.

## Overview

- **Runtime:** Node.js (CommonJS), Express 5, Sequelize 6 on PostgreSQL.
- **Auth:** RS256 bearer (verified against the issuer JWKS) **or** HMAC-signed
  auth-gateway BFF identity headers. No HS256 path.
- **Tenancy:** every read/write runs inside a Sequelize transaction so the
  `app.current_tenant` / `app.tenant_bypass` GUCs are set and RLS scopes every row.
- **Events:** emits `gtos.product.upserted.v1` / `gtos.product.retired.v1` via
  `@baalvion/sdk`; an event consumer is wired for future external product feeds.

## HTTP surface

Routes are mounted under both `/v1` and `/api/v1`. All `/products` and `/hs`
routes require a resolved tenant context.

| Method | Path                          | Description                                  |
| ------ | ----------------------------- | -------------------------------------------- |
| GET    | `/`                           | Service + version banner                     |
| GET    | `/health`                     | Liveness + metadata                          |
| GET    | `/health/live`                | Liveness probe                               |
| GET    | `/health/ready`               | Readiness probe (checks DB connectivity)     |
| GET    | `/v1/products`                | List products (paginated; `page`, `limit` capped at 100; optional `hsCode`, `status`, `q` filters) |
| POST   | `/v1/products`                | Create a product                             |
| GET    | `/v1/products/:id`            | Fetch a product by id                        |
| PATCH  | `/v1/products/:id`            | Update a product                             |
| POST   | `/v1/products/:id/retire`     | Retire a product                             |
| GET    | `/v1/hs/:hsCode/requirements` | HS-code document requirements (optional `dest`) |

## Required environment variables

See [`.env.example`](./.env.example) for the full list with defaults. Key vars:

| Variable                                   | Purpose                                              |
| ------------------------------------------ | --------------------------------------------------- |
| `PORT`                                     | HTTP listen port (default `3048`)                   |
| `DB_HOST` / `DB_PORT` / `DB_NAME`          | PostgreSQL connection                               |
| `DB_USER` / `DB_PASSWORD`                  | Application role (subject to RLS)                   |
| `DB_SCHEMA`                                | Owned schema (default `product`)                    |
| `MIGRATION_DB_USER` / `MIGRATION_DB_PASSWORD` | Privileged owner role used **only** for migrations |
| `JWKS_URI`                                 | Issuer JWKS endpoint for RS256 verification         |
| `JWT_ISSUER` / `JWT_AUDIENCE`              | Expected token issuer / audience                    |
| `GATEWAY_SIGNING_SECRET`                   | HMAC secret for auth-gateway BFF identity headers   |
| `INTERNAL_SERVICE_SECRET`                  | Shared secret for internal/CMS calls via the SDK    |
| `EVENT_TRANSPORT` / `EVENT_STREAM` / `EVENT_CONSUMER_GROUP` | Event bus wiring                  |
| `CORS_ORIGINS`                             | Comma-separated allowed origins                     |
| `RATE_LIMIT_IP_MAX`                        | Per-IP requests / minute (default `120`)            |
| `LOG_LEVEL`                                | Log level (default `info`)                          |

## Run

```bash
cp .env.example .env        # then fill in secrets
pnpm install                # from the monorepo root
pnpm --filter product-registry-service start   # or: node index.js
pnpm --filter product-registry-service dev     # watch mode (nodemon)
```

## Migrate

Migrations are plain SQL in `migrations/` and run as the privileged owner role
(`MIGRATION_DB_USER`), not the RLS-scoped app role.

```bash
pnpm --filter product-registry-service migrate          # apply pending
pnpm --filter product-registry-service migrate:status   # show applied vs pending
```

In non-production with `BOOTSTRAP_MIGRATIONS!=false`, pending migrations are also
applied automatically on boot.

## Test

Unit tests use the built-in `node:test` runner (no external test dependency) and
cover pure validation/helper logic — no database or network required.

```bash
pnpm --filter product-registry-service test   # node --test
```
