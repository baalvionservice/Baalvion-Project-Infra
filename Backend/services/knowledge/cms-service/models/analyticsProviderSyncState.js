'use strict';

/**
 * analytics.provider_sync_state — per-(website,provider) sync bookkeeping for the
 * hardened connector runtime: the incremental `watermark` (last period pulled),
 * last status/error for partial-failure tolerance, and a daily API-call counter
 * for cost/quota governance.
 */
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('analytics_provider_sync_state', {
        websiteId: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
        provider: { type: DataTypes.TEXT, allowNull: false, primaryKey: true },
        watermark: { type: DataTypes.DATEONLY, allowNull: true },
        lastSyncedAt: { type: DataTypes.DATE, allowNull: true },
        lastStatus: { type: DataTypes.TEXT, allowNull: true },
        lastError: { type: DataTypes.TEXT, allowNull: true },
        rowsWritten: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        callsToday: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        callsDate: { type: DataTypes.DATEONLY, allowNull: true },
    }, {
        sequelize,
        tableName: 'provider_sync_state',
        schema: 'analytics',
        timestamps: true,
        underscored: true,
    });
};
