'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('DueDiligenceItem', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
    item_key: { type: DataTypes.STRING(50), allowNull: false },
    label: { type: DataTypes.STRING(255), allowNull: false },
    sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, { schema: 'dashboard', tableName: 'due_diligence_items', underscored: true, timestamps: true });
