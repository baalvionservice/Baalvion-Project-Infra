'use strict';
// Logistics Core Foundation (Phase 2) — fleet vehicle. Schema `tradeops`, UUID
// PK, paranoid, versioned. carrier_id is a soft TEXT reference (like
// Container.carrier_id / TradeShipment.carrier_id), not FK-constrained.
module.exports = (sequelize, DataTypes) => {
    const Vehicle = sequelize.define('Vehicle', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        vehicle_number: { type: DataTypes.TEXT, allowNull: false }, // license plate / registration
        vehicle_type: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'truck',
            validate: { isIn: [['truck', 'van', 'trailer', 'rail_car', 'ship', 'aircraft']] },
        },
        capacity_kg: { type: DataTypes.DECIMAL(14, 3) },
        capacity_volume_cbm: { type: DataTypes.DECIMAL(14, 3) },
        status: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'available',
            validate: { isIn: [['available', 'in_use', 'maintenance', 'out_of_service']] },
        },
        current_location: { type: DataTypes.TEXT },
        carrier_id: { type: DataTypes.TEXT },
        make: { type: DataTypes.TEXT },
        model: { type: DataTypes.TEXT },
        year: { type: DataTypes.INTEGER },
        gps_device_id: { type: DataTypes.TEXT },
        metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        created_by: { type: DataTypes.TEXT },
        updated_by: { type: DataTypes.TEXT },
        deleted_by: { type: DataTypes.TEXT },
    }, {
        schema: 'tradeops',
        tableName: 'vehicles',
        underscored: true,
        timestamps: true,
        paranoid: true,
        deletedAt: 'deleted_at',
        version: true,
    });

    Vehicle.associate = (db) => {
        Vehicle.hasMany(db.Driver, { as: 'drivers', foreignKey: 'current_vehicle_id' });
        Vehicle.hasMany(db.FleetAssignment, { as: 'assignments', foreignKey: 'vehicle_id' });
    };

    return Vehicle;
};
