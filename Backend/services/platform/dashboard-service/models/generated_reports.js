'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('GeneratedReport', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
    report_type: { type: DataTypes.STRING(100), allowNull: false },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'generating', validate: { isIn: [['generating', 'ready', 'failed']] } },
    data: { type: DataTypes.JSONB, allowNull: true, defaultValue: null },
    options: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
}, { schema: 'dashboard', tableName: 'generated_reports', underscored: true, timestamps: true });
