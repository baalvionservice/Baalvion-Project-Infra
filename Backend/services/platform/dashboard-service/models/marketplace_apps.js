'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('MarketplaceApp', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
    slug: { type: DataTypes.STRING(100), allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    category: { type: DataTypes.STRING(100), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    rating: { type: DataTypes.DECIMAL(3, 1), allowNull: true },
    installs: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    developer: { type: DataTypes.STRING(255), allowNull: true },
    version: { type: DataTypes.STRING(50), allowNull: true },
    last_updated: { type: DataTypes.STRING(50), allowNull: true },
    featured: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    icon: { type: DataTypes.TEXT, allowNull: true },
    permissions: { type: DataTypes.JSONB, allowNull: true, defaultValue: [] },
    pricing: { type: DataTypes.STRING(100), allowNull: true },
    features: { type: DataTypes.JSONB, allowNull: true, defaultValue: [] },
    screenshots: { type: DataTypes.JSONB, allowNull: true, defaultValue: [] },
    reviews: { type: DataTypes.JSONB, allowNull: true, defaultValue: [] },
}, { schema: 'dashboard', tableName: 'marketplace_apps', underscored: true, timestamps: true });
