'use strict';
module.exports = (sequelize, DataTypes) =>
    sequelize.define('IngestRun', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        ran_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        created: { type: DataTypes.INTEGER, defaultValue: 0 },
        report: { type: DataTypes.JSONB, defaultValue: {} },
    }, { schema: 'legal', tableName: 'ingest_runs', underscored: true, timestamps: false });
