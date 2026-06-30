# Payments Go-Live Runbook (consolidated 4 GiB box)

Authoritative operator runbook to take payments from sandbox to **live customer charges**
on the consolidated single-host stack (`baalvion-prod-01`, RDS + on-box Redis/Caddy).

Companion to the hardening landed in commit `19c6be4c`
(`fix(payments): production-harden billing path …`) on `fix/payments-online-4gb-box`.

> Everything below is **operator / external** work: it needs SSH to the prod box, AWS/CI
> access, real merchant credentials, and SES production approval. None of it can be done
> from a developer workstation. The code/repo side is already done and verified.

---

## 0. Pre-flight (what the code change already guarantees)

- The Node fulfillment endpoint (`proxy-service/controller/internalFulfillController.js`)
  is **committed** (since `abf1b48a`) and is baked into the image by `Dockerfile.node`
  (`COPY Backend ./Backend`). **Rebuilding the `baalvion/backend` image from a commit that
  includes it removes the need for the `docker cp` hotfix entirely.**
- `docker-compose.prod.yml` `app-payments` is now **fully env-driven** — no untracked
  `docker-compose.payments-override.yml` is needed. Image, security, and mock posture all
  come from `.env`. Secure defaults: `APP_SECURITY_ENABLED=true`, `PSP_MOCK=false`.

---

## 1. Rebuild + deploy the Node backend image (closes the hotfix drift — Task 1)

```bash
# On CI (preferred) or the box. Build context = repo root.
export IMAGE_TAG=prod-$(git rev-parse --short HEAD)        # a sha that contains abf1b48a + 19c6be4c
docker build -f deploy/consolidated/Dockerfile.node -t $ECR_REGISTRY/baalvion/backend:$IMAGE_TAG .
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin $ECR_REGISTRY
docker push $ECR_REGISTRY/baalvion/backend:$IMAGE_TAG

# On the box: pin the tag and recreate the edge-realtime app (holds proxy-service).
cd /opt/baalvion-core/deploy/consolidated
sed -i "s/^IMAGE_TAG=.*/IMAGE_TAG=$IMAGE_TAG/" .env
docker compose --env-file .env -f docker-compose.prod.yml up -d --no-deps --force-recreate app-edge-realtime

# Verify the baked endpoint is present (no docker cp anywhere):
docker compose exec app-edge-realtime sh -lc \
  'test -f Backend/services/infrastructure/proxy-service/controller/internalFulfillController.js && echo BAKED'
curl -fsS http://127.0.0.1:4000/health && echo OK
```

The JVM payment image is built the same way via `deploy/consolidated/Dockerfile.java`; set
`PAYMENTS_IMAGE` in `.env` to the exact ECR ref that was built (e.g. the
`core-payment-service` repo while `deploy.yml` is wedged).

## 2. Apply the invoice-dedup migration (Task 5/10)

```bash
# One-shot, like 028/029. Idempotent + safe on existing data (partial index, NULL-exempt).
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f Backend/database/migrations/030_invoices_payment_ref.sql
psql "$DATABASE_URL" -c "\d+ public.invoices" | grep payment_ref   # confirm column + uq index
```

## 3. Flip to live PSP mode (Task 3) — **external: needs real merchant credentials**

Live keys come **only** from the CMS vault (per-site) or `.env` (global) — never hardcoded.
Per live site (`proxy-baalvionstack`, and each site that transacts), in the central admin
panel → CMS → Websites → Integrations & Keys, set for each provider:

| Provider  | Required secrets (validate all)                                   |
|-----------|-------------------------------------------------------------------|
| Razorpay  | `keyId`, `keySecret`, `webhookSecret`, mode=`live`                |
| PayU      | `merchantKey`, `merchantSalt`, mode=`production`                  |

Then on the box:

```bash
sed -i 's/^PSP_MOCK=.*/PSP_MOCK=false/' .env
grep -E 'PSP_MOCK|APP_SECURITY_ENABLED' .env          # PSP_MOCK=false, APP_SECURITY_ENABLED=true
docker compose --env-file .env -f docker-compose.prod.yml --profile payments up -d --force-recreate app-payments
docker compose exec app-payments sh -lc 'wget -qO- http://127.0.0.1:3015/actuator/health'   # UP
```

Validate (the JVM `PspConfigResolver` enforces these per-tenant): merchant id/key/salt,
webhook secret, currency (server-pinned USD), amount (server-computed), environment=live,
and **site isolation** (`?site=<slug>` selects the tenant's vault entry).

## 4. Configure provider webhooks → live edge (Task 4)

In each provider dashboard, point the webhook URL at the live edge and copy the signing
secret back into the vault (step 3):

- Razorpay: `https://api.baalvion.com/v1/gateway/webhooks/razorpay` (events: `payment.captured`, `order.paid`)
- PayU: surl/furl `https://app.baalvion.com/checkout/return` (S2S verified by SHA-512 reverse hash)

Edge posture is already correct: webhooks are `permitAll` (provider-signed); `refund`,
`capture`, `actuator`, `internal` are 403-locked at Caddy **and** `ROLE_INTERNAL`/JWT-gated
in the JVM (defence-in-depth, `APP_SECURITY_ENABLED=true`).

## 5. Production validation (Task 11) — run a real low-value charge per provider

For Razorpay and PayU, end-to-end on the live edge: checkout → pay (₹1/$1) → webhook
`CAPTURED` → `/v1/billing/fulfill` → subscription active + **one** paid invoice (confirm the
`payment_ref` is set and a second redelivery is deduped) → notification → audit row. Then a
**duplicate webhook** (replay) and a **failed/expired** payment. Confirm idempotency.

## 6. Rollback (Task 12) — image is pinned by sha

```bash
sed -i "s/^IMAGE_TAG=.*/IMAGE_TAG=<previous-sha>/" .env
docker compose --env-file .env -f docker-compose.prod.yml up -d --force-recreate app-edge-realtime app-payments
# Migration 030 is additive + NULL-safe; rollback only if required:
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f Backend/database/migrations/030_invoices_payment_ref.down.sql
```

## 7. Backups / DR (Task 13) — **external: AWS console**

- RDS automated backups + PITR (set retention ≥ 7 days); take a manual snapshot **before** step 2/3.
- Redis: `appendonly yes` is set; snapshot the `redisdata` volume if used as more than a cache.
- Vault/config: `.env` is sourced from SSM/Secrets Manager — confirm it's stored there, not only on the box.
- Test restore into a scratch RDS instance and document the RTO.

---

## External blockers (cannot be automated from the repo)

| # | Blocker | Why it's external | Manual step |
|---|---------|-------------------|-------------|
| 1 | Image rebuild + push + recreate | Needs Docker daemon + ECR + SSH to prod | §1 |
| 2 | Live Razorpay/PayU credentials | Merchant activation by the provider | §3 — paste into vault |
| 3 | Provider webhook registration | Provider dashboards | §4 |
| 4 | SES production access | AWS support request (out of sandbox) | Open the SES prod-access case; until then mail is sandbox-only |
| 5 | `trade.baalvion.com` DNS | Registrar | Add the A/CNAME → edge; add the Caddy site block |
| 6 | RDS snapshot/PITR retention | AWS console | §7 |
