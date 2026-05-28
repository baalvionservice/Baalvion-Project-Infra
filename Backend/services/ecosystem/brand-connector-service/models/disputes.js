'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('disputes', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    campaign_id: { type: DataTypes.INTEGER, allowNull: true },
    creator_id: { type: DataTypes.INTEGER, allowNull: true },
    brand_id: { type: DataTypes.INTEGER, allowNull: true },
    deliverable_id: { type: DataTypes.INTEGER, allowNull: true },
    category: { type: DataTypes.STRING(100), allowNull: true },
    reason: { type: DataTypes.TEXT, allowNull: false },
    proposed_resolution: { type: DataTypes.TEXT, allowNull: true },
    evidence_urls: { type: DataTypes.JSONB, defaultValue: [] },
    status: { type: DataTypes.STRING(40), defaultValue: 'filed' },
    admin_notes: { type: DataTypes.TEXT, allowNull: true },
}, {
    schema: 'brand',
    tableName: 'disputes',
    timestamps: true,
    underscored: true,
});
