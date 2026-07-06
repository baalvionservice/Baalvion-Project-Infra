'use strict';

/**
 * analytics.rollup_monthly — per-module monthly aggregation, retained far longer
 * than daily rollups. Same shape as rollup_daily keyed by `month` (first-of-month
 * date) instead of `day`.
 */
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('analytics_rollup_monthly', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        websiteId: { type: DataTypes.UUID, allowNull: false },
        organizationId: { type: DataTypes.UUID, allowNull: false },
        module: { type: DataTypes.TEXT, allowNull: false },
        month: { type: DataTypes.DATEONLY, allowNull: false },
        dims: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        // dimsHash is a STORED generated column — DB-managed, never written by the app.
        metrics: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    }, {
        sequelize,
        tableName: 'rollup_monthly',
        schema: 'analytics',
        timestamps: true,
        underscored: true,
    });
};
