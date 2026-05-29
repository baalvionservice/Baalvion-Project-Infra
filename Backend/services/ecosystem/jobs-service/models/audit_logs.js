'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('AuditLog', {
    id:          { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    org_id:      { type: DataTypes.UUID, allowNull: false },
    actor_id:    { type: DataTypes.BIGINT, allowNull: true },
    actor_name:  { type: DataTypes.STRING(255), allowNull: true },
    action:      { type: DataTypes.STRING(100), allowNull: false },
    entity_type: { type: DataTypes.STRING(50), allowNull: true },
    entity_id:   { type: DataTypes.STRING(100), allowNull: true },
    details:     { type: DataTypes.JSONB, defaultValue: {} },
    ip:          { type: DataTypes.STRING(64), allowNull: true },
}, { schema: 'jobs', tableName: 'audit_logs', underscored: true, timestamps: true });
