'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable({ tableName: 'orders_order_items', schema: 'orders' }, {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
            order_id: { type: Sequelize.UUID, allowNull: false },
            product_id: { type: Sequelize.UUID, allowNull: true },
            variant_id: { type: Sequelize.UUID, allowNull: true },
            sku: { type: Sequelize.STRING(200), allowNull: false },
            name: { type: Sequelize.STRING(500), allowNull: false },
            variant_name: { type: Sequelize.STRING(200), allowNull: true },
            quantity: { type: Sequelize.INTEGER, allowNull: false },
            price: { type: Sequelize.DECIMAL(14, 2), allowNull: false },
            compare_at_price: { type: Sequelize.DECIMAL(14, 2), allowNull: true },
            total: { type: Sequelize.DECIMAL(14, 2), allowNull: false },
            tax_amount: { type: Sequelize.DECIMAL(14, 2), defaultValue: 0 },
            fulfillable_quantity: { type: Sequelize.INTEGER, defaultValue: 0 },
            fulfilled_quantity: { type: Sequelize.INTEGER, defaultValue: 0 },
            metadata: { type: Sequelize.JSONB, defaultValue: {} },
            created_at: { type: Sequelize.DATE, allowNull: false },
            updated_at: { type: Sequelize.DATE, allowNull: false },
        });
        await queryInterface.addIndex({ tableName: 'orders_order_items', schema: 'orders' }, ['order_id']);
    },
    async down(queryInterface) { await queryInterface.dropTable({ tableName: 'orders_order_items', schema: 'orders' }); },
};
