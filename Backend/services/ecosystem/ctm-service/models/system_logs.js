'use strict';
const { DataTypes } = require('sequelize');

// Structured application logs (real notable events: errors, slow requests, lifecycle).
module.exports = (sequelize) => sequelize.define('system_logs', {
    id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    service:   { type: DataTypes.STRING(60), defaultValue: 'ctm-service' },
    severity:  { type: DataTypes.ENUM('Info', 'Warning', 'Error'), defaultValue: 'Info' },
    message:   { type: DataTypes.TEXT, allowNull: false },
    metadata:  { type: DataTypes.JSONB, defaultValue: {} },
    created_at:{ type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { schema: 'ctm', tableName: 'system_logs', timestamps: false });
