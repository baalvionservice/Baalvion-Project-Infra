'use strict';
/**
 * DB hardening (Phases 1, 4, 10) for the `orders` schema.
 *  - Intra-schema FKs: order_items.order_id, order_payments.order_id -> orders_orders.id.
 *    Added as NOT VALID so the migration succeeds on populated tables (orphans don't block it);
 *    new writes ARE enforced. Run `VALIDATE CONSTRAINT` after orphan reconciliation to fully trust.
 *    items -> CASCADE (aggregate child); payments -> RESTRICT (financial history must not vanish).
 *  - Hot-path indexes (idempotent).
 *  - Money columns widened to DECIMAL(15,4) to match commerce (widening is lossless).
 * Reversible: `down` drops the FKs (indexes/type widening left in place — non-destructive).
 */
module.exports = {
    async up(queryInterface) {
        const q = queryInterface.sequelize;

        // ── Indexes ──────────────────────────────────────────────────────────────
        await q.query(`CREATE INDEX IF NOT EXISTS idx_orders_store ON orders.orders_orders (store_id)`);
        await q.query(`CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders.orders_orders (customer_id)`);
        await q.query(`CREATE INDEX IF NOT EXISTS idx_orders_created ON orders.orders_orders (created_at)`);
        await q.query(`CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders.orders_orders (payment_status)`);
        await q.query(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders.orders_orders (status)`);
        await q.query(`CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders.orders_orders (order_number)`);
        await q.query(`CREATE INDEX IF NOT EXISTS idx_order_items_order ON orders.orders_order_items (order_id)`);
        await q.query(`CREATE INDEX IF NOT EXISTS idx_order_items_product ON orders.orders_order_items (product_id)`);
        await q.query(`CREATE INDEX IF NOT EXISTS idx_order_items_variant ON orders.orders_order_items (variant_id)`);
        await q.query(`CREATE INDEX IF NOT EXISTS idx_order_payments_order ON orders.orders_order_payments (order_id)`);
        await q.query(`CREATE INDEX IF NOT EXISTS idx_order_payments_txn ON orders.orders_order_payments (transaction_id)`);

        // ── Foreign keys (NOT VALID — enforced for new rows; VALIDATE later after cleanup) ──
        await q.query(`DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_order_items_order') THEN
                ALTER TABLE orders.orders_order_items
                    ADD CONSTRAINT fk_order_items_order FOREIGN KEY (order_id)
                    REFERENCES orders.orders_orders(id) ON DELETE CASCADE NOT VALID;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_order_payments_order') THEN
                ALTER TABLE orders.orders_order_payments
                    ADD CONSTRAINT fk_order_payments_order FOREIGN KEY (order_id)
                    REFERENCES orders.orders_orders(id) ON DELETE RESTRICT NOT VALID;
            END IF;
        END $$;`);

        // ── Money precision standardisation -> DECIMAL(15,4) (lossless widening) ──
        const moneyCols = [
            ['orders_orders', ['subtotal', 'discount_amount', 'shipping_amount', 'tax_amount', 'total_amount']],
            ['orders_order_items', ['price', 'compare_at_price', 'total', 'tax_amount']],
            ['orders_order_payments', ['amount']],
            ['orders_customers', ['total_spent']],
        ];
        for (const [tbl, cols] of moneyCols) {
            for (const c of cols) {
                await q.query(`ALTER TABLE orders.${tbl} ALTER COLUMN ${c} TYPE DECIMAL(15,4)`);
            }
        }
    },

    async down(queryInterface) {
        const q = queryInterface.sequelize;
        await q.query(`ALTER TABLE orders.orders_order_items DROP CONSTRAINT IF EXISTS fk_order_items_order`);
        await q.query(`ALTER TABLE orders.orders_order_payments DROP CONSTRAINT IF EXISTS fk_order_payments_order`);
    },
};
