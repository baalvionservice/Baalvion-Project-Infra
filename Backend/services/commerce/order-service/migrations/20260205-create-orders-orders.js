'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable({ tableName: 'orders_orders', schema: 'orders' }, {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
            store_id: { type: Sequelize.UUID, allowNull: false },
            customer_id: { type: Sequelize.UUID, allowNull: true },
            billing_address_id: { type: Sequelize.UUID, allowNull: true },
            shipping_address_id: { type: Sequelize.UUID, allowNull: true },
            order_number: { type: Sequelize.STRING(50), allowNull: false, unique: true },
            status: { type: Sequelize.ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'), defaultValue: 'pending' },
            fulfillment_status: { type: Sequelize.ENUM('unfulfilled', 'partial', 'fulfilled', 'returned'), defaultValue: 'unfulfilled' },
            payment_status: { type: Sequelize.ENUM('pending', 'authorized', 'paid', 'partially_paid', 'refunded', 'voided', 'failed'), defaultValue: 'pending' },
            currency_code: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'USD' },
            subtotal: { type: Sequelize.DECIMAL(14, 2), allowNull: false },
            discount_amount: { type: Sequelize.DECIMAL(14, 2), defaultValue: 0 },
            shipping_amount: { type: Sequelize.DECIMAL(14, 2), defaultValue: 0 },
            tax_amount: { type: Sequelize.DECIMAL(14, 2), defaultValue: 0 },
            total_amount: { type: Sequelize.DECIMAL(14, 2), allowNull: false },
            discount_code: { type: Sequelize.STRING(100), allowNull: true },
            notes: { type: Sequelize.TEXT, allowNull: true },
            tags: { type: Sequelize.ARRAY(Sequelize.TEXT), defaultValue: [] },
            metadata: { type: Sequelize.JSONB, defaultValue: {} },
            shipping_address: { type: Sequelize.JSONB, allowNull: true },
            billing_address: { type: Sequelize.JSONB, allowNull: true },
            cancelled_at: { type: Sequelize.DATE, allowNull: true },
            cancel_reason: { type: Sequelize.TEXT, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false },
            updated_at: { type: Sequelize.DATE, allowNull: false },
        });
        await queryInterface.addIndex({ tableName: 'orders_orders', schema: 'orders' }, ['store_id', 'status']);
        await queryInterface.addIndex({ tableName: 'orders_orders', schema: 'orders' }, ['customer_id']);
    },
    async down(queryInterface) { await queryInterface.dropTable({ tableName: 'orders_orders', schema: 'orders' }); },
};
