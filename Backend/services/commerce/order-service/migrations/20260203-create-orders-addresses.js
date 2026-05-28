'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable({ tableName: 'orders_addresses', schema: 'orders' }, {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
            customer_id: { type: Sequelize.UUID, allowNull: false },
            store_id: { type: Sequelize.UUID, allowNull: false },
            address_type: { type: Sequelize.ENUM('shipping', 'billing', 'both'), defaultValue: 'shipping' },
            first_name: { type: Sequelize.STRING(100), allowNull: false },
            last_name: { type: Sequelize.STRING(100), allowNull: false },
            company: { type: Sequelize.STRING(200), allowNull: true },
            address1: { type: Sequelize.STRING(300), allowNull: false },
            address2: { type: Sequelize.STRING(300), allowNull: true },
            city: { type: Sequelize.STRING(100), allowNull: false },
            state: { type: Sequelize.STRING(100), allowNull: true },
            zip: { type: Sequelize.STRING(20), allowNull: true },
            country_code: { type: Sequelize.STRING(3), allowNull: false },
            phone: { type: Sequelize.STRING(30), allowNull: true },
            is_default: { type: Sequelize.BOOLEAN, defaultValue: false },
            created_at: { type: Sequelize.DATE, allowNull: false },
            updated_at: { type: Sequelize.DATE, allowNull: false },
        });
        await queryInterface.addIndex({ tableName: 'orders_addresses', schema: 'orders' }, ['customer_id']);
    },
    async down(queryInterface) { await queryInterface.dropTable({ tableName: 'orders_addresses', schema: 'orders' }); },
};
