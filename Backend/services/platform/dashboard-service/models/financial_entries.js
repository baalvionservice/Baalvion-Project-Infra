'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('FinancialEntry', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    domain_id: { type: DataTypes.INTEGER, allowNull: true },
    type: { type: DataTypes.STRING(20), allowNull: false, validate: { isIn: [['Revenue', 'Expense']] } },
    amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    category: { type: DataTypes.STRING(100), allowNull: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
}, { schema: 'dashboard', tableName: 'financial_entries', underscored: true, timestamps: true });
