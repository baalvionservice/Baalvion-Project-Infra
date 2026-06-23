# fulfillment-service

Baalvion Enterprise **Fulfillment & Shipping** service (commerce bounded context).
Owns shipments, tracking events, shipping zones, shipping rates, and couriers for a
store. Authentication is canonical RS256 via `@baalvion/auth-node`; authorization on
write paths is delegated to the shared `@baalvion/commerce-rbac` Policy Enforcement
Point (RBAC is the single source of truth — this service does not own roles).

- **Port:** `3016` (default; `PORT` overrides)
- **DB schema:** `fulfillment` (isolated PostgreSQL schema)
- **API base path:** `/api/v1`

## Surface

Health / readiness:

| Method | Path       | Description                                  |
| ------ | ---------- | -------------------------------------------- |
| GET    | `/health`  | Liveness probe                               |
| GET    | `/readyz`  | Readiness probe (verifies DB is reachable)   |

Shipments (under `/api/v1/fulfillment/stores/:storeId`):

| Method | Path                                  | Auth / RBAC                              |
| ------ | ------------------------------------- | ---------------------------------------- |
| GET    | `/shipments`                          | `authMiddleware`                         |
| POST   | `/shipments`                          | `authMiddleware` + body validation       |
| GET    | `/shipments/:shipmentId`              | `authMiddleware`                         |
| PATCH  | `/shipments/:shipmentId`              | `fulfillment_manager` (min store role)   |
| POST   | `/shipments/:shipmentId/tracking`     | `fulfillment_manager` (min store role)   |

Shipping zones, rates, and couriers (same `:storeId` prefix):

| Method | Path                              |
| ------ | --------------------------------- |
| GET    | `/zones`                          |
| POST   | `/zones`                          |
| PATCH  | `/zones/:zoneId`                  |
| DELETE | `/zones/:zoneId`                  |
| POST   | `/zones/:zoneId/rates`            |
| PATCH  | `/rates/:rateId`                  |
| DELETE | `/rates/:rateId`                  |
| GET    | `/couriers`                       |
| POST   | `/couriers`                       |
| PATCH  | `/couriers/:courierId`            |

All mutation routes validate request bodies with `zod` schemas
(`validators/fulfillmentSchemas.js`); list routes paginate with a hard page-size cap
of 100 (`utils/pagination.js`). See [RBAC.md](RBAC.md) for the authorization model.

## Required environment variables

Copy `.env.example` to `.env` and fill in values.

| Variable                 | Required | Default                  | Notes                                         |
| ------------------------ | -------- | ------------------------ | --------------------------------------------- |
| `JWT_PUBLIC_KEY`         | yes      | —                        | RS256 public key for token verification       |
| `JWT_ISSUER`             | no       | `baalvion-auth`          |                                               |
| `JWT_AUDIENCE`           | no       | `baalvion-platform`      |                                               |
| `JWKS_URI`               | no       | —                        | Alternative to a static public key            |
| `DB_HOST`                | no       | `localhost`              |                                               |
| `DB_PORT`                | no       | `5432`                   |                                               |
| `DB_NAME`                | no       | `baalvion_db`            |                                               |
| `DB_USER`                | no       | `baalvion`               |                                               |
| `DB_PASSWORD`            | no       | (empty)                  |                                               |
| `REDIS_HOST`             | no       | `localhost`              | RBAC effective-scope cache                     |
| `REDIS_PORT`             | no       | `6379`                   |                                               |
| `REDIS_PASSWORD`         | no       | —                        |                                               |
| `PORT`                   | no       | `3016`                   |                                               |
| `NODE_ENV`               | no       | `development`            |                                               |
| `CORS_ORIGINS`           | no       | localhost dev origins    | Comma-separated allowlist                      |
| `RATE_LIMIT_IP_MAX`      | no       | `200`                    | Per-IP request cap                             |
| `RBAC_BASE_URL`          | no       | `http://localhost:3055`  | Shared RBAC service                            |
| `RBAC_FAIL_MODE`         | no       | `closed`                 | `closed` denies on RBAC outage                 |

## Run

```bash
pnpm install            # from the monorepo root
pnpm --filter fulfillment-service dev     # nodemon (auto-reload)
pnpm --filter fulfillment-service start   # node index.js
```

## Migrate

```bash
pnpm --filter fulfillment-service migrate          # apply migrations
pnpm --filter fulfillment-service migrate:undo     # roll back the last migration
pnpm --filter fulfillment-service seed             # run seeders
```

## Test

Pure-logic unit tests (zod schemas + pagination helper) run without a live DB or
network via Node's built-in test runner:

```bash
pnpm --filter fulfillment-service test    # node --test
```
