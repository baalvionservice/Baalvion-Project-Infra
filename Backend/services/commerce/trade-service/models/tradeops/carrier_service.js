'use strict';
// Freight Management — per (carrier, transport mode) service offering (Phase 3,
// Prompt 2). Schema `tradeops`, GLOBAL reference data (child of carriers — no
// tenant_id, same rationale as its parent). See migration 047.
module.exports = (sequelize, DataTypes) => {
    const CarrierService = sequelize.define('CarrierService', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        carrier_id: { type: DataTypes.UUID, allowNull: false },
        service_type: { type: DataTypes.TEXT, allowNull: false },
        transport_mode: { type: DataTypes.TEXT, allowNull: false },
        transit_time_days: { type: DataTypes.INTEGER },
        base_fee: { type: DataTypes.DECIMAL(20, 2) },
        rate_per_kg: { type: DataTypes.DECIMAL(20, 4) },
        active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    }, {
        schema: 'tradeops',
        tableName: 'carrier_services',
        underscored: true,
        timestamps: true,
    });

    CarrierService.associate = (db) => {
        if (db.CarrierDirectory) {
            CarrierService.belongsTo(db.CarrierDirectory, { as: 'carrier', foreignKey: 'carrier_id' });
        }
    };

    return CarrierService;
};
