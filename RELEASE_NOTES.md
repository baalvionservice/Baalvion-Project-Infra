# Release Notes

> Newest release first. Prior release notes are retained below for history.

---

## v1.0.1-production — Baalvion Production Hotfix + Stability Release

**Release date:** 2026-06-21 · **Branch:** `release/ec2-single-host-v1.0.1-production`
**Tag (suggested):** `v1.0.1-production` · **Based on:** latest `main` + the EC2 single-host
deployment configs from the v1.0.0 release line.
**Type:** Production hotfix + stability release. No new features.

This release does not change `v1.0.0-mvp`. It is a minimal, production-safe hotfix on top of
the EC2 single-host v1.0.0 deployment that removes a CI-blocking build hang and hardens
sitemap generation so `next build` is deterministic in constrained CI environments.

### Fixed

- **CI-blocking build hang (Law-Elite-Network-main `/sitemap.xml`).** The sitemap was
  statically prerendered at build time, which executed live `fetch` calls against law-service.
  Against an unreachable/slow API in CI this hung `next build` (no fetch timeout) until the
  step timed out. The route is now `export const dynamic = 'force-dynamic'` — it renders at
  request time and is **never** generated during the build, so the production build has no
  build-time external dependency. Verified locally: the build prints `ƒ /sitemap.xml`
  (Dynamic, server-rendered on demand).
- **Defense-in-depth sitemap fetch hardening (Law-Elite-Network-main + Imperialpedia-main).**
  Each sitemap fetch is now wrapped in an `AbortController` timeout (4s) and skips
  non-absolute URLs, so a slow or unconfigured upstream degrades gracefully to the static
  routes instead of hanging the request or an ISR regeneration. Imperialpedia shared the
  identical unguarded build-time `fetch` pattern and received the same fix.

### Stability / validation

- All affected frontend apps type-check clean; Law-Elite-Network-main `next build` succeeds.
- EC2 single-host `deploy/ec2-single-host/docker-compose.yml` validates clean
  (`docker compose config -q`) against `.env.production.example`.
- The CI `deploy-compose-validate` set (`deploy/*/docker-compose.prod.yml`) validates clean.

### Deployment

- EC2 single-host deployment (`deploy/ec2-single-host/`) is **unchanged** and stable.
- No backend service changes; no breaking changes. Safe for immediate EC2 deployment.

---

## v1.0.0-mvp — Baalvion MVP Production Release

**Release date:** 2026-06-20 · **Branch:** `main` · **Tag:** `v1.0.0-mvp`
**Scope:** Critical-path production launch — user registration, login, CMS publishing,
product management, order creation, and Razorpay payments.

This release packages the platform for its first production deployment on AWS: a
self-contained, single-database MVP slice with Caddy TLS ingress, a hardened service
roster, and reproducible standalone Docker images for the frontend apps.

### What's new

**Deployment infrastructure (`deploy/mvp-production/`)**
- `docker-compose.yml` — full MVP stack, 100% env-driven (`${VAR}`), no embedded secrets
- `Caddyfile` — ACME TLS ingress for `api` / `admin` / `baalvion.com` / `shop` + payment webhook routes
- `.env.production.example` — complete config template; all secret fields blank with 🔒 markers
- `init-roles.sql` — idempotent RDS bootstrap of `baalvion` (owner) + `baalvion_app` (RLS runtime) roles
- `redis.conf`, `RUNBOOK.md`, `MVP-DEPLOYMENT-ANALYSIS.md`

**Frontend production builds**
- `output: 'standalone'` for about-baalvion, Imperialpedia, Law-Elite-Network, Global-Trade-Infrastructure
- New production `Dockerfile` + `Dockerfile.dockerignore` for GTI, Imperialpedia, Proxy-BaalvionStack,
  about-baalvion, admin-platform; updated Amarisé + admin-platform multi-stage Dockerfiles
- `nginx.conf.template` for the Proxy-BaalvionStack SPA

**Platform**
- Service catalog contract refreshed (`Backend/catalog/index.json`); PM2 ecosystem aligned

### Services included (MVP critical path)
Infra: PostgreSQL 16 (`baalvion_db`, schema-per-service), Redis 7, Redpanda, Caddy.
Services: auth-service, auth-gateway, rbac-service, audit-service, cms-service, commerce-service,
inventory-service, order-service, payment-service (Java), notification-service, admin-platform,
about-web, amarise-web.

### Services deferred (stubbed / fail-open)
ledger, session-service, media-service, dashboards, ControlTheMarket (CTM), analytics, OAuth.

### Security
- In-schema PostgreSQL RLS via non-superuser `baalvion_app` runtime role
- RS256 JWT, centralized issuer; Razorpay webhook HMAC verification
- All secrets injected at deploy time from AWS Secrets Manager — none in source
- Audit: no secrets in any committed file (verified pre-tag)

### Deploy notes
Run `init-roles.sql` against fresh RDS **before** starting services; rotate `SUPERADMIN_PASSWORD`
after first login. See `deploy/mvp-production/RUNBOOK.md`.

