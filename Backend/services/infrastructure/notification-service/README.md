# notification-service

Baalvion's dedicated, multi-channel **notification dispatcher**. It is the platform's
first production event consumer on the Redis Streams backbone (`baalvion:events`):
it subscribes via `@baalvion/sdk`, fans events out to email / SMS / push / in-app
channels through BullMQ workers, and exposes a small internal + user-facing HTTP API.

## Overview

- **Event-driven**: a Redis Streams consumer (`workers/eventConsumer.js`) listens on
  the `notification-service` consumer group (at-least-once delivery, idempotent by
  event id) and translates platform events (auth, session-risk, CMS, payment, …)
  into channel jobs.
- **Channels**:
  - **Email** — Resend (primary) → SMTP fallback (AWS SES via SMTP supported) → dev `log`.
  - **SMS** — Twilio (optional dep) → dev `log`.
  - **Push** — FCM and/or Web Push/VAPID (both optional, lazy-loaded) → dev `log`.
  - **In-app** — Redis pub/sub (realtime-service fans out over WebSocket) + a durable,
    capped, TTL'd per-user inbox.
- **Queues**: BullMQ (`email`, `webhook`, `sms`, `push`, `notification`) with
  per-channel retry/backoff and a DLQ viewer/retry surface for admins.
- **Fail-closed**: in `production` the service **refuses to boot** without a real email
  provider configured (no silent log-only mail) — see `config/validateConfig.js`.

Auth is centralized: RS256 verify-only via `@baalvion/auth-node`; service-to-service
calls use a shared internal secret. Structured logging + tracing flow through
`@baalvion/sdk` (`utils/logger.js` is the facade).

## HTTP surface

Mounted under `/v1/notifications` (`routes/notificationRoutes.js`). Plus `GET /health`.

| Method & path | Auth | Purpose |
|---|---|---|
| `POST /v1/notifications/email` | internal | Enqueue an email |
| `POST /v1/notifications/email/sync` | internal | Send a critical email synchronously |
| `POST /v1/notifications/webhook` | internal | Enqueue an outbound webhook |
| `POST /v1/notifications/sms` | internal | Enqueue an SMS |
| `POST /v1/notifications/push` | internal | Enqueue a push notification |
| `POST /v1/notifications/dispatch` | internal | Unified multi-channel fan-out (honors prefs) |
| `GET/POST/DELETE /v1/notifications/devices[...]` | user JWT | Manage own push device tokens |
| `GET/PUT /v1/notifications/preferences` | user JWT | Per-channel opt-in/opt-out |
| `GET /v1/notifications/inbox` | user JWT | Fetch in-app inbox (`limit` capped at 100) |
| `POST /v1/notifications/inbox/read`, `/inbox/:id/read` | user JWT | Mark read |
| `GET /v1/notifications/queues/stats`, `/queues/dlq`, `POST /queues/dlq/:entryId/retry` | admin | Queue + DLQ ops |

All request bodies are validated with `zod` in `controller/notificationController.js`.
A global IP rate limiter (`express-rate-limit`) guards the whole surface.

## Required environment

Copy `.env.example` to `.env`. Key variables:

| Variable | Required | Notes |
|---|---|---|
| `INTERNAL_SERVICE_SECRET` | **yes** | Service-to-service auth (validated at startup). |
| `PORT` | no | Defaults to `3031`. |
| `NODE_ENV` | no | `production` enables the fail-closed email-provider check. |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | yes (runtime) | Queues, streams, pub/sub, inbox. |
| `RESEND_API_KEY` **or** `SMTP_HOST`+`SMTP_USER`+`SMTP_PASS` | yes in prod | Email provider (one is required to boot in prod). AWS SES via `SMTP_HOST=email-smtp.<region>.amazonaws.com`. |
| `EMAIL_FROM` / `EMAIL_FROM_NAME` / `EMAIL_REPLY_TO` | no | Sender identity. |
| `JWT_PUBLIC_KEY[_B64\|_PATH]` / `JWT_ISSUER` / `JWT_AUDIENCE` | runtime | RS256 verify-only for user endpoints. |
| `TWILIO_*` | optional | Enables the SMS channel. |
| `FCM_SERVICE_ACCOUNT*` / `VAPID_*` | optional | Enable FCM / Web Push. |
| `APP_URL` / `ADMIN_URL` / `CORS_ORIGINS` | no | Links in emails + allowed origins. |
| `*_WORKER_CONCURRENCY`, `*_RATE_LIMIT_PER_HOUR`, `IP_RATE_LIMIT_MAX` | no | Tuning knobs. |

See `.env.example` for the full list and defaults.

## Run

```bash
pnpm install                  # from the monorepo root
pnpm run infra:up             # Postgres + Redis (this service only needs Redis)

# from this directory:
node index.js                 # API + in-process BullMQ workers + event consumer
# or: npm run dev             # nodemon
# or: npm run worker          # workers entrypoint only (workers/index.js)
```

## Migrations

This service is **stateless** — it owns no SQL schema. All state lives in Redis
(device tokens, channel preferences, in-app inbox, idempotency markers). There are
no migrations to run.

## Test

Tests use the built-in Node test runner (`node:test` + `node:assert`) — no extra deps.

```bash
npm test          # node --test
```

There is also a manual smoke checker for a running instance:

```bash
node scripts/smoke.js
```
