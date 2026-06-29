# admin-service

Baalvion Identity **Admin microservice** — the backend for the super-admin console
(`admin-platform`, dev origin `http://localhost:3030`). It powers platform-wide
super-admin operations: user / organization management, short-lived audited
impersonation, platform statistics, billing/payments insight, support desk,
feature flags, developer (API-key) administration, an AI assistant surface, and
the staff (HR) module (departments, teams, employees, invitations, onboarding).

Auth is centralized: every authenticated route is verified with RS256 via
`@baalvion/auth-node`'s canonical verifier (JWKS-first, static-key fallback).
This service does **not** mint canonical sessions; impersonation tokens it issues
carry a **distinct issuer** so canonical consumers never accept them implicitly.

## Surface

Base path: `/v1`. Health probe: `GET /health` (unauthenticated).

| Mount | Auth | Purpose |
|-------|------|---------|
| `GET /health` | none | Liveness/version probe |
| `/v1/staff/invitations/accept` | invite token | **Public** invitation acceptance (no bearer) |
| `/v1/admin` | super_admin | Platform stats, user & org CRUD, sessions, audit logs, impersonation |
| `/v1/admin/payments` | super_admin | Billing / payments insight |
| `/v1/admin/feature-flags` | super_admin | Feature flag administration |
| `/v1/admin/analytics` | super_admin | Platform analytics |
| `/v1/support` | bearer | Support desk (tickets) |
| `/v1/ai` | bearer | AI assistant operations |
| `/v1/developer` | bearer | Developer / API-key administration |
| `/v1/identity` | bearer | Identity helpers |
| `/v1/staff` | super_admin | Staff/HR: departments, teams, employees, invitations, onboarding, permissions |

Responses use the platform envelope: `{ success, data, requestId }` on success
and `{ success: false, error: { code, message, details, requestId } }` on failure.

### Input validation

The highest-risk staff mutation routes are guarded by permissive zod schemas
(`validation/staffSchemas.js`, wired via `middleware/validate.js`) that mirror the
service's existing manual checks — they never reject inputs the service already
accepts:

- `POST /v1/staff/departments` (createDepartment)
- `PATCH /v1/staff/employees/:id` (updateEmployee)
- `POST /v1/staff/invitations` (sendInvitation)

## Required environment variables

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| `PORT` | no | `3021` | HTTP port |
| `NODE_ENV` | no | `development` | `production` enables fail-closed guards |
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` | no | `localhost` / `5432` / `baalvion_db` / `baalvion` | Postgres connection |
| `DB_PASSWORD` | **yes** | — | Fail-closed: required at startup via `requireEnv` (no dev-default in the running service) |
| `DB_SSL` | no | — | Set `false` for local Postgres without TLS |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | no | `''` / `6379` / `''` | JTI revocation; service runs degraded if Redis is down |
| `BAALVION_JWKS_URI` / `JWKS_URI` | recommended | — | JWKS endpoint for RS256 verification (auth-service) |
| `JWT_PUBLIC_KEY` / `JWT_PUBLIC_KEY_B64` / `JWT_PUBLIC_KEY_PATH` | fallback | — | Static public-key sources when JWKS is unavailable |
| `JWT_ISSUER` | no | `baalvion-auth` | Expected token issuer |
| `JWT_AUDIENCE` | no | `baalvion-platform` | Expected token audience |
| `JWT_IMPERSONATION_ISSUER` | no | `baalvion-auth-impersonation` | Distinct issuer for impersonation tokens |
| `CORS_ORIGINS` | no | `http://localhost:3030` | Comma-separated allowed origins |
| `AUTH_SERVICE_URL` | no | `http://localhost:3001` | Upstream auth-service for user lookups / registration |
| `SMTP_HOST` / `SMTP_PORT` / `EMAIL_FROM` | no | `127.0.0.1` / `1025` / `noreply@baalvion.com` | Best-effort invitation email (dev: Mailpit) |

> Secrets are never committed — `.env*`, keys, and certs are git-ignored and
> injected at deploy time. The bootstrap scripts keep a local-dev `DB_PASSWORD`
> fallback but **throw in production** when it is missing.

## Run

```bash
pnpm install            # from the monorepo root (installs the whole workspace)
pnpm run dev            # nodemon (this service)        — or: pnpm start
```

From the monorepo root you can also use the identity stack target
(`pnpm run dev:identity`) which brings up this service alongside the admin platform.

## Migrate

Migrations are plain SQL applied with `psql` against `$DATABASE_URL`:

```bash
pnpm run migrate
# applies, in order:
#   001_feature_flags.sql  002_analytics.sql  003_support.sql
#   004_developer.sql      005_ai.sql         006_rls_tenant_isolation.sql
```

Optional seed/bootstrap helpers (idempotent; load env via dotenv):

```bash
node -r dotenv/config scripts/bootstrapStaff.js      # staff schema + sample org chart
node -r dotenv/config scripts/bootstrapPayments.js   # billing schema + sample revenue
```

## Test

```bash
pnpm test               # vitest run
```

Pure-logic unit tests (no DB / no network) live alongside the code they cover,
e.g. `validation/staffSchemas.test.js`.

## Known residual

`service/aiService.js` (~995 lines) and `service/adminService.js` (~900 lines)
exceed the 800-line guideline and are intentionally **left un-split** here — see
the production-readiness residual notes. Splitting them is a separate, reviewed
change.
