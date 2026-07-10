'use strict';
// Warehouse Management System, Phase A — functional area within a warehouse
// (receiving, staging, packing, hazmat, cold storage, quarantine, ...). Bins
// nest under a zone (models/tradeops/warehouse_bin.js). Schema `tradeops`,
// UUID PK, paranoid, versioned — same shape as Warehouse.
module.exports = (sequelize, DataTypes) => {
    const WarehouseZone = sequelize.define('WarehouseZone', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        warehouse_id: { type: DataTypes.UUID, allowNull: false },
        code: { type: DataTypes.TEXT },
        name: { type: DataTypes.TEXT, allowNull: false },
        zone_type: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'storage',
            validate: { isIn: [['storage', 'receiving', 'staging', 'packing', 'hazmat', 'cold_storage', 'quarantine', 'cross_dock']] },
        },
        temperature_zone: {
            type: DataTypes.TEXT,
            validate: { isIn: [[null, 'ambient', 'chilled', 'frozen', 'controlled']] },
        },
        hazard_class: { type: DataTypes.TEXT },
        capacity_units: { type: DataTypes.INTEGER },
        used_units: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        sequence_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        status: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'active',
            validate: { isIn: [['active', 'inactive', 'maintenance', 'full']] },
        },
        barcode: { type: DataTypes.TEXT },
        qr_payload: { type: DataTypes.TEXT },
        metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        created_by: { type: DataTypes.TEXT },
        updated_by: { type: DataTypes.TEXT },
        deleted_by: { type: DataTypes.TEXT },
    }, {
        schema: 'tradeops',
        tableName: 'warehouse_zones',
        underscored: true,
        timestamps: true,
        paranoid: true,
        deletedAt: 'deleted_at',
        version: true,
    });

    WarehouseZone.associate = (db) => {
        WarehouseZone.belongsTo(db.Warehouse, { as: 'warehouse', foreignKey: 'warehouse_id' });
        WarehouseZone.hasMany(db.WarehouseBin, { as: 'bins', foreignKey: 'zone_id' });
    };

    return WarehouseZone;
};
