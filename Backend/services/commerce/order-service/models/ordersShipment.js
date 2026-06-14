'use strict';
module.exports = function(sequelize, DataTypes) {
    return sequelize.define('OrdersShipment', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        orderId: { type: DataTypes.UUID, allowNull: false },
        storeId: { type: DataTypes.UUID, allowNull: false },
        status: { type: DataTypes.ENUM('pending', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'returned'), allowNull: false, defaultValue: 'pending' },
        carrier: { type: DataTypes.STRING(100), allowNull: true },
        trackingNumber: { type: DataTypes.STRING(200), allowNull: true },
        trackingUrl: { type: DataTypes.STRING(500), allowNull: true },
        shippedAt: { type: DataTypes.DATE, allowNull: true },
        deliveredAt: { type: DataTypes.DATE, allowNull: true },
        estimatedDelivery: { type: DataTypes.DATE, allowNull: true },
        // Append-only timeline of { status, message, location?, at } status changes.
        events: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    }, { schema: 'orders', underscored: true, timestamps: true, tableName: 'orders_shipments' });
};
