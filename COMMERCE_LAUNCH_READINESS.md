# Commerce Platform — Launch-Readiness Report

**Phase 7 — Post-Security Completion.** Branch `feat/platform-foundation` (uncommitted).
Scope: finish the remaining business/operational capabilities on the existing
RBAC + payments architecture. No RBAC or payment redesign; build on what exists;
remove mocks where found.

---

## 1. Completed this phase

### Product Media System — `commerce-service` (backend complete)
Full media library on the existing `commerce_product_media` table:
- Upload (multipart), **multiple images per product**, **ordering** (`sortOrder` + `reorder`),
  **featured** selection (exactly one hero, auto-promote on delete), **delete/replace**.
- **Thumbnail generation** (400×400 via `sharp` when present; graceful fallback to original).
- **Storage**: pluggable `local` (filesystem `/uploads`) or `minio`/`s3` (dependency-free SigV4).
- **Secure**: every op verifies the product belongs to the caller's store (no cross-store
  attach); mutations gated by the existing `requireStoreRole('content_editor')`.
- New: `service/productMediaService.js`, `controller/productMediaController.js`,
  `utils/{multipart,s3Client,imageThumb}.js`, `validators/mediaSchemas.js`; routes added to
  `productRoutes.js`; `/uploads` static mount. Doc: `docs/PRODUCT_MEDIA.md`. **7 tests pass.**

### Financial Reconciliation — `order-service` ↔ `ledger-service`
The pre-existing gap "payments not posted to the double-entry ledger" is closed:
- **Capture → PAYMENT entry** mirrored on both `confirmPayment` (provider flow) and
  `recordPayment` (manual capture). Debit store *cash* / credit store *revenue*.
- **Refund** capability added (`POST …/orders/:orderId/refund`, ops_manager) → records a
  refund row, advances order state, and mirrors a **REFUND entry** (reverse double-entry).
- **Idempotent**: `transactionRef = pay-{paymentId}` / `refund-{paymentId}`; ledger 409 = success.
- **Fail-open**: a ledger outage never breaks checkout; failures are logged `ledger.post_failed`.
- **Reconciliation report** + **idempotent backfill** (`GET/POST …/reconciliation`): compares
  order captures/refunds against ledger entries, classifies matched/missing/mismatched, totals
  money in/out, and re-posts gaps.
- Deterministic per-store account ids (no chart-of-accounts provisioning needed).
- New: `service/ledgerClient.js`, `service/reconciliationService.js`,
  `controller/reconciliationController.js`, `routes/reconciliationRoutes.js`; `refundPayment`
  in `orderService`; ledger config block. **6 tests pass.**

### Security fix (launch blocker) — `ledger-service` auth bypass closed
`ledger-service/middleware/authMiddleware.js` previously **accepted any bearer string and
fabricated a random user** — full authentication + tenant bypass on a *financial* service.
Replaced with:
- A **dependency-free RS256 verifier** (`middleware/verifyJwt.js`, Node `crypto` only — no new
  deps) that checks signature/exp/nbf and rejects `none` and HS* (alg-confusion) tokens.
- A constant-time **internal service key** path (`X-Internal-Key`) for service-to-service posts.
- **Fail-closed**: no valid token and no matching key → 401. **9 tests pass.**
- `payment-service` was inspected and is **already hardened** (canonical `@baalvion/auth-node`
  RS256; webhooks are signature-verified and correctly bypass JWT auth) — no change needed.

### Operational readiness (partial)
- Commerce vertical (`commerce`, `order`, `inventory`, `ledger`) added to the realtime
  ops-dashboard `HEALTH_TARGETS` so they appear on the admin **Infrastructure** page.

**Test total: 28 passing** (media 7, ledger-auth 9, reconciliation/refund 6, order-security regression 6).
All new code load-/syntax-verified.

---

## 2. Status by requested priority

