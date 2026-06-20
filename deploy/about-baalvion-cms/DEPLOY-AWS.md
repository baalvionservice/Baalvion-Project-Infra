# Deploy the About-Baalvion CMS publicly (single EC2 + Docker Compose)

This stands up the central **Baalvion CMS** at a public HTTPS host so the
**about.baalvion.com** site on Vercel — and every CMS-backed page — fetches **live**
content from the admin platform. It is the fix for the home page showing *"Service
Temporarily Unavailable"*: that message appears because Vercel cannot reach a `localhost`
CMS. Once this is live and Vercel's `CMS_PUBLIC_URL` points at it, the pages render real
content per-request (the frontend is now `force-dynamic` + `no-store`).

```
about.baalvion.com (Vercel)  ─server fetch→  https://cms.baalvion.com/api/v1/public/about-baalvion/content[/:slug]
cms.baalvion.com ─443→ Caddy ─ /* → cms-service:3011   (public delivery + authenticated admin API)
admin.baalvion.com ─443→ Caddy ─ /* → admin-web:3030   (admin console — optional, --profile admin)
   auth-service:3001  mints RS256 + JWKS (verified by cms-service for the admin API)
   postgres · redis   (internal compose network; no public ports)
```

> **What only you can do** (I can't from the dev sandbox): create the EC2 + security group,
> point DNS at it, and supply production secrets. Everything else is the commands below.
> Treat the first deploy as a validation run — watch the logs at each step.

---

## 0. Prerequisites (you)
- An AWS account + an SSH key pair.
- Control of DNS for `baalvion.com` (Route 53 or your registrar).
- Production secret values (`openssl rand -hex 32` for each secret).

## 1. EC2 instance
- **AMI:** Ubuntu 22.04/24.04 LTS. **Type:** `t3.medium` (2 vCPU / 4 GB) — Node + Postgres +
  Redis, no Java/Kafka. **Disk:** 20 GB gp3.
- **Elastic IP:** allocate + associate one (stable IP for stable DNS).
- **Security group (inbound):** `22` from your IP only; `80` + `443` from `0.0.0.0/0`.
  Nothing else — Postgres/Redis stay internal to Docker.

## 2. DNS
- `A` record: `cms.baalvion.com` → the Elastic IP.
- (Admin console only) `A` record: `admin.baalvion.com` → the same Elastic IP.
- Verify before continuing: `dig +short cms.baalvion.com` returns your IP. Caddy's TLS
  issuance fails until DNS resolves publicly.

## 3. Host setup
```bash
ssh ubuntu@<elastic-ip>
sudo apt-get update && sudo apt-get install -y docker.io docker-compose-plugin git
sudo usermod -aG docker ubuntu && newgrp docker
# Node 20 + corepack — only needed to GENERATE the RS256 keypair (you can also do this on
# your laptop and paste the PEMs into .env.prod).
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs
sudo corepack enable
sudo mkdir -p /opt/baalvion && sudo chown "$USER" /opt/baalvion
git clone <YOUR_REPO_URL> /opt/baalvion && cd /opt/baalvion
```

## 4. RS256 signing keypair (auth-service mints tokens; cms-service verifies them)
```bash
cd Backend/services/identity/auth-service && npm run generate-keys   # writes keys/private.pem + keys/public.pem
awk 'NF {printf "%s\\n", $0}' keys/private.pem   # → paste as JWT_PRIVATE_KEY
awk 'NF {printf "%s\\n", $0}' keys/public.pem    # → paste as JWT_PUBLIC_KEY
cd /opt/baalvion
```

## 5. Secrets file
```bash
cp deploy/about-baalvion-cms/.env.prod.example deploy/about-baalvion-cms/.env.prod
nano deploy/about-baalvion-cms/.env.prod
```
Fill EVERY `__CHANGE_ME__`:
- `ACME_EMAIL`
- `POSTGRES_PASSWORD`
- `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY` (from §4)
- `INTERNAL_SERVICE_SECRET`, `CMS_SECRETS_KEY` (`openssl rand -hex 32` each — cms-service
  REFUSES to start without these in production)
- `SUPERADMIN_EMAIL`, `SUPERADMIN_PASSWORD` (your admin login + seed credential)
- `GATEWAY_SIGNING_SECRET` (only needed for the admin console profile)

## 6. Bring up the core stack
```bash
cd /opt/baalvion
export CF="--env-file deploy/about-baalvion-cms/.env.prod -f deploy/about-baalvion-cms/docker-compose.prod.yml"
docker compose $CF up -d --build
docker compose $CF ps
```
First build pulls Node images + runs `turbo prune` per service — give it a few minutes.
`cms-service` will log DB errors until the migrations in §7 create its tables (it retries —
that's expected). The `cms` schema itself is auto-created on boot.

## 7. Database setup (one-time, on a fresh DB)

> **Easy path:** run `bash deploy/about-baalvion-cms/init-data.sh` from the repo root once the
> stack is up. It performs ALL of §7 + §8 automatically (waits for health → auth migrations →
> CMS migrations → super-admin → registers the website → resolves its id → seeds → verifies).
> The manual steps below are the same sequence, kept for reference and troubleshooting.

This exact sequence was validated end-to-end on a local copy of this stack. Run the steps in
order — each depends on the previous.
```bash
# Load ONLY the scalar vars (don't `source` the file — the multi-line PEM keys break it):
export $(grep -E '^(POSTGRES_USER|POSTGRES_DB|SUPERADMIN_EMAIL|SUPERADMIN_PASSWORD)=' \
  deploy/about-baalvion-cms/.env.prod | xargs)
```
**a) Auth schema** — apply ALL of auth-service's SQL migrations in order (the repo's
`migrate:auth` npm script is stale and skips some):
```bash
for f in Backend/services/identity/auth-service/migrations/00{1,2,3,4,5,6,7,8}*.sql; do
  echo ">> $f"
  docker compose $CF exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 < "$f"
done
# 009 is tenant RLS — best-effort (services connect as the DB owner, which bypasses RLS):
docker compose $CF exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  < Backend/services/identity/auth-service/migrations/009_rls_tenant_isolation.sql || true
```
**b) CMS schema** — run the one-shot migrator (Sequelize migrations; it builds, migrates, exits):
```bash
docker compose $CF --profile tools run --rm cms-migrate
```
**c) Super-admin** (idempotent; runs inside auth-service so it uses the same argon2 + DB).
**Note the `orgId` and `userId` it prints — you need them in step (d):**
```bash
docker compose $CF exec \
  -e SUPERADMIN_EMAIL="$SUPERADMIN_EMAIL" -e SUPERADMIN_PASSWORD="$SUPERADMIN_PASSWORD" \
  auth-service node scripts/bootstrapSuperAdmin.js
# → {"ok":true,"userId":"1","orgId":"<uuid>","email":"...","role":"super_admin"}
```
**d) Register the `about-baalvion` website tenant** — the seed writes content INTO this site, so
it must exist first, owned by the super-admin's org so that user can manage it. Substitute the
`orgId`/`userId` from (c):
```bash
docker compose $CF --profile tools run --rm \
  -e CMS_ORG_ID=<orgId-from-step-c> -e CMS_CREATED_BY=<userId-from-step-c> \
  cms-register
```
**e) Resolve the generated website id** (the seed needs it):
```bash
WID=$(docker compose $CF exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -tAc "select id from cms.cms_websites where slug='about-baalvion'" | tr -d '[:space:]')
echo "about-baalvion website id = $WID"
```

