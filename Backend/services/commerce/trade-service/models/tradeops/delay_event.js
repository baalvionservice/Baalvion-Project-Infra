'use strict';
// Shipment Tracking & Global Visibility Platform — detected delay causes,
// written by service/tracking-platform/delayDetectionEngine.js. Mutable
// (resolved flag flips) but never soft-deleted.
module.exports = (sequelize, DataTypes) => {
    const DelayEvent = sequelize.define('DelayEvent', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        shipment_id: { type: DataTypes.UUID, allowNull: false },
        delay_type: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                isIn: [[
                    'traffic', 'weather', 'mechanical', 'border', 'port_congestion',
                    'customs_hold', 'missing_documents', 'driver', 'warehouse',
                    'late_pickup', 'late_delivery',
                ]],
            },
        },
        detected_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        estimated_delay_minutes: { type: DataTypes.INTEGER },
        resolved: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        resolved_at: { type: DataTypes.DATE },
        metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    }, {
        schema: 'tradeops',
        tableName: 'delay_events',
        underscored: true,
        timestamps: true,
    });

    DelayEvent.associate = (db) => {
        DelayEvent.belongsTo(db.TradeShipment, { as: 'shipment', foreignKey: 'shipment_id' });
    };

    return DelayEvent;
};
