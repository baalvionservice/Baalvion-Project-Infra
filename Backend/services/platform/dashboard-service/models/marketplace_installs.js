'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('MarketplaceInstall', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
    app_slug: { type: DataTypes.STRING(100), allowNull: false },
    installed_at: { type: DataTypes.DATE, allowNull: true },
}, { schema: 'dashboard', tableName: 'marketplace_installs', underscored: true, timestamps: true });
