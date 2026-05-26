'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Widget = sequelize.define('Widget', {
        id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
        dashboard_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: { model: { tableName: 'dashboards', schema: 'dashboard' }, key: 'id' }
        },
        org_id: { type: DataTypes.UUID, allowNull: false },
        name: { type: DataTypes.STRING(255), allowNull: false },
        widget_type: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: { isIn: [['chart', 'table', 'metric', 'text', 'map', 'iframe', 'list']] }
        },
        data_source_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
            references: { model: { tableName: 'data_sources', schema: 'dashboard' }, key: 'id' }
        },
        config: { type: DataTypes.JSONB, defaultValue: {} },
        position_x: { type: DataTypes.INTEGER, defaultValue: 0 },
        position_y: { type: DataTypes.INTEGER, defaultValue: 0 },
        width: { type: DataTypes.INTEGER, defaultValue: 4 },
        height: { type: DataTypes.INTEGER, defaultValue: 3 },
        refresh_interval_seconds: { type: DataTypes.INTEGER, defaultValue: 0 },
        last_refreshed_at: { type: DataTypes.DATE, allowNull: true },
    }, {
        tableName: 'widgets',
        schema: 'dashboard',
        underscored: true,
        timestamps: true,
    });
    return Widget;
};
