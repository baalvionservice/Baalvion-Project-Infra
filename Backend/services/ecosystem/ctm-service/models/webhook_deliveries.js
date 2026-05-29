'use strict';
const { DataTypes } = require('sequelize');

// Per-attempt delivery log for a webhook (real HTTP result).
module.exports = (sequelize) => sequelize.define('webhook_deliveries', {
    id:              { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    webhook_id:      { type: DataTypes.UUID, allowNull: false },
    event:           { type: DataTypes.STRING(80), allowNull: false },
    status:          { type: DataTypes.ENUM('Success', 'Failed'), defaultValue: 'Failed' },
    request_payload: { type: DataTypes.JSONB, defaultValue: {} },
    response_status: { type: DataTypes.INTEGER },
    response_body:   { type: DataTypes.TEXT },
    attempt:         { type: DataTypes.INTEGER, defaultValue: 1 },
    created_at:      { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { schema: 'ctm', tableName: 'webhook_deliveries', timestamps: false });
