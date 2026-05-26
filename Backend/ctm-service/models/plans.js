'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('plans', {
    id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name:           { type: DataTypes.STRING(100), allowNull: false },
    slug:           { type: DataTypes.STRING(80), unique: true, allowNull: false },
    description:    { type: DataTypes.TEXT },
    monthly_price:  { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    annual_price:   { type: DataTypes.DECIMAL(10, 2) },
    currency:       { type: DataTypes.STRING(3), defaultValue: 'USD' },
    features:       { type: DataTypes.JSONB, defaultValue: {} },
    max_tasks:      { type: DataTypes.INTEGER },
    max_team_size:  { type: DataTypes.INTEGER },
    is_active:      { type: DataTypes.BOOLEAN, defaultValue: true },
}, { schema: 'ctm', tableName: 'plans' });
