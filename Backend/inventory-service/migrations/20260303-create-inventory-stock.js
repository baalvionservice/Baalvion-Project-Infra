'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable({ tableName: 'inventory_stock', schema: 'inventory' }, {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
            warehouse_id: { type: Sequelize.UUID, allowNull: false },
            store_id: { type: Sequelize.UUID, allowNull: false },
            product_id: { type: Sequelize.UUID, allowNull: false },
            variant_id: { type: Sequelize.UUID, allowNull: true },
            sku: { type: Sequelize.STRING(200), allowNull: false },
            quantity: { type: Sequelize.INTEGER, defaultValue: 0 },
            reserved_quantity: { type: Sequelize.INTEGER, defaultValue: 0 },
            low_stock_threshold: { type: Sequelize.INTEGER, defaultValue: 5 },
            status: { type: Sequelize.ENUM('in_stock', 'low_stock', 'out_of_stock', 'discontinued'), defaultValue: 'in_stock' },
            created_at: { type: Sequelize.DATE, allowNull: false },
            updated_at: { type: Sequelize.DATE, allowNull: false },
        });
        await queryInterface.addIndex({ tableName: 'inventory_stock', schema: 'inventory' }, ['warehouse_id', 'sku'], { unique: true });
        await queryInterface.addIndex({ tableName: 'inventory_stock', schema: 'inventory' }, ['store_id', 'product_id']);
    },
    async down(queryInterface) { await queryInterface.dropTable({ tableName: 'inventory_stock', schema: 'inventory' }); },
};
