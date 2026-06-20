# Deploy `proxy.baalvionstack.com` to AWS (single EC2 + Docker Compose)

> ⚠️ **DEPRECATED — this standalone per-stack package is superseded by
> [`deploy/ec2-single-host/`](../ec2-single-host/), the ONE canonical production stack.**
> Production now follows **GitHub Actions → Amazon ECR → EC2 `docker compose pull`** (zero host
> builds, **zero GHCR**). The per-stack `deploy-proxy-baalvionstack.yml` workflow has been removed;
> the proxy images are built + pushed to ECR by [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml).
> See [`deploy/ec2-single-host/ECR-CICD.md`](../ec2-single-host/ECR-CICD.md) for the live pipeline,
> IAM policies, and secret names. Kept for historical reference only.

Production deploy of the **proxy purchase stack** (the flow verified locally: pricing → signup →
checkout → **real Razorpay charge** → active subscription). One EC2 host runs everything via
`docker-compose.prod.yml`; Caddy terminates TLS and serves the SPA. This is the right shape for ONE
site — when you add more sites, graduate to the Kubernetes platform in `Backend/infra/`.

> **What only you can do** (I can't from the dev sandbox): create the EC2 + security group, point
> DNS at it, and supply **live Razorpay keys** + production secrets. Everything else is the commands
> below. Treat the first deploy as a validation run — watch the logs at each step.

## Architecture (one host)
```
proxy.baalvionstack.com ─443─> Caddy ─┬─ /            → static SPA (Frontend/Proxy-BaalvionStack/dist)
  (TLS, Let's Encrypt)                ├─ /auth-bff/*  → proxy-service:4000 /v1/auth/*
                                      └─ /v1/*         → proxy-service:4000  (billing/checkout, webhook, …)
                                                           └─> payment-service:3015 (Java PSP) ─> CMS vault ─> Razorpay
cms.baalvion.com        ─443─> Caddy ──── /api/v1/public/* → cms-service:3011  (read-only content API)
  (feeds the Vercel sites: about.baalvion.com, … at build + ISR time)
            postgres · redis · kafka+zookeeper  (internal compose network; no public ports)
```

## 0. Prerequisites (you)
- An AWS account + a key pair for SSH.
- Control of DNS for `baalvionstack.com` (Route 53 or your registrar).
- **Live Razorpay account** → `rzp_live_…` key id, key secret, and a webhook signing secret.
- Production secret values (generate with `openssl rand -hex 32`).

## 1. EC2 instance
- **AMI:** Ubuntu 22.04/24.04 LTS. **Type:** `t3.large` (2 vCPU / 8 GB) minimum — the Java
  payment-service + Kafka want headroom. **Disk:** 30 GB gp3.
- **Elastic IP:** allocate one and associate it (so the IP survives restarts → stable DNS).
- **Security group (inbound):** `22` from your IP only; `80` + `443` from `0.0.0.0/0`. Nothing else
  (Postgres/Redis/Kafka stay internal to Docker).

## 2. DNS (Route 53)
- `A` record: `proxy.baalvionstack.com` → the Elastic IP.
- Verify before continuing: `dig +short proxy.baalvionstack.com` returns your IP. (Caddy's TLS
  issuance fails until DNS resolves publicly.)

## 3. Host setup
```bash
ssh ubuntu@<elastic-ip>
sudo apt-get update && sudo apt-get install -y docker.io docker-compose-plugin git
sudo usermod -aG docker ubuntu && newgrp docker
# Node 20 + pnpm (needed only to BUILD the SPA + run DB migrations host-side)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs
sudo corepack enable
sudo mkdir -p /opt/baalvion && sudo chown "$USER" /opt/baalvion
git clone <YOUR_REPO_URL> /opt/baalvion && cd /opt/baalvion
```
(Clone to **/opt/baalvion** — the CI deploy workflow in §13 expects the repo there.)

## 4. Secrets file
```bash
cp deploy/proxy-baalvionstack/.env.prod.example deploy/proxy-baalvionstack/.env.prod
# Edit and fill EVERY __CHANGE_ME__: DB password, INTERNAL_SERVICE_SECRET, CMS_SECRETS_KEY,
# JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, RAZORPAY_KEY_ID/SECRET/WEBHOOK_SECRET, ACME_EMAIL.
nano deploy/proxy-baalvionstack/.env.prod
```

## 5. RS256 signing keypair (proxy-service mints access tokens with it)
```bash
mkdir -p deploy/proxy-baalvionstack/secrets/keys
node Backend/services/infrastructure/proxy-service/scripts/generateKeys.js baalvion-key-1
# move the generated keypair into the mounted secrets dir:
mv Backend/services/infrastructure/proxy-service/config/keys/baalvion-key-1.* \
   deploy/proxy-baalvionstack/secrets/keys/
chmod 600 deploy/proxy-baalvionstack/secrets/keys/baalvion-key-1.key
```
`JWT_ACTIVE_KID` in `.env.prod` must match the kid (`baalvion-key-1`).

## 6. Build the SPA with production config
```bash
cat > Frontend/Proxy-BaalvionStack/.env.production <<'EOF'
VITE_API_PLATFORM_BASE_URL=https://proxy.baalvionstack.com/v1
VITE_APP_URL=https://proxy.baalvionstack.com
EOF
( cd Frontend/Proxy-BaalvionStack && pnpm install && pnpm build )   # → dist/ (Caddy serves it)
```
(The SPA is same-origin in prod: it calls `/v1/*` and `/auth-bff/*` on this host; Caddy proxies
them. The CSP is set by Caddy, not Vite.)

## 7. Bring up the stack
```bash
cd /opt/baalvion
docker compose --env-file deploy/proxy-baalvionstack/.env.prod \
  -f deploy/proxy-baalvionstack/docker-compose.prod.yml up -d --build
docker compose -f deploy/proxy-baalvionstack/docker-compose.prod.yml ps
```
First build is slow (Java payment-service runs a full Maven build in its image). Watch logs:
`docker compose -f deploy/proxy-baalvionstack/docker-compose.prod.yml logs -f payment-service`.

## 8. Database migrations / schema
- **payment-service** self-migrates (Flyway, `flyway_history_payment`) on boot — confirm in its logs.
- **cms-service** + **proxy-service** (Sequelize): run their migrations against the DB. Simplest:
  temporarily add `ports: ["5432:5432"]` to the `postgres` service, then host-side
  `pnpm --filter @baalvion/cms-service migrate` / proxy-service's migrate script (see each service's
  README), then REMOVE the postgres port mapping. Verify the `cms`, `auth`/proxy, and `payments`
  schemas exist before taking traffic.

