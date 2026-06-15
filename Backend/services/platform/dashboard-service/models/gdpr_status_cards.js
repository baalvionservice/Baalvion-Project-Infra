'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('GdprStatusCard', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    status: { type: DataTypes.STRING(50), allowNull: true },
    description: { type: DataTypes.STRING(255), allowNull: true },
    sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, { schema: 'dashboard', tableName: 'gdpr_status_cards', underscored: true, timestamps: true });
