'use strict';
module.exports = function(sequelize, DataTypes) {
    return sequelize.define('InventoryWarehouse', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        storeId: { type: DataTypes.UUID, allowNull: false },
        name: { type: DataTypes.STRING(200), allowNull: false },
        code: { type: DataTypes.STRING(50), allowNull: false },
        address: { type: DataTypes.TEXT, allowNull: true },
        city: { type: DataTypes.STRING(100), allowNull: true },
        countryCode: { type: DataTypes.STRING(3), allowNull: false },
        isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
        isDefault: { type: DataTypes.BOOLEAN, defaultValue: false },
        metadata: { type: DataTypes.JSONB, defaultValue: {} },
    }, { schema: 'inventory', underscored: true, timestamps: true, tableName: 'inventory_warehouses' });
};
