# Law Elite Network — Deployment Guide

Two deployable units:
- **Backend** — `law-service` (Node/Express, Postgres, MinIO, Razorpay). Already containerized
  (`Backend/services/knowledge/law-service/Dockerfile`, image `baalvion-law`).
- **Frontend** — `Law-Elite-Network-main` (Next.js 15, standalone output). Container
  (`Frontend/Law-Elite-Network-main/Dockerfile`) or any Node host / Vercel / AWS Amplify.

Plus shared infra: **Postgres**, **Redis**, **MinIO** (object storage), and the **auth-service**.

---

## 1. Backend env (law-service)

| Var | Required | Notes |
|---|---|---|
| `PORT` | yes | 3015 |
| `NODE_ENV` | yes | `production` (hides internal error details) |
| `JWT_PUBLIC_KEY` | yes | RS256 public key (PEM, `\n`-escaped) — verifies auth-service tokens |
| `JWT_ISSUER` / `JWT_AUDIENCE` | yes | `baalvion-auth` / `baalvion-platform` |
| `DB_HOST/PORT/NAME/USER/PASSWORD` | yes | Postgres (schema `legal`) |
| `REDIS_HOST/PORT` | yes | rate limiting |
| `CORS_ORIGINS` | yes | **comma list of the real frontend origin(s)** e.g. `https://lawelitenetwork.com` |
| `LAW_ADMIN_EMAILS` | rec | bootstrap admin emails (default `infra.baalvion@gmail.com`) |
| `MINIO_ENDPOINT` | yes | internal endpoint for uploads (e.g. `http://minio:9000` / S3 endpoint) |
| `MINIO_PUBLIC_ENDPOINT` | yes | **browser-reachable** endpoint for presigned downloads (e.g. `https://files.yourdomain.com`) |
| `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` | yes | object storage creds (**use a secrets manager**) |
| `MINIO_BUCKET` | rec | default `law-documents` |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | **deploy-time** | set to enable real charges; **empty = simulated settlement** |
| `RAZORPAY_WEBHOOK_SECRET` | deploy-time | verifies the Razorpay webhook |
| `PLATFORM_FEE_PERCENT` | rec | marketplace commission withheld from each settled payment (default `15`) |
| `APP_PUBLIC_URL` | rec | public web origin used in transactional email links |
| `MAIL_ENABLED` | rec | `true` + SMTP_* → real email; otherwise emails are **logged, not sent** |
| `SMTP_HOST/PORT/SECURE/USER/PASS`, `MAIL_FROM` | deploy-time | SMTP (dev → Mailpit `:1025`; prod → SES/SendGrid) |
| `VIDEO_PROVIDER` + `DAILY_API_KEY` / `DAILY_DOMAIN` | deploy-time | `daily` for Daily.co rooms; **empty → Jitsi public rooms (works, no keys)** |
| `BILLING_WORKER_ENABLED` / `BILLING_INTERVAL_MINUTES` | rec | recurring-subscription billing worker (default on, every 60 min) |
| `SECRETS_FILE` | prod | path to a mounted JSON secret (AWS SM CSI / K8s secret / Vault) — overrides env |

> **Secrets**: in production prefer `SECRETS_FILE` over plaintext env. On boot the service
> **refuses to start** if a required secret (`JWT_PUBLIC_KEY`) is missing or a known placeholder.
>
> **Migrations**: schema changes are versioned SQL in `db/migrations/` and applied automatically on
> boot (and via `npm run migrate`). `npm run migrate:status` lists applied/pending. They are immutable
> once applied (checksum drift guard) — add a new file rather than editing an applied one.
>
> S3 note: `@aws-sdk/client-s3` is S3-compatible — point `MINIO_*` at AWS S3 instead of MinIO by
> setting the S3 endpoint/region/creds and a bucket. Presigned URLs then come from S3 directly.

## 2. Frontend env

Build-time (baked into the bundle — must be the **real** URLs):
- `NEXT_PUBLIC_API_BASE_URL` = `https://api.yourdomain.com/v1`
- `NEXT_PUBLIC_APP_URL` = `https://yourdomain.com`

Run-time (server, used by the `/api/auth/*` BFF):
- `AUTH_SERVICE_URL` = internal auth-service URL (e.g. `http://auth:3001`)

CSP `connect-src` is **derived from `NEXT_PUBLIC_API_BASE_URL`** automatically, so it works on any domain.

## 3. Razorpay / AI / email — deploy-time toggles

All are **env-gated with a working fallback**, so nothing breaks without them:
- **Razorpay** empty → payments settle in *simulated* mode (testable). Add keys → real Checkout
  (cards/UPI/netbanking/wallets/bank) + webhook settlement. Webhook URL: `POST /v1/payments/webhook`.
- **AI / email / SMS** are placeholders until their provider keys are wired.

## 4. Build & run

Backend:
```
docker compose --profile backend up -d --build law-service
# or standalone:
docker build -f Backend/services/knowledge/law-service/Dockerfile -t law-service .
```

Frontend:
```
docker build -t law-elite-web \
  --build-arg NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com/v1 \
  --build-arg NEXT_PUBLIC_APP_URL=https://yourdomain.com \
  Frontend/Law-Elite-Network-main
docker run -p 9002:9002 -e AUTH_SERVICE_URL=http://auth:3001 law-elite-web
```
Local (no container): `npm run build && PORT=9002 npm run start`.

## 5. AWS options
- **Frontend:** AWS Amplify or Vercel (Next-native, easiest), or the Docker image on ECS/Fargate, or `next start` on EC2 behind an ALB. Put **CloudFront/CDN** in front; serve over **HTTPS**.
- **Backend:** the `law-service` image on **ECS/Fargate** (or EC2). Postgres → **RDS**, Redis → **ElastiCache**, object storage → **S3** (set `MINIO_*` to the S3 endpoint/creds) or self-hosted MinIO.
- **Secrets** (`*_SECRET`, DB password, JWT keys) → **AWS Secrets Manager / SSM Parameter Store**, never in the image or compose defaults.

## 6. Pre-launch checklist
- [ ] `NODE_ENV=production` (backend) — generic error responses
- [ ] `CORS_ORIGINS` = real frontend origin(s) only
- [ ] HTTPS everywhere; cookies are `Secure` in prod (dev strips `Secure`)
- [ ] Secrets in a manager, not in env files committed to git
- [ ] Razorpay live keys + webhook configured (at go-live)
- [ ] DB backups (RDS automated) + run the seed only on a fresh demo DB, not production
- [ ] `/metrics` restricted to internal/monitoring network
