# Core 3-Service Stack

The reduced platform core as a self-contained, single-host Docker Compose deployment.
Nothing else in the monorepo is touched — this slice just bundles three bounded-context
services with the proven wiring.

```
                        ┌─────────────────────── Caddy (TLS, :80/:443) ───────────────────────┐
   api.<domain>  ──►  /v1/auth/*, JWKS ─────────────────────────────────►  auth-service  :3001
                 ──►  /v1/gateway/payments, /v1/gateway/webhooks/* ───────►  payment-service:3015
                 ──✗  /v1/gateway/.../refund|capture, /api/*, /actuator/*  (403 at the edge)
   cms.<domain>  ──►  /api/v1/public/*  (no auth)  +  admin API ──────────►  cms-service   :3011
                 ──✗  /api/v1/internal/*  (vault — 403 at the edge)
   admin.<domain>──►  admin console (profile: admin) ───────────────────►  admin-web      :3030

   internal only:  payment-service ──► cms-service:3011/api/v1/internal/integrations/{slug}
                                       (x-internal-secret)  ──► Razorpay keys ──► api.razorpay.com
   infra (internal):  postgres · redis · zookeeper + kafka
```

| Service           | Port | Role                                                                   |
|-------------------|------|------------------------------------------------------------------------|
| `auth-service`    | 3001 | Identity. Mints RS256 access tokens, serves JWKS.                      |
| `cms-service`     | 3011 | Content delivery + admin API + the per-tenant provider-key **vault**.  |
| `payment-service` | 3015 | Java PSP gateway. Razorpay + transactions; reads keys from the vault.  |

**Auth (unchanged):** `auth-service` mints RS256 → `cms-service` verifies admin tokens via
JWKS; the CMS public delivery API (`/api/v1/public/*`) needs no token and bypasses the gateway.
**Payments (unchanged):** the Java gateway resolves Razorpay keys from the CMS vault per website
slug (or from global env), then calls Razorpay; Razorpay calls back to the webhook.

Infra (`postgres`, `redis`, `zookeeper`, `kafka`) and the edge (`caddy`) are supporting
containers — `kafka` backs payment-service's transactional outbox + saga listeners.

---

## 1. Prerequisites

- A host with Docker + Docker Compose v2 (≈ 4 GB RAM; the Java service + Kafka want headroom).
- DNS A records for `DOMAIN_API`, `DOMAIN_CMS`, (and `DOMAIN_ADMIN` if you run the admin profile)
  all pointing at this host's public IP. Ports 80 + 443 open.

## 2. Configure

```bash
cp deploy/core-stack/.env.prod.example deploy/core-stack/.env.prod

# RS256 keypair (auth-service mints; cms + payment verify)
cd Backend/services/identity/auth-service && npm run generate-keys && cd -
#   JWT_PRIVATE_KEY = awk 'NF {printf "%s\\n", $0}' .../keys/private.pem
#   JWT_PUBLIC_KEY  = awk 'NF {printf "%s\\n", $0}' .../keys/public.pem

# Strong secrets (run each twice, distinct values):
openssl rand -hex 32   # INTERNAL_SERVICE_SECRET   (MUST match across cms + payment)
openssl rand -hex 32   # CMS_SECRETS_KEY           (vault encryption master key)
openssl rand -hex 32   # GATEWAY_SIGNING_SECRET    (admin profile only)
```

Fill every `__CHANGE_ME__` in `.env.prod`. Never commit it.

## 3. Bring the core up (from the repo root)

```bash
docker compose --env-file deploy/core-stack/.env.prod \
  -f deploy/core-stack/docker-compose.prod.yml up -d --build
```

> First build is slow: `payment-service` runs a full Maven build, and the Node services run
> `turbo prune` over the workspace. Watch progress:
> `docker compose --env-file deploy/core-stack/.env.prod -f deploy/core-stack/docker-compose.prod.yml logs -f payment-service`

## 4. Initialize the database (once, fresh DB only)

```bash
bash deploy/core-stack/init-data.sh
# CMS-vault (per-tenant) mode instead of global keys:
REGISTER_PAYMENT_SITE=my-site bash deploy/core-stack/init-data.sh
```

This applies the auth + cms migrations, bootstraps the super-admin, and (optionally) registers
a payment website tenant. `payment-service` self-migrates on boot (Flyway).

---

## Razorpay keys — two supported modes

`payment-service` resolves provider keys **per call** (`PspConfigResolver`):

