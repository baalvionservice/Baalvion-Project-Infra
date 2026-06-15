'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('AutomationWebhook', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
    event_key: { type: DataTypes.STRING(50), allowNull: false },
    occurred_at: { type: DataTypes.DATE, allowNull: true },
    event_type: { type: DataTypes.STRING(100), allowNull: true },
    source: { type: DataTypes.STRING(100), allowNull: true },
    payload: { type: DataTypes.TEXT, allowNull: true },
    response_code: { type: DataTypes.INTEGER, allowNull: true },
    status: { type: DataTypes.STRING(20), allowNull: true, defaultValue: 'Success' },
}, { schema: 'dashboard', tableName: 'automation_webhooks', underscored: true, timestamps: true });
