'use strict';

/**
 * analytics.anomalies — findings from the reconciliation/anomaly engine
 * (traffic spikes/drops, CTR drops, provider-vs-first-party mismatch, missing
 * pages). One open row per (website, kind, metric, day); resolving clears it.
 */
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('analytics_anomalies', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        websiteId: { type: DataTypes.UUID, allowNull: false },
        organizationId: { type: DataTypes.UUID, allowNull: false },
        detectedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        kind: { type: DataTypes.TEXT, allowNull: false },
        severity: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'info' },
        metric: { type: DataTypes.TEXT, allowNull: true },
        observed: { type: DataTypes.DECIMAL, allowNull: true },
        expected: { type: DataTypes.DECIMAL, allowNull: true },
        deviation: { type: DataTypes.DECIMAL, allowNull: true },
        details: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        resolved: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    }, {
        sequelize,
        tableName: 'anomalies',
        schema: 'analytics',
        timestamps: true,
        updatedAt: false,
        underscored: true,
    });
};