## 8. Seed the About-Baalvion content (pages, projects, news, ecosystem)
Creates the category tree + all content and **publishes** it so the public delivery API serves
it. Idempotent — safe to re-run; it skips what already exists.
```bash
docker compose $CF --profile tools run --rm -e ABOUT_WEBSITE_ID="$WID" cms-seed
# Expect: "publish": {"published": 26, ... "failed": 0}
```
> If the seed reports `created: 0` / `failed: N` with "not found", step (d) didn't run or `WID`
> is empty — the site doesn't exist yet. Re-check (d)/(e), then re-run the seed.

## 9. Verify the public delivery API
```bash
# Website metadata + the home page content the frontend reads:
curl -sS https://cms.baalvion.com/api/v1/public/about-baalvion | head -c 400; echo
curl -sS https://cms.baalvion.com/api/v1/public/about-baalvion/content/home | head -c 400; echo
# A content listing:
curl -sS "https://cms.baalvion.com/api/v1/public/about-baalvion/content?limit=3" | head -c 400; echo
```
Each should return `{"success":true,"data":...}`. If `content/home` returns data, the
Vercel site will render.

## 10. Point Vercel at the public CMS (this clears "Service Temporarily Unavailable")
In the Vercel project for **about-baalvion-web** → Settings → Environment Variables, set
(Production + Preview):
```
CMS_PUBLIC_URL   = https://cms.baalvion.com/api/v1/public
CMS_WEBSITE_SLUG = about-baalvion
```
Then **redeploy** (Deployments → ⋯ → Redeploy, or push a commit). The pages are
`force-dynamic`, so the build no longer needs the CMS; every request now fetches live.
Verify: `https://about.baalvion.com` shows real content, and editing a page in the CMS is
visible on the next page load (no rebuild).

