# Commerce Platform — Operator Runbooks

Operational procedures for the commerce + admin platform (commerce, order, inventory, ledger,
payment, rbac, audit, notification, realtime). Each runbook is a checklist an on-call operator can
follow without prior context.

> Verify environment first: `node Backend/scripts/check-env.cjs` (gates required vars; warns on
> recommended). Health: admin **Operations** dashboard, or `GET /health` / `GET /health/ready` per service.

---

## 1. Pre-launch environment verification

1. Run `node Backend/scripts/check-env.cjs`. Resolve every `X MISSING REQUIRED` (services refuse to
   boot without `JWT_PUBLIC_KEY`). Address `!` recommended warnings for production hardening.
2. Confirm the cross-service warning is clear: `LEDGER_INTERNAL_KEY` must be **identical** in
   order-service and ledger-service, or ledger posting is rejected (401).
3. Confirm `CART_SESSION_SECRET` is set in order-service (else guest carts are disabled — fail-closed).
4. Confirm payments are not silently mocked: production requires `PAYMENT_PROVIDER` + provider keys,
   or an explicit `ALLOW_MOCK_PAYMENTS=true` (do NOT set this in production).

---

## 2. Financial reconciliation (drift + backfill)

**What it is.** Captured payments/refunds in order-service are mirrored as double-entry journal
entries in ledger-service (`pay-{paymentId}` / `refund-{paymentId}`). A scheduled sweep
(BullMQ, `RECONCILE_CRON`, default hourly) compares the two and alerts ops on drift.

**Activate.** Set `LEDGER_INTERNAL_KEY` (shared), `LEDGER_BASE_URL`, and `RECONCILE_ENABLED=true`
in order-service; restart. Log line `[Reconcile] worker started; sweep scheduled ...` confirms.

**Investigate a drift alert** (`Reconciliation drift: store <id>`):
1. Pull the report: `GET /api/v1/orders/stores/:storeId/reconciliation?from=&to=` (ops_manager role)
   — or the admin **Operations / Reconciliation** panel.
2. `missing[]` = captures/refunds with no ledger entry (usually a ledger outage during capture).
   `mismatched[]` = entry exists but amount/type differs (investigate — possible data issue).
3. Backfill the missing entries (idempotent): `POST /api/v1/orders/stores/:storeId/reconciliation/backfill?from=&to=`
   (store_admin), or enable `RECONCILE_AUTO_BACKFILL=true` to let the sweep self-heal.
4. Re-run the report; confirm `balanced: true`.

**`mismatched` never auto-backfills** — it indicates a real discrepancy. Escalate to finance.

---

## 3. Ledger outage recovery

**Symptom.** Alert `Ledger unavailable for store <id>`, or logs `evt:"ledger.post_failed"`.

1. Posting is **fail-open** — checkout/capture continue; entries are simply not written. No customer
   impact, but the books drift until recovered.
2. Restore ledger-service: check `GET /health/ready` (503 = DB down). Fix DB/connectivity, restart.
3. Once healthy, backfill the gap window per affected store (step 2.3). Idempotent — safe to re-run.
4. If `LEDGER_INTERNAL_KEY` mismatch is the cause (401s in order-service logs), align the key in both
   services and restart order-service.

---

## 4. Product media storage

**Drivers** (`MEDIA_DRIVER` in commerce-service): `local` (filesystem `/uploads`, dev default) |
`minio` | `s3`.

**Go-live (object storage):**
1. Set `MEDIA_DRIVER=s3` (or `minio`), `S3_ENDPOINT`/`S3_PUBLIC_URL`/`S3_BUCKET`/`S3_REGION`/
   `S3_ACCESS_KEY`/`S3_SECRET_KEY`. Restart commerce-service.
2. Ensure the bucket is reachable and publicly readable for product images (or fronted by a CDN whose
   domain is allowed in the admin `next.config` image domains).
3. Real thumbnails require `sharp`: `pnpm --filter commerce-service add sharp`. Without it the original
   is reused as its own thumbnail (functional, larger payload).
4. Existing `local` URLs are not migrated automatically — re-upload or run a one-off copy job.

---

## 5. Payment provider go-live

1. order-service: set `PAYMENT_PROVIDER=stripe|razorpay|paypal` and the provider keys. The mock provider
   throws in production unless `ALLOW_MOCK_PAYMENTS=true` (never in prod).
2. payment-service (canonical webhooks) already verifies provider signatures; configure its provider
   secrets and confirm webhook endpoints are registered with the provider.
3. Smoke test: place an order → create intent → confirm → verify `paymentStatus: paid`, a ledger
   PAYMENT entry appears, and reconciliation reports `balanced`.
4. Test a refund: `POST …/orders/:orderId/refund` → verify refund row + REFUND ledger entry.

---

## 6. RBAC admin onboarding (store teams)

1. RBAC (rbac-service :3055) is the single source of truth. One-time bootstrap:
   `node Backend/services/commerce/commerce-service/scripts/provisionCommerceRbac.cjs` (super-admin token)
   registers commerce permissions + store roles and syncs stores→tenants.
2. Country admins are assigned in the admin **Team Management** (`/rbac`) UI (super_admin only).
3. A country_admin assigns store-team roles (store_admin / commerce_manager / content_editor /
   ops_manager / store_viewer) within their country via the same UI.
4. All role changes are audited (`rbac.role_change`) and visible in the admin **Audit Center**.

---

## 7. Monitoring & health

- **Operations dashboard** (admin `/operations`): service health, dependency status (Postgres/Redis),
  BullMQ queue backlog, reconciliation status, ledger sync.
- **Per-service**: `GET /health` (liveness), `GET /health/ready` (readiness, DB check). ledger and
  payment expose `/health/ready`; commerce/order/inventory expose `/health`.
- **Metrics**: realtime-service `/metrics` (Prometheus) exposes service up/latency, CPU/mem/disk,
  Redis/Postgres, and per-queue depths.
- **Alerts**: reconciliation drift + ledger-unavailable dispatch to notification-service
  (`INTERNAL_SERVICE_SECRET` + `OPS_ALERT_USER_ID`/`OPS_ALERT_EMAIL`). All alerts are also logged
  (`evt:"ops.alert"`) — the guaranteed sink if notifications are down.

---

## 8. Inventory low-stock

- Feed: `GET /api/v1/inventory/stores/:storeId/alerts/low-stock` returns `low_stock`/`out_of_stock`
  rows worst-first plus a store-wide `summary {lowStock, outOfStock, total}`. Surfaced on the admin
  **Analytics** dashboard inventory-alerts panel.
- Replenish via `POST …/warehouses/:warehouseId/stock/adjust` (`type: inbound`). Status auto-updates
  (`in_stock` once quantity exceeds the threshold).
