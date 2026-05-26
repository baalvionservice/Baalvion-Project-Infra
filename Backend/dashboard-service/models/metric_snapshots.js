'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const MetricSnapshot = sequelize.define('MetricSnapshot', {
        id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
        org_id: { type: DataTypes.UUID, allowNull: false },
        metric_name: { type: DataTypes.STRING(255), allowNull: false },
        metric_value: { type: DataTypes.DECIMAL(20, 4), allowNull: true },
        string_value: { type: DataTypes.TEXT, allowNull: true },
        unit: { type: DataTypes.STRING(50), allowNull: true },
        metadata: { type: DataTypes.JSONB, defaultValue: {} },
        captured_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    }, {
        tableName: 'metric_snapshots',
        schema: 'dashboard',
        underscored: true,
        timestamps: true,
    });
    return MetricSnapshot;
};
