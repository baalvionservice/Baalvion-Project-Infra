'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('FinanceReport', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
    report_key: { type: DataTypes.STRING(50), allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    type: { type: DataTypes.STRING(100), allowNull: true },
    period: { type: DataTypes.STRING(50), allowNull: true },
    generated_at: { type: DataTypes.DATEONLY, allowNull: true },
    size_label: { type: DataTypes.STRING(50), allowNull: true },
    file_url: { type: DataTypes.STRING(500), allowNull: true, defaultValue: null },
}, { schema: 'dashboard', tableName: 'finance_reports', underscored: true, timestamps: true });
