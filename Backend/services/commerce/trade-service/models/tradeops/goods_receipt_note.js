'use strict';
// Warehouse Management System, Phase A — receiving header, one per inbound
// shipment/PO arrival. draft -> in_progress -> completed (cancellable from
// either open state — see service/warehouse/receivingLifecycle.js). Schema
// `tradeops`, UUID PK, paranoid, versioned — same shape as Warehouse.
module.exports = (sequelize, DataTypes) => {
    const GoodsReceiptNote = sequelize.define('GoodsReceiptNote', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        grn_number: { type: DataTypes.TEXT, allowNull: false },
        warehouse_id: { type: DataTypes.UUID, allowNull: false },
        purchase_order_id: { type: DataTypes.UUID },
        shipment_id: { type: DataTypes.UUID },
        supplier_reference: { type: DataTypes.TEXT },
        status: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'draft',
            validate: { isIn: [['draft', 'in_progress', 'completed', 'cancelled']] },
        },
        received_by: { type: DataTypes.TEXT },
        received_at: { type: DataTypes.DATE },
        notes: { type: DataTypes.TEXT },
        metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        created_by: { type: DataTypes.TEXT },
        updated_by: { type: DataTypes.TEXT },
        deleted_by: { type: DataTypes.TEXT },
    }, {
        schema: 'tradeops',
        tableName: 'goods_receipt_notes',
        underscored: true,
        timestamps: true,
        paranoid: true,
        deletedAt: 'deleted_at',
        version: true,
    });

    GoodsReceiptNote.associate = (db) => {
        GoodsReceiptNote.belongsTo(db.Warehouse, { as: 'warehouse', foreignKey: 'warehouse_id' });
        GoodsReceiptNote.belongsTo(db.PurchaseOrder, { as: 'purchaseOrder', foreignKey: 'purchase_order_id' });
        GoodsReceiptNote.belongsTo(db.TradeShipment, { as: 'shipment', foreignKey: 'shipment_id' });
        GoodsReceiptNote.hasMany(db.GoodsReceiptLine, { as: 'lines', foreignKey: 'grn_id' });
    };

    return GoodsReceiptNote;
};