## 9. Seed the CMS payment vault (LIVE keys for this site)
The webhook + checkout resolve provider keys from the CMS vault keyed by `proxy-baalvionstack`.
On a fresh DB you must (a) create the CMS website `proxy-baalvionstack` and (b) add its **Razorpay
live** integration (`mode: live`, your `rzp_live_…` keys). Do this through the **admin console**
(CMS → Websites → add `proxy-baalvionstack` → Integrations & Keys → Razorpay → paste live keys), the
intended product flow. The keys are AES-encrypted at rest with `CMS_SECRETS_KEY`.
> Note: `configureSandboxPayments.cjs` is sandbox-only (it refuses non-`rzp_test_` keys) — use the
> console for live keys.

## 10. Razorpay dashboard webhook
- Razorpay Dashboard → **Settings → Webhooks → Add**:
  - URL: `https://proxy.baalvionstack.com/v1/billing/webhook/razorpay`
  - Secret: the SAME value as `RAZORPAY_WEBHOOK_SECRET` in `.env.prod`.
  - Events: `payment.captured`, `order.paid`.
- This is the authoritative activation path; it's signature-verified and idempotent.

## 11. Verify (go-live smoke test)
```bash
curl -sS https://proxy.baalvionstack.com/v1/public/plans            # 200 + the 3 plans
curl -sS -o /dev/null -w '%{http_code}\n' https://proxy.baalvionstack.com/   # 200, valid TLS
```
Then in a browser at `https://proxy.baalvionstack.com`: sign up → checkout → pay with a **real card**
(small amount first) → confirm "Payment Successful", an `active` subscription, and a `payment.captured`
delivery (200) in the Razorpay dashboard. Check `docker compose ... logs proxy-service | grep billing-webhook`.

