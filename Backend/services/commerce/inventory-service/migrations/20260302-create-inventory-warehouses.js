'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable({ tableName: 'inventory_warehouses', schema: 'inventory' }, {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
            store_id: { type: Sequelize.UUID, allowNull: false },
            name: { type: Sequelize.STRING(200), allowNull: false },
            code: { type: Sequelize.STRING(50), allowNull: false },
            address: { type: Sequelize.TEXT, allowNull: true },
            city: { type: Sequelize.STRING(100), allowNull: true },
            country_code: { type: Sequelize.STRING(3), allowNull: false },
            is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
            is_default: { type: Sequelize.BOOLEAN, defaultValue: false },
            metadata: { type: Sequelize.JSONB, defaultValue: {} },
            created_at: { type: Sequelize.DATE, allowNull: false },
            updated_at: { type: Sequelize.DATE, allowNull: false },
        });
        await queryInterface.addIndex({ tableName: 'inventory_warehouses', schema: 'inventory' }, ['store_id']);
        await queryInterface.addIndex({ tableName: 'inventory_warehouses', schema: 'inventory' }, ['store_id', 'code'], { unique: true });
    },
    async down(queryInterface) { await queryInterface.dropTable({ tableName: 'inventory_warehouses', schema: 'inventory' }); },
};
