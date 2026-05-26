'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('plans', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    monthly_price: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    annual_price: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    commission: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
    features: { type: DataTypes.JSONB, defaultValue: [] },
    limits: { type: DataTypes.JSONB, defaultValue: {} },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
    schema: 'brand',
    tableName: 'plans',
    timestamps: true,
    underscored: true,
});
