# Deploy the Company Dashboard to AWS (single EC2 + Docker Compose)

Production deploy of the **company-unified-dashboard** as a **self-contained identity slice**: the
dashboard SPA/SSR + its own auth (auth-service mints RS256), the BFF cookie gateway, dashboard-service,
Postgres, and Redis. One EC2 host runs everything via `docker-compose.prod.yml`; Caddy terminates TLS.
This is the right shape for ONE dashboard — when you host many sites, graduate to the Kubernetes
platform in `Backend/infra/`.

```
dashboard.yourdomain.com ─443─> Caddy ─ /* → web:3024 (Next.js SSR)
  (TLS, Let's Encrypt)                         ├─ /auth-bff/* ─(Next rewrite)→ auth-gateway:3099 /auth/*
                                               └─ /api-bff/*  ─(Next rewrite)→ auth-gateway:3099 /api/*
   auth-gateway ─→ auth-service:3001 (login/refresh/me + JWKS) · dashboard-service:3009 (data)
   postgres · redis   (internal compose network; no public ports)
```

> **What only you can do** (I can't from the dev sandbox): create the EC2 + security group, point
> DNS at it, and supply production secrets. Everything else is the commands below. Treat the first
> deploy as a validation run — watch the logs at each step.

## 0. Prerequisites (you)
- An AWS account + an SSH key pair.
- Control of DNS for your domain (Route 53 or your registrar).
- Production secret values (generate with `openssl rand -hex 32`).

## 1. EC2 instance
- **AMI:** Ubuntu 22.04/24.04 LTS. **Type:** `t3.medium` (2 vCPU / 4 GB) is plenty — this slice has
  no Java/Kafka. **Disk:** 20 GB gp3.
- **Elastic IP:** allocate + associate one (stable IP → stable DNS across restarts).
- **Security group (inbound):** `22` from your IP only; `80` + `443` from `0.0.0.0/0`. Nothing else
  (Postgres/Redis stay internal to Docker).

## 2. DNS
- `A` record: `dashboard.yourdomain.com` → the Elastic IP.
- Verify before continuing: `dig +short dashboard.yourdomain.com` returns your IP. (Caddy's TLS
  issuance fails until DNS resolves publicly.)

## 3. Host setup
```bash
ssh ubuntu@<elastic-ip>
sudo apt-get update && sudo apt-get install -y docker.io docker-compose-plugin git
sudo usermod -aG docker ubuntu && newgrp docker
# Node 20 + pnpm — needed only to GENERATE the RS256 keypair host-side (optional; you can also
# generate it on your laptop and just paste the PEMs into .env.prod).
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs
sudo corepack enable
sudo mkdir -p /opt/baalvion && sudo chown "$USER" /opt/baalvion
git clone <YOUR_REPO_URL> /opt/baalvion && cd /opt/baalvion
```

## 4. RS256 signing keypair (auth-service mints access/refresh tokens with it)
Generate on your laptop or the host, then paste BOTH halves into `.env.prod` as single-line,
`\n`-escaped PEM:
```bash
cd Backend/services/identity/auth-service && npm run generate-keys   # writes keys/private.pem + keys/public.pem
awk 'NF {printf "%s\\n", $0}' keys/private.pem   # → JWT_PRIVATE_KEY
awk 'NF {printf "%s\\n", $0}' keys/public.pem    # → JWT_PUBLIC_KEY
cd /opt/baalvion
```

## 5. Secrets file
```bash
cp deploy/company-dashboard/.env.prod.example deploy/company-dashboard/.env.prod
nano deploy/company-dashboard/.env.prod
```
Fill EVERY `__CHANGE_ME__`:
- `DOMAIN`, `ACME_EMAIL`
- `POSTGRES_PASSWORD` (use the SAME value the file references; it is the DB password)
- `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY` (from §4)
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `GATEWAY_SIGNING_SECRET` (`openssl rand -hex 32` each)
- `SUPERADMIN_EMAIL`, `SUPERADMIN_PASSWORD` (your admin login — used by the bootstrap in §7)

## 6. Bring up the stack
```bash
cd /opt/baalvion
docker compose --env-file deploy/company-dashboard/.env.prod \
  -f deploy/company-dashboard/docker-compose.prod.yml up -d --build
docker compose -f deploy/company-dashboard/docker-compose.prod.yml ps
```
First build pulls Node images + runs `turbo prune` per service; give it a few minutes. `auth-service`
will log DB errors until you run the migrations in the next step (it retries — that's expected).
`dashboard-service` self-creates its `dashboard` schema on boot (Sequelize `sync`).

## 7. Database migrations + super-admin (one-time, on a fresh DB)
**a) Apply the auth schema.** The repo's `migrate:auth` npm script is STALE (it skips 005–008a,
including `006_user_platform_role.sql`). Apply ALL of them, in order, straight into the DB container:
```bash
source deploy/company-dashboard/.env.prod
CF="-f deploy/company-dashboard/docker-compose.prod.yml"
for f in Backend/services/identity/auth-service/migrations/00{1,2,3,4,5,6,7,8}*.sql; do
  echo ">> $f"
  docker compose $CF exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 < "$f"
done
# 009 is tenant RLS — optional for this admin slice (services connect as the DB owner, which bypasses
# RLS). Apply it best-effort; ignore errors if it references an app role you didn't provision:
docker compose $CF exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  < Backend/services/identity/auth-service/migrations/009_rls_tenant_isolation.sql || true
```
**b) Create the platform super-admin** (idempotent; runs inside the auth-service container so it uses
the same argon2 hashing + DB the service uses):
```bash
docker compose $CF exec \
  -e SUPERADMIN_EMAIL="$SUPERADMIN_EMAIL" -e SUPERADMIN_PASSWORD="$SUPERADMIN_PASSWORD" \
  auth-service node scripts/bootstrapSuperAdmin.js
```
This creates the user + an org + a `super_admin` membership → the login token carries
`roles:["super_admin"]`, which the dashboard maps to the full **Admin** view.

