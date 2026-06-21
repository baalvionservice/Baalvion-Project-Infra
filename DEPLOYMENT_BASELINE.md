# Deployment Baseline — Baalvion MVP (v1.0.0-mvp)

Frozen reference describing the exact deployable surface at tag `v1.0.0-mvp`.
Generated from a live repository audit on 2026-06-20.

## 1. Source baseline

| Item | Value |
|------|-------|
| Repository | `baalvionservice/Baalvion-Project-Infra` |
| Branch | `main` (in sync with `origin/main`) |
| Tag | `v1.0.0-mvp` |
| Prior tags | `v0.5-private-beta`, `v1.0.1-stabilization.1` |
| Last commit before release | `680fdf53` |

## 2. Infrastructure topology

```
Internet ── DNS ──► Caddy (TLS 443)
  api.baalvion.com    → auth-gateway:3099   (single API ingress / BFF)
  admin.baalvion.com  → admin-platform:3030
  baalvion.com        → about-web:3020
  shop.baalvion.com   → amarise-web:3033
  api…/api/v1/orders/webhooks/*   → order-service:3013
  api…/api/payments/webhooks/*    → payment-service:3015
```

Shared infra: **RDS PostgreSQL 16** (`baalvion_db`, one schema per service:
`auth, rbac, audit, cms, commerce, inventory, orders, payments`) · **ElastiCache Redis 7**
· **Redpanda** (events) · **S3** (media) · **SES** (email) · **Razorpay** (payments).
Tenant isolation: in-schema RLS via non-superuser `baalvion_app`, not separate databases.

## 3. Service roster (gateway-fronted unless noted)

| Service | Port | Notes |
|---------|------|-------|
| auth-service | 3001 | `/auth/*` — RS256 issuer |
| auth-gateway | 3099 | ingress, injects identity headers |
| rbac-service | 3055 | `/api/rbac/*` |
| cms-service | 3018 | `/api/cms/*` + payment-key vault |
| commerce-service | 3012 | `/api/commerce/*` |
| inventory-service | 3014 | `/api/inventory/*` |
| order-service | 3013 | `/api/orders/*` + Razorpay capture |
| payment-service | 3015 | Java gateway (Razorpay/Stripe/PayU) |
| audit-service | 3032 | event consumer (not fronted) |
| notification-service | 3031 | SES email consumer (not fronted) |
| admin-platform | 3030 | admin UI |
| about-web | 3020 | main site |
| amarise-web | 3033 | storefront |

## 4. Deferred / excluded from baseline

ledger · session-service · media-service · company/analytics dashboards · ControlTheMarket (CTM)
· OAuth providers. Referenced code paths are stubbed or fail-open.

## 5. Configuration surface

- Template: `deploy/mvp-production/.env.production.example` (all 🔒 fields blank).
- Secrets source at deploy: **AWS Secrets Manager** (DB, JWT, inter-service HMACs, Razorpay,
  SES, S3, superadmin bootstrap).
- Compose references config strictly via `${VAR}` (111 references, 0 literals).

## 6. Pre-deploy operator steps (from RUNBOOK)

1. Provision RDS, ElastiCache, S3, SES, Caddy host.
2. Run `init-roles.sql` against fresh RDS as master, **before** any service starts.
3. Populate `.env.production` from Secrets Manager (never commit it).
4. `docker compose -f deploy/mvp-production/docker-compose.yml up -d`.
5. Verify health, then rotate `SUPERADMIN_PASSWORD` after first login.

## 7. Security baseline

- No secrets in source (verified pre-tag: no `.env`, AWS `AKIA…`, `rzp_live_*`, PayU, or PEM keys).
- `.gitignore` covers `.env`, `*.pem`, `*.key`, `secrets/`, `node_modules`, `dist`, `.next`, `coverage`, `*.log`.
- GitHub secret-scanning push protection enabled on the remote.
- RS256 JWT, RLS tenant isolation, Razorpay webhook HMAC, payment cross-tenant IDOR fixes (prior hardening).

## 8. Known gaps at baseline

- Build/quality gates (`type-check`, `lint`, `build`, `architecture:check`) are operator-run
  before tagging — see `RELEASE_CHECKLIST.md` §4.
- Transient `build-report.txt` / `lint-report.txt` are excluded from the release (add to `.gitignore`).
