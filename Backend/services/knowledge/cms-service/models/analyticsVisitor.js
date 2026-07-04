'use strict';

/**
 * analytics.visitors — per-website anonymous visitor identity. Keyed by
 * (website_id, visitor_id). `isReturning` flips true on the second distinct
 * session; drives returning-vs-new-user metrics without storing PII.
 */
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('analytics_visitors', {
        websiteId: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
        visitorId: { type: DataTypes.TEXT, allowNull: false, primaryKey: true },
        organizationId: { type: DataTypes.UUID, allowNull: false },
        firstSeen: { type: DataTypes.DATE, allowNull: false },
        lastSeen: { type: DataTypes.DATE, allowNull: false },
        sessionsCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        isReturning: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    }, {
        sequelize,
        tableName: 'visitors',
        schema: 'analytics',
        timestamps: true,
        underscored: true,
    });
};
