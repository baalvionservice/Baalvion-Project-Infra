# session-service

Baalvion session management — geo enrichment, device fingerprinting, and login
risk scoring for the **identity** bounded context.

## Overview

This service owns the read/admin surface over `auth.sessions` and computes a
risk score for each login. It does **not** issue tokens — authentication is
centralized in `auth-service` (RS256 via `@baalvion/auth-node`). On each login
`auth-service` calls this service over an internal HMAC-signed endpoint to
enrich the session row (geo + device) and persist a risk score; high-risk logins
are published to Redis (`auth:events`) for downstream notification.

Risk signals include: new country, impossible travel, new device fingerprint,
and many concurrent active IPs.

## Surface

User-facing routes are JWT-protected (`Bearer` access token) and mounted under
`/v1/sessions`; the internal route is HMAC service-to-service auth.

| Method | Path | Auth | Purpose |
| ------ | ---- | ---- | ------- |
| GET | `/health` | none | Liveness probe |
| GET | `/v1/sessions` | JWT | List the caller's sessions (paginated) |
| GET | `/v1/sessions/stats` | JWT | Session statistics for the caller |
| GET | `/v1/sessions/:sessionId` | JWT | Session detail (own session only) |
| DELETE | `/v1/sessions` | JWT | Revoke all of the caller's *other* sessions |
| DELETE | `/v1/sessions/:sessionId` | JWT | Revoke one of the caller's sessions |
| GET | `/v1/sessions/admin/all` | JWT (admin) | List all active sessions |
| GET | `/v1/sessions/admin/users/:userId` | JWT (admin) | List a user's sessions |
| GET | `/v1/sessions/admin/:sessionId` | JWT (admin) | Session detail (any user) |
| DELETE | `/v1/sessions/admin/:sessionId` | JWT (admin) | Revoke any session |
| POST | `/internal/analyse-login` | HMAC | Enrich + risk-score a login (called by auth-service) |

Responses use the platform envelope: `{ success, data, requestId }` (paginated
responses add `total`, `page`, `limit`, `hasMore`).

### Internal HMAC auth

`/internal/*` requires `x-service-signature` and `x-service-timestamp` headers.
The signature is `HMAC-SHA256(INTERNAL_SERVICE_SECRET, "<ts>:<method>:<path>")`
(hex). Timestamps older than 30s are rejected. The endpoint fails **closed** in
every environment except `development`/`test` when the secret is unset.

## Required environment

See [`.env.example`](.env.example) for the full list. Key variables:

| Var | Required | Notes |
| --- | -------- | ----- |
| `PORT` | no | Defaults to `3022` |
| `NODE_ENV` | no | `development` / `test` relax internal auth when secret unset |
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | yes | Shared PostgreSQL (`auth` schema) |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | recommended | Event publishing + JTI revocation check (fails closed if down) |
| `JWT_PUBLIC_KEY` / `JWT_PUBLIC_KEY_B64` / `JWT_PUBLIC_KEY_PATH` | yes | RS256 verification key (verify-only, same key as auth-service) |
| `JWT_ISSUER` / `JWT_AUDIENCE` | no | Default `baalvion-auth` / `baalvion` |
| `INTERNAL_SERVICE_SECRET` | yes (non-dev) | HMAC shared secret for `/internal/*` |
| `IMPOSSIBLE_TRAVEL_KMH` / `HIGH_RISK_SCORE` | no | Risk thresholds (`900` / `70`) |
| `CORS_ORIGINS` | no | Comma-separated allowlist |

Secrets are never committed — they are injected at deploy time.

## Run

```bash
pnpm install            # from the monorepo root
node index.js           # or: pnpm --filter session-service start
pnpm --filter session-service dev   # watch mode (nodemon)
```

The service starts on `PORT` (default `3022`) and connects to Redis on boot
(degraded mode if Redis is unavailable).

## Migrate

This service does not own its own migrations — it reads/writes the `auth`
schema (`auth.sessions`, `auth.refresh_tokens`, `auth.users`) owned by
`auth-service`. Apply identity migrations from there:

```bash
pnpm run migrate:auth   # from the monorepo root
```

## Test

```bash
pnpm --filter session-service test   # node --test (no DB/network required)
```

Unit tests cover the pure helpers (device parsing/fingerprinting, geo lookup,
Haversine distance) and run without a live database or network.
