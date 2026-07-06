'use strict';

/**
 * analytics.provider_metrics — time-series pulled from external providers
 * (GA4 Data API, Search Console, Ads, AdSense, pixels, Cloudflare, …) by the
 * connector sync jobs. `dims` holds the provider's breakdown dimensions
 * (e.g. { country }, { query }, { campaign }); `dimsHash` (DB-generated) makes
 * the row uniquely upsertable per (website, provider, metric, period, dims).
 */
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('analytics_provider_metrics', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        websiteId: { type: DataTypes.UUID, allowNull: false },
        organizationId: { type: DataTypes.UUID, allowNull: false },
        provider: { type: DataTypes.TEXT, allowNull: false },
        metric: { type: DataTypes.TEXT, allowNull: false },
        dims: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        // dimsHash is a STORED generated column — DB-managed, never written by the app.
        value: { type: DataTypes.DECIMAL, allowNull: false, defaultValue: 0 },
        granularity: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'day' },
        periodStart: { type: DataTypes.DATEONLY, allowNull: false },
        periodEnd: { type: DataTypes.DATEONLY, allowNull: false },
    }, {
        sequelize,
        tableName: 'provider_metrics',
        schema: 'analytics',
        timestamps: true,
        underscored: true,
    });
};
