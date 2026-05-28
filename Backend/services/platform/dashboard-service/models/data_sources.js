'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const DataSource = sequelize.define('DataSource', {
        id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
        org_id: { type: DataTypes.UUID, allowNull: false },
        created_by: { type: DataTypes.BIGINT, allowNull: false },
        name: { type: DataTypes.STRING(255), allowNull: false },
        source_type: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: { isIn: [['postgres', 'api', 'csv', 'google_sheets', 'bigquery']] }
        },
        connection_config: { type: DataTypes.JSONB, defaultValue: {} },
        query: { type: DataTypes.TEXT, allowNull: true },
        is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
        last_tested_at: { type: DataTypes.DATE, allowNull: true },
        last_test_status: { type: DataTypes.STRING(32), allowNull: true },
        last_test_error: { type: DataTypes.TEXT, allowNull: true },
        widgets_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    }, {
        tableName: 'data_sources',
        schema: 'dashboard',
        underscored: true,
        timestamps: true,
    });
    return DataSource;
};
