# IR-Stack — Investor Relations backend deploy slice

The IR frontend (`ir.baalvion.com`) runs on **Vercel**. Its `/api/ir/*` and `/api/mp/*` BFF routes
call backend services **server-side**:

| BFF route | Calls | Env var | Default (unreachable on Vercel) |
|---|---|---|---|
| `/api/ir/apply` | ir-service `POST /api/v1/applications` | `IR_SERVICE_URL` | `http://127.0.0.1:3008` |
| `/api/ir/eligibility` | ir-service `GET /api/v1/applications/eligibility` | `IR_SERVICE_URL` | `http://127.0.0.1:3008` |
| `/api/ir/contact` | ir-service `POST /api/v1/contact-messages` | `IR_SERVICE_URL` | `http://127.0.0.1:3008` |
| `/api/mp/deals` (deal room) | marketplace-service | `MARKETPLACE_SERVICE_URL` | `http://127.0.0.1:3062` |

**Root cause of "The application service is temporarily unavailable":** `ir-service` was never
deployed, and on Vercel `IR_SERVICE_URL` is unset, so the BFF tries `127.0.0.1:3008` (nothing
there) and the `fetch` throws. This slice gives `ir-service` a reachable home; then you set
`IR_SERVICE_URL` on Vercel to its public URL.

> The **deal room** additionally needs `marketplace-service` deployed + `MARKETPLACE_SERVICE_URL`
> set on Vercel. That service is **not** included here — onboarding, eligibility and contact all
> work with ir-service alone. Add marketplace-service as a follow-up when you want live deal rooms.

---

## What's in the slice

- **ir-service** `:3008` — owns the `ir` Postgres schema (created + synced on boot, including the
  new `ir_contact_messages` table). Public endpoints: `POST /api/v1/applications`,
  `GET /api/v1/applications/eligibility`, `POST /api/v1/contact-messages`. Staff endpoints are
  RS256-protected.
- **postgres:16** — slice-local DB (volume `ir_pgdata`).
- **caddy:2** — TLS edge; the only public ports. Reverse-proxies `DOMAIN_IR_API` → ir-service.

ir-service has **no Redis/Kafka dependency**, so the slice is intentionally minimal.

---

## Deploy (standalone host)

```bash
# 0. DNS: point an A record for DOMAIN_IR_API (e.g. ir-api.baalvion.com) at this host.

# 1. Config
cp deploy/ir-stack/.env.prod.example deploy/ir-stack/.env.prod
#   edit: POSTGRES_PASSWORD, JWT_PUBLIC_KEY, DOMAIN_IR_API, ACME_EMAIL, IR_DEFAULT_ORG_ID

# 2. Build + run (from the REPO ROOT — build context is the monorepo)
docker compose --env-file deploy/ir-stack/.env.prod \
  -f deploy/ir-stack/docker-compose.prod.yml up -d --build

# 3. Smoke test
curl -fsS https://<DOMAIN_IR_API>/health
curl -fsS -X POST https://<DOMAIN_IR_API>/api/v1/applications \
  -H 'content-type: application/json' \
  -d '{"full_name":"Test User","email":"test@example.com"}'
```

Then in the **Vercel project for ir-baalvion-web** → Settings → Environment Variables:

```
IR_SERVICE_URL = https://<DOMAIN_IR_API>
# (later, for live deal rooms)
MARKETPLACE_SERVICE_URL = https://<your marketplace-service URL>
```

Redeploy the Vercel app so the new env is picked up.

---

## Alternative: fold ir-service into the existing core-stack

The live AWS box already runs `deploy/core-stack` with a shared Postgres. Instead of a separate
host you can add ir-service there:

1. Add an `ir-service` service block to `deploy/core-stack/docker-compose.prod.yml` modelled on
   this slice (reuse the shared `*db` anchor, `DB_SCHEMA` is implicit — ir-service hardcodes the
   `ir` schema; give it `mem_limit: 256m` + `NODE_OPTIONS=--max-old-space-size=192`).
2. Add a Caddy route for the IR API host (or a path on the existing API domain) → `ir-service:3008`.
3. Set `IR_SERVICE_URL` on Vercel to that public URL.

Either way the application-layer code is identical; only the URL the Vercel BFF points at changes.

---

## Notes / gotchas

- **`JWT_PUBLIC_KEY` is required at boot** — ir-service `requireEnv('JWT_PUBLIC_KEY')` will crash
  the container if it's missing, even though the public submission path needs no token. Provide the
  public key (or wire `BAALVION_JWKS_URI`).
- **`IR_DEFAULT_ORG_ID` must match** the org the staff console uses to review applications, or
  approvals won't line up with the public submissions.
- **Eligibility is rate-limited** (`RATE_LIMIT_IP_MAX`, default 120/min). The endpoint returns only
  booleans/reasons (no PII); the Vercel BFF only ever queries the signed-in user's own email.
- **First boot creates the schema** via `CREATE SCHEMA IF NOT EXISTS ir` + Sequelize `sync` — no
  separate migration job is needed for a fresh DB.
