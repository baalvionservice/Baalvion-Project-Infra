'use strict';
const { DataTypes } = require('sequelize');
// Online/offline data conflicts surfaced on the Sync view. resolved=false → open conflict;
// resolved=true → resolution-history entry.
module.exports = (sequelize) => sequelize.define('SyncConflict', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
    conflict_key: { type: DataTypes.STRING(50), allowNull: false },
    business_id: { type: DataTypes.STRING(50), allowNull: true },
    field: { type: DataTypes.STRING(255), allowNull: true },
    offline_value: { type: DataTypes.STRING(255), allowNull: true },
    online_value: { type: DataTypes.STRING(255), allowNull: true },
    detected_at: { type: DataTypes.DATE, allowNull: true },
    resolved: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    resolved_by: { type: DataTypes.STRING(255), allowNull: true },
    resolved_at: { type: DataTypes.DATE, allowNull: true },
    action: { type: DataTypes.STRING(255), allowNull: true },
}, { schema: 'dashboard', tableName: 'sync_conflicts', underscored: true, timestamps: true });
