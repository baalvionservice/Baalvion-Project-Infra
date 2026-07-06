'use strict';
// Logistics Core Foundation (Phase 1) — GPS/carrier tracking ping. Distinct
// from db.ShipmentEvent (workflow/lifecycle audit trail): this is high-volume,
// append-only location telemetry, not a state transition record. Schema
// `tradeops`. No paranoid/version — append-only, never updated or soft-deleted.
module.exports = (sequelize, DataTypes) => {
    const TrackingEvent = sequelize.define('TrackingEvent', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        shipment_id: { type: DataTypes.UUID, allowNull: false },
        container_id: { type: DataTypes.UUID },
        source: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'manual',
            validate: { isIn: [['carrier_webhook', 'gps_device', 'manual']] },
        },
        event_type: { type: DataTypes.TEXT, allowNull: false }, // e.g. 'location_update', 'checkpoint', 'exception'
        description: { type: DataTypes.TEXT },
        latitude: { type: DataTypes.DECIMAL(9, 6) },
        longitude: { type: DataTypes.DECIMAL(9, 6) },
        location_label: { type: DataTypes.TEXT },
        occurred_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        raw_payload: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        created_by: { type: DataTypes.TEXT },
    }, {
        schema: 'tradeops',
        tableName: 'tracking_events',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    });

    TrackingEvent.associate = (db) => {
        TrackingEvent.belongsTo(db.TradeShipment, { as: 'shipment', foreignKey: 'shipment_id' });
        TrackingEvent.belongsTo(db.Container, { as: 'container', foreignKey: 'container_id' });
    };

    return TrackingEvent;
};
