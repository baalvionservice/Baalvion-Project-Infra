# crm-service

Baalvion CRM & Marketing service (bounded context: **ecosystem**). Owns the brand-scoped
customer-relationship and marketing data behind the storefront account areas and the central
admin console: VIP clients, customer segments, marketing campaigns, vendors, affiliates,
appointments, and support tickets.

All data lives in an isolated PostgreSQL schema (`crm`) and is multi-tenant by `brandId`
(default brand `amarise-luxe`). Authentication is centralized RS256 verification via
`@baalvion/auth-node` — this service does not issue or hand-roll tokens.

## Surface

Routes are mounted under both `/v1` and `/api/v1`.

| Method | Path | Auth | Notes |
| ------ | ---- | ---- | ----- |
| GET | `/health` | public | Liveness probe |
| GET | `/metrics` | public | Prometheus metrics |
| GET | `/v1/crm/vip-clients/me` | required | The caller's own VIP record (by `userId`, else `?email=`) |

Each of the seven entities below exposes standard CRUD:

| Method | Path | Auth |
| ------ | ---- | ---- |
| GET | `/v1/crm/<entity>` | required (list, paginated; supports `?page`, `?limit`, `?status`, `?search`, `?brandId`) |
| GET | `/v1/crm/<entity>/:id` | required |
| POST | `/v1/crm/<entity>` | required (see public-create exceptions below) |
| PATCH / PUT | `/v1/crm/<entity>/:id` | required |
| DELETE | `/v1/crm/<entity>/:id` | required |

Entities: `vip-clients`, `segments`, `campaigns`, `vendors`, `affiliates`, `appointments`,
`support-tickets`.

**Public-create exceptions:** `POST /v1/crm/appointments` and `POST /v1/crm/support-tickets`
use optional auth so the public storefront can submit a booking / open a ticket without a
session. Their request bodies are validated by permissive zod schemas
(`middleware/validate.js`) that mirror the underlying model's required columns
(`customerName`, and `subject` for tickets) and pass every other field through unchanged.

## Required environment variables

| Variable | Required | Default | Purpose |
| -------- | -------- | ------- | ------- |
| `JWT_PUBLIC_KEY` | **yes** | — | RS256 public key for token verification (startup throws if missing). Use `\n` for newlines. |
| `PORT` | no | `3063` | HTTP port |
| `NODE_ENV` | no | `development` | Runtime environment |
| `CORS_ORIGINS` | no | `http://localhost:3000` | Comma-separated allowed origins |
| `DB_HOST` | no | `localhost` | Postgres host |
| `DB_PORT` | no | `5432` | Postgres port |
| `DB_NAME` | no | `baalvion_db` | Database name |
| `DB_USER` | no | `baalvion` | Database user |
| `DB_PASSWORD` | no | `` (empty) | Database password |
| `DB_SSL` | no | — | Enables Postgres TLS (via `@baalvion/auth-node` `buildPgSsl`) |
| `JWT_ISSUER` | no | `baalvion-auth` | Expected token issuer |
| `JWT_AUDIENCE` | no | `baalvion-platform` | Expected token audience |
| `JWKS_URI` / `BAALVION_JWKS_URI` | no | — | JWKS endpoint for key rotation |
| `CRM_DEFAULT_BRAND` | no | `amarise-luxe` | Default brand for unscoped reads/writes |
| `RATE_LIMIT_IP_MAX` | no | `120` | Per-minute IP rate limit |
| `SERVICE_NAME` | no | `ir-service` | Metrics label |

Secrets are never committed — `.env*` is git-ignored and injected at deploy time.

## Run

```bash
pnpm install                 # from the monorepo root
pnpm --filter crm-service start    # or: node index.js  (from this directory)
pnpm --filter crm-service dev      # watch mode (nodemon)
```

On boot the service connects to Postgres, ensures the `crm` schema exists, and runs
`sequelize.sync({ alter: false })` — this only creates missing tables on a fresh DB and never
auto-mutates existing columns. Schema changes go through explicit migrations.

## Seed (demo data)

```bash
node scripts/seedAmariseCrm.cjs
```

Idempotently seeds the Amarisé (`amarise-luxe`) VIP clients, segments, campaigns, vendors,
affiliates, appointments, and support tickets, skipping any row whose natural key already
exists for the brand.

## Test

```bash
pnpm --filter crm-service test     # or: node --test  (from this directory)
```

Tests use the Node built-in test runner and run without a live DB or network. Current coverage
focuses on the pure validation schemas (`test/validate.test.js`).
