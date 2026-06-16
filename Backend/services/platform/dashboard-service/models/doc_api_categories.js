'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('DocApiCategory', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    endpoints: { type: DataTypes.JSONB, allowNull: true, defaultValue: [] },
    sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, { schema: 'dashboard', tableName: 'doc_api_categories', underscored: true, timestamps: true });
