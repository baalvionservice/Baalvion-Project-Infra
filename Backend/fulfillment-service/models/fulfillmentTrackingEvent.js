'use strict';
module.exports = function(sequelize, DataTypes) {
    return sequelize.define('FulfillmentTrackingEvent', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        shipmentId: { type: DataTypes.UUID, allowNull: false },
        status: { type: DataTypes.STRING(100), allowNull: false },
        location: { type: DataTypes.STRING(300), allowNull: true },
        description: { type: DataTypes.TEXT, allowNull: true },
        occurredAt: { type: DataTypes.DATE, allowNull: false },
    }, { schema: 'fulfillment', underscored: true, timestamps: true, tableName: 'fulfillment_tracking_events' });
};
