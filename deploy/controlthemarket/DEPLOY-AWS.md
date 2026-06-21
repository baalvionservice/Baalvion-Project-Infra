# Deploy `controlthemarket.com` to AWS (single EC2 + Docker Compose)

> ⚠️ **DEPRECATED — this standalone per-stack package is superseded by
> [`deploy/ec2-single-host/`](../ec2-single-host/), the ONE canonical production stack.**
> Production now follows **GitHub Actions → Amazon ECR → EC2 `docker compose pull`** (zero host
> builds, **zero GHCR**). The per-stack `deploy-controlthemarket.yml` workflow has been removed; the
> CTM image is built + pushed to ECR by [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml).
> See [`deploy/ec2-single-host/ECR-CICD.md`](../ec2-single-host/ECR-CICD.md) for the live pipeline,
> IAM policies, and secret names. This document is kept for historical reference only.

Production deploy of **ControlTheMarket** — its own standalone stack: the Next.js frontend
(`controlthemarket-web`) + its own backend (`ctm-service`) + Postgres, fronted by Caddy (TLS).
CTM does **not** use the central admin panel / CMS vault: Razorpay is handled directly by
`ctm-service`. Login/refresh proxy to the **central identity (SSO)** — read §0 first, it's the one
hard external dependency.

> **What only you can do** (I can't from the dev sandbox): create the EC2 + security group, point
> DNS at it, supply the **central auth RS256 public key** + **live Razorpay keys** + production
> secrets, and confirm the central identity is reachable. Everything else is the commands below.
> Treat the first deploy as a validation run — watch the logs at each step.

## Architecture (one host)
```
controlthemarket.com ─443→ Caddy ─┬─ /api/*  → ctm-service:3017  (CTM API + Razorpay webhook → Postgres)
  (TLS, Let's Encrypt)            └─ /*       → web:3000          (Next.js SSR; /auth-bff/* it rewrites
                                                                   to the central identity for SSO)
                          postgres  (schema `ctm`; internal compose network; no public port)
```

## 0. ⚠️ Auth model — central SSO (READ THIS FIRST)
`ctm-service` **verifies** login tokens; it does **not** mint them. This deploy uses the platform's
**central identity** for login/signup/refresh. Two things MUST be true or every authenticated CTM
action 401s:

CTM uses the **same SSO adapter as every other platform site**: `@baalvion/auth-sdk` on the
frontend (`/auth-bff/*` → central gateway) and `@baalvion/auth-node` on the backend (RS256 verify).

1. **The central identity must be deployed and reachable** at `AUTH_PROXY_TARGET`
   (default `https://api.baalvion.com/api/v1/identity/auth/v1/auth`). The Next.js server proxies
   `controlthemarket.com/auth-bff/*` there. If the central platform isn't live yet, CTM login won't
   work — you'd need to stand up the identity stack first (or switch CTM to bundle its own auth).
2. **The token-signing key must resolve.** PREFERRED: set `JWT_JWKS_URI` to the central auth's
   public `/.well-known/jwks.json` — the backend fetches the current key by `kid`, so rotation needs
   no redeploy (nothing to paste). A static `JWT_PUBLIC_KEY` is an optional fallback for when the
   JWKS endpoint is briefly unreachable; leave it blank to run JWKS-only. `JWT_ISSUER` / `JWT_AUDIENCE`
   must match the claims the central auth signs (`baalvion-auth` / `baalvion-platform` by default).
   Verify before go-live: `curl -s "$JWT_JWKS_URI"` returns `{"keys":[...]}`.

> **Cross-domain cookie check (the subtle one):** after sign-in, the central auth sets the
> `baalvion_refresh` httpOnly cookie via the same-origin `/auth-bff` proxy. For the browser to keep
> it on `controlthemarket.com`, the central auth must set it **host-only** (no `Domain=.baalvion.com`
> attribute). Verify in §6: sign up, then in DevTools → Application → Cookies confirm `baalvion_refresh`
> is present for `controlthemarket.com`. If it's missing, the central auth is scoping the cookie to a
> different domain and SSO won't establish a session here.

## 1. Prerequisites (you)
- An AWS account + a key pair for SSH.
- Control of DNS for `controlthemarket.com` (Route 53 or your registrar).
- The **central auth RS256 public key** (PEM) and confirmation the central identity is live.
- A **live Razorpay account** → `rzp_live_…` key id, key secret, and a webhook signing secret.
- Production secret values (generate with `openssl rand -hex 32`).

## 2. EC2 instance
- **AMI:** Ubuntu 22.04/24.04 LTS. **Type:** `t3.small` (2 vCPU / 2 GB) is enough for this stack
  (no Java/Kafka here); use `t3.medium` for comfortable headroom. **Disk:** 20 GB gp3.
- **Elastic IP:** allocate one and associate it (stable IP → stable DNS).
- **Security group (inbound):** `22` from your IP only; `80` + `443` from `0.0.0.0/0`. Nothing else
  (Postgres stays internal to Docker).

## 3. DNS (Route 53)
- `A` record: `controlthemarket.com` → the Elastic IP. (If you also want `www`, add a `www` A/ALIAS
  and a redirect — not required for go-live.)
- Verify before continuing: `dig +short controlthemarket.com` returns your IP. (Caddy's TLS issuance
  fails until DNS resolves publicly.)

## 4. Host setup
```bash
ssh ubuntu@<elastic-ip>
sudo apt-get update && sudo apt-get install -y docker.io docker-compose-plugin git
sudo usermod -aG docker ubuntu && newgrp docker
sudo mkdir -p /opt/baalvion && sudo chown "$USER" /opt/baalvion
git clone <YOUR_REPO_URL> /opt/baalvion && cd /opt/baalvion
sudo systemctl enable docker      # survive reboots
```
(Clone to **/opt/baalvion** — the CI deploy workflow in §9 expects the repo there. No host Node/pnpm
needed: both images build inside Docker.)

## 5. Secrets file
```bash
cp deploy/controlthemarket/.env.prod.example deploy/controlthemarket/.env.prod
# Edit and fill EVERY __CHANGE_ME__:
#   POSTGRES_PASSWORD / DB_PASSWORD (same value),
#   JWT_JWKS_URI    (central auth's public /.well-known/jwks.json — confirm it returns {"keys":[...]}),
#   RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET / RAZORPAY_WEBHOOK_SECRET,
#   ACME_EMAIL, and confirm AUTH_PROXY_TARGET points at the LIVE central auth.
nano deploy/controlthemarket/.env.prod
```
JWKS needs nothing pasted — just confirm the URL resolves: `curl -s "$JWT_JWKS_URI"` → `{"keys":[...]}`.
If you instead want the optional static-key fallback, produce the single-line PEM and set it as
`JWT_PUBLIC_KEY` (otherwise leave it blank for JWKS-only):
```bash
awk 'NF {printf "%s\\n", $0}' /path/to/central-auth-public-key.pem
```

## 6. Bring up the stack
```bash
cd /opt/baalvion
docker compose --env-file deploy/controlthemarket/.env.prod \
  -f deploy/controlthemarket/docker-compose.prod.yml up -d --build
docker compose -f deploy/controlthemarket/docker-compose.prod.yml ps
```
First build compiles the Next.js app (a few minutes). Watch logs:
```bash
docker compose -f deploy/controlthemarket/docker-compose.prod.yml logs -f ctm-service web caddy
```
- **Schema:** `ctm-service` auto-creates the `ctm` schema and syncs its tables on boot
  (`CREATE SCHEMA IF NOT EXISTS ctm` + Sequelize `sync`). Confirm `[DB] Connected and schema synced`
  in its logs — no manual migration step for the first deploy.

## 7. Razorpay dashboard webhook
- Razorpay Dashboard → **Settings → Webhooks → Add**:
  - URL: `https://controlthemarket.com/api/v1/payments/webhook`
  - Secret: the SAME value as `RAZORPAY_WEBHOOK_SECRET` in `.env.prod`.
  - Events: `payment.captured`, `order.paid` (and `payment.failed` if you want failure handling).
- The webhook is signature-verified server-side (raw body is preserved through Caddy), so the secret
  must match exactly.

## 8. Verify (go-live smoke test)
```bash
# Backend reachable through Caddy (provider status is a light, optional-auth endpoint):
curl -sS https://controlthemarket.com/api/v1/payments/provider          # 200 JSON {provider:"razorpay",...}
# Frontend home renders with valid TLS:
curl -sS -o /dev/null -w '%{http_code}\n' https://controlthemarket.com/  # 200
```
Then in a browser at `https://controlthemarket.com`:
1. **Sign up / log in** → confirm you land in the app (this exercises the central SSO via /auth-bff).
2. DevTools → Application → Cookies → confirm `baalvion_refresh` is set for `controlthemarket.com`
   (the §0 cross-domain check). If absent, fix the central auth cookie domain before launch.
3. Walk a **company billing → Razorpay checkout** with a real card (small amount) → confirm
   "paid", an active subscription/invoice, and a `payment.captured` delivery (200) in the Razorpay
   dashboard. Tail logs: `docker compose ... logs ctm-service | grep -i webhook`.

## 9. CI/CD — one `git push` deploys (after the first manual deploy)
Steps 1–8 are the **one-time** setup. After that, the workflow
[`.github/workflows/deploy-controlthemarket.yml`](../../.github/workflows/deploy-controlthemarket.yml)
auto-deploys on every push to `main` that touches the CTM stack (or via "Run workflow"). It builds +
pushes the two images (web + ctm-service) to GHCR (cached), then SSHes the EC2 to
`docker compose pull` + `up -d --no-build` + restart Caddy.

**GitHub repo settings → Secrets and variables → Actions** (add these):
| Secret | Value |
|---|---|
| `CTM_PROD_HOST` | EC2 Elastic IP / hostname |
| `CTM_PROD_USER` | SSH user (e.g. `ubuntu`) |
| `CTM_PROD_SSH_KEY` | private key whose public half is in the EC2's `~/.ssh/authorized_keys` |

**Amazon ECR pull access on the EC2** (so `docker compose pull` works): attach the **read-only ECR
instance role** to the EC2 (`AmazonEC2ContainerRegistryReadOnly`, scoped to `baalvion/*`). The host
then pulls with **no stored credentials** — `aws ecr get-login-password | docker login` uses the
instance role. Full IAM policy: [`ECR-CICD.md` §3B](../ec2-single-host/ECR-CICD.md).

`IMAGE_PREFIX` in `.env.prod` must equal the ECR registry the canonical pipeline pushes to
(`<account>.dkr.ecr.<region>.amazonaws.com/baalvion`). No GHCR login / PAT is required anywhere.

> The workflow assumes §1–7 are already done on the EC2 (repo at `/opt/baalvion`, `.env.prod`
> present). It updates images — it does not bootstrap a fresh host. The frontend's `NEXT_PUBLIC_*`
> are baked at build time in the workflow (the prod origin), so changing the domain means editing the
> workflow's build args.

## 10. Operate
- Logs: `docker compose -f deploy/controlthemarket/docker-compose.prod.yml logs -f <svc>`
- Update (manual): `git pull` → `up -d --build` (or just let CI do it on push to `main`).
- **Backups:** schedule `pg_dump` of `baalvion_db` (schema `ctm`) to S3 — `pgdata` is the only
  stateful volume besides Caddy's certs. Snapshot the EBS volume too.
- Services use `restart: unless-stopped`; Docker is enabled on boot (§4).

## Hardening backlog (post-launch)
- Move Postgres → **RDS** (point `DB_HOST`/`DB_PORT` at the endpoint; drop the `postgres` service).
- Replace Sequelize `sync` with explicit migrations before the schema evolves in production
  (`sync({alter:false})` won't apply destructive/altering changes safely).
- Rate-limit and add abuse controls on `POST /api/v1/payments/webhook` and auth endpoints; alarm on
  5xx + payment failures (CloudWatch).
- Put the EC2 behind an **ALB + AWS WAF**; ship logs to CloudWatch.
- If you later want CTM fully self-contained (no central-platform dependency), bundle the identity
  stack (`auth-service`) into this compose and point `AUTH_PROXY_TARGET` at it.
