'use strict';
// Logistics Core Foundation (Phase 2) — warehouse inventory movement ledger.
// Append-only (no paranoid/updatedAt), same shape as TrackingEvent: a movement
// is a fact that happened, never edited or soft-deleted, only ever appended.
module.exports = (sequelize, DataTypes) => {
    const InventoryMovement = sequelize.define('InventoryMovement', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        warehouse_id: { type: DataTypes.UUID, allowNull: false },
        package_id: { type: DataTypes.UUID },
        shipment_id: { type: DataTypes.UUID },
        // WMS Phase A: bin-level tracking. An `inbound` movement (putaway
        // completion) only ever populates to_bin_id; `outbound` only
        // from_bin_id; both populated on a bin-to-bin `transfer` (Phase B).
        from_bin_id: { type: DataTypes.UUID },
        to_bin_id: { type: DataTypes.UUID },
        movement_type: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: { isIn: [['inbound', 'outbound', 'transfer', 'adjustment']] },
        },
        quantity: { type: DataTypes.DECIMAL(14, 3), allowNull: false },
        unit: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'unit' },
        reference_type: { type: DataTypes.TEXT }, // e.g. 'shipment', 'purchase_order', 'manual'
        reference_id: { type: DataTypes.TEXT },
        occurred_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        notes: { type: DataTypes.TEXT },
        metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        created_by: { type: DataTypes.TEXT },
    }, {
        schema: 'tradeops',
        tableName: 'inventory_movements',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    });

    InventoryMovement.associate = (db) => {
        InventoryMovement.belongsTo(db.Warehouse, { as: 'warehouse', foreignKey: 'warehouse_id' });
        InventoryMovement.belongsTo(db.LogisticsPackage, { as: 'package', foreignKey: 'package_id' });
        InventoryMovement.belongsTo(db.TradeShipment, { as: 'shipment', foreignKey: 'shipment_id' });
        InventoryMovement.belongsTo(db.WarehouseBin, { as: 'fromBin', foreignKey: 'from_bin_id' });
        InventoryMovement.belongsTo(db.WarehouseBin, { as: 'toBin', foreignKey: 'to_bin_id' });
    };

    return InventoryMovement;
};
