'use strict';
module.exports = function(sequelize, DataTypes) {
    return sequelize.define('OrdersOrderPayment', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        orderId: { type: DataTypes.UUID, allowNull: false },
        provider: { type: DataTypes.STRING(50), allowNull: false },
        transactionId: { type: DataTypes.STRING(200), allowNull: true },
        amount: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
        currencyCode: { type: DataTypes.STRING(3), allowNull: false },
        status: { type: DataTypes.ENUM('pending', 'authorized', 'captured', 'refunded', 'voided', 'failed'), defaultValue: 'pending' },
        metadata: { type: DataTypes.JSONB, defaultValue: {} },
        paidAt: { type: DataTypes.DATE, allowNull: true },
    }, { schema: 'orders', underscored: true, timestamps: true, tableName: 'orders_order_payments' });
};
