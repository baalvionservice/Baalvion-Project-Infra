'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('AutomationCronJob', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
    job_key: { type: DataTypes.STRING(50), allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    frequency: { type: DataTypes.STRING(100), allowNull: true },
    last_run: { type: DataTypes.DATE, allowNull: true },
    next_run: { type: DataTypes.DATE, allowNull: true },
    duration: { type: DataTypes.STRING(20), allowNull: true },
    status: { type: DataTypes.STRING(20), allowNull: true, defaultValue: 'Success' },
}, { schema: 'dashboard', tableName: 'automation_cron_jobs', underscored: true, timestamps: true });
