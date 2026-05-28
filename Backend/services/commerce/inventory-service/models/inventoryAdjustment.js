'use strict';
module.exports = function(sequelize, DataTypes) {
    return sequelize.define('InventoryAdjustment', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        warehouseId: { type: DataTypes.UUID, allowNull: false },
        storeId: { type: DataTypes.UUID, allowNull: false },
        reason: { type: DataTypes.STRING(300), allowNull: false },
        notes: { type: DataTypes.TEXT, allowNull: true },
        status: { type: DataTypes.ENUM('draft', 'applied', 'cancelled'), defaultValue: 'draft' },
        processedBy: { type: DataTypes.BIGINT, allowNull: true },
        processedAt: { type: DataTypes.DATE, allowNull: true },
        items: { type: DataTypes.JSONB, defaultValue: [] },
    }, { schema: 'inventory', underscored: true, timestamps: true, tableName: 'inventory_adjustments' });
};
