'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable({ tableName: 'fulfillment_shipping_zones', schema: 'fulfillment' }, {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
            store_id: { type: Sequelize.UUID, allowNull: false },
            name: { type: Sequelize.STRING(200), allowNull: false },
            countries: { type: Sequelize.ARRAY(Sequelize.STRING), defaultValue: [] },
            regions: { type: Sequelize.ARRAY(Sequelize.STRING), defaultValue: [] },
            is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
            created_at: { type: Sequelize.DATE, allowNull: false },
            updated_at: { type: Sequelize.DATE, allowNull: false },
        });
        await queryInterface.addIndex({ tableName: 'fulfillment_shipping_zones', schema: 'fulfillment' }, ['store_id']);

        await queryInterface.createTable({ tableName: 'fulfillment_shipping_rates', schema: 'fulfillment' }, {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
            zone_id: { type: Sequelize.UUID, allowNull: false },
            store_id: { type: Sequelize.UUID, allowNull: false },
            name: { type: Sequelize.STRING(200), allowNull: false },
            carrier: { type: Sequelize.STRING(100), allowNull: true },
            method: { type: Sequelize.STRING(100), allowNull: true },
            type: { type: Sequelize.ENUM('flat', 'weight', 'price', 'free'), defaultValue: 'flat' },
            base_rate: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
            conditions: { type: Sequelize.JSONB, defaultValue: {} },
            estimated_days: { type: Sequelize.INTEGER, allowNull: true },
            is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
            created_at: { type: Sequelize.DATE, allowNull: false },
            updated_at: { type: Sequelize.DATE, allowNull: false },
        });
        await queryInterface.addIndex({ tableName: 'fulfillment_shipping_rates', schema: 'fulfillment' }, ['zone_id']);
    },
    async down(queryInterface) {
        await queryInterface.dropTable({ tableName: 'fulfillment_shipping_rates', schema: 'fulfillment' });
        await queryInterface.dropTable({ tableName: 'fulfillment_shipping_zones', schema: 'fulfillment' });
    },
};
