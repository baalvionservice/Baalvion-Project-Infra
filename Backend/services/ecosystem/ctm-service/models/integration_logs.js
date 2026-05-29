'use strict';
const { DataTypes } = require('sequelize');

// Unified inbound/outbound integration event log (GitHub, Webhook, Slack, Sentry, ...).
module.exports = (sequelize) => sequelize.define('integration_logs', {
    id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    source:         { type: DataTypes.STRING(60), allowNull: false },
    event_type:     { type: DataTypes.STRING(120) },
    status:         { type: DataTypes.ENUM('Success', 'Warning', 'Error'), defaultValue: 'Success' },
    description:    { type: DataTypes.TEXT },
    related_entity: { type: DataTypes.JSONB, defaultValue: {} },
    created_at:     { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { schema: 'ctm', tableName: 'integration_logs', timestamps: false });
