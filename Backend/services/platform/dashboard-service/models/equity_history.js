'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('EquityHistory', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    shareholder_id: { type: DataTypes.INTEGER, allowNull: false },
    old_percentage: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
    new_percentage: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
    reason: { type: DataTypes.TEXT, allowNull: true },
    changed_by: { type: DataTypes.INTEGER, allowNull: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
}, { schema: 'dashboard', tableName: 'equity_history', underscored: true, timestamps: true });
