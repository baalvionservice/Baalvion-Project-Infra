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