> Note: `.env.local` is gitignored and is NOT used by Vercel — these must be set in the
> Vercel dashboard.

## 11. (Optional) Run the admin console in production — manage content from the browser
Brings up the BFF gateway + the Next.js admin console at `admin.baalvion.com`.
```bash
docker compose $CF --profile admin up -d --build auth-gateway admin-web
```
Log in at `https://admin.baalvion.com` with the super-admin from §7c. The console edits the
same CMS the public API serves, so changes are live immediately.

> **First-deploy verification:** the admin console is the central platform UI and normally
> sits behind the full `api.baalvion.com` gateway. This package wires the CMS + auth paths
> through the BFF gateway, but non-CMS surfaces (user management, sessions, OAuth) depend on
> services not in this slice and will be limited. Confirm the login + content-edit flow on
> first deploy; check `docker compose $CF --profile admin logs -f auth-gateway admin-web`.
>
> **Interim alternative:** you don't need the prod console to manage About-Baalvion content.
> You can (a) re-run the §8 seed after editing the seed script, or (b) point your LOCAL
> admin-platform at this prod CMS by setting its `NEXT_PUBLIC_CMS_API_URL` to
> `https://cms.baalvion.com/api/v1` and `NEXT_PUBLIC_AUTH_URL` to the prod auth host
> (`CORS_ORIGINS` in `.env.prod` already allows `http://localhost:3030`).

## 12. Operate
- Logs: `docker compose $CF logs -f cms-service` (or `auth-service`, `caddy`).
- Update: `git pull` → `docker compose $CF up -d --build`.
- **Backups:** schedule `pg_dump` of the DB to S3 — the `pgdata` volume is the only stateful
  store besides Caddy's certs. Snapshot the EBS volume too.
- Reboot resilience: services use `restart: unless-stopped`; `sudo systemctl enable docker`.

## 13. Gotchas (already handled here, listed for debugging)
- **cms-service won't start, exits immediately:** `INTERNAL_SERVICE_SECRET` or `CMS_SECRETS_KEY`
  is missing/dev-default. Both are mandatory in production.
- **Public API 404 for `content/home`:** the seed (§8) hasn't run, or content is still draft.
  Re-run §8 — it publishes anything left in draft/approved.
- **`cms-migrate` can't find sequelize-cli:** it intentionally builds the Dockerfile's
  `installer` target (which keeps devDeps + migrations); don't point it at the slim image.
- **Admin login bounces / CMS calls 401:** the gateway must run `BFF_ENFORCEMENT_MODE=hybrid`
  (set here) so it forwards the RS256 Bearer; cookie names must match the `admin-web` build.
- **Caddy cert error for `admin.baalvion.com` while only running core:** harmless — Caddy
  retries that cert in the background and the `cms.baalvion.com` site serves normally. Only
  point admin DNS when you run `--profile admin`.

## 14. Hardening backlog (post-launch)
- Move Postgres → **RDS** and Redis → **ElastiCache** (point `DB_HOST`/`REDIS_HOST` at them;
  drop those services from the compose).
- Put the EC2 behind **CloudFront/ALB + AWS WAF**; the CMS public API benefits from a CDN
  cache in front (the delivery responses are public and cacheable).
- Production image build/push + EC2 roll is handled by the canonical pipeline
  (`.github/workflows/deploy.yml` → Amazon ECR → EC2 `docker compose pull`). No GHCR is used.
- Wire transactional email (`SMTP_*`) for admin password reset + member invites.
```
