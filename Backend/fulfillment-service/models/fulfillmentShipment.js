'use strict';
module.exports = function(sequelize, DataTypes) {
    return sequelize.define('FulfillmentShipment', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        orderId: { type: DataTypes.UUID, allowNull: false },
        storeId: { type: DataTypes.UUID, allowNull: false },
        courierId: { type: DataTypes.UUID, allowNull: true },
        status: { type: DataTypes.ENUM('pending', 'processing', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'returned'), defaultValue: 'pending' },
        trackingNumber: { type: DataTypes.STRING(200), allowNull: true },
        shippingAddress: { type: DataTypes.JSONB, allowNull: false },
        weight: { type: DataTypes.DECIMAL(10, 3), allowNull: true },
        shippedAt: { type: DataTypes.DATE, allowNull: true },
        estimatedDelivery: { type: DataTypes.DATE, allowNull: true },
        deliveredAt: { type: DataTypes.DATE, allowNull: true },
        metadata: { type: DataTypes.JSONB, defaultValue: {} },
        items: { type: DataTypes.JSONB, defaultValue: [] },
    }, { schema: 'fulfillment', underscored: true, timestamps: true, tableName: 'fulfillment_shipments' });
};
