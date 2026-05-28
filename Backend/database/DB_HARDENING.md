# Baalvion DB Hardening — Governance & Safe Plan

Status of each phase: **APPLIED** (migration/code shipped this pass) or **PLANNED** (DDL ready, not applied — reason given). Nothing here was runtime-tested (no live DB in the work environment).

## APPLIED this pass
- **Phase 1 (intra-schema FKs):** `orders_order_items.order_id`→`orders_orders` (CASCADE), `orders_order_payments.order_id`→`orders_orders` (RESTRICT), `inventory_stock.warehouse_id`→`inventory_warehouses` (RESTRICT). All `NOT VALID` (safe on populated tables). → `order-service/migrations/20260210-*`, `inventory-service/migrations/20260306-*`.
- **Phase 3 (inventory reservation safety):** `unwindReservation()` in order-service — release on cancel/fail, fulfill-deduct on capture, bounded by `reserved_quantity` (no negative stock). `CHECK (quantity>=0, reserved>=0, reserved<=quantity)` added.
- **Phase 4 (indexes):** orders (store_id, customer_id, created_at, payment_status, status, order_number), order_items (order_id, product_id, variant_id), order_payments (order_id, transaction_id), inventory_stock ((store_id,variant_id), (store_id,product_id), warehouse_id).
- **Phase 10 (money precision):** `orders.*` money columns widened `DECIMAL(14,2)`→`DECIMAL(15,4)` to match `commerce` (lossless).

## PLANNED (DDL ready — NOT applied; reasons below)

### Phase 5 — Migration governance (canonical strategy)
Three systems exist today: per-service **Sequelize/umzug JS** (commerce, order, inventory, …); **auth-service raw SQL** (`001_…sql`); **root SQL runner** `database/migrate.js` (`004–026`, ecosystem + proxy `public`).
**Rule going forward:** *Sequelize/umzug per service is canonical* for all schema-owning services. Governance:
- One migration system per **schema owner**; a service migrates ONLY its own schema. Cross-schema changes require a coordinated PR touching both owners.
- Deploy order: identity (`auth`) → commerce → inventory → orders → fulfillment → ecosystem. (Downstream schemas reference upstream data by UUID, not FK.)
- Rollback: every migration ships a `down`. Constraint-adding migrations use `NOT VALID` + a later `VALIDATE`, so rollback = drop constraint (non-destructive).
- The root `database/migrate.js` SQL set (`004–026`) is **frozen legacy** for the proxy `public` schema; new proxy changes also move to umzug.
*Not auto-converting existing migrations (risk); this is the forward rule.*

### Phase 2 — UUID/type consistency (BIGINT → UUID)
Verified mismatches: `commerce.commerce_products.created_by` **BIGINT** and `orders.orders_customers.user_id` **BIGINT**, but `auth.users.id` is **UUID** → these columns cannot reference a real user.
**Reason not applied:** BIGINT→UUID is **value-lossy** (no cast from int to the real uuid). Safe migration requires either an empty table or a BIGINT→UUID backfill map that does not exist yet.
**DDL (guarded):**
```sql
-- only safe on an empty/pre-launch table; abort otherwise (no silent data loss)
DO $$ BEGIN
  IF (SELECT count(*) FROM commerce.commerce_products) = 0 THEN
    ALTER TABLE commerce.commerce_products DROP COLUMN created_by;
    ALTER TABLE commerce.commerce_products ADD COLUMN created_by UUID;
  ELSE RAISE NOTICE 'commerce_products not empty — backfill BIGINT->UUID before converting created_by';
  END IF;
END $$;
-- same pattern for orders.orders_customers.user_id
```

### Phase 6 — Tenant safety (without blanket RLS)
Isolation is app-layer only today (no RLS on commerce/orders/inventory; mig `017_tenant_security` covers proxy `public`).
**Plan:** (1) a shared `storeScope(req)` util that resolves+asserts `store_id` (extend `commerce-service/middleware/commerceAccess.resolveStoreId`); (2) a lint/CI check + manual query audit for any commerce/orders/inventory query missing a `store_id` predicate; (3) cross-store leakage integration tests; (4) **defer RLS** until tested in staging — when ready: `ALTER TABLE … ENABLE ROW LEVEL SECURITY; CREATE POLICY store_isolation USING (store_id = current_setting('app.store_id')::uuid);` with the app setting `app.store_id` per request.
**Reason not applied:** RLS needs a per-request `SET app.store_id` plumbed through every connection + thorough testing; applying it blind risks locking out all queries.

### Phase 7 — Selective soft-delete
**DDL:**
```sql
ALTER TABLE commerce.commerce_products       ADD COLUMN deleted_at TIMESTAMPTZ, ADD COLUMN deleted_by UUID;
ALTER TABLE commerce.commerce_product_variants ADD COLUMN deleted_at TIMESTAMPTZ, ADD COLUMN deleted_by UUID;
ALTER TABLE commerce.commerce_collections    ADD COLUMN deleted_at TIMESTAMPTZ, ADD COLUMN deleted_by UUID;
ALTER TABLE commerce.commerce_categories     ADD COLUMN deleted_at TIMESTAMPTZ, ADD COLUMN deleted_by UUID;
ALTER TABLE orders.orders_customers          ADD COLUMN deleted_at TIMESTAMPTZ, ADD COLUMN deleted_by UUID;
```
Then set `paranoid: true, deletedAt: 'deletedAt'` on those Sequelize models (auto-excludes soft-deleted). Order history stays valid (order_items snapshot sku/name/price). **Do NOT** soft-delete orders/payments (status enums handle their lifecycle).
**Reason not applied:** additive + safe, but touches several models + needs storefront query verification → grouped for one reviewed migration rather than mixed into the integrity pass.

### Phase 8 — Durable audit/events
Today: `auth.audit_logs`, `dashboard.audit_logs`, and structured `console.info(JSON…)` for order/payment/inventory (not persisted).
**DDL (central, per owning schema to avoid new cross-coupling):**
```sql
CREATE TABLE orders.orders_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL, order_id UUID, actor_id UUID, actor_type TEXT,
  event_type TEXT NOT NULL, correlation_id TEXT, payload JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ON orders.orders_events (store_id, order_id);
CREATE INDEX ON orders.orders_events (event_type, created_at);
```
+ a `writeEvent()` helper replacing the `console.info` calls (order.created, payment.captured/failed, inventory.released/fulfilled). **Reason not applied:** straightforward but should land with the audit-read API; current structured logs already give traceability.

### Phase 9 — Customer/User identity strategy
`auth.users` (platform) and `orders_customers` (storefront buyers) are unlinked; `orders_customers.user_id` is BIGINT (broken — see Phase 2).
**Strategy:** keep the two models **separate** (storefront customers ≠ platform users). Add (after Phase 2 makes it UUID) an **optional** `orders_customers.user_id UUID NULL` linking an authenticated buyer to an `auth.users` id (no cross-schema FK — enforced in app). Guest checkout = `user_id NULL` + email. Account order history = join by `user_id` when present.
**Reason not applied:** depends on Phase 2 (UUID conversion) landing first.

## Sequencing (safe order)
1. ✅ Integrity FKs + indexes + money + inventory CHECK + reservation release (this pass).
2. Reconcile orphans → `VALIDATE CONSTRAINT` on the `NOT VALID` FKs.
3. Phase 2 UUID conversion (empty or backfilled) → unblocks Phase 9.
4. Phase 7 soft-delete migration + paranoid models.
5. Phase 8 events table + `writeEvent`.
6. Phase 6 RLS in staging (last, most invasive).