## 12. Operate
- Logs: `docker compose -f deploy/proxy-baalvionstack/docker-compose.prod.yml logs -f <svc>`
- Update: `git pull` → rebuild SPA (§6) → `up -d --build`
- **Backups:** schedule `pg_dump` of `baalvion_db` to S3 (the `pgdata` volume is the only stateful
  store besides Caddy's certs). Snapshot the EBS volume too.
- Restart on reboot: services use `restart: unless-stopped`; enable Docker on boot
  (`sudo systemctl enable docker`).

## 13. CI/CD — one `git push` deploys (after the first manual deploy)
Steps 1–12 are the **one-time** setup. After that, the workflow
[`.github/workflows/deploy-proxy-baalvionstack.yml`](../../.github/workflows/deploy-proxy-baalvionstack.yml)
auto-deploys on every push to `main` that touches the proxy stack (or via "Run workflow"). It:
1. builds the SPA on the runner, 2. builds + pushes the 3 backend images to GHCR (cached), 3. SSHes
the EC2 to `rsync` the SPA, `docker compose pull`, `up -d --no-build`, and restart Caddy.

**GitHub repo settings → Secrets and variables → Actions** (add these):
| Secret | Value |
|---|---|
| `PROD_HOST` | EC2 Elastic IP / hostname |
| `PROD_USER` | SSH user (e.g. `ubuntu`) |
| `PROD_SSH_KEY` | private key whose public half is in the EC2's `~/.ssh/authorized_keys` |

**Amazon ECR pull access on the EC2** (so `docker compose pull` works): attach the **read-only ECR
instance role** to the EC2 (`AmazonEC2ContainerRegistryReadOnly`, scoped to `baalvion/*`). The host
then pulls with **no stored credentials**. Full IAM policy: [`ECR-CICD.md` §3B](../ec2-single-host/ECR-CICD.md).

`IMAGE_PREFIX` in `.env.prod` must equal the ECR registry the canonical pipeline pushes to
(`<account>.dkr.ecr.<region>.amazonaws.com/baalvion`). No GHCR login / PAT is required anywhere.

> The workflow assumes §1–9 are already done on the EC2 (repo at `/opt/baalvion`, `.env.prod`
> present, RS256 keys mounted, DB migrated, vault seeded). It updates code/images — it does not
> bootstrap a fresh host.

## 14. Serve the CMS publicly for the Vercel sites (about.baalvion.com)

`about.baalvion.com` (and the other Next.js sites) are hosted on **Vercel**, but their pages are
built from the **central CMS** at build + ISR time. The CMS already runs in this compose
(`cms-service`, internal-only); these steps expose its **read-only** public API at `cms.baalvion.com`
so Vercel can reach it. Without this, the Vercel build can't fetch content and bakes a permanent
"Service Temporarily Unavailable" page (which is exactly what about.baalvion.com shows today).

> Only the unauthenticated `/api/v1/public/*` routes are exposed (the Caddyfile `{$CMS_DOMAIN}`
> block). The admin/write API and the internal key-vault resolver stay on the compose network.

### 14a. DNS
- `A` record: `cms.baalvion.com` → the **same** Elastic IP. Verify: `dig +short cms.baalvion.com`.
  (Caddy's TLS issuance for this host fails until it resolves publicly. Port 443 is already open.)

### 14b. Env + restart
Add to `deploy/proxy-baalvionstack/.env.prod` (template values are in `.env.prod.example`):
```bash
CMS_DOMAIN=cms.baalvion.com
CMS_CORS_ORIGINS=https://about.baalvion.com
# Single-line PEM of proxy-service's RS256 public half (generated in §5) — cms-service
# requires JWT_PUBLIC_KEY at boot even though the public read API is unauthenticated:
CMS_JWT_PUBLIC_KEY="$(awk 'NF {printf "%s\\n", $0}' deploy/proxy-baalvionstack/secrets/keys/baalvion-key-1.pub)"
```
Then restart the two affected services:
```bash
docker compose --env-file deploy/proxy-baalvionstack/.env.prod \
  -f deploy/proxy-baalvionstack/docker-compose.prod.yml up -d cms-service caddy
```
Verify the API is live and TLS issued:
```bash
curl -sS https://cms.baalvion.com/api/v1/health                  # {"status":"ok",...}
curl -sS https://cms.baalvion.com/api/v1/public/about-baalvion   # website info, or 404 until seeded (14c)
```

### 14c. Seed the about-baalvion content into the prod CMS
The prod CMS DB is fresh — it has no `about-baalvion` website yet, so the public API 404s and the
homepage stays on the maintenance shell. Get the content in by ONE of:

- **(Recommended) Run the maintained seed script via the admin API.** `scripts/seedAboutBaalvion.cjs`
  logs in to `auth-service`, then POSTs to the CMS admin API — so this path needs `auth-service`
  reachable and `cms-service`'s `JWT_PUBLIC_KEY` matching its issuer. If you aren't running the full
  identity stack on this host, bring `auth-service` up temporarily (or point `AUTH_URL`/`CMS_URL` at a
  host where the admin stack runs) and run:
  ```bash
  AUTH_URL=<auth>/v1/auth CMS_URL=<cms>/api/v1 \
    SUPERADMIN_EMAIL=… SUPERADMIN_PASSWORD=… ABOUT_WEBSITE_ID=<uuid> \
    node Backend/services/knowledge/cms-service/scripts/seedAboutBaalvion.cjs
  ```
  It is idempotent (re-running updates in place). Also run `seedAboutAuthority.cjs` for the
  /services, /industries, /case-studies, /about pages.

- **(Alternative) Copy the content rows from your local CMS DB.** `pg_dump` the `about-baalvion`
  website + its `cms` content/category/section rows from local and load them into the prod DB. Scope
  it to that website's rows — do **NOT** wholesale-replace the `cms` schema, or you'll clobber the
  `proxy-baalvionstack` payment-vault rows already there.

After seeding, confirm the home content resolves:
```bash
curl -sS https://cms.baalvion.com/api/v1/public/about-baalvion/content/home   # title/sections JSON
```

### 14d. Point Vercel at the CMS and redeploy
In the Vercel **about-baalvion-web** project → Settings → Environment Variables (Production):
```
CMS_PUBLIC_URL   = https://cms.baalvion.com/api/v1/public
CMS_WEBSITE_SLUG = about-baalvion
```
Then **Redeploy with build cache cleared** (uncheck "Use existing Build Cache") so `/` is rebuilt and
prerendered from the live CMS. The maintenance page disappears once the build's `getHomePageData()`
succeeds; ISR (`revalidate: 3600`) keeps it fresh hourly thereafter.

> Repeat 14c–14d per site (IR, Law-Elite, …): seed its website slug into the CMS, then set that
> Vercel project's `CMS_PUBLIC_URL` to the same host with its own `CMS_WEBSITE_SLUG`.

## Hardening backlog (post-launch)
- Move Postgres → **RDS** and Redis → **ElastiCache** (point `DB_HOST`/`REDIS_HOST` at them; drop
  those services from compose). Kafka → **MSK** when scaling.
- Rate-limit `POST /v1/auth/register`; add a trial-expiry job; enforce email verification.
- Put the EC2 behind an **ALB + AWS WAF**; ship logs to CloudWatch; alarm on 5xx + payment failures.
- For MULTIPLE sites: switch to the `Backend/infra/` Kubernetes/Helm/ArgoCD platform.
