'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('companies', {
    id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    owner_user_id:{ type: DataTypes.BIGINT, allowNull: false },
    name:         { type: DataTypes.STRING(200), allowNull: false },
    slug:         { type: DataTypes.STRING(120), unique: true, allowNull: false },
    logo_url:     { type: DataTypes.TEXT },
    description:  { type: DataTypes.TEXT },
    website:      { type: DataTypes.STRING(500) },
    tier:         { type: DataTypes.ENUM('free', 'starter', 'pro', 'enterprise'), defaultValue: 'free' },
    status:       { type: DataTypes.ENUM('active', 'suspended', 'pending'), defaultValue: 'active' },
    settings:     { type: DataTypes.JSONB, defaultValue: {} },
}, { schema: 'ctm', tableName: 'companies' });
