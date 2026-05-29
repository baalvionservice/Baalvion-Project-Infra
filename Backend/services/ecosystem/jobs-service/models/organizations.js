'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Organization', {
    id:         { type: DataTypes.UUID, primaryKey: true },
    name:       { type: DataTypes.STRING(255), allowNull: false },
    slug:       { type: DataTypes.STRING(255), allowNull: true },
    plan:       { type: DataTypes.STRING(20), defaultValue: 'FREE', validate: { isIn: [['FREE', 'PRO', 'ENTERPRISE']] } },
    logo_url:   { type: DataTypes.TEXT, allowNull: true },
}, { schema: 'jobs', tableName: 'organizations', underscored: true, timestamps: true });
