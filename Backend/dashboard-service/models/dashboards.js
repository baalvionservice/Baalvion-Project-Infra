'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Dashboard = sequelize.define('Dashboard', {
        id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
        org_id: { type: DataTypes.UUID, allowNull: false },
        created_by: { type: DataTypes.BIGINT, allowNull: false },
        name: { type: DataTypes.STRING(255), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        is_default: { type: DataTypes.BOOLEAN, defaultValue: false },
        is_public: { type: DataTypes.BOOLEAN, defaultValue: false },
        layout: { type: DataTypes.JSONB, defaultValue: [] },
        theme: { type: DataTypes.STRING(50), defaultValue: 'light' },
        refresh_interval_seconds: { type: DataTypes.INTEGER, defaultValue: 0 },
        widgets_count: { type: DataTypes.INTEGER, defaultValue: 0 },
        last_viewed_at: { type: DataTypes.DATE, allowNull: true },
    }, {
        tableName: 'dashboards',
        schema: 'dashboard',
        underscored: true,
        timestamps: true,
    });
    return Dashboard;
};
