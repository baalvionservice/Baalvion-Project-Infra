'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('scrape_sessions', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    query: { type: DataTypes.STRING(500), allowNull: false },
    platform: { type: DataTypes.STRING(50), allowNull: false },
    lead_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    org_id: { type: DataTypes.UUID, allowNull: false },
}, {
    schema: 'brand',
    tableName: 'scrape_sessions',
    timestamps: true,
    underscored: true,
});
