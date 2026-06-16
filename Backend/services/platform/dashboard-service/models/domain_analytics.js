'use strict';
const { DataTypes } = require('sequelize');
// Per-domain web analytics. DB-backed cache; values can be overridden by an external provider
// (Google Analytics / Plausible) via service/analyticsProvider.js — see the seam there.
module.exports = (sequelize) => sequelize.define('DomainAnalytics', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
    domain_key: { type: DataTypes.STRING(50), allowNull: false },
    domain: { type: DataTypes.STRING(255), allowNull: false },
    business_name: { type: DataTypes.STRING(255), allowNull: true },
    ssl_status: { type: DataTypes.STRING(50), allowNull: true },
    monthly_visitors: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    page_views: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    avg_session_duration: { type: DataTypes.STRING(50), allowNull: true },
    web_revenue: { type: DataTypes.DECIMAL(14, 2), allowNull: true, defaultValue: 0 },
    uptime: { type: DataTypes.DECIMAL(6, 3), allowNull: true, defaultValue: 0 },
    hosting_cost: { type: DataTypes.DECIMAL(12, 2), allowNull: true, defaultValue: 0 },
    traffic_trend: { type: DataTypes.JSONB, allowNull: true, defaultValue: [] },
    top_pages: { type: DataTypes.JSONB, allowNull: true, defaultValue: [] },
    traffic_sources: { type: DataTypes.JSONB, allowNull: true, defaultValue: [] },
    seo: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
    geo_visitors: { type: DataTypes.JSONB, allowNull: true, defaultValue: [] },
    revenue_attribution: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
}, { schema: 'dashboard', tableName: 'domain_analytics', underscored: true, timestamps: true });
