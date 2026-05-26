'use strict';
module.exports = function(sequelize, DataTypes) {
    return sequelize.define('FulfillmentCourier', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        storeId: { type: DataTypes.UUID, allowNull: false },
        name: { type: DataTypes.STRING(200), allowNull: false },
        code: { type: DataTypes.STRING(50), allowNull: false },
        trackingUrl: { type: DataTypes.STRING(500), allowNull: true },
        isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
        metadata: { type: DataTypes.JSONB, defaultValue: {} },
    }, { schema: 'fulfillment', underscored: true, timestamps: true, tableName: 'fulfillment_couriers' });
};
