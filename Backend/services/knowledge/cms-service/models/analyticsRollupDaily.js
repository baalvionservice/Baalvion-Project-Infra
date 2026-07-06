'use strict';

/**
 * analytics.rollup_daily — per-module daily aggregation. This (plus
 * rollup_monthly and materialized views) is what the dashboard reads; it never
 * scans raw events. `metrics` is an open JSONB bag (e.g. { users, sessions,
 * pageviews, bounceRate }); `dims` holds the breakdown (e.g. { country },
 * { device }, {} for the site total).
 */
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('analytics_rollup_daily', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        websiteId: { type: DataTypes.UUID, allowNull: false },
        organizationId: { type: DataTypes.UUID, allowNull: false },
        module: { type: DataTypes.TEXT, allowNull: false },
        day: { type: DataTypes.DATEONLY, allowNull: false },
        dims: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        // dimsHash is a STORED generated column — DB-managed, never written by the app.
        metrics: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    }, {
        sequelize,
        tableName: 'rollup_daily',
        schema: 'analytics',
        timestamps: true,
        underscored: true,
    });
};
