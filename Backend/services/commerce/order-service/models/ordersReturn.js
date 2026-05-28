'use strict';
module.exports = function(sequelize, DataTypes) {
    return sequelize.define('OrdersReturn', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        orderId: { type: DataTypes.UUID, allowNull: false },
        customerId: { type: DataTypes.UUID, allowNull: true },
        storeId: { type: DataTypes.UUID, allowNull: false },
        returnNumber: { type: DataTypes.STRING(50), allowNull: false, unique: true },
        status: { type: DataTypes.ENUM('requested', 'approved', 'rejected', 'received', 'refunded', 'closed'), defaultValue: 'requested' },
        reason: { type: DataTypes.STRING(200), allowNull: false },
        notes: { type: DataTypes.TEXT, allowNull: true },
        totalRefund: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
        refundMethod: { type: DataTypes.STRING(50), allowNull: true },
        processedAt: { type: DataTypes.DATE, allowNull: true },
        processedBy: { type: DataTypes.BIGINT, allowNull: true },
    }, { schema: 'orders', underscored: true, timestamps: true, tableName: 'orders_returns' });
};
