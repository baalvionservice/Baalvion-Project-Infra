'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('OperationsAlert', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: true },
    severity: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'Info', validate: { isIn: [['Critical', 'Warning', 'Info']] } },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'open', validate: { isIn: [['open', 'acknowledged', 'resolved']] } },
    business_id: { type: DataTypes.INTEGER, allowNull: true },
}, { schema: 'dashboard', tableName: 'operations_alerts', underscored: true, timestamps: true });
