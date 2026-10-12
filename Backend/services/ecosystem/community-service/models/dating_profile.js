'use strict';
const { DataTypes } = require('sequelize');

// A verified adult's dating profile. birth_date is copied from their approved KYC and never shown; only the age is.
module.exports = (sequelize) => sequelize.define('DatingProfile', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    display_name: { type: DataTypes.STRING(80), allowNull: false },
    birth_date: { type: DataTypes.DATEONLY, allowNull: false },
    headline: { type: DataTypes.STRING(120), allowNull: true },
    bio: { type: DataTypes.STRING(600), allowNull: true },
    city: { type: DataTypes.STRING(80), allowNull: true },
    is_founder: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    company_name: { type: DataTypes.STRING(120), allowNull: true },
    role_title: { type: DataTypes.STRING(80), allowNull: true },
    looking_for: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'dating' },
    interests: { type: DataTypes.ARRAY(DataTypes.STRING(40)), allowNull: false, defaultValue: [] },
    photo_asset_id: { type: DataTypes.UUID, allowNull: true },
    status: { type: DataTypes.STRING(12), allowNull: false, defaultValue: 'active' },
    hidden_reason: { type: DataTypes.STRING(300), allowNull: true },
}, { tableName: 'dating_profiles', schema: 'community', underscored: true, timestamps: true, indexes: [{ fields: ['status', 'city'] }] });
