# audit-service — Baalvion Immutable Audit Log

The platform's single **immutable, append-only, tamper-evident** audit trail. It
*aggregates* audit events from every domain (it does **not** replace the local
audit each service already writes — `auth.audit_logs`, `rbac.decision_logs`, etc.).

- **Domain:** infrastructure · **Port:** `3032` · **Schema:** `audit` (isolated)
- **Stack:** Node + Express + Sequelize/pg + ioredis. Verify-only RS256 via `@baalvion/auth-node`.

## Tamper-evidence
- **WORM:** Postgres triggers reject every `UPDATE`/`DELETE`/`TRUNCATE` on `audit.events` — even for the table owner.
- **Hash chain:** each row stores `hash = SHA256(prev_hash + canonical(row))`, chained to the previous row. `GET /v1/audit/verify` re-walks the chain and reports the first tampered/removed row (catches both content edits and inserted/deleted rows).

## Capture
- **Event bus (primary):** a Redis-Streams consumer on `baalvion:events` records *every* platform event automatically — no per-service integration needed.
- **Direct writes:** `POST /v1/audit` (+ `/audit/batch`) for high-value synchronous events, from services (`X-Internal-Key`) or privileged users.

## API (`/v1`)
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/audit` | internal key / privileged user | append one event |
| POST | `/audit/batch` | internal key / privileged user | append many (chained) |
| GET | `/audit` | audit-reader | query (actor/action/resource/service/severity/time + pagination) |
| GET | `/audit/:seq` | audit-reader | one event |
| GET | `/audit/verify?fromSeq=&toSeq=` | audit-reader | verify chain integrity |
| GET | `/audit/export` | audit-reader | CSV export |

Audit-reader = `super_admin`/`admin`/`owner`/`auditor`/`compliance` role, or `audit:read`/`*` permission, or a service principal.

## Run locally
```bash
cp .env.example .env
pnpm install
pnpm --filter audit-service migrate   # or: psql $DATABASE_URL -f migrations/001_audit_schema.sql
pnpm --filter audit-service dev
node scripts/smoke.mjs                 # live end-to-end check (service must be running)
```

## Deferred
- **ClickHouse** analytics mirror (the old `audit-platform` descriptor) — Postgres + hash-chain is the source of truth; ClickHouse is a Phase-2 high-volume read model.
- Per-event-id dedup for exactly-once event capture.
- Provider/event delivery receipts.
