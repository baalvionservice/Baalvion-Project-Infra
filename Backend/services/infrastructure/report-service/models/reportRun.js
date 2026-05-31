'use strict';
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('report_run', {
        id:            { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        definition_id: { type: DataTypes.UUID, allowNull: false },
        org_id:        { type: DataTypes.STRING(128), allowNull: true },
        status:        { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'pending' }, // pending|running|completed|failed
        format:        { type: DataTypes.STRING(8), allowNull: false, defaultValue: 'csv' },
        params:        { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        row_count:     { type: DataTypes.INTEGER, allowNull: true },
        // Rendered artifact is kept inline for small reports (dev/local); large ones would offload to S3.
        artifact:      { type: DataTypes.TEXT, allowNull: true },        // base64 for binary formats, raw text otherwise
        artifact_encoding: { type: DataTypes.STRING(8), allowNull: false, defaultValue: 'utf8' }, // utf8|base64
        content_type:  { type: DataTypes.STRING(80), allowNull: true },
        byte_size:     { type: DataTypes.INTEGER, allowNull: true },
        error:         { type: DataTypes.TEXT, allowNull: true },
        duration_ms:   { type: DataTypes.INTEGER, allowNull: true },
        triggered_by:  { type: DataTypes.STRING(64), allowNull: true },
        trigger:       { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'manual' }, // manual|schedule|api
        created_at:    { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        completed_at:  { type: DataTypes.DATE, allowNull: true },
    }, {
        tableName: 'report_runs', schema: 'reports', timestamps: false,
    });
};
