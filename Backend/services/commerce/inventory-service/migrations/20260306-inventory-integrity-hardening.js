'use strict';
/**
 * DB hardening (Phases 1, 3-safeguards, 4) for the `inventory` schema.
 *  - FK inventory_stock.warehouse_id -> inventory_warehouses.id (RESTRICT; NOT VALID for safety).
 *  - Hot-path indexes for the reservation lookups: (store_id, variant_id), (store_id, product_id), warehouse_id.
 *  - CHECK constraints (NOT VALID) preventing negative/over-reserved stock — aligns with the
 *    transaction-safe reserve/release/fulfill logic in order-service.
 * Reversible: `down` drops the added constraints (indexes left in place).
 */
module.exports = {
    async up(queryInterface) {
        const q = queryInterface.sequelize;

        await q.query(`CREATE INDEX IF NOT EXISTS idx_inv_stock_store_variant ON inventory.inventory_stock (store_id, variant_id)`);
        await q.query(`CREATE INDEX IF NOT EXISTS idx_inv_stock_store_product ON inventory.inventory_stock (store_id, product_id)`);
        await q.query(`CREATE INDEX IF NOT EXISTS idx_inv_stock_warehouse ON inventory.inventory_stock (warehouse_id)`);

        await q.query(`DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_inv_stock_warehouse') THEN
                ALTER TABLE inventory.inventory_stock
                    ADD CONSTRAINT fk_inv_stock_warehouse FOREIGN KEY (warehouse_id)
                    REFERENCES inventory.inventory_warehouses(id) ON DELETE RESTRICT NOT VALID;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_inv_qty_nonneg') THEN
                ALTER TABLE inventory.inventory_stock ADD CONSTRAINT chk_inv_qty_nonneg CHECK (quantity >= 0) NOT VALID;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_inv_reserved_nonneg') THEN
                ALTER TABLE inventory.inventory_stock ADD CONSTRAINT chk_inv_reserved_nonneg CHECK (reserved_quantity >= 0) NOT VALID;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_inv_reserved_le_qty') THEN
                ALTER TABLE inventory.inventory_stock ADD CONSTRAINT chk_inv_reserved_le_qty CHECK (reserved_quantity <= quantity) NOT VALID;
            END IF;
        END $$;`);
    },

    async down(queryInterface) {
        const q = queryInterface.sequelize;
        await q.query(`ALTER TABLE inventory.inventory_stock DROP CONSTRAINT IF EXISTS fk_inv_stock_warehouse`);
        await q.query(`ALTER TABLE inventory.inventory_stock DROP CONSTRAINT IF EXISTS chk_inv_qty_nonneg`);
        await q.query(`ALTER TABLE inventory.inventory_stock DROP CONSTRAINT IF EXISTS chk_inv_reserved_nonneg`);
        await q.query(`ALTER TABLE inventory.inventory_stock DROP CONSTRAINT IF EXISTS chk_inv_reserved_le_qty`);
    },
};