**(A) GLOBAL / single-tenant** — set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`,
`RAZORPAY_WEBHOOK_SECRET` in `.env.prod`, set `PSP_MOCK=false`, and call the gateway **without**
`?site=`. Simplest; one merchant account for the whole stack.

**(B) CMS vault / per-tenant (the "keep current pattern" flow)** — leave the `RAZORPAY_*` env
blank and store keys per website slug in the CMS **Integrations & Keys** vault, then call with
`?site=<slug>`. The resolver fetches the first vault entry where
`category=payment, provider=razorpay, enabled=true, status=configured` and uses
`config.mode=="live"` to decide live vs. test. Enter keys via the admin console:

```bash
# bring up the admin console (BFF + Next.js), then log in as the super-admin at https://${DOMAIN_ADMIN}
docker compose --env-file deploy/core-stack/.env.prod \
  -f deploy/core-stack/docker-compose.prod.yml --profile admin up -d --build auth-gateway admin-web
```

Keys are AES-encrypted at rest with `CMS_SECRETS_KEY`. Rotating that key after seeding the vault
means re-entering the keys.

## Razorpay webhook

In the Razorpay dashboard, point the webhook at:

```
https://<DOMAIN_API>/v1/gateway/webhooks/razorpay          # global mode
https://<DOMAIN_API>/v1/gateway/webhooks/razorpay?site=<slug>   # vault / per-tenant mode
```

Set the dashboard webhook secret equal to `RAZORPAY_WEBHOOK_SECRET` (global) or the
`webhookSecret` stored in that site's vault entry. The webhook is verified by HMAC inside
`payment-service` (it carries no platform JWT — which is why the edge leaves it open while
locking everything else down).

---

## Security posture (read before changing `APP_SECURITY_ENABLED`)

`payment-service` runs with `APP_SECURITY_ENABLED=false`, matching the proven stack: the Java
suite has no IdP minting service tokens, and in the full platform a BFF sits in front of it.
This slice has **no BFF**, so the public surface is narrowed at the **Caddy edge** instead:

- exposed: `POST /v1/gateway/payments` (initiate), `GET /v1/gateway/payments/{id}` (status),
  `/v1/gateway/webhooks/*` (HMAC-verified).
- denied (403): `.../refund`, `.../capture` (money out), `/api/*` (saga surface), `/actuator/*`,
  and the CMS `/api/v1/internal/*` vault route.

`cms-service` admin API and `auth-service` remain RS256-protected as normal.

If you prefer to enforce RS256 on the payment endpoints too, set `APP_SECURITY_ENABLED=true` and
`OAUTH_JWK_SET_URI=http://auth-service:3001/.well-known/jwks.json` — **but** that also 401s the
Razorpay webhook (it has no JWT), so you'd then need a BFF/edge component to terminate the webhook
and forward it internally. For a heavier-traffic or higher-risk deployment, re-introducing the
platform BFF/gateway in front of `payment-service` is the cleaner long-term answer.

## Going to RDS / managed infra

Point `DB_HOST` at the RDS endpoint, set `DB_SSL=true` and `DB_JDBC_PARAMS=?sslmode=require`, and
drop the `postgres` service. Same idea for ElastiCache (`REDIS_HOST`) and MSK (`KAFKA_BROKERS`).

## Production CI/CD (GitHub Actions → ECR → EC2)

Steps 3–4 above are the **local / manual** path. For the automated pipeline — CI builds the
`core-*` images to Amazon ECR and SSH-rolls a dedicated host that only pulls (never builds) — see
[ECR-CICD.md](ECR-CICD.md). In short: set the `AWS_DEPLOY_ROLE_ARN` + `CORE_EC2_*` GitHub secrets,
clone this repo to the host with a `.env.production`, and run the
[deploy-core-stack.yml](../../.github/workflows/deploy-core-stack.yml) workflow (or push a change
under `deploy/core-stack/**` to `main`). The host roll is [deploy.sh](deploy.sh).

## Profiles

| Profile  | Adds                          | Use when                                            |
|----------|-------------------------------|-----------------------------------------------------|
| (none)   | core 6 + caddy                | normal operation                                    |
| `tools`  | `cms-migrate`, `cms-register` | one-shot DB setup (driven by `init-data.sh`)        |
| `admin`  | `auth-gateway`, `admin-web`   | manage the CMS vault / content via the admin console |

## Troubleshooting

- **`cms-service` crash-loops on boot** — it requires `JWT_PUBLIC_KEY`, `INTERNAL_SERVICE_SECRET`,
  and `CMS_SECRETS_KEY`; it refuses the dev defaults. Check they're set in `.env.prod`.
- **payment resolves no keys / 422** — vault mode needs an `enabled + configured` Razorpay entry
  for that `?site=` slug; global mode needs the `RAZORPAY_*` env set and the call to omit `?site=`.
- **`INTERNAL_SERVICE_SECRET` mismatch** — vault reads 401/403 if the value differs between
  `cms-service` and `payment-service`. They must be identical.
- **Java build slow / OOM** — give the host more RAM, or build the image in CI and pull it
  (set `IMAGE_PREFIX`/`IMAGE_TAG` and use `up -d` without `--build`).
