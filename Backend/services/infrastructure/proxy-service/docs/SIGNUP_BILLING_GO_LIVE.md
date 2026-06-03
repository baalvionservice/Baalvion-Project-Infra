# Proxy / NetStack — Signup → Billing → Entitlement: Status & AWS Go-Live

_Last updated: 2026-06-03_

## What is DONE and verified (local, tested)

The acquisition flow is wired end-to-end and E2E-tested (Playwright + DB assertions):

| Capability | Status |
|---|---|
| Pricing `Get Started` carries the chosen plan (`/signup?plan=<slug>`) | ✅ real |
| Self-service signup provisions a real tenant (org + owner user + owner membership + subscription) **atomically** (one DB transaction) | ✅ real |
| Register issues access + rotating refresh token, sets the httpOnly cookie, returns `{token, user, org, plan, subscription, requiresPayment}` | ✅ real |
| Paid plans → 14-day **trial** + routed into checkout; `$0` plans → active immediately | ✅ real |
| Checkout activates the subscription server-side (`POST /v1/billing/activate`, trial → active, syncs org plan/bandwidth) | ✅ real |
| Entitlements (`currentPlan`) sourced from the **verified backend subscription**, not a localStorage default | ✅ real |
| Security: register strips client `role`/`orgId` (no privilege escalation); duplicate email → 409 | ✅ real |
| "Payment Successful" only shown when the backend confirms an **active** subscription | ✅ real |

Plan vocabulary: backend slugs are `starter` / `growth` / `enterprise`; the client maps `growth → pro`.

## What is NOT production-real yet (requires ops / further work)

These are deliberately **not** completed by code alone — they need infrastructure, secrets, or are a larger build:

1. **Real payment capture.** The hosted-checkout transport (browser → proxy-service BFF `/billing/checkout` → payment-service → CMS vault) exists, but:
   - No payment **provider is configured** for the `proxy-baalvionstack` site slug → `/billing/checkout` returns `422 NO_PAYMENT_PROVIDER`. In **local dev** the UI simulates success and calls the real `activate` endpoint (clearly gated on `import.meta.env.DEV`). **In production this must be wired (see below).**
   - The **authoritative** activation path should be the provider **webhook → payment-service ledger → activate**, not the client. The client `activate` call is a convenience; the webhook is the source of truth and is **not yet wired** into proxy-service (`billingRoutes.js` has no webhook/verify route).
2. **Trial enforcement.** Trials are created with a 14-day window but nothing yet downgrades/locks an account when the trial expires without payment (no scheduled job / status check on access).
3. **Server-side amount validation.** The checkout amount + promo (any non-empty code = 10% off) are computed **client-side**; the backend trusts the amount. Price + discount must be recomputed/validated server-side before charging.
4. **Email verification** is a no-op (no email sent, login not blocked).
5. **Admin panel coverage** of users / orgs / subscriptions / plans / payments is partial — see the central `admin-platform` (:3030) and in-app `/admin/*` routes; full coverage is a separate build phase.

## AWS Go-Live Checklist

### Secrets & config (AWS Secrets Manager / SSM Parameter Store — never in env files)
- [ ] `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (rotate; do NOT use the dev values in `.env`)
- [ ] `INTERNAL_SERVICE_SECRET` (proxy-service ↔ payment-service)
- [ ] `BILLING_SIGNING_SECRET`, `WEBHOOK_SHARED_SECRET`
- [ ] Real provider keys (Stripe/Razorpay) loaded into the **CMS vault**, not env
- [ ] `CORS_ORIGINS` = the real production web origin(s) only (drop the localhost dev defaults)
- [ ] `NODE_ENV=production` (enables Secure cookies; disables the dev checkout simulation)

### Data & infra
- [ ] **RDS PostgreSQL** (managed), run the versioned migrations in `Backend/migrations` (`node migrate.js up`) — do NOT rely on dev seeding
- [ ] **ElastiCache Redis** for sessions/rate-limits (currently sessions are in-memory → won't survive multi-instance; move to Redis-backed session store before scaling out)
- [ ] Run proxy-service behind an **ALB**; health check `GET /` ; 2+ tasks on **ECS Fargate** (or EKS)
- [ ] Container image built from the existing `Dockerfile`; push to **ECR**

### Payments (the real money path)
- [ ] Configure a payment provider for the `proxy-baalvionstack` slug in the CMS vault (run `scripts/loadPaymentProvider.cjs` / add to `configurePaymentSites.cjs`)
- [ ] Flip the CMS integration `mode` from `mock` → `live`
- [ ] Expose a **public HTTPS webhook URL** (provider → payment-service); wire `webhook → ledger → activate` as the authoritative path and make `activate` idempotent on the ledger event
- [ ] Add **server-side price/promo validation** in `/billing/checkout` (don't trust the browser amount)

### Hardening
- [ ] Rate-limit `POST /v1/auth/register` (account-creation abuse) — only `/login` is currently locked out
- [ ] Add a **trial-expiry job** (downgrade/lock on `current_period_end` for `trialing` subs without payment)
- [ ] Enforce email verification before privileged actions
- [ ] WAF on the ALB; structured logs → CloudWatch; alarms on 5xx + payment failures

### Frontend (Proxy-BaalvionStack)
- [ ] Build with `vite build` (sets `import.meta.env.DEV=false` → disables the dev checkout simulation)
- [ ] Serve via S3 + CloudFront (or the existing static host); reverse-proxy `/auth-bff` + `/api` to the gateway/proxy-service same-origin
- [ ] Set `VITE_API_PLATFORM_BASE_URL` / `VITE_API_AUTH_BASE_URL` to the production API origin

## Key endpoints (proxy-service, `/v1`)
- `POST /auth/register` — provision tenant + log in
- `POST /auth/login` `/auth/refresh` `/auth/logout`
- `GET  /billing/subscription` · `GET /billing/plans` · `GET /public/plans`
- `POST /billing/change-plan` — change plan (may create a checkout session)
- `POST /billing/activate` — activate after payment (trial → active; no new session)
