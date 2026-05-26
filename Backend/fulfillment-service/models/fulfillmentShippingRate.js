'use strict';
module.exports = function(sequelize, DataTypes) {
    return sequelize.define('FulfillmentShippingRate', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        zoneId: { type: DataTypes.UUID, allowNull: false },
        storeId: { type: DataTypes.UUID, allowNull: false },
        name: { type: DataTypes.STRING(200), allowNull: false },
        carrier: { type: DataTypes.STRING(100), allowNull: true },
        method: { type: DataTypes.STRING(100), allowNull: true },
        type: { type: DataTypes.ENUM('flat', 'weight', 'price', 'free'), defaultValue: 'flat' },
        baseRate: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
        conditions: { type: DataTypes.JSONB, defaultValue: {} },
        estimatedDays: { type: DataTypes.INTEGER, allowNull: true },
        isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    }, { schema: 'fulfillment', underscored: true, timestamps: true, tableName: 'fulfillment_shipping_rates' });
};
