'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Shareholder', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    role: { type: DataTypes.STRING(50), allowNull: false, validate: { isIn: [['Founder', 'CEO', 'Investor', 'Co-Founder']] } },
    equity_percentage: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    org_id: { type: DataTypes.UUID, allowNull: false },
}, { schema: 'dashboard', tableName: 'shareholders', underscored: true, timestamps: true });
