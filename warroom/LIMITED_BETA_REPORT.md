# Baalvion Limited-Beta Readiness Report

**Date:** 2026-06-02 · **Branch:** `feat/platform-foundation` · **Goal:** convert the verified
revenue/authz fixes into a stable, `docker compose`-only Limited-Beta stack. All evidence below is
real tool output captured live — no fabrication.

---

## Success criteria — status

| Criterion | Status | Evidence |
|---|---|---|
| Fresh machine can boot stack from repository | ✅ services build+boot via compose · ⚠️ empty-volume needs a seed step (below) | `docker compose build`/`up -d` for rbac/order/commerce/inventory/ledger/cms/payment |
| No manual host node processes required | ✅ | `:3055` = Docker `wslrelay` (rbac **container** port); `:3113`/`:3115` free; rbac & payment are containers |
| Payment succeeds | ✅ | gateway create-intent → **201** (provider from CMS vault) |
| Webhook succeeds | ✅ | signed razorpay webhook → **200 processed**; tampered → **401** |
| Refund succeeds | ✅ | gateway refund → **refunded** + debit ledger; order-service ops refund → **refunded** |
| Backup succeeds | ✅ | `db-backup.ps1` → dump+sql.gz+manifest+sha256 |
| Restore succeeds | ✅ | `db-restore.ps1`+`db-verify-restore.ps1` → **541 tables row-for-row** |

---

## What was done (committed)

| Commit | Scope |
|---|---|
| `443c0d6` | RBAC-enforced commerce revenue/authz vertical (order/commerce/inventory/ledger/rbac + `@baalvion/commerce-rbac`) |
| `c686edd` | War-room E2E regression harnesses + report |
| `7578df5` | **Containerized rbac-service** (Dockerfile + compose); order-service rewired to `rbac-service:3055`; authz vertical boots compose-only |
| `e527e3f` | **Automated DB backup + restore + row-for-row verify** scripts |
| `ef3358f` | **Containerized payment gateway + refunds**: payment-service monorepo build (was a dev junction), in-image `@baalvion/sdk` build, `POST /gateway/payments/:id/refund` (claim-before-provider-call, idempotent), compose CMS-vault wiring |

**Real blockers fixed along the way:** stale `pnpm-lock.yaml` (missing `@baalvion/commerce-rbac`),
scoped package name (`@baalvion/payment-service`) breaking `turbo prune`, BuildKit cache corruption,
`@baalvion/sdk/dist` absent from images (git+docker-ignored — now compiled in-image), and the shared
`tsconfig` chain missing from the pruned build context.

## Final compose-only regression (all green)

- **Revenue:** product → order → payment intent → confirm → **PAID** + idempotent re-confirm.
- **Authz:** cross-customer IDOR **403**; store-role gate (end_user 403 / viewer 200); ops_manager refund → **refunded**; viewer refund **403**.
- **Security:** malformed JSON → **400** (order + rbac); revoked JTI → **401**.
- **Payment:** internal-auth 401; intent (CMS vault) 201; signed webhook 200 / tampered 401; refund → refunded + debit ledger; idempotent re-refund; cross-tenant refund **404**.

---

## Honest caveats (Limited-Beta posture, not yet GA)

1. **Empty-volume bootstrap is not one-command.** Services boot compose-only, but a *brand-new*
   Postgres volume needs: migrations (compose `migrate` profile + per-service) → seed demo stores
   (`commerce-service` seeders) → RBAC provisioning (`provisionCommerceRbac.cjs` + role assignments)
   → payment vault (`cms-service/scripts/configurePaymentSites.cjs`) → a customer row. These scripts
   exist and were run live this session; a single `bootstrap` wrapper is the recommended follow-up.
2. **Payments run in `mock` mode** = real adapter code + real signature crypto, **no live charge**.
   A live charge needs real provider sandbox/live keys (in the CMS vault) + outbound network.
3. **Dev-grade secrets.** cms-service runs `development` (dev vault key) to match the existing
   encrypted integrations; the whole stack uses `baalvion_dev_pass`. Production requires
   `CMS_SECRETS_KEY`, `INTERNAL_SERVICE_SECRET`, real DB creds, and `NODE_ENV=production`.
4. **Refund residual:** a process crash *between* the DB claim and finalize leaves a
   `refund_pending` ledger row (a reconciliation sweep resolves it — never a double-refund).
5. **Scope:** only the revenue/authz/payment vertical + its deps were committed/verified. ~40
   unrelated uncommitted files (frontends, ecosystem, infra, docs) were intentionally left untouched.
   The order-service mock payment provider (`ALLOW_MOCK_PAYMENTS`) is a local affordance — a real
   deploy configures a provider instead.

## Verdict

**Commerce revenue + authz + payment vertical: READY FOR LIMITED BETA** on the compose stack —
boots without host processes, with working payment/webhook/refund and proven backup/restore. The
remaining items above are deploy-hardening + a fresh-volume bootstrap wrapper, not functional gaps.
