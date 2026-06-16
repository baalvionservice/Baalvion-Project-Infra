'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('DocHelpCategory', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
    slug: { type: DataTypes.STRING(100), allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.STRING(255), allowNull: true },
    sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, { schema: 'dashboard', tableName: 'doc_help_categories', underscored: true, timestamps: true });