---

# Release Notes — Baalvion Limited Beta RC

**Release:** Limited-Beta Release Candidate · **Date:** 2026-06-02 ·
**Branch:** `feat/platform-foundation` · **Scope:** commerce revenue / authorization /
payment vertical, deployable from a fresh checkout via `docker compose` + `bootstrap`.

This RC converts the previously-verified development environment into a **reproducible**
beta. It adds no product features — it is deployability, payments, recovery, and release
engineering only.

---

## Highlights

### Zero-to-Beta bootstrap (new)
- **`bootstrap.sh` + `bootstrap.ps1`** — one idempotent command takes a fresh checkout to a
  working beta: preflight (network, RS256 keypair, `.env`, toolchain) → infra → migrations →
  services → seed/provision → fixtures → health verify. `--fresh` wipes volumes for a true
  cold start.
- **`Backend/scripts/mint-token.cjs`** — portable, dependency-free RS256 token minter
  (replaces hard-coded absolute key paths).
- Creates the default RBAC hierarchy, demo store + catalog, payment vault entries, a test
  customer, role assignments, and `warroom/beta-fixtures.json` (stable harness IDs).

### Payment sandbox (wired + documented)
- **`configureSandboxPayments.cjs`** — one-step flip of a site from mock to a real provider
  **sandbox** (Stripe/Razorpay test mode); refuses non-test keys.
- **`warroom/payment_sandbox_e2e.cjs`** — drives a real provider sandbox transaction
  (create-intent + refund hit the provider; capture via a provider-signed webhook).
- **`SANDBOX_GOLIVE.md`** — flip + go-live + rollback procedure.
- Mock path remains fully harness-verified (real adapter + real signature crypto).

### Disaster recovery (proven)
- Live drill: backup → restore → verify → **destroy** → re-restore → re-verify, all green
  (540 tables, 9 686 rows, row-for-row). **`docs/runbooks/disaster-recovery.md`** documents it.

### Release engineering
- Removed obsolete compose `version:` attribute.
- **Fixed ledger-service Dockerfile** — was `npm ci` with no lockfile (a pnpm workspace) and
  could never build; rewritten to the monorepo `turbo prune` → `pnpm deploy --prod` pattern +
  repo-root build context. **Build verified (image produced).**
- Deprecated `start.ps1` (stale pre-migration host-process script) with a pointer to bootstrap.
- `pnpm install --frozen-lockfile` verified in sync (reproducible clean-clone install).
- `.dockerignore` already lean (excludes `node_modules`/`Frontend`/`dist`).

### Harness portability
- War-room E2E harnesses no longer hard-code absolute `D:\` paths; they resolve the repo
  relatively, read `beta-fixtures.json`, default to the correct ports (order-service `:3013`),
  and drive Redis via `docker exec redis-cli` (no `ioredis` dependency).

---

## What's verified in this RC

| Area | Evidence |
|---|---|
| Revenue path | order → intent → confirm → **PAID** → idempotent re-confirm → **refunded** |
| Authorization | cross-customer IDOR **403**; store-role gates (end_user 403 / viewer 200); ops_manager refund 201 / viewer 403 |
| Security | malformed JSON → **400** (order + rbac); revoked JTI → **401** |
| Payments (mock) | internal-auth 401; intent 201; signed webhook 200 / tampered 401; capture+ledger; refund→debit ledger; idempotent re-refund; cross-tenant 404 |
| Bootstrap | every stage idempotent; rbac builds from an empty DB; all 4 harnesses green post-bootstrap |
| Backup/restore | 540 tables / 9 686 rows row-for-row; destroy → re-restore repeatable |
| Build | `frozen-lockfile` in sync; ledger image builds; 4 core images build |

---

## Known limitations (Limited-Beta posture)

- **Payments run in mock mode** until real provider keys are supplied (flip is one step + documented).
- **Dev-grade secrets** in `.env` / `baalvion_dev_pass`; production requires real RS256 keys,
  `INTERNAL_SERVICE_SECRET` (payment-service refuses the dev default in prod), `CMS_SECRETS_KEY`,
  and real DB credentials.
- **Scope is the commerce vertical** — the broader platform (frontends, auth-service interactive
  login, monitoring coverage, the other ~25 services) is out of this RC and unverified here.
- **ledger-service** is excluded from the booted set (ledger posting is fail-open); its build is
  fixed but it is not part of the verified runtime.
- The full destructive `--fresh` cold start is wired; this RC validated bootstrap stage-by-stage
  + idempotently + harness-green. Run `--fresh` on CI / a throwaway host as the final pre-tag gate.

---

## Upgrade / operate

- Stand up: `DEPLOYMENT_GUIDE.md`. Operate: `RUNBOOK.md`. Recover: `docs/runbooks/disaster-recovery.md`.
- Go live on payments: `Backend/services/commerce/payment-service/docs/SANDBOX_GOLIVE.md`.
