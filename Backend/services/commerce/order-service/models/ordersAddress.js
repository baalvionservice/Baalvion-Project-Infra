'use strict';
module.exports = function(sequelize, DataTypes) {
    return sequelize.define('OrdersAddress', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        customerId: { type: DataTypes.UUID, allowNull: false },
        storeId: { type: DataTypes.UUID, allowNull: false },
        addressType: { type: DataTypes.ENUM('shipping', 'billing', 'both'), defaultValue: 'shipping' },
        firstName: { type: DataTypes.STRING(100), allowNull: false },
        lastName: { type: DataTypes.STRING(100), allowNull: false },
        company: { type: DataTypes.STRING(200), allowNull: true },
        address1: { type: DataTypes.STRING(300), allowNull: false },
        address2: { type: DataTypes.STRING(300), allowNull: true },
        city: { type: DataTypes.STRING(100), allowNull: false },
        state: { type: DataTypes.STRING(100), allowNull: true },
        zip: { type: DataTypes.STRING(20), allowNull: true },
        // ISO-3166-1 alpha-2 (the API contract enforces length(2) in customerSchemas/orderSchemas).
        countryCode: { type: DataTypes.STRING(2), allowNull: false },
        phone: { type: DataTypes.STRING(30), allowNull: true },
        isDefault: { type: DataTypes.BOOLEAN, defaultValue: false },
    }, { schema: 'orders', underscored: true, timestamps: true, tableName: 'orders_addresses' });
};
