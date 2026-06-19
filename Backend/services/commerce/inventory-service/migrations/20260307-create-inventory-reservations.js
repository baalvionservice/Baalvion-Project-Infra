'use strict';
/**
 * Reservation/lock ledger for storefront inventory holds (unique luxury items must not oversell).
 * A row is the durable record of a hold against `inventory_stock.reserved_quantity`:
 *  - 'active'    : holding stock, decrements available until expiresAt
 *  - 'released'  : explicitly freed (reserved_quantity decremented)
 *  - 'confirmed' : converted to a committed decrement at order placement
 *  - 'expired'   : TTL lapsed, swept back to available by expireStale()
 * Indexes mirror the reservation hot paths: (store_id, sku) lookups and the (status, expires_at)
 * sweep used by expireStale().
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable({ tableName: 'inventory_reservations', schema: 'inventory' }, {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
            warehouse_id: { type: Sequelize.UUID, allowNull: false },
            store_id: { type: Sequelize.UUID, allowNull: false },
            sku: { type: Sequelize.STRING(200), allowNull: false },
            product_id: { type: Sequelize.UUID, allowNull: true },
            variant_id: { type: Sequelize.UUID, allowNull: true },
            quantity: { type: Sequelize.INTEGER, allowNull: false },
            user_id: { type: Sequelize.STRING(128), allowNull: true },
            status: { type: Sequelize.ENUM('active', 'released', 'confirmed', 'expired'), defaultValue: 'active' },
            order_id: { type: Sequelize.UUID, allowNull: true },
            expires_at: { type: Sequelize.DATE, allowNull: false },
            created_at: { type: Sequelize.DATE, allowNull: false },
            updated_at: { type: Sequelize.DATE, allowNull: false },
        });
        await queryInterface.addIndex({ tableName: 'inventory_reservations', schema: 'inventory' }, ['store_id', 'sku']);
        await queryInterface.addIndex({ tableName: 'inventory_reservations', schema: 'inventory' }, ['status', 'expires_at']);
    },
    async down(queryInterface) { await queryInterface.dropTable({ tableName: 'inventory_reservations', schema: 'inventory' }); },
};
