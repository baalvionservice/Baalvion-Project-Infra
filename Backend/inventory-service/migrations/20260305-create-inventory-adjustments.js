'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable({ tableName: 'inventory_adjustments', schema: 'inventory' }, {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
            warehouse_id: { type: Sequelize.UUID, allowNull: false },
            store_id: { type: Sequelize.UUID, allowNull: false },
            reason: { type: Sequelize.STRING(300), allowNull: false },
            notes: { type: Sequelize.TEXT, allowNull: true },
            status: { type: Sequelize.ENUM('draft', 'applied', 'cancelled'), defaultValue: 'draft' },
            processed_by: { type: Sequelize.BIGINT, allowNull: true },
            processed_at: { type: Sequelize.DATE, allowNull: true },
            items: { type: Sequelize.JSONB, defaultValue: [] },
            created_at: { type: Sequelize.DATE, allowNull: false },
            updated_at: { type: Sequelize.DATE, allowNull: false },
        });
        await queryInterface.addIndex({ tableName: 'inventory_adjustments', schema: 'inventory' }, ['warehouse_id', 'status']);
    },
    async down(queryInterface) { await queryInterface.dropTable({ tableName: 'inventory_adjustments', schema: 'inventory' }); },
};
