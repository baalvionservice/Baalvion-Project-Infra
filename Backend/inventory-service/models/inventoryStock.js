'use strict';
module.exports = function(sequelize, DataTypes) {
    return sequelize.define('InventoryStock', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        warehouseId: { type: DataTypes.UUID, allowNull: false },
        storeId: { type: DataTypes.UUID, allowNull: false },
        productId: { type: DataTypes.UUID, allowNull: false },
        variantId: { type: DataTypes.UUID, allowNull: true },
        sku: { type: DataTypes.STRING(200), allowNull: false },
        quantity: { type: DataTypes.INTEGER, defaultValue: 0 },
        reservedQuantity: { type: DataTypes.INTEGER, defaultValue: 0 },
        availableQuantity: { type: DataTypes.VIRTUAL, get() { return (this.quantity || 0) - (this.reservedQuantity || 0); } },
        lowStockThreshold: { type: DataTypes.INTEGER, defaultValue: 5 },
        status: { type: DataTypes.ENUM('in_stock', 'low_stock', 'out_of_stock', 'discontinued'), defaultValue: 'in_stock' },
    }, { schema: 'inventory', underscored: true, timestamps: true, tableName: 'inventory_stock' });
};
