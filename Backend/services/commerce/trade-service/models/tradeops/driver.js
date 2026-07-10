'use strict';
// Logistics Core Foundation (Phase 2) — fleet driver / delivery partner.
// Schema `tradeops`, UUID PK, paranoid, versioned.
module.exports = (sequelize, DataTypes) => {
    const Driver = sequelize.define('Driver', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        full_name: { type: DataTypes.TEXT, allowNull: false },
        license_number: { type: DataTypes.TEXT },
        license_expiry: { type: DataTypes.DATEONLY },
        phone: { type: DataTypes.TEXT },
        email: { type: DataTypes.TEXT },
        status: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'available',
            validate: { isIn: [['available', 'on_trip', 'off_duty', 'suspended']] },
        },
        current_vehicle_id: { type: DataTypes.UUID },
        rating: { type: DataTypes.DECIMAL(3, 2) },
        metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        created_by: { type: DataTypes.TEXT },
        updated_by: { type: DataTypes.TEXT },
        deleted_by: { type: DataTypes.TEXT },
    }, {
        schema: 'tradeops',
        tableName: 'drivers',
        underscored: true,
        timestamps: true,
        paranoid: true,
        deletedAt: 'deleted_at',
        version: true,
    });

    Driver.associate = (db) => {
        Driver.belongsTo(db.Vehicle, { as: 'currentVehicle', foreignKey: 'current_vehicle_id' });
        Driver.hasMany(db.FleetAssignment, { as: 'assignments', foreignKey: 'driver_id' });
    };

    return Driver;
};
