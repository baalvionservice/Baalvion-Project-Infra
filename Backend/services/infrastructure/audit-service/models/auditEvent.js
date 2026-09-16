'use strict';
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('audit_event', {
        seq:            { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
        // The DB generates this — the hash chain deliberately excludes event_id/seq/recorded_at
        // as DB-controlled (see services/hashChain.js), and INSERT_SQL omits the column entirely.
        // Without the literal default, sequelize.sync() creates the column NOT NULL with no
        // default and EVERY append fails on a not-null violation — silently, because the
        // consumer only logs and never ACKs. migrations/001_audit_schema.sql already had this
        // default; sync() was creating a table that disagreed with the migration.
        event_id:       { type: DataTypes.UUID, allowNull: false, defaultValue: sequelize.literal('gen_random_uuid()') },
        // Same story as event_id: the migration gives both DEFAULT NOW(), the model did not,
        // and sync() won. recorded_at is never supplied by the writer (INSERT_SQL omits it),
        // so without the default every append failed.
        occurred_at:    { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('NOW()') },
        recorded_at:    { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('NOW()') },
        actor_id:       { type: DataTypes.STRING(64), allowNull: true },
        actor_org_id:   { type: DataTypes.STRING(128), allowNull: true },
        ip_address:     { type: DataTypes.STRING(45), allowNull: true },
        user_agent:     { type: DataTypes.TEXT, allowNull: true },
        action:         { type: DataTypes.STRING(160), allowNull: false },
        resource_type:  { type: DataTypes.STRING(120), allowNull: true },
        resource_id:    { type: DataTypes.STRING(255), allowNull: true },
        tenant_id:      { type: DataTypes.STRING(128), allowNull: true },
        scope_id:       { type: DataTypes.STRING(128), allowNull: true },
        outcome:        { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'success' },
        severity:       { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'info' },
        source_service: { type: DataTypes.STRING(80), allowNull: true },
        app_id:         { type: DataTypes.STRING(80), allowNull: true },
        correlation_id: { type: DataTypes.STRING(128), allowNull: true },
        metadata:       { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        prev_hash:      { type: DataTypes.CHAR(64), allowNull: false },
        hash:           { type: DataTypes.CHAR(64), allowNull: false },
    }, {
        sequelize, tableName: 'events', schema: 'audit', timestamps: false,
    });
};
