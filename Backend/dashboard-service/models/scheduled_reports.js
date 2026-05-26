'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ScheduledReport = sequelize.define('ScheduledReport', {
        id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
        org_id: { type: DataTypes.UUID, allowNull: false },
        created_by: { type: DataTypes.BIGINT, allowNull: false },
        dashboard_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
            references: { model: { tableName: 'dashboards', schema: 'dashboard' }, key: 'id' }
        },
        name: { type: DataTypes.STRING(255), allowNull: false },
        schedule_cron: { type: DataTypes.STRING(100), allowNull: false },
        format: {
            type: DataTypes.STRING(20),
            defaultValue: 'pdf',
            validate: { isIn: [['pdf', 'csv', 'xlsx']] }
        },
        recipients: { type: DataTypes.JSONB, defaultValue: [] },
        is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
        last_run_at: { type: DataTypes.DATE, allowNull: true },
        next_run_at: { type: DataTypes.DATE, allowNull: true },
        last_run_status: { type: DataTypes.STRING(32), allowNull: true },
    }, {
        tableName: 'scheduled_reports',
        schema: 'dashboard',
        underscored: true,
        timestamps: true,
    });
    return ScheduledReport;
};
