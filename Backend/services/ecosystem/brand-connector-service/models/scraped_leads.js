'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('scraped_leads', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    session_id: { type: DataTypes.INTEGER, allowNull: false },
    platform: { type: DataTypes.STRING(50), allowNull: false },
    company_name: { type: DataTypes.STRING(255), allowNull: true },
    handle: { type: DataTypes.STRING(100), allowNull: true },
    followers: { type: DataTypes.INTEGER, defaultValue: 0 },
    niche: { type: DataTypes.STRING(100), allowNull: true },
    bio: { type: DataTypes.TEXT, allowNull: true },
    website: { type: DataTypes.STRING(500), allowNull: true },
    email: { type: DataTypes.STRING(255), allowNull: true },
    score: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
    is_enriched: { type: DataTypes.BOOLEAN, defaultValue: false },
    imported: { type: DataTypes.BOOLEAN, defaultValue: false },
    org_id: { type: DataTypes.UUID, allowNull: false },
}, {
    schema: 'brand',
    tableName: 'scraped_leads',
    timestamps: true,
    underscored: true,
});
