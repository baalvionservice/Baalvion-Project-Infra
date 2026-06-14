'use strict';
module.exports = function(sequelize, DataTypes) {
    return sequelize.define('OrdersReturnItem', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        returnId: { type: DataTypes.UUID, allowNull: false },
        orderItemId: { type: DataTypes.UUID, allowNull: false },
        quantity: { type: DataTypes.INTEGER, allowNull: false },
        reason: { type: DataTypes.STRING(200), allowNull: true },
        condition: { type: DataTypes.ENUM('new', 'like_new', 'good', 'fair', 'poor'), defaultValue: 'good' },
        refundAmount: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
    }, { schema: 'orders', underscored: true, timestamps: true, tableName: 'orders_return_items' });
};
