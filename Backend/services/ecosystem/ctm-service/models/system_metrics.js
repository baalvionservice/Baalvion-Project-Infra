'use strict';
const { DataTypes } = require('sequelize');

// Periodic real metric snapshots (captured from prom-client + process + DB) so the
// admin dashboards have a genuine time-series instead of synthetic data.
module.exports = (sequelize) => sequelize.define('system_metrics', {
    id:                    { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    captured_at:           { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    active_users:          { type: DataTypes.INTEGER, defaultValue: 0 },
    active_sessions:       { type: DataTypes.INTEGER, defaultValue: 0 },
    system_load:           { type: DataTypes.FLOAT, defaultValue: 0 },   // % (CPU/mem derived)
    api_requests_per_minute:{ type: DataTypes.INTEGER, defaultValue: 0 },
    requests_per_second:   { type: DataTypes.FLOAT, defaultValue: 0 },
    error_rate:            { type: DataTypes.FLOAT, defaultValue: 0 },   // %
    avg_api_response_time: { type: DataTypes.FLOAT, defaultValue: 0 },   // ms
    db_query_time:         { type: DataTypes.FLOAT, defaultValue: 0 },   // ms
    auto_scaling_status:   { type: DataTypes.STRING(20), defaultValue: 'Stable' },
    metadata:              { type: DataTypes.JSONB, defaultValue: {} },
}, { schema: 'ctm', tableName: 'system_metrics', timestamps: false });
