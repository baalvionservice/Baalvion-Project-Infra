'use strict';
// Logistics Core Foundation (Phase 2) — operational warehouse: a physical
// facility that holds inventory and can be a shipment pickup/delivery point.
// Distinct from db.Facility (Phase 2 Trust/Verification: an org's DECLARED
// factory/warehouse profile for KYC review) — this is the operational record
// containers/packages/inventory movements actually reference day to day.
// Schema `tradeops`, UUID PK, paranoid, versioned.
module.exports = (sequelize, DataTypes) => {
    const Warehouse = sequelize.define('Warehouse', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        name: { type: DataTypes.TEXT, allowNull: false },
        code: { type: DataTypes.TEXT },
        warehouse_type: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'distribution',
            validate: { isIn: [['distribution', 'fulfillment', 'cold_storage', 'bonded', 'cross_dock']] },
        },
        address_id: { type: DataTypes.UUID },
        capacity_sqm: { type: DataTypes.DECIMAL(14, 2) },
        capacity_units: { type: DataTypes.INTEGER },
        used_units: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        status: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'active',
            validate: { isIn: [['active', 'inactive', 'full', 'maintenance']] },
        },
        manager_name: { type: DataTypes.TEXT },
        contact_phone: { type: DataTypes.TEXT },
        operating_hours: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        created_by: { type: DataTypes.TEXT },
        updated_by: { type: DataTypes.TEXT },
        deleted_by: { type: DataTypes.TEXT },
    }, {
        schema: 'tradeops',
        tableName: 'warehouses',
        underscored: true,
        timestamps: true,
        paranoid: true,
        deletedAt: 'deleted_at',
        version: true,
    });

    Warehouse.associate = (db) => {
        Warehouse.belongsTo(db.LogisticsAddress, { as: 'address', foreignKey: 'address_id' });
        Warehouse.hasMany(db.InventoryMovement, { as: 'movements', foreignKey: 'warehouse_id' });
        // WMS Phase A: location hierarchy + receiving.
        Warehouse.hasMany(db.WarehouseZone, { as: 'zones', foreignKey: 'warehouse_id' });
        Warehouse.hasMany(db.WarehouseBin, { as: 'bins', foreignKey: 'warehouse_id' });
        Warehouse.hasMany(db.GoodsReceiptNote, { as: 'goodsReceiptNotes', foreignKey: 'warehouse_id' });
        Warehouse.hasMany(db.PutawayTask, { as: 'putawayTasks', foreignKey: 'warehouse_id' });
    };

    return Warehouse;
};
