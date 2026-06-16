'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('GdprCookieConsent', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
    domain: { type: DataTypes.STRING(255), allowNull: false },
    rate: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
}, { schema: 'dashboard', tableName: 'gdpr_cookie_consent', underscored: true, timestamps: true });
