'use strict';
// Logistics Core Foundation (Phase 2) — links a vehicle + driver to a shipment
// for a delivery run. This is the "Assign Driver" / dispatch-manager action
// record. Schema `tradeops`, UUID PK, paranoid, versioned.
module.exports = (sequelize, DataTypes) => {
    const FleetAssignment = sequelize.define('FleetAssignment', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        vehicle_id: { type: DataTypes.UUID, allowNull: false },
        driver_id: { type: DataTypes.UUID, allowNull: false },
        shipment_id: { type: DataTypes.UUID },
        status: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'assigned',
            validate: { isIn: [['assigned', 'in_progress', 'completed', 'cancelled']] },
        },
        assigned_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        started_at: { type: DataTypes.DATE },
        completed_at: { type: DataTypes.DATE },
        notes: { type: DataTypes.TEXT },
        metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        created_by: { type: DataTypes.TEXT },
        updated_by: { type: DataTypes.TEXT },
        deleted_by: { type: DataTypes.TEXT },
    }, {
        schema: 'tradeops',
        tableName: 'fleet_assignments',
        underscored: true,
        timestamps: true,
        paranoid: true,
        deletedAt: 'deleted_at',
        version: true,
    });

    FleetAssignment.associate = (db) => {
        FleetAssignment.belongsTo(db.Vehicle, { as: 'vehicle', foreignKey: 'vehicle_id' });
        FleetAssignment.belongsTo(db.Driver, { as: 'driver', foreignKey: 'driver_id' });
        FleetAssignment.belongsTo(db.TradeShipment, { as: 'shipment', foreignKey: 'shipment_id' });
    };

    return FleetAssignment;
};
