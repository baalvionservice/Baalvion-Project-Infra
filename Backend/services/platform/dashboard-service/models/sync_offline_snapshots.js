'use strict';
const { DataTypes } = require('sequelize');
// Offline (in-store POS) sales snapshot. There is no live POS feed yet, so offline figures are
// stored here (one row per org) while online figures are computed live from transactions.
module.exports = (sequelize) => sequelize.define('SyncOfflineSnapshot', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
    todays_revenue: { type: DataTypes.DECIMAL(14, 2), allowNull: true, defaultValue: 0 },
    walk_in_customers: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    avg_transaction: { type: DataTypes.DECIMAL(12, 2), allowNull: true, defaultValue: 0 },
    top_store: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
    revenue_last_7_days: { type: DataTypes.JSONB, allowNull: true, defaultValue: [] },
}, { schema: 'dashboard', tableName: 'sync_offline_snapshots', underscored: true, timestamps: true });
