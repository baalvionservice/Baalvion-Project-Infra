# Live-Sites Integration Runbook — login · email · CMS · payments

**Goal:** make every live Vercel frontend able to do real **login**, send **email/OTP**,
read **CMS** content, and take **payments** (Razorpay / UPI / PayU / card) against the
consolidated backend on EC2 (`baalvion-prod-01`, `13.206.116.65`, ap-south-1).

Architecture (unchanged): **frontends on Vercel → backend on EC2 behind Caddy.**
- `auth.baalvion.com` → identity (login / OTP / JWKS)
- `api.baalvion.com` → consumer/admin BFF (proxy-service) **+ new public carve-outs (below)**
- `admin.baalvion.com` → admin console (see the separate admin-web PR)
- payments JVM (`app-payments:3015`) runs under `--profile payments`

This runbook pairs with the repo-side changes already in the PR:
- `deploy/consolidated/caddy/Caddyfile` — public CMS + payment carve-outs on `api.baalvion.com`
- `deploy/consolidated/.env.production.example` — full `CORS_ORIGINS` reference value

---

## 0. The four shared blockers (found by probing prod 2026-06-24)

| # | Symptom (live) | Root cause | Fix type |
|---|----------------|-----------|----------|
| 1 | Cross-origin login blocked; preflight has no `Access-Control-Allow-Origin` | `CORS_ORIGINS` on the box = `localhost` | **box `.env`** |
| 2 | `api.baalvion.com/api/v1/public/*` → 401 | public CMS delivery was behind the session BFF; no carve-out | **repo (done)** + roll |
| 3 | `api.baalvion.com/v1/gateway/payments` → 401; no payment route | no edge route; payments JVM under optional profile | **repo (done)** + roll w/ profile |
| 4 | External users can't get OTP/receipts | Amazon SES in **sandbox** | **AWS** |

Fixes 2 and 3 are in the PR. Fixes 1 and 4 are operator actions below.

---

## 1. Box `.env` — CORS + payments (fix #1, enables #3)

SSH to the box, edit `/opt/baalvion-core/deploy/consolidated/.env`:

```bash
# 1a. CORS — paste the canonical value from deploy/consolidated/.env.production.example.
#     Every browser-facing origin (scheme+host, NO trailing slash, comma-separated, no spaces).
CORS_ORIGINS=https://app.baalvion.com,https://admin.baalvion.com,https://auth.baalvion.com,https://about.baalvion.com,https://ir.baalvion.com,https://mining.baalvion.com,https://jobs.baalvion.com,https://imperialpedia.com,https://www.imperialpedia.com,https://lawelitenetwork.com,https://www.lawelitenetwork.com,https://amarisemaisonavenue.com,https://www.amarisemaisonavenue.com,https://controlthemarket.com,https://www.controlthemarket.com,https://proxy.baalvionstack.com

# 1b. Payment provider GLOBAL fallback keys (per-site keys live in the CMS vault — §5).
#     Leave PSP_MOCK=true until real keys are in; flip to false to hit live PSPs.
PSP_MOCK=true
```

> `REFRESH_COOKIE_DOMAIN=.baalvion.com` is required for cross-subdomain SSO across the
> `*.baalvion.com` sites. The non-baalvion.com domains (imperialpedia.com,
> controlthemarket.com, amarisemaisonavenue.com, lawelitenetwork.com) get a **host-only**
> cookie — they sign in independently; that's expected.

## 2. Roll the stack WITH payments (fixes #2 and #3 go live)

```bash
cd /opt/baalvion-core
git fetch --all && git checkout main && git pull --ff-only   # after the PR merges
COMPOSE="docker compose --env-file deploy/consolidated/.env \
  -f deploy/consolidated/docker-compose.prod.yml \
  -f deploy/consolidated/docker-compose.ssl-override.yml"

# Bring up the payments JVM + its Kafka (adds ~1.9 GB RAM — see capacity note).
$COMPOSE --profile payments up -d app-payments kafka zookeeper
# Reload Caddy to pick up the new api.baalvion.com carve-outs.
$COMPOSE up -d caddy
```

**Capacity:** the box is `t4g.large` (8 GB). Adding payments+Kafka+ZK to the running
node fleet (~4 GB idle) lands near ~6–6.5 GB. Acceptable, but watch `docker stats`; the
RAM lever if it's tight is ElastiCache (move Redis off-box) or `t4g.xlarge`.

