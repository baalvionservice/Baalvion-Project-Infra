'use strict';
// Shipment Tracking & Global Visibility Platform — append-only geofence
// entry/exit/dwell/violation log. No paranoid/version — immutable once written.
module.exports = (sequelize, DataTypes) => {
    const GeofenceEvent = sequelize.define('GeofenceEvent', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        geofence_id: { type: DataTypes.UUID, allowNull: false },
        shipment_id: { type: DataTypes.UUID, allowNull: false },
        event_type: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: { isIn: [['entry', 'exit', 'dwell_exceeded', 'unauthorized_movement', 'outside_route', 'wrong_destination']] },
        },
        latitude: { type: DataTypes.DECIMAL(9, 6) },
        longitude: { type: DataTypes.DECIMAL(9, 6) },
        occurred_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    }, {
        schema: 'tradeops',
        tableName: 'geofence_events',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    });

    GeofenceEvent.associate = (db) => {
        GeofenceEvent.belongsTo(db.Geofence, { as: 'geofence', foreignKey: 'geofence_id' });
        GeofenceEvent.belongsTo(db.TradeShipment, { as: 'shipment', foreignKey: 'shipment_id' });
    };

    return GeofenceEvent;
};
