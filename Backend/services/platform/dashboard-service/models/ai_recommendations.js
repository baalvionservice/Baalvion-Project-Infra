'use strict';
const { DataTypes } = require('sequelize');
// Editable AI growth opportunities (narrative recommendations). Numeric forecasts/risk are computed
// live from real financials in service/aiInsights.js; these are the curated growth-opportunity cards.
module.exports = (sequelize) => sequelize.define('AiRecommendation', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
    rec_key: { type: DataTypes.STRING(50), allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    estimated_impact: { type: DataTypes.STRING(100), allowNull: true },
    confidence: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 70 },
    sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, { schema: 'dashboard', tableName: 'ai_recommendations', underscored: true, timestamps: true });
