'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('leads', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    company_name: { type: DataTypes.STRING(255), allowNull: false },
    niche: { type: DataTypes.STRING(100), allowNull: true },
    email: { type: DataTypes.STRING(255), allowNull: true },
    instagram_handle: { type: DataTypes.STRING(100), allowNull: true },
    website: { type: DataTypes.STRING(500), allowNull: true },
    score: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
    priority: { type: DataTypes.STRING(20), defaultValue: 'medium' },
    score_breakdown: { type: DataTypes.JSONB, defaultValue: {} },
    status: { type: DataTypes.STRING(30), defaultValue: 'new' },
    assigned_to: { type: DataTypes.INTEGER, allowNull: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
    last_scored_at: { type: DataTypes.DATE, allowNull: true },
}, {
    schema: 'brand',
    tableName: 'leads',
    timestamps: true,
    underscored: true,
});
