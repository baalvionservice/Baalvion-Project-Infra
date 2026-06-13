'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable({ tableName: 'orders_carts', schema: 'orders' }, {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
            store_id: { type: Sequelize.UUID, allowNull: false },
            customer_id: { type: Sequelize.UUID, allowNull: true },
            user_id: { type: Sequelize.BIGINT, allowNull: true },
            session_id: { type: Sequelize.STRING(128), allowNull: true },
            items: { type: Sequelize.JSONB, defaultValue: [] },
            currency_code: { type: Sequelize.STRING(3), defaultValue: 'USD' },
            subtotal: { type: Sequelize.DECIMAL(14, 2), defaultValue: 0 },
            discount_code: { type: Sequelize.STRING(100), allowNull: true },
            discount_amount: { type: Sequelize.DECIMAL(14, 2), defaultValue: 0 },
            total_amount: { type: Sequelize.DECIMAL(14, 2), defaultValue: 0 },
            expires_at: { type: Sequelize.DATE, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false },
            updated_at: { type: Sequelize.DATE, allowNull: false },
        });
        await queryInterface.addIndex({ tableName: 'orders_carts', schema: 'orders' }, ['store_id', 'customer_id']);
        await queryInterface.addIndex({ tableName: 'orders_carts', schema: 'orders' }, ['session_id']);
    },
    async down(queryInterface) { await queryInterface.dropTable({ tableName: 'orders_carts', schema: 'orders' }); },
};
