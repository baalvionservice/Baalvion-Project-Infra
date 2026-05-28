'use strict';
module.exports = function(sequelize, DataTypes) {
    return sequelize.define('InventoryMovement', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        warehouseId: { type: DataTypes.UUID, allowNull: false },
        storeId: { type: DataTypes.UUID, allowNull: false },
        productId: { type: DataTypes.UUID, allowNull: false },
        variantId: { type: DataTypes.UUID, allowNull: true },
        sku: { type: DataTypes.STRING(200), allowNull: false },
        type: { type: DataTypes.ENUM('inbound', 'outbound', 'adjustment', 'transfer_in', 'transfer_out', 'return'), allowNull: false },
        quantity: { type: DataTypes.INTEGER, allowNull: false },
        previousQuantity: { type: DataTypes.INTEGER, allowNull: false },
        newQuantity: { type: DataTypes.INTEGER, allowNull: false },
        reference: { type: DataTypes.STRING(200), allowNull: true },
        notes: { type: DataTypes.TEXT, allowNull: true },
        createdBy: { type: DataTypes.BIGINT, allowNull: true },
    }, { schema: 'inventory', underscored: true, timestamps: true, tableName: 'inventory_movements' });
};
