'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable({ tableName: 'fulfillment_shipments', schema: 'fulfillment' }, {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
            order_id: { type: Sequelize.UUID, allowNull: false },
            store_id: { type: Sequelize.UUID, allowNull: false },
            courier_id: { type: Sequelize.UUID, allowNull: true },
            status: { type: Sequelize.ENUM('pending', 'processing', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'returned'), defaultValue: 'pending' },
            tracking_number: { type: Sequelize.STRING(200), allowNull: true },
            shipping_address: { type: Sequelize.JSONB, allowNull: false },
            weight: { type: Sequelize.DECIMAL(10, 3), allowNull: true },
            shipped_at: { type: Sequelize.DATE, allowNull: true },
            estimated_delivery: { type: Sequelize.DATE, allowNull: true },
            delivered_at: { type: Sequelize.DATE, allowNull: true },
            metadata: { type: Sequelize.JSONB, defaultValue: {} },
            items: { type: Sequelize.JSONB, defaultValue: [] },
            created_at: { type: Sequelize.DATE, allowNull: false },
            updated_at: { type: Sequelize.DATE, allowNull: false },
        });
        await queryInterface.addIndex({ tableName: 'fulfillment_shipments', schema: 'fulfillment' }, ['order_id']);
        await queryInterface.addIndex({ tableName: 'fulfillment_shipments', schema: 'fulfillment' }, ['tracking_number']);

        await queryInterface.createTable({ tableName: 'fulfillment_tracking_events', schema: 'fulfillment' }, {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
            shipment_id: { type: Sequelize.UUID, allowNull: false },
            status: { type: Sequelize.STRING(100), allowNull: false },
            location: { type: Sequelize.STRING(300), allowNull: true },
            description: { type: Sequelize.TEXT, allowNull: true },
            occurred_at: { type: Sequelize.DATE, allowNull: false },
            created_at: { type: Sequelize.DATE, allowNull: false },
            updated_at: { type: Sequelize.DATE, allowNull: false },
        });
        await queryInterface.addIndex({ tableName: 'fulfillment_tracking_events', schema: 'fulfillment' }, ['shipment_id', 'occurred_at']);
    },
    async down(queryInterface) {
        await queryInterface.dropTable({ tableName: 'fulfillment_tracking_events', schema: 'fulfillment' });
        await queryInterface.dropTable({ tableName: 'fulfillment_shipments', schema: 'fulfillment' });
    },
};
