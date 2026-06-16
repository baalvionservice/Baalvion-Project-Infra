'use strict';
const { DataTypes } = require('sequelize');
// GLOBAL reference data (NOT org-scoped): FX rates vs USD shared by all tenants. Refreshed from a
// pluggable external provider (see service/fxProvider.js); seeded so the endpoint is never empty.
module.exports = (sequelize) => sequelize.define('FxRate', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    base: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'USD' },
    code: { type: DataTypes.STRING(10), allowNull: false },
    symbol: { type: DataTypes.STRING(10), allowNull: true },
    currency: { type: DataTypes.STRING(100), allowNull: true },
    rate: { type: DataTypes.DECIMAL(18, 6), allowNull: false, defaultValue: 1 },
    change_24h: { type: DataTypes.DECIMAL(10, 4), allowNull: true, defaultValue: 0 },
    change_7d: { type: DataTypes.DECIMAL(10, 4), allowNull: true, defaultValue: 0 },
    prev_rate: { type: DataTypes.DECIMAL(18, 6), allowNull: true, defaultValue: null },
    last_updated: { type: DataTypes.DATE, allowNull: true },
    as_of: { type: DataTypes.DATE, allowNull: true },
}, { schema: 'dashboard', tableName: 'fx_rates', underscored: true, timestamps: true });
