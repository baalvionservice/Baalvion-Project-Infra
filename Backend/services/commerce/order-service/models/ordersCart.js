'use strict';
module.exports = function(sequelize, DataTypes) {
    return sequelize.define('OrdersCart', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        storeId: { type: DataTypes.UUID, allowNull: false },
        customerId: { type: DataTypes.UUID, allowNull: true },
        userId: { type: DataTypes.BIGINT, allowNull: true },
        sessionId: { type: DataTypes.STRING(128), allowNull: true },
        items: { type: DataTypes.JSONB, defaultValue: [] },
        currencyCode: { type: DataTypes.STRING(3), defaultValue: 'USD' },
        subtotal: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
        discountCode: { type: DataTypes.STRING(100), allowNull: true },
        discountAmount: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
        totalAmount: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
        expiresAt: { type: DataTypes.DATE, allowNull: true },
    }, { schema: 'orders', underscored: true, timestamps: true, tableName: 'orders_carts' });
};
