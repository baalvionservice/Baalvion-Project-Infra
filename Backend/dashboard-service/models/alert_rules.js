'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('AlertRule', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    condition: { type: DataTypes.STRING(255), allowNull: true },
    threshold: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
    metric: { type: DataTypes.STRING(100), allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    notification_channels: { type: DataTypes.JSONB, allowNull: true, defaultValue: [] },
}, { schema: 'dashboard', tableName: 'alert_rules', underscored: true, timestamps: true });
