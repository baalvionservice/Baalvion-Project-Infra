'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable({ tableName: 'orders_customers', schema: 'orders' }, {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
            store_id: { type: Sequelize.UUID, allowNull: false },
            user_id: { type: Sequelize.BIGINT, allowNull: true },
            email: { type: Sequelize.STRING(255), allowNull: false },
            first_name: { type: Sequelize.STRING(100), allowNull: false },
            last_name: { type: Sequelize.STRING(100), allowNull: false },
            phone: { type: Sequelize.STRING(30), allowNull: true },
            total_orders: { type: Sequelize.INTEGER, defaultValue: 0 },
            total_spent: { type: Sequelize.DECIMAL(14, 2), defaultValue: 0 },
            notes: { type: Sequelize.TEXT, allowNull: true },
            is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
            created_at: { type: Sequelize.DATE, allowNull: false },
            updated_at: { type: Sequelize.DATE, allowNull: false },
        });
        await queryInterface.addIndex({ tableName: 'orders_customers', schema: 'orders' }, ['store_id']);
        await queryInterface.addIndex({ tableName: 'orders_customers', schema: 'orders' }, ['store_id', 'email'], { unique: true });
    },
    async down(queryInterface) { await queryInterface.dropTable({ tableName: 'orders_customers', schema: 'orders' }); },
};
