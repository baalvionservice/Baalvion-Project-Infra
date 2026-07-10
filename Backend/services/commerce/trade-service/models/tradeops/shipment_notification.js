'use strict';
// Shipment Tracking & Global Visibility Platform — one row per channel
// delivery attempt for an alert, written by
// service/tracking-platform/notificationDispatcher.js.
module.exports = (sequelize, DataTypes) => {
    const ShipmentNotification = sequelize.define('ShipmentNotification', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        shipment_id: { type: DataTypes.UUID, allowNull: false },
        alert_id: { type: DataTypes.UUID },
        channel: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: { isIn: [['websocket', 'email', 'sms', 'whatsapp', 'slack', 'teams', 'webhook', 'push']] },
        },
        recipient: { type: DataTypes.TEXT },
        status: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'pending',
            validate: { isIn: [['pending', 'sent', 'failed', 'delivered']] },
        },
        payload: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        sent_at: { type: DataTypes.DATE },
        error: { type: DataTypes.TEXT },
    }, {
        schema: 'tradeops',
        tableName: 'shipment_notifications',
        underscored: true,
        timestamps: true,
    });

    ShipmentNotification.associate = (db) => {
        ShipmentNotification.belongsTo(db.TradeShipment, { as: 'shipment', foreignKey: 'shipment_id' });
        ShipmentNotification.belongsTo(db.ShipmentAlert, { as: 'alert', foreignKey: 'alert_id' });
    };

    return ShipmentNotification;
};
