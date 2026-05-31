'use strict';
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('report_definition', {
        id:            { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        org_id:        { type: DataTypes.STRING(128), allowNull: true },
        name:          { type: DataTypes.STRING(160), allowNull: false },
        description:   { type: DataTypes.TEXT, allowNull: true },
        category:      { type: DataTypes.STRING(80), allowNull: true },
        // 'query' = parameterized read-only SELECT against a datasource; 'inline' = caller supplies rows at run time.
        source_type:   { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'query' },
        datasource:    { type: DataTypes.STRING(64), allowNull: false, defaultValue: 'default' },
        query_template:{ type: DataTypes.TEXT, allowNull: true },
        // [{ name, type, required, default }]
        params_schema: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        // [{ key, label, type, format }] — drives export columns/ordering; empty = infer from first row.
        columns:       { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        default_format:{ type: DataTypes.STRING(8), allowNull: false, defaultValue: 'csv' },
        status:        { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'active' },
        created_by:    { type: DataTypes.STRING(64), allowNull: true },
        created_at:    { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated_at:    { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    }, {
        tableName: 'report_definitions', schema: 'reports', timestamps: false,
    });
};
