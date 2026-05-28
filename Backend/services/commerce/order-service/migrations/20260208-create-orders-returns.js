'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable({ tableName: 'orders_returns', schema: 'orders' }, {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
            order_id: { type: Sequelize.UUID, allowNull: false },
            customer_id: { type: Sequelize.UUID, allowNull: true },
            store_id: { type: Sequelize.UUID, allowNull: false },
            return_number: { type: Sequelize.STRING(50), allowNull: false, unique: true },
            status: { type: Sequelize.ENUM('requested', 'approved', 'rejected', 'received', 'refunded', 'closed'), defaultValue: 'requested' },
            reason: { type: Sequelize.STRING(200), allowNull: false },
            notes: { type: Sequelize.TEXT, allowNull: true },
            total_refund: { type: Sequelize.DECIMAL(14, 2), defaultValue: 0 },
            refund_method: { type: Sequelize.STRING(50), allowNull: true },
            processed_at: { type: Sequelize.DATE, allowNull: true },
            processed_by: { type: Sequelize.BIGINT, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false },
            updated_at: { type: Sequelize.DATE, allowNull: false },
        });
        await queryInterface.addIndex({ tableName: 'orders_returns', schema: 'orders' }, ['order_id']);
        await queryInterface.addIndex({ tableName: 'orders_returns', schema: 'orders' }, ['store_id', 'status']);

        await queryInterface.createTable({ tableName: 'orders_return_items', schema: 'orders' }, {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
            return_id: { type: Sequelize.UUID, allowNull: false },
            order_item_id: { type: Sequelize.UUID, allowNull: false },
            quantity: { type: Sequelize.INTEGER, allowNull: false },
            reason: { type: Sequelize.STRING(200), allowNull: true },
            condition: { type: Sequelize.ENUM('new', 'like_new', 'good', 'fair', 'poor'), defaultValue: 'good' },
            refund_amount: { type: Sequelize.DECIMAL(14, 2), defaultValue: 0 },
            created_at: { type: Sequelize.DATE, allowNull: false },
            updated_at: { type: Sequelize.DATE, allowNull: false },
        });
        await queryInterface.addIndex({ tableName: 'orders_return_items', schema: 'orders' }, ['return_id']);
    },
    async down(queryInterface) {
        await queryInterface.dropTable({ tableName: 'orders_return_items', schema: 'orders' });
        await queryInterface.dropTable({ tableName: 'orders_returns', schema: 'orders' });
    },
};
