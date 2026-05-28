'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Transaction', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    business_id: { type: DataTypes.INTEGER, allowNull: true },
    gateway: { type: DataTypes.STRING(50), allowNull: true },
    customer_name: { type: DataTypes.STRING(255), allowNull: true },
    customer_email: { type: DataTypes.STRING(255), allowNull: true },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    fee: { type: DataTypes.DECIMAL(10, 2), allowNull: true, defaultValue: 0 },
    currency: { type: DataTypes.STRING(10), allowNull: true, defaultValue: 'USD' },
    status: { type: DataTypes.STRING(20), allowNull: true, defaultValue: 'Pending', validate: { isIn: [['Success', 'Failed', 'Pending']] } },
    org_id: { type: DataTypes.UUID, allowNull: false },
}, { schema: 'dashboard', tableName: 'transactions', underscored: true, timestamps: true });
