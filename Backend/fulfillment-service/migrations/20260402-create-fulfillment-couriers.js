'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable({ tableName: 'fulfillment_couriers', schema: 'fulfillment' }, {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
            store_id: { type: Sequelize.UUID, allowNull: false },
            name: { type: Sequelize.STRING(200), allowNull: false },
            code: { type: Sequelize.STRING(50), allowNull: false },
            tracking_url: { type: Sequelize.STRING(500), allowNull: true },
            is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
            metadata: { type: Sequelize.JSONB, defaultValue: {} },
            created_at: { type: Sequelize.DATE, allowNull: false },
            updated_at: { type: Sequelize.DATE, allowNull: false },
        });
        await queryInterface.addIndex({ tableName: 'fulfillment_couriers', schema: 'fulfillment' }, ['store_id']);
    },
    async down(queryInterface) { await queryInterface.dropTable({ tableName: 'fulfillment_couriers', schema: 'fulfillment' }); },
};
