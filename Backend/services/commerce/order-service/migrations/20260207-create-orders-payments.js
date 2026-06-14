'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable({ tableName: 'orders_order_payments', schema: 'orders' }, {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
            order_id: { type: Sequelize.UUID, allowNull: false },
            provider: { type: Sequelize.STRING(50), allowNull: false },
            transaction_id: { type: Sequelize.STRING(200), allowNull: true },
            amount: { type: Sequelize.DECIMAL(14, 2), allowNull: false },
            currency_code: { type: Sequelize.STRING(3), allowNull: false },
            status: { type: Sequelize.ENUM('pending', 'authorized', 'captured', 'refunded', 'voided', 'failed'), defaultValue: 'pending' },
            metadata: { type: Sequelize.JSONB, defaultValue: {} },
            paid_at: { type: Sequelize.DATE, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false },
            updated_at: { type: Sequelize.DATE, allowNull: false },
        });
        await queryInterface.addIndex({ tableName: 'orders_order_payments', schema: 'orders' }, ['order_id']);
    },
    async down(queryInterface) { await queryInterface.dropTable({ tableName: 'orders_order_payments', schema: 'orders' }); },
};
