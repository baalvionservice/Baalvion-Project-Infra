'use strict';
const { DataTypes } = require('sequelize');

// Real captured errors (populated by errorMiddleware). De-duplicated by fingerprint
// with a frequency counter, matching the frontend SystemError dashboard.
module.exports = (sequelize) => sequelize.define('system_errors', {
    id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    fingerprint:    { type: DataTypes.STRING(200), unique: true },
    service:        { type: DataTypes.STRING(60), defaultValue: 'ctm-service' },
    type:           { type: DataTypes.STRING(120), defaultValue: 'Unhandled Exception' },
    severity:       { type: DataTypes.ENUM('Critical', 'Warning', 'Minor'), defaultValue: 'Warning' },
    message:        { type: DataTypes.TEXT, allowNull: false },
    stack_trace:    { type: DataTypes.TEXT },
    frequency:      { type: DataTypes.INTEGER, defaultValue: 1 },
    affected_users: { type: DataTypes.INTEGER, defaultValue: 0 },
    status:         { type: DataTypes.ENUM('Open', 'Resolved', 'Ignored'), defaultValue: 'Open' },
    last_occurred:  { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    metadata:       { type: DataTypes.JSONB, defaultValue: {} },
}, { schema: 'ctm', tableName: 'system_errors', timestamps: true });
