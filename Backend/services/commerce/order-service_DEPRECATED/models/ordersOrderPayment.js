'use strict';
const { Op } = require('sequelize');
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
    }, {
        schema: 'orders', underscored: true, timestamps: true, tableName: 'orders_order_payments',
        // Hard idempotency (see migration 20260215). Partial unique because transaction_id is nullable.
        indexes: [{ unique: true, name: 'uq_order_payments_order_txn', fields: ['order_id', 'transaction_id'], where: { transaction_id: { [Op.ne]: null } } }],
    });
};
