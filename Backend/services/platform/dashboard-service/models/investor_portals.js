'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('InvestorPortal', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
    portal_key: { type: DataTypes.STRING(50), allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    pin: { type: DataTypes.STRING(20), allowNull: true },
    included_businesses: { type: DataTypes.JSONB, allowNull: true, defaultValue: [] },
    expires: { type: DataTypes.DATEONLY, allowNull: true },
    investor_name: { type: DataTypes.STRING(255), allowNull: true },
}, { schema: 'dashboard', tableName: 'investor_portals', underscored: true, timestamps: true });
