'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('ComplianceRecord', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    country_id: { type: DataTypes.STRING(10), allowNull: false },
    country: { type: DataTypes.STRING(100), allowNull: false },
    business_id: { type: DataTypes.INTEGER, allowNull: true },
    tax_status: { type: DataTypes.STRING(100), allowNull: true },
    tax_status_code: { type: DataTypes.STRING(20), allowNull: true, validate: { isIn: [['ok', 'warning']] } },
    vat_gst: { type: DataTypes.STRING(100), allowNull: true },
    licenses: { type: DataTypes.STRING(255), allowNull: true },
    data_laws: { type: DataTypes.STRING(255), allowNull: true },
    employment_law: { type: DataTypes.STRING(255), allowNull: true },
    overall_score: { type: DataTypes.INTEGER, allowNull: true },
    action_items: { type: DataTypes.JSONB, allowNull: true, defaultValue: [] },
    org_id: { type: DataTypes.UUID, allowNull: false },
}, { schema: 'dashboard', tableName: 'compliance_records', underscored: true, timestamps: true });
