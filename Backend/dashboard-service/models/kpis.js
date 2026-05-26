'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('KPI', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    business_id: { type: DataTypes.INTEGER, allowNull: true },
    revenue_target: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
    revenue_actual: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
    profit_margin: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    profit_trend: { type: DataTypes.STRING(10), allowNull: true, validate: { isIn: [['up', 'down', 'flat']] } },
    customers_total: { type: DataTypes.INTEGER, allowNull: true },
    customers_change: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    return_rate: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    nps: { type: DataTypes.INTEGER, allowNull: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
}, { schema: 'dashboard', tableName: 'kpis', underscored: true, timestamps: true });
