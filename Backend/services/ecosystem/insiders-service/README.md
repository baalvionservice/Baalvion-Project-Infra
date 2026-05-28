# insiders-service

Self-hosted **Node.js + PostgreSQL** backend for the **Baalvion Insiders**
frontend (`Frontend/For Invstors and Founders`). It replaces the app's former
Supabase backend (Auth, Postgres+RLS, Realtime, Storage, RPC, Edge Functions)
with a single Express + Sequelize service, following the `trade-service`
conventions.

## What it provides

| Supabase feature        | Replacement                                                            |
| ----------------------- | ---------------------------------------------------------------------- |
| Auth (email/password)   | JWT access + rotating refresh tokens, bcrypt, brute-force lockout      |
| Postgres + RLS          | `insiders` schema + a generic query engine with per-table authz policies |
| `.from().select()` etc. | `POST /v1/db/query` (PostgREST-compatible spec incl. embedded joins)   |
| RPC functions           | `POST /v1/rpc/:fn` (`has_role`, `increment_thread_views`, `create_notification`) |
| Realtime                | Polling (frontend `NotificationBell`) + DB notification triggers       |
| Storage (`elite-proofs`)| `POST /v1/storage/:bucket/upload` → local disk, served at `/storage/…` |
| Edge Functions          | `POST /v1/functions/{ai-chat,scheduled-tag-report,update-report-schedule,send-notification}` |

The frontend talks to it through a Supabase-compatible adapter at
`Frontend/For Invstors and Founders/src/integrations/supabase/client.ts` — the
rest of the frontend is unchanged.

## Run locally

Requires the shared `baalvion-postgres` container (DB `baalvion_db`).

```sh
cp .env.example .env       # adjust if needed
npm install
npm run migrate            # applies migrations/*.sql into the `insiders` schema
npm run dev                # http://localhost:3050   (or: npm start)
```

Frontend: `cd "../../Frontend/For Invstors and Founders" && npm run dev`
(http://localhost:8080). It defaults to `VITE_API_URL=http://localhost:3050/v1`.

## Make a user an admin

Roles live in `insiders.user_roles`. After registering, grant admin and re-login
to refresh the token:

```sh
docker exec baalvion-postgres psql -U baalvion -d baalvion_db -c \
  "insert into insiders.user_roles(user_id, role) select id,'admin' from insiders.users where email='you@example.com' on conflict do nothing;"
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