| # | Priority | Status |
| --- | --- | --- |
| 1 | Product Media System | **Backend DONE.** Admin-platform product-editor **Media tab = remaining** (frontend). Thumbnails need optional `sharp`. |
| 2 | Financial Reconciliation | **DONE** (capture+refund+report+backfill, idempotent, audited). Activation needs `LEDGER_INTERNAL_KEY` + ledger-service running. |
| 3 | Admin Operations Dashboard | Backend ready: analytics endpoints (`summary`/`top-products`/`by-country`/`revenue`) exist; reconciliation report added; commerce on health dashboard. **Remaining (frontend):** wire by-country/top-products widgets; add inventory low-stock endpoint + payment-status widget. |
| 4 | Audit & Compliance Center | Backend ready: `audit-service` (WORM + SHA-256 hash-chain) already ingests RBAC `role_change`, `commerce.payment_*`, ownership/cross-scope events. **Remaining (frontend):** RBAC-activity + payment-audit viewer pages, search/filter/export UI. |
| 5 | Operational Readiness | Commerce now on ops dashboard. **Remaining:** alerting hooks (low-stock / payment-failure → notification-service), runbooks/operator docs, backup-restore drill, ledger `/health` tenant-guard fix. |
| 6 | Final Production Review | **This report.** |

---

## 3. Mocks / placeholders (removed or flagged)

- **Removed:** ledger-service random-user auth mock.
- **Flagged, still simulated (flip when configured):**
  - `order-service` payment provider = `mock` (production already guarded: requires
    `PAYMENT_PROVIDER` + keys, or explicit `ALLOW_MOCK_PAYMENTS=true`). Refund provider mirrors this.
  - **Discount/promo engine not implemented** — `discount = 0` hardcoded in `createOrder`; order
    totals currently omit discounts. (Documented gap, predates this phase.)
  - Thumbnails reuse the original image until `sharp` is installed.

---

## 4. Risks

| Sev | Risk | Mitigation |
| --- | --- | --- |
| ~~CRIT~~ | Ledger auth bypass (impersonation on a financial service). | **FIXED** this phase. |
| HIGH | Ledger posting is fail-open: a ledger outage drops entries until backfilled. | Schedule a periodic `reconciliation` + `backfill` cron and alert when `missing > 0`. Idempotent transactionRef makes this safe. |
| MED | Activation depends on env: `LEDGER_INTERNAL_KEY` (shared with ledger-service) and the ledger running. Until set, posting is skipped (`ledger.skipped`). | Set the shared key in both services' env; verify with the reconciliation report. |
| MED | `ledger-service` mounts `tenantContext` before `/health`, so probes without `x-tenant-id` may 400. | Move health routes ahead of `tenantContext` (small ops fix). |
| MED | Payments simulated; discount engine stub. | Provider keys + a discount engine are explicit milestones below. |
| LOW | Per-service `pnpm install` not run (workspace junctions); `sharp` optional. | Run a workspace install before deploy; add `sharp` if real thumbnails are required. |

---

## 5. Recommended next milestones

1. **M1 — Activate + protect the ledger:** set `LEDGER_INTERNAL_KEY` in order- and ledger-service;
   add a scheduled reconcile+backfill job per store with an alert on non-zero `missing`.
2. **M2 — Admin Media tab:** product-editor upload/reorder/feature/delete UI on the new API.
3. **M3 — Admin Operations dashboard:** wire by-country/top-products; add inventory low-stock
   alerts endpoint + payment-status widget.
4. **M4 — Audit center viewers:** RBAC-activity + payment-audit pages over `audit-service`.
5. **M5 — Alerting + runbooks:** low-stock / payment-failure → notification-service; operator
   runbooks; backup-restore drill; ledger `/health` tenant-guard fix.
6. **M6 — Productionize:** real payment provider keys, discount/promo engine, install `sharp`,
   per-service `pnpm install`.

---

## 6. Activation checklist (to turn reconciliation on)

```bash
# Shared secret in BOTH services
export LEDGER_INTERNAL_KEY=<random-strong-secret>     # order-service AND ledger-service
export LEDGER_BASE_URL=http://localhost:3014          # order-service → ledger-service
export JWT_PUBLIC_KEY=<platform RS256 public key>     # ledger-service (now verifies real tokens)
# then: capture a payment → GET …/orders/stores/:storeId/reconciliation  → balanced:true
```
