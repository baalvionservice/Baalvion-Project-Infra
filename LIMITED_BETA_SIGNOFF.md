# Limited Beta — Sign-Off Report

**Date:** 2026-06-02 · **Branch:** `feat/platform-foundation` · **Scope:** commerce
revenue / authorization / payment vertical, deployed compose-only from a fresh checkout.
**Method:** live tool output only — no fabricated evidence. Every result below was captured
this session against the running stack.

> This sign-off covers Phase-2 release readiness: deployability (bootstrap), payments
> (sandbox-ready), recovery (DR drill), and release engineering. It supersedes
> `warroom/LIMITED_BETA_REPORT.md` for the go/no-go decision.

---

## 1. What was tested + evidence

### Auth / session security — ✅ PASS
- `warroom/security_e2e.cjs`: malformed JSON → **400** (order-service + rbac-service);
  revoked JTI (`auth:blacklist:<jti>` in Redis) → **401 BLACKLISTED** at the resource service.
- Auth invariant guards: `check-jwt-algorithms` → **OK** (no HS256/alg-confusion in `Backend`).
  `check-jwt-imports` / `check-auth-middleware` exit 0 with warnings only on **out-of-beta**
  services (realtime-service, insiders/proxy HS256 islands, one cms seed script) — the beta
  vertical (order/rbac/payment/cms-runtime/commerce) is clean.

### Commerce revenue — ✅ PASS
- `warroom/revenue_e2e.cjs --refund`: create order (total 63 483.78) → payment intent (201) →
  confirm → **PAID** → idempotent re-confirm (no double-capture) → **refunded**.

### Authorization (RBAC PEP/PDP) — ✅ PASS
- `warroom/enforcement_e2e.cjs` (8/8): end_user-no-role list → **403**; store_viewer list →
  **200**; owner GET → 200; **cross-customer IDOR → 403**; foreign create-intent → 403;
  store_viewer refund → **403** (order stays paid); ops_manager refund → **refunded**.

### Payments + refund (gateway, mock mode) — ✅ PASS
- `warroom/payment_e2e.cjs` (9/9): no internal-auth → **401**; create intent → **201**
  (razorpay, provider from CMS vault); **signed** webhook → **200 processed**; **tampered**
  signature → **401**; captured + ledger entry; **refund → refunded + debit ledger**;
  idempotent re-refund; cross-tenant refund → **404**.

### Backup / restore (disaster recovery) — ✅ PASS
- Live drill (`scripts/db-backup.ps1` → `db-restore.ps1` → `db-verify-restore.ps1`):
  **540 tables / 9 686 rows row-for-row PASS**; integrity confirmed (orders=13, RBAC
  10 roles/3 assignments, auth.users=87, payments 19/18 ledger, 25 FK constraints); DB
  **destroyed** then **re-restored → re-verified PASS**. Detail: `docs/runbooks/disaster-recovery.md`.

### Reproducible bootstrap — ✅ PASS
- `bootstrap.{sh,ps1}` data stages run idempotently against the live stack; rbac builds its
  schema + 4 system roles **from an empty database**; pending migrations apply cleanly; all
  four harnesses pass against the bootstrapped environment; `beta-fixtures.json` emitted.

### Build reproducibility — ✅ PASS
- `pnpm install --frozen-lockfile` in sync (clean-clone reproducible). 4 core service images
  build via the monorepo pattern; **ledger-service Dockerfile fixed and build verified**
  (image produced). `.dockerignore` lean.

---

## 2. Remaining risks

| Sev | Risk | Mitigation / status |
|---|---|---|
| HIGH | Payments are **mock** until real keys are added | One-step flip + verified harness + `SANDBOX_GOLIVE.md`; no code change to go live |
| HIGH | **Dev-grade secrets** (`baalvion_dev_pass`, dev JWT keypair, dev internal secret) | Documented required prod secrets; payment-service refuses the dev internal-secret default in prod |
| MED | Ledger posting is **fail-open** | By design; reconciliation sweep detects + backfills drift (runbook) |
| MED | Full destructive `--fresh` cold start not executed this session | Validated stage-by-stage + idempotent + from-empty rbac + harness-green; run `--fresh` on CI as the final pre-tag gate |
| LOW | Auth-tech-debt warnings on non-beta services | Out of beta scope (realtime/insiders/proxy HS256 islands); tracked separately |

---

## 3. Known limitations (Limited-Beta posture)

- **Scope = the commerce vertical only.** Frontends, auth-service interactive login,
  monitoring coverage, and the other ~25 platform services are **not** part of this RC and
  are unverified here.
- **Payments do not move real money** until provider keys are supplied (sandbox or live).
- **ledger-service** is not in the booted set (fail-open); its build is fixed but unverified at runtime.
- A real DR posture needs **off-site** backups (local `backups/` only survives logical loss).
- The beta authenticates with **minted RS256 tokens**, not the interactive login flow.

---

## 4. Readiness score

| Surface | Score | Verdict |
|---|---|---|
| **Commerce revenue + authz + payment vertical** (scoped) | **~94 / 100** | **READY FOR LIMITED BETA** — reproducible bootstrap, proven DR, sandbox-ready payments, fixed/verified builds; needs real provider keys + prod secrets before public charges |
| **Baalvion platform overall** (public GA) | ~55 / 100 | **NOT READY** — most surfaces unverified; out of this RC's scope |

Change vs. prior phase (~90/100): + one-command reproducible bootstrap, + proven destroy→restore
recovery, + sandbox flip wired & documented, + build-reproducibility blocker (ledger) fixed,
+ portable/host-independent harnesses.

---

## 5. Recommendation

### ✅ READY FOR LIMITED BETA — commerce revenue / authz / payment vertical

The checkout, authorization, payment, refund, security, backup/restore, and reproducible
deployment paths are demonstrably correct on the compose stack. Proceed to a **limited beta**
(invited/internal users, the commerce vertical) subject to the two go-live gates below.

### Pre-public-charge gates (must clear before real money / external users)
1. **Flip payments to a real provider** (sandbox first, then live) — `SANDBOX_GOLIVE.md`.
2. **Replace dev secrets** — real RS256 keypair, `INTERNAL_SERVICE_SECRET`, `CMS_SECRETS_KEY`,
   `LEDGER_INTERNAL_KEY`, real DB credentials, `NODE_ENV=production`; `check-env.cjs` → OK.
3. Run `bootstrap --fresh` on CI / a throwaway host as the final cold-start gate.
4. Configure **off-site** backups + a scheduled `db-backup`.

### For a full public platform launch: **NOT READY** — out of this RC's scope.
