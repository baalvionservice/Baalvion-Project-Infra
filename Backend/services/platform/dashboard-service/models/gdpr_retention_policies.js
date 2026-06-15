'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('GdprRetentionPolicy', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
    data_type: { type: DataTypes.STRING(255), allowNull: false },
    period: { type: DataTypes.STRING(255), allowNull: true },
    legal_basis: { type: DataTypes.STRING(255), allowNull: true },
    sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, { schema: 'dashboard', tableName: 'gdpr_retention_policies', underscored: true, timestamps: true });
