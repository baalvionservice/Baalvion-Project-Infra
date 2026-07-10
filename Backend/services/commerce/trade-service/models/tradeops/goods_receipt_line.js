'use strict';
// Warehouse Management System, Phase A — per-item receiving detail. Plain
// timestamps (no paranoid): a line is cancelled/rejected via `condition`/the
// parent GRN's status, not soft-deleted, same rationale as InventoryMovement.
module.exports = (sequelize, DataTypes) => {
    const GoodsReceiptLine = sequelize.define('GoodsReceiptLine', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        grn_id: { type: DataTypes.UUID, allowNull: false },
        package_id: { type: DataTypes.UUID },
        putaway_task_id: { type: DataTypes.UUID },
        sku: { type: DataTypes.TEXT },
        description: { type: DataTypes.TEXT },
        expected_quantity: { type: DataTypes.DECIMAL(14, 3) },
        received_quantity: { type: DataTypes.DECIMAL(14, 3), allowNull: false, defaultValue: 0 },
        unit: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'unit' },
        condition: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'good',
            validate: { isIn: [['good', 'damaged', 'partial', 'rejected']] },
        },
        lot_number: { type: DataTypes.TEXT },
        manufacture_date: { type: DataTypes.DATEONLY },
        expiry_date: { type: DataTypes.DATEONLY },
        weight_kg: { type: DataTypes.DECIMAL(12, 3) },
        volume_cbm: { type: DataTypes.DECIMAL(12, 4) },
        hazard_class: { type: DataTypes.TEXT },
        temperature_requirement: { type: DataTypes.TEXT },
        metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        created_by: { type: DataTypes.TEXT },
    }, {
        schema: 'tradeops',
        tableName: 'goods_receipt_lines',
        underscored: true,
        timestamps: true,
    });

    GoodsReceiptLine.associate = (db) => {
        GoodsReceiptLine.belongsTo(db.GoodsReceiptNote, { as: 'grn', foreignKey: 'grn_id' });
        GoodsReceiptLine.belongsTo(db.LogisticsPackage, { as: 'package', foreignKey: 'package_id' });
        GoodsReceiptLine.belongsTo(db.PutawayTask, { as: 'putawayTask', foreignKey: 'putaway_task_id' });
    };

    return GoodsReceiptLine;
};
