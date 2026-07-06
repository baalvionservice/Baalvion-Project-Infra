'use strict';
// Shipment Tracking & Global Visibility Platform — high-volume append-only
// sensor readings, written by service/tracking-platform/iotIngestEngine.js.
// No paranoid/version — immutable once written, matching tracking_event.js.
module.exports = (sequelize, DataTypes) => {
    const IotSensorLog = sequelize.define('IotSensorLog', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        device_id: { type: DataTypes.UUID, allowNull: false },
        shipment_id: { type: DataTypes.UUID },
        metric_type: { type: DataTypes.TEXT, allowNull: false },
        value: { type: DataTypes.DECIMAL(12, 4) },
        unit: { type: DataTypes.TEXT },
        recorded_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        raw_payload: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    }, {
        schema: 'tradeops',
        tableName: 'iot_sensor_logs',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    });

    IotSensorLog.associate = (db) => {
        IotSensorLog.belongsTo(db.IotDevice, { as: 'device', foreignKey: 'device_id' });
        IotSensorLog.belongsTo(db.TradeShipment, { as: 'shipment', foreignKey: 'shipment_id' });
    };

    return IotSensorLog;
};
