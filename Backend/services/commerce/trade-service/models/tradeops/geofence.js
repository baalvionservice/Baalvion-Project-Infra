'use strict';
// Shipment Tracking & Global Visibility Platform — named zone (circle or
// polygon, stored as JSONB) used by service/tracking-platform/geofenceEngine.js
// to detect entry/exit/dwell/violations. Schema `tradeops`, UUID PK, paranoid,
// versioned (mutable reference-ish record, tenant-scoped unlike HsCode/Carrier).
module.exports = (sequelize, DataTypes) => {
    const Geofence = sequelize.define('Geofence', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        name: { type: DataTypes.TEXT, allowNull: false },
        fence_type: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: { isIn: [['warehouse', 'port', 'airport', 'customer', 'border', 'customs', 'delivery_hub', 'rail_terminal', 'distribution_center', 'other']] },
        },
        shape: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        created_by: { type: DataTypes.TEXT },
        updated_by: { type: DataTypes.TEXT },
        deleted_by: { type: DataTypes.TEXT },
    }, {
        schema: 'tradeops',
        tableName: 'geofences',
        underscored: true,
        timestamps: true,
        paranoid: true,
        deletedAt: 'deleted_at',
        version: true,
    });

    Geofence.associate = (db) => {
        Geofence.hasMany(db.GeofenceEvent, { as: 'events', foreignKey: 'geofence_id' });
    };

    return Geofence;
};
