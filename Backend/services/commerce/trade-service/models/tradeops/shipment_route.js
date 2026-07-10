'use strict';
// Shipment Tracking & Global Visibility Platform — planned/actual leg-by-leg
// journey for a shipment. Distinct from tradeops.route_optimizations
// (pre-booking carrier/route scoring, see route_optimization.js).
module.exports = (sequelize, DataTypes) => {
    const ShipmentRoute = sequelize.define('ShipmentRoute', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        shipment_id: { type: DataTypes.UUID, allowNull: false },
        sequence: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        leg_mode: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: { isIn: [['sea', 'air', 'road', 'rail', 'courier']] },
        },
        from_location: { type: DataTypes.TEXT },
        to_location: { type: DataTypes.TEXT },
        planned_departure: { type: DataTypes.DATE },
        planned_arrival: { type: DataTypes.DATE },
        actual_departure: { type: DataTypes.DATE },
        actual_arrival: { type: DataTypes.DATE },
        distance_km: { type: DataTypes.DECIMAL(12, 2) },
        polyline: { type: DataTypes.TEXT },
        carrier_leg_id: { type: DataTypes.TEXT },
        metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    }, {
        schema: 'tradeops',
        tableName: 'shipment_routes',
        underscored: true,
        timestamps: true,
    });

    ShipmentRoute.associate = (db) => {
        ShipmentRoute.belongsTo(db.TradeShipment, { as: 'shipment', foreignKey: 'shipment_id' });
    };

    return ShipmentRoute;
};