## 8. Verify (go-live smoke test)
```bash
curl -sS -o /dev/null -w '%{http_code}\n' https://dashboard.yourdomain.com/auth/login   # 200, valid TLS
# Login through the same-origin BFF and confirm cookies + data:
curl -sS -c /tmp/j.txt -X POST https://dashboard.yourdomain.com/auth-bff/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$SUPERADMIN_EMAIL\",\"password\":\"$SUPERADMIN_PASSWORD\"}"          # {"user":...}
curl -sS -b /tmp/j.txt https://dashboard.yourdomain.com/auth-bff/me                      # identity + permissions
curl -sS -b /tmp/j.txt https://dashboard.yourdomain.com/api-bff/dashboard/v1/dashboard/total  # {"success":true,...}
```
Then in a browser at `https://dashboard.yourdomain.com`: sign in with the super-admin → you should
land on `/dashboard` (Admin view), not bounce back to login. Data panels show zeros until business
data is added — that is expected, not an error.

## 9. Operate
- Logs: `docker compose -f deploy/company-dashboard/docker-compose.prod.yml logs -f <svc>`
  (`web`, `auth-gateway`, `auth-service`, `dashboard-service`).
- Update: `git pull` → `docker compose ... up -d --build`.
- **Backups:** schedule `pg_dump` of the DB to S3 (the `pgdata` volume is the only stateful store
  besides Caddy's certs + the `redisdata` cache). Snapshot the EBS volume too.
- Restart on reboot: services use `restart: unless-stopped`; enable Docker on boot
  (`sudo systemctl enable docker`).

## 10. Common gotchas (already handled in this package, here for debugging)
- **Login works but every page bounces to /auth/login:** the route-gate middleware checks for the
  gateway's refresh cookie by name. The web image is built with
  `NEXT_PUBLIC_REFRESH_COOKIE_NAME=baalvion_refresh` to match the gateway's `COOKIE_REFRESH_NAME`.
  If you change one, change both (and rebuild `web`).
- **Data calls 401 "Bearer token required":** the gateway must run `BFF_ENFORCEMENT_MODE=hybrid`
  (set in the compose) so it forwards the RS256 Bearer to dashboard-service. Do NOT set
  `GATEWAY_SIGNING_SECRET` on dashboard-service, or it takes the header-trust path with empty
  permissions.
- **`/auth-bff` / `/api-bff` 502:** the dashboard's `NEXT_PUBLIC_GATEWAY_URL` runtime env must point
  at the internal gateway (`http://auth-gateway:3099`) — it is set in the compose.

## 11. Hardening backlog (post-launch)
- Move Postgres → **RDS** and Redis → **ElastiCache** (point `DB_HOST`/`REDIS_HOST` at them; drop
  those services from the compose). 
- Put the EC2 behind an **ALB + AWS WAF**; ship logs to CloudWatch; alarm on 5xx.
- Add `session-service` if you want the standalone session-management / anomaly surface.
- Wire transactional email (SMTP_*) for password reset + member invites.
- Add a CI workflow (mirror `.github/workflows/deploy-proxy-baalvionstack.yml`) to build+push the 3
  images to GHCR and `docker compose pull && up -d` on the EC2 on each push.
```
