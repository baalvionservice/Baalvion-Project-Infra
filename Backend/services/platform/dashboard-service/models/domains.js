'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Domain', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    type: { type: DataTypes.STRING(100), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    country: { type: DataTypes.STRING(100), allowNull: true },
    country_code: { type: DataTypes.STRING(10), allowNull: true },
    currency: { type: DataTypes.STRING(10), allowNull: true, defaultValue: 'USD' },
    status: { type: DataTypes.STRING(50), allowNull: true, defaultValue: 'Active' },
    org_id: { type: DataTypes.UUID, allowNull: false },
}, { schema: 'dashboard', tableName: 'domains', underscored: true, timestamps: true });
