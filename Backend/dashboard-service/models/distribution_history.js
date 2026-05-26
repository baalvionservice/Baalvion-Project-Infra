'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('DistributionHistory', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
    total_profit: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    retention_percentage: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
    retained_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    distributed_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    payouts: { type: DataTypes.JSONB, allowNull: true, defaultValue: [] },
}, { schema: 'dashboard', tableName: 'distribution_history', underscored: true, timestamps: true });
