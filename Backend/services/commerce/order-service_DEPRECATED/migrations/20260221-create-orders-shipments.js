'use strict';
/**
 * Shipment tracking for orders (customer-readable; admin-managed).
 * One order may have many shipments (split fulfilment). `events` is an append-only JSONB
 * timeline of status changes. FK to orders_orders(id) added NOT VALID (matches the
 * 20260210 hardening migration) so it succeeds on populated tables; new writes are enforced.
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable({ tableName: 'orders_shipments', schema: 'orders' }, {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
            order_id: { type: Sequelize.UUID, allowNull: false },
            store_id: { type: Sequelize.UUID, allowNull: false },
            status: { type: Sequelize.ENUM('pending', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'returned'), allowNull: false, defaultValue: 'pending' },
            carrier: { type: Sequelize.STRING(100), allowNull: true },
            tracking_number: { type: Sequelize.STRING(200), allowNull: true },
            tracking_url: { type: Sequelize.STRING(500), allowNull: true },
            shipped_at: { type: Sequelize.DATE, allowNull: true },
            delivered_at: { type: Sequelize.DATE, allowNull: true },
            estimated_delivery: { type: Sequelize.DATE, allowNull: true },
            events: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
            metadata: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
            created_at: { type: Sequelize.DATE, allowNull: false },
            updated_at: { type: Sequelize.DATE, allowNull: false },
        });
        await queryInterface.addIndex({ tableName: 'orders_shipments', schema: 'orders' }, ['order_id']);
        await queryInterface.addIndex({ tableName: 'orders_shipments', schema: 'orders' }, ['store_id', 'status']);

        // FK to orders_orders (NOT VALID — enforced for new rows; VALIDATE later after cleanup).
        await queryInterface.sequelize.query(`DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_orders_shipments_order') THEN
                ALTER TABLE orders.orders_shipments
                    ADD CONSTRAINT fk_orders_shipments_order FOREIGN KEY (order_id)
                    REFERENCES orders.orders_orders(id) ON DELETE CASCADE NOT VALID;
            END IF;
        END $$;`);
    },
    async down(queryInterface) {
        await queryInterface.sequelize.query(`ALTER TABLE orders.orders_shipments DROP CONSTRAINT IF EXISTS fk_orders_shipments_order`);
        await queryInterface.dropTable({ tableName: 'orders_shipments', schema: 'orders' });
        // Drop the ENUM type created by the table (Postgres leaves it behind otherwise).
        await queryInterface.sequelize.query(`DROP TYPE IF EXISTS orders.enum_orders_shipments_status`);
    },
};
