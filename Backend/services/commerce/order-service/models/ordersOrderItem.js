'use strict';
module.exports = function(sequelize, DataTypes) {
    return sequelize.define('OrdersOrderItem', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        orderId: { type: DataTypes.UUID, allowNull: false },
        productId: { type: DataTypes.UUID, allowNull: true },
        variantId: { type: DataTypes.UUID, allowNull: true },
        sku: { type: DataTypes.STRING(200), allowNull: false },
        name: { type: DataTypes.STRING(500), allowNull: false },
        variantName: { type: DataTypes.STRING(200), allowNull: true },
        quantity: { type: DataTypes.INTEGER, allowNull: false },
        price: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
        compareAtPrice: { type: DataTypes.DECIMAL(14, 2), allowNull: true },
        total: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
        taxAmount: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
        // Per-line tax shape for audit / re-derivation (matches the order's market context).
        taxRate: { type: DataTypes.DECIMAL(7, 4), allowNull: true },
        taxInclusive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        fulfillableQuantity: { type: DataTypes.INTEGER, defaultValue: 0 },
        fulfilledQuantity: { type: DataTypes.INTEGER, defaultValue: 0 },
        metadata: { type: DataTypes.JSONB, defaultValue: {} },
    }, { schema: 'orders', underscored: true, timestamps: true, tableName: 'orders_order_items' });
};
