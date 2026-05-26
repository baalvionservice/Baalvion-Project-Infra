'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('PortalAccess', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
    shareholder_id: { type: DataTypes.INTEGER, allowNull: false },
    token: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    pin_hash: { type: DataTypes.STRING(255), allowNull: false },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    last_accessed_at: { type: DataTypes.DATE, allowNull: true },
}, { schema: 'dashboard', tableName: 'portal_access', underscored: true, timestamps: true });
