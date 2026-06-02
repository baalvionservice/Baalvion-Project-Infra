'use strict';
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('report_schedule', {
        id:            { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        definition_id: { type: DataTypes.UUID, allowNull: false },
        org_id:        { type: DataTypes.STRING(128), allowNull: true },
        name:          { type: DataTypes.STRING(160), allowNull: true },
        // Interval-based cadence (cron-lite): 'hourly'|'daily'|'weekly'|'monthly' + at_minute/at_hour/at_weekday/at_day.
        cadence:       { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'daily' },
        at_minute:     { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        at_hour:       { type: DataTypes.INTEGER, allowNull: false, defaultValue: 6 },
        at_weekday:    { type: DataTypes.INTEGER, allowNull: true },  // 0=Sun..6=Sat (weekly)
        at_day:        { type: DataTypes.INTEGER, allowNull: true },  // 1..28 (monthly)
        timezone:      { type: DataTypes.STRING(48), allowNull: false, defaultValue: 'UTC' },
        format:        { type: DataTypes.STRING(8), allowNull: false, defaultValue: 'csv' },
        params:        { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        // Delivery: emit a `report.completed` event with a webhook/notification payload.
        delivery:      { type: DataTypes.JSONB, allowNull: false, defaultValue: {} }, // { channel:'event'|'webhook'|'email', target }
        enabled:       { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        last_run_at:   { type: DataTypes.DATE, allowNull: true },
        next_run_at:   { type: DataTypes.DATE, allowNull: true },
        created_by:    { type: DataTypes.STRING(64), allowNull: true },
        created_at:    { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    }, {
        tableName: 'report_schedules', schema: 'reports', timestamps: false,
    });
};
