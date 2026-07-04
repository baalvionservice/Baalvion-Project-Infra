'use strict';

/**
 * analytics.sessions — first-party session rollup, maintained by the ingest
 * worker as page_view / session_* events arrive. Keyed by (website_id, session_id)
 * so first-party session ids never collide across tenants.
 */
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('analytics_sessions', {
        websiteId: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
        sessionId: { type: DataTypes.TEXT, allowNull: false, primaryKey: true },
        organizationId: { type: DataTypes.UUID, allowNull: false },
        visitorId: { type: DataTypes.TEXT, allowNull: true },
        startedAt: { type: DataTypes.DATE, allowNull: false },
        endedAt: { type: DataTypes.DATE, allowNull: true },
        durationS: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        pageviews: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        landingPage: { type: DataTypes.TEXT, allowNull: true },
        exitPage: { type: DataTypes.TEXT, allowNull: true },
        bounced: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        engaged: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        geo: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        device: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        campaign: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    }, {
        sequelize,
        tableName: 'sessions',
        schema: 'analytics',
        timestamps: true,
        underscored: true,
    });
};
