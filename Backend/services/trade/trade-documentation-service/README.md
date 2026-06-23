# trade-documentation-service

GTOS trade documents: commercial invoice, packing list, bill of lading,
certificate of origin, LC documents, and inspection certificates. Handles
draft → issue (render + freeze with SHA-256 checksum) → e-sign → void, plus a
per-order dossier view. Each tenant's rows are isolated by Postgres RLS, set on
every transaction via `@baalvion/tenancy`.

## Surface

All routes are mounted under both `/v1` and `/api/v1`, and require auth +
tenant context (gateway HMAC identity or RS256 bearer).

| Method | Path | Purpose |
|--------|------|---------|
| GET  | `/documents` | List documents (filter by `orderId`, `docType`, `status`; paginated) |
| POST | `/documents` | Create a draft document |
| GET  | `/documents/:id` | Fetch one document with its signatures |
| POST | `/documents/:id/issue` | Render + freeze a draft (checksum, storage key, lock) |
| POST | `/documents/:id/sign` | E-sign an issued document |
| POST | `/documents/:id/void` | Void a document |
| GET  | `/orders/:orderId/dossier` | All documents for an order |

Operational endpoints (no auth): `GET /`, `GET /health`, `GET /health/live`,
`GET /health/ready`.

The service also runs an event consumer that pre-creates draft dossiers on
`gtos.order.created.v1` and attaches inspection certificates on
`gtos.quality.inspection.completed.v1`.

## Required env vars

See [`.env.example`](./.env.example) for the full list. Key variables:

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `3049` | HTTP listen port |
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | localhost / 5432 / `baalvion_db` / `baalvion_app` / — | App DB connection (subject to RLS) |
| `DB_SCHEMA` | `tradedoc` | Owned Postgres schema |
| `MIGRATION_DB_USER` / `MIGRATION_DB_PASSWORD` | — | Privileged owner role for migrations (table ownership + RLS DDL) |
| `JWKS_URI` / `JWT_ISSUER` / `JWT_AUDIENCE` | — | RS256 verification of bearer tokens |
| `GATEWAY_SIGNING_SECRET` | — | HMAC secret for auth-gateway BFF identity headers |
| `EVENT_TRANSPORT` / `EVENT_STREAM` / `EVENT_CONSUMER_GROUP` | redis / `baalvion:events` / service name | Event bus |
| `CMS_BASE_URL` / `INTERNAL_SERVICE_SECRET` | — | SDK CMS access |
| `CORS_ORIGINS` | `http://localhost:3000` | Allowed CORS origins (comma-separated) |
| `RATE_LIMIT_IP_MAX` | `120` | Per-minute IP rate limit |
| `LOG_LEVEL` | `info` | Log level |
| `BOOTSTRAP_MIGRATIONS` | `true` | Run pending migrations on boot (non-production only) |
| `EVENT_CONSUMER` | `true` | Start the event consumer |

## Run

```bash
pnpm install                 # from the monorepo root
cp .env.example .env         # then fill in DB + secrets
node index.js                # or: pnpm --filter trade-documentation-service start
pnpm --filter trade-documentation-service dev   # watch mode (nodemon)
```

## Migrate

```bash
node migrate.js              # apply pending migrations
node migrate.js status       # show migration status
```

Migrations run as the privileged `MIGRATION_DB_USER` so table ownership and RLS
DDL are correct while the app role stays subject to RLS.

## Test

```bash
node --test                  # run the node:test suite (no DB required)
```
