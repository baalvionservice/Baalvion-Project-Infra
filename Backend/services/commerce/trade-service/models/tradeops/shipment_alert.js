'use strict';
// Shipment Tracking & Global Visibility Platform — the single alert ledger,
// written exclusively by service/tracking-platform/alertEngine.js. Mutable
// (ack/resolve flips status) but never soft-deleted, so no paranoid/version.
module.exports = (sequelize, DataTypes) => {
    const ShipmentAlert = sequelize.define('ShipmentAlert', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        shipment_id: { type: DataTypes.UUID, allowNull: false },
        alert_type: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                isIn: [[
                    'gps_lost', 'offline', 'geofence_enter', 'geofence_exit', 'delay',
                    'route_deviation', 'temperature', 'humidity', 'shock',
                    'unauthorized_opening', 'container_tampering', 'battery_low',
                    'eta_changed', 'late_delivery', 'customs_hold', 'delivered',
                ]],
            },
        },
        severity: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'medium',
            validate: { isIn: [['low', 'medium', 'high', 'critical']] },
        },
        message: { type: DataTypes.TEXT, allowNull: false },
        status: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'active',
            validate: { isIn: [['active', 'acknowledged', 'resolved']] },
        },
        triggered_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        acknowledged_by: { type: DataTypes.TEXT },
        acknowledged_at: { type: DataTypes.DATE },
        resolved_at: { type: DataTypes.DATE },
        metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    }, {
        schema: 'tradeops',
        tableName: 'shipment_alerts',
        underscored: true,
        timestamps: true,
    });

    ShipmentAlert.associate = (db) => {
        ShipmentAlert.belongsTo(db.TradeShipment, { as: 'shipment', foreignKey: 'shipment_id' });
        ShipmentAlert.hasMany(db.ShipmentNotification, { as: 'notifications', foreignKey: 'alert_id' });
    };

    return ShipmentAlert;
};
