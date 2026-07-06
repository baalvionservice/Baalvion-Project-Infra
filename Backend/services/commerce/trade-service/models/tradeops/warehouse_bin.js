'use strict';
// Warehouse Management System, Phase A — a storage location inside a zone.
// Self-referencing via parent_bin_id so aisle -> rack -> shelf -> bin is ONE
// table (bin_type discriminates the level) rather than four near-duplicate
// tables. warehouse_id is denormalized here (not just on the zone) because the
// putaway engine's candidate query filters by warehouse first. Schema
// `tradeops`, UUID PK, paranoid, versioned — same shape as Warehouse.
module.exports = (sequelize, DataTypes) => {
    const WarehouseBin = sequelize.define('WarehouseBin', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        warehouse_id: { type: DataTypes.UUID, allowNull: false },
        zone_id: { type: DataTypes.UUID, allowNull: false },
        parent_bin_id: { type: DataTypes.UUID },
        bin_type: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'bin',
            validate: { isIn: [['aisle', 'rack', 'shelf', 'bin']] },
        },
        code: { type: DataTypes.TEXT },
        name: { type: DataTypes.TEXT },
        path: { type: DataTypes.TEXT },
        capacity_weight_kg: { type: DataTypes.DECIMAL(12, 3) },
        capacity_volume_cbm: { type: DataTypes.DECIMAL(12, 4) },
        capacity_units: { type: DataTypes.INTEGER },
        used_weight_kg: { type: DataTypes.DECIMAL(12, 3), allowNull: false, defaultValue: 0 },
        used_volume_cbm: { type: DataTypes.DECIMAL(12, 4), allowNull: false, defaultValue: 0 },
        used_units: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        temperature_zone: {
            type: DataTypes.TEXT,
            validate: { isIn: [[null, 'ambient', 'chilled', 'frozen', 'controlled']] },
        },
        hazard_class: { type: DataTypes.TEXT },
        abc_class: {
            type: DataTypes.TEXT,
            validate: { isIn: [[null, 'A', 'B', 'C']] },
        },
        status: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'active',
            validate: { isIn: [['active', 'inactive', 'blocked', 'full', 'maintenance']] },
        },
        barcode: { type: DataTypes.TEXT },
        qr_payload: { type: DataTypes.TEXT },
        metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        created_by: { type: DataTypes.TEXT },
        updated_by: { type: DataTypes.TEXT },
        deleted_by: { type: DataTypes.TEXT },
    }, {
        schema: 'tradeops',
        tableName: 'warehouse_bins',
        underscored: true,
        timestamps: true,
        paranoid: true,
        deletedAt: 'deleted_at',
        version: true,
    });

    WarehouseBin.associate = (db) => {
        WarehouseBin.belongsTo(db.Warehouse, { as: 'warehouse', foreignKey: 'warehouse_id' });
        WarehouseBin.belongsTo(db.WarehouseZone, { as: 'zone', foreignKey: 'zone_id' });
        WarehouseBin.belongsTo(db.WarehouseBin, { as: 'parent', foreignKey: 'parent_bin_id' });
        WarehouseBin.hasMany(db.WarehouseBin, { as: 'children', foreignKey: 'parent_bin_id' });
    };

    return WarehouseBin;
};
