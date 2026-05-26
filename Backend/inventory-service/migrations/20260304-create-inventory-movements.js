'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable({ tableName: 'inventory_movements', schema: 'inventory' }, {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
            warehouse_id: { type: Sequelize.UUID, allowNull: false },
            store_id: { type: Sequelize.UUID, allowNull: false },
            product_id: { type: Sequelize.UUID, allowNull: false },
            variant_id: { type: Sequelize.UUID, allowNull: true },
            sku: { type: Sequelize.STRING(200), allowNull: false },
            type: { type: Sequelize.ENUM('inbound', 'outbound', 'adjustment', 'transfer_in', 'transfer_out', 'return'), allowNull: false },
            quantity: { type: Sequelize.INTEGER, allowNull: false },
            previous_quantity: { type: Sequelize.INTEGER, allowNull: false },
            new_quantity: { type: Sequelize.INTEGER, allowNull: false },
            reference: { type: Sequelize.STRING(200), allowNull: true },
            notes: { type: Sequelize.TEXT, allowNull: true },
            created_by: { type: Sequelize.BIGINT, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false },
            updated_at: { type: Sequelize.DATE, allowNull: false },
        });
        await queryInterface.addIndex({ tableName: 'inventory_movements', schema: 'inventory' }, ['warehouse_id', 'sku']);
        await queryInterface.addIndex({ tableName: 'inventory_movements', schema: 'inventory' }, ['store_id', 'type']);
    },
    async down(queryInterface) { await queryInterface.dropTable({ tableName: 'inventory_movements', schema: 'inventory' }); },
};
