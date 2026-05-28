# elite-circle-service

Self-hosted **Node.js + PostgreSQL** backend for the **Baalvion Elite Circle**
frontend (`Frontend/baalvion-elite-circle-main`). It replaces the app's former
Supabase backend (Auth, Postgres+RLS, Realtime, Storage, RPC, Edge Functions)
with a single Express + Sequelize service, following the `trade-service`
conventions.

## What it provides

| Supabase feature        | Replacement                                                            |
| ----------------------- | ---------------------------------------------------------------------- |
| Auth (email/password)   | JWT access + rotating refresh tokens, bcrypt, brute-force lockout      |
| Postgres + RLS          | `elite_circle` schema + a generic query engine with per-table authz policies |
| `.from().select()` etc. | `POST /v1/db/query` (PostgREST-compatible spec incl. embedded joins)   |
| RPC functions           | `POST /v1/rpc/:fn` (`has_role`, `increment_thread_views`, `create_notification`) |
| Realtime                | Polling (frontend `NotificationBell`) + DB notification triggers       |
| Storage (`elite-proofs`)| `POST /v1/storage/:bucket/upload` → local disk, served at `/storage/…` |
| Edge Functions          | `POST /v1/functions/{ai-chat,scheduled-tag-report,update-report-schedule,send-notification}` |

The frontend talks to it through a Supabase-compatible adapter at
`Frontend/baalvion-elite-circle-main/src/integrations/supabase/client.ts` — the
rest of the frontend is unchanged.

## Run locally

Requires the shared `baalvion-postgres` container (DB `baalvion_db`).

```sh
cp .env.example .env       # adjust if needed
npm install
npm run migrate            # applies migrations/*.sql into the `elite_circle` schema
npm run dev                # http://localhost:3051   (or: npm start)
```

Frontend: `cd "../../Frontend/baalvion-elite-circle-main" && npm run dev`
(http://localhost:8081). It defaults to `VITE_API_URL=http://localhost:3051/v1`.

## Make a user an admin

Roles live in `elite_circle.user_roles`. After registering, grant admin and re-login
to refresh the token:

```sh
docker exec baalvion-postgres psql -U baalvion -d baalvion_db -c \
  "insert into elite_circle.user_roles(user_id, role) select id,'admin' from elite_circle.users where email='you@example.com' on conflict do nothing;"
```

## AI assistant

`POST /v1/functions/ai-chat` is provider-agnostic (OpenAI-compatible). Set in
`.env`: `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL`. Without a key it returns a
graceful stub so the UI keeps working.

## Notes

- Accounts are auto-verified on registration (no email service wired). Password
  reset returns the token in the response in dev so the flow is testable.
- Authorization that RLS used to enforce now lives in
  `controller/queryController.js` (`POLICIES`). Review it when adding tables.
