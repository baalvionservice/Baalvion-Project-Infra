# jobs.baalvion.com — backend go-live runbook

The frontend (Next.js) is on **Vercel** and already works for public pages. This runbook stands
up the **jobs-service backend** so the admin dashboard and super-admin have live data.

There are two hosting options. **A is the default** (lowest friction — the platform is already
wired for it). B is the fallback if the consolidated box runs short on memory.

---

## 0. Frontend (Vercel) — required either way

Set these in the **jobs portal's Vercel project → Settings → Environment Variables** (Production):

| Var | Value |
|-----|-------|
| `NEXT_PUBLIC_USE_MOCK` | `false` |
| `NEXT_PUBLIC_AUTH_URL` | `/api/auth` |
| `AUTH_SERVICE_URL` | `https://api.baalvion.com/v1/auth` |
| `NEXT_PUBLIC_JOBS_SERVICE_URL` | **A:** `https://admin.baalvion.com/api-bff/ecosystem/jobs/api/v1`  •  **B:** `https://jobs-api.baalvion.com/api/v1` |

> The login fix (PR #161) makes `AUTH_SERVICE_URL` default correctly on Vercel even if unset, but
> setting it explicitly is the authoritative fix. Redeploy after changing env vars.

---

## A. Consolidated box (default)

jobs-service is now in `deploy/consolidated/pm2/ecosystem.config.js` (app-ecosystem, port 3002).
The Caddy route `admin.baalvion.com/api-bff/ecosystem/jobs/* → app-ecosystem:3002` and the admin
console's `NEXT_PUBLIC_SERVICE_URLS` already point here.

1. Merge the backend PR to `main` and let CI build + push the `baalvion/backend` image to ECR.
2. Deploy through the prod approval gate (deploy-consolidated workflow). On the box this rolls
   `app-ecosystem`, which now starts crm + ir + **jobs-service**.
3. jobs-service auto-runs `CREATE SCHEMA IF NOT EXISTS jobs` + `sequelize.sync` on boot — no
   migration step. It verifies RS256 with the same `JWT_PUBLIC_KEY` ir-service already uses.
4. Run the **super-admin grant** (section C) against RDS.
5. Verify: `curl -s -o /dev/null -w "%{http_code}" https://admin.baalvion.com/api-bff/ecosystem/jobs/health` → `200`.

**Memory:** crm (320M) + ir (320M) + jobs (448M cap) = ~1088M, under app-ecosystem's 1536m
`mem_limit`. If the box gets tight, switch to B.

---

## B. Standalone backend (fallback)

Run jobs-service on its own small host, exposed at `jobs-api.baalvion.com`.

1. Point `jobs-api.baalvion.com` DNS at the host (A record).
2. `cp deploy/jobs/.env.prod.example deploy/jobs/.env.prod` and fill in (reuse the SAME RDS +
   RS256 values as `deploy/consolidated/.env`).
3. From the repo root:
   ```bash
   docker compose --env-file deploy/jobs/.env.prod \
     -f deploy/jobs/docker-compose.prod.yml up -d
   ```
4. Run the **super-admin grant** (section C).
5. Set the Vercel `NEXT_PUBLIC_JOBS_SERVICE_URL` to `https://jobs-api.baalvion.com/api/v1`, redeploy.
6. Verify: `curl https://jobs-api.baalvion.com/health` → `{"status":"ok"}`.
7. Remove jobs-service from `deploy/consolidated/pm2/ecosystem.config.js` so it doesn't run twice.

---

## C. Super-admin grant (REQUIRED for both A and B)

jobs-service keys portal roles off `jobs.system_users` by the caller's auth email. With no row,
even the platform owner logs in as a plain CANDIDATE. Insert a SUPER_ADMIN row for the real
auth-service account that should own the ATS. The `org_id` is the employer/tenant all admin data
scopes to — pick one stable UUID and keep it.

```sql
-- Run against the shared RDS (baalvion_db), AFTER jobs-service has booted once (tables exist).
INSERT INTO jobs.system_users (org_id, name, email, role, status, created_at, updated_at)
VALUES (
  '9d421643-e0fa-42c4-abe9-34509a64387a',   -- employer org (any stable UUID; reuse everywhere)
  'Platform Owner',
  'superadmin@baalvion.com',                 -- MUST match a real central auth-service account
  'SUPER_ADMIN',
  'active', now(), now()
)
ON CONFLICT DO NOTHING;
```

> The email must already exist as a login in the central auth-service (register/own it there
> first). After this, that user logging in at jobs.baalvion.com is resolved as SUPER_ADMIN and
> all org-scoped controllers operate on the employer org above.

Optional demo data: `cd Backend/services/ecosystem/jobs-service && npm run seed` (idempotent;
test accounts under the seed org). Skip in prod if you want a clean ATS.
