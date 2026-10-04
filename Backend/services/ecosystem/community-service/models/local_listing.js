'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('LocalListing', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    slug: { type: DataTypes.STRING(200), allowNull: false, unique: true },
    title: { type: DataTypes.STRING(240), allowNull: false },
    type: { type: DataTypes.ENUM('Casting & Jobs', 'Events', 'Matchmaking', 'Travel'), allowNull: false },
    location: { type: DataTypes.STRING(160), allowNull: false },
    city: { type: DataTypes.STRING(80), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    requirements: { type: DataTypes.ARRAY(DataTypes.TEXT), allowNull: false, defaultValue: [] },
    contact: { type: DataTypes.STRING(200), allowNull: true },
    event_date: { type: DataTypes.STRING(80), allowNull: true },
    salary: { type: DataTypes.STRING(120), allowNull: true },
    posted_by: { type: DataTypes.STRING(160), allowNull: false },
    verified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    min_age: { type: DataTypes.INTEGER, allowNull: true },
    max_age: { type: DataTypes.INTEGER, allowNull: true },
    gender: { type: DataTypes.ENUM('Male', 'Female', 'Any'), allowNull: true },
    primary_category: { type: DataTypes.STRING(120), allowNull: true },
    role_requirements: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    seo_keywords: { type: DataTypes.ARRAY(DataTypes.STRING(80)), allowNull: false, defaultValue: [] },
    status: { type: DataTypes.ENUM('active', 'closed', 'archived'), allowNull: false, defaultValue: 'active' },
}, {
    tableName: 'local_listings',
    schema: 'community',
    underscored: true,
    timestamps: true,
    indexes: [{ fields: ['type'] }, { fields: ['city'] }, { fields: ['status'] }],
});
