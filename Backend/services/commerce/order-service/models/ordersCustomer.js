'use strict';
module.exports = function(sequelize, DataTypes) {
    return sequelize.define('OrdersCustomer', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        storeId: { type: DataTypes.UUID, allowNull: false },
        userId: { type: DataTypes.BIGINT, allowNull: true },
        email: { type: DataTypes.STRING(255), allowNull: false },
        firstName: { type: DataTypes.STRING(100), allowNull: false },
        lastName: { type: DataTypes.STRING(100), allowNull: false },
        phone: { type: DataTypes.STRING(30), allowNull: true },
        totalOrders: { type: DataTypes.INTEGER, defaultValue: 0 },
        totalSpent: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
        notes: { type: DataTypes.TEXT, allowNull: true },
        isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    }, { schema: 'orders', underscored: true, timestamps: true, tableName: 'orders_customers' });
};
