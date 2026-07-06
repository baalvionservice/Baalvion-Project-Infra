'use strict';
// Shipment Tracking & Global Visibility Platform — registered sensor/tracker
// hardware attached to a shipment or container. Schema `tradeops`, UUID PK,
// paranoid, versioned.
module.exports = (sequelize, DataTypes) => {
    const IotDevice = sequelize.define('IotDevice', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        shipment_id: { type: DataTypes.UUID },
        container_id: { type: DataTypes.UUID },
        device_type: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: { isIn: [['temperature', 'humidity', 'shock', 'tilt', 'door', 'battery', 'fuel', 'pressure', 'light', 'gps']] },
        },
        external_device_id: { type: DataTypes.TEXT },
        provider: {
            type: DataTypes.TEXT,
            validate: { isIn: [['aws_iot', 'azure_iot', 'mqtt', 'lorawan', 'ble']] },
        },
        status: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'unknown',
            validate: { isIn: [['online', 'offline', 'unknown']] },
        },
        last_seen_at: { type: DataTypes.DATE },
        battery_pct: { type: DataTypes.DECIMAL(5, 2) },
        metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        created_by: { type: DataTypes.TEXT },
        updated_by: { type: DataTypes.TEXT },
        deleted_by: { type: DataTypes.TEXT },
    }, {
        schema: 'tradeops',
        tableName: 'iot_devices',
        underscored: true,
        timestamps: true,
        paranoid: true,
        deletedAt: 'deleted_at',
        version: true,
    });

    IotDevice.associate = (db) => {
        IotDevice.belongsTo(db.TradeShipment, { as: 'shipment', foreignKey: 'shipment_id' });
        IotDevice.belongsTo(db.Container, { as: 'container', foreignKey: 'container_id' });
        IotDevice.hasMany(db.IotSensorLog, { as: 'sensorLogs', foreignKey: 'device_id' });
    };

    return IotDevice;
};