### Verify (should change 401 → 200/2xx)

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://api.baalvion.com/api/v1/public/about-baalvion/content   # → 200
curl -s -o /dev/null -w '%{http_code}\n' https://api.baalvion.com/v1/gateway/payments/health             # → not 401
# CORS now echoes the origin:
curl -s -D - -o /dev/null -X OPTIONS -H 'Origin: https://www.controlthemarket.com' \
  -H 'Access-Control-Request-Method: POST' https://auth.baalvion.com/auth/login | grep -i access-control-allow-origin
```

---

## 3. Amazon SES — production access (fix #4, unblocks ALL login/email)

Until this is done, **only `@baalvion.com` recipients receive mail** — real users can't get
OTP codes or receipts.

1. SES console (ap-south-1) → **Account dashboard → Request production access**.
2. Use case: transactional (login OTP, order receipts), expected volume, bounce/complaint
   handling. Approval is usually < 24h.
3. Confirm `baalvion.com` domain identity is **verified** (DKIM + SPF + DMARC). Keep the
   SMTP creds in the box `.env` (`SMTP_HOST=email-smtp.ap-south-1.amazonaws.com`, 587 STARTTLS).
4. Smoke: trigger an OTP to an external Gmail and confirm delivery.

---

## 4. AWS — pre-create the admin-web ECR repo (for the admin console PR)

The OIDC CI role can push under `baalvion/*` but **cannot create repos**. One-time, with admin creds:

```bash
aws ecr create-repository --repository-name baalvion/admin-web \
  --image-tag-mutability MUTABLE --image-scanning-configuration scanOnPush=true --region ap-south-1
```

---

## 5. Payments — per-site provider keys in the CMS vault

Each commerce site resolves PSP keys **per tenant slug** from the CMS "Integrations & Keys"
vault (encrypted at rest). Enter keys via the admin console (`admin.baalvion.com` → Integrations)
or the vault API. Supported: Razorpay (cards/UPI/netbanking), PayU, Cashfree.

| Site | Vault slug | Providers to enter |
|------|-----------|--------------------|
| controlthemarket.com | `control-the-market` | Razorpay + (Stripe intl) |
| amarisemaisonavenue.com | `amarise` | Razorpay (USD/EUR/GBP/INR) |
| *(others as they go commerce)* | site slug | Razorpay / PayU / Cashfree |

> Flip `PSP_MOCK=false` (box `.env`) only after real keys are in the vault for that slug, then
> roll `app-payments`. UPI rides on Razorpay/Cashfree — no separate integration.

---

## 6. Per-site Vercel env (template)

Set on each Vercel project (Project → Settings → Environment Variables), then redeploy:

```bash
# Auth (shared sign-in surface)
NEXT_PUBLIC_AUTH_URL=https://auth.baalvion.com
# CMS public delivery (now reachable after §2)
NEXT_PUBLIC_CMS_PUBLIC_URL=https://api.baalvion.com/api/v1/public
NEXT_PUBLIC_CMS_SITE_SLUG=<this site's slug>
# Backend API / BFF
NEXT_PUBLIC_API_URL=https://api.baalvion.com
# Payments (commerce sites)
NEXT_PUBLIC_PAYMENT_SITE_SLUG=<vault slug>
```

Known slugs: imperialpedia=`imperialpedia`, law=`law-elite-network`, about=`about-baalvion`,
IR=`ir`/leadership, amarisé=`amarise`, CTM=`control-the-market`.

**Per-site backend APIs not yet edge-exposed** (law/imperialpedia/jobs/ir/mining dynamic
endpoints live inside `app-ecosystem`/`app-platform` but have no public Caddy host yet). CMS +
auth + payments are shared-fixed by this runbook; the per-site dynamic APIs are the follow-up
slice — add one `*.baalvion.com` Caddy vhost (or `api.baalvion.com/<svc>/*` prefix) per service
as each site needs live (non-CMS) data.

---

## 7. Done-when checklist

- [ ] `CORS_ORIGINS` set on box; preflight echoes the origin (§2 verify)
- [ ] Stack rolled with `--profile payments`; Caddy reloaded
- [ ] `api.baalvion.com/api/v1/public/*` → 200; payment route → not 401
- [ ] SES production access granted; external OTP delivered
- [ ] admin-web ECR repo created; admin console PR merged + rolled
- [ ] Per-site Vercel env set + redeployed
- [ ] Per commerce site: vault keys entered, `PSP_MOCK=false`, test charge succeeds
