'use strict';
const { DataTypes } = require('sequelize');

// Append-only record of what staff did. Rows are only ever inserted; no route updates or deletes them.
module.exports = (sequelize) => sequelize.define('AuditEvent', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    actor_id: { type: DataTypes.STRING(64), allowNull: false },
    actor_label: { type: DataTypes.STRING(160), allowNull: true },
    actor_tier: { type: DataTypes.STRING(20), allowNull: true },
    action: { type: DataTypes.STRING(120), allowNull: false },
    summary: { type: DataTypes.STRING(300), allowNull: false },
    target_id: { type: DataTypes.STRING(80), allowNull: true },
    severity: { type: DataTypes.ENUM('info', 'warning', 'critical'), allowNull: false, defaultValue: 'info' },
    ip: { type: DataTypes.STRING(64), allowNull: true },
    status_code: { type: DataTypes.INTEGER, allowNull: true },
}, {
    tableName: 'audit_events', schema: 'community', underscored: true, timestamps: true, updatedAt: false,
    indexes: [{ fields: ['created_at'] }, { fields: ['actor_id'] }, { fields: ['action'] }],
});
