'use strict';

/**
 * analytics.events — raw, append-only event spine (RANGE-partitioned by month).
 *
 * timestamps:false — the table has no created_at/updated_at; `receivedAt` is the
 * server ingest stamp and `occurredAt` the event time. The PK is composite
 * (event_id, occurred_at) because Postgres requires the partition key in the PK.
 * Writes are always stamped with websiteId + organizationId (tenant keys).
 */
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('analytics_events', {
        eventId: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        occurredAt: { type: DataTypes.DATE, allowNull: false, primaryKey: true },
        receivedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        websiteId: { type: DataTypes.UUID, allowNull: false },
        organizationId: { type: DataTypes.UUID, allowNull: false },
        provider: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'first_party' },
        event: { type: DataTypes.TEXT, allowNull: false },
        module: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'traffic' },
        userId: { type: DataTypes.BIGINT, allowNull: true },
        sessionId: { type: DataTypes.TEXT, allowNull: true },
        visitorId: { type: DataTypes.TEXT, allowNull: true },
        page: { type: DataTypes.TEXT, allowNull: true },
        url: { type: DataTypes.TEXT, allowNull: true },
        referrer: { type: DataTypes.TEXT, allowNull: true },
        campaign: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        geo: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        device: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        valueNum: { type: DataTypes.DECIMAL, allowNull: true },
        currency: { type: DataTypes.TEXT, allowNull: true },
        metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        // ── v2 trust/compliance layers ──
        consentState: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        fraudScore: { type: DataTypes.DECIMAL, allowNull: true },
        attributionId: { type: DataTypes.TEXT, allowNull: true },
        dedupeKey: { type: DataTypes.TEXT, allowNull: true },
        eventSchemaVersion: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 2 },
    }, {
        sequelize,
        tableName: 'events',
        schema: 'analytics',
        timestamps: false,
        underscored: true,
    });
};
