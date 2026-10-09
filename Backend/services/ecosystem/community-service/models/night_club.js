'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('NightClub', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    slug: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(160), allowNull: false },
    state: { type: DataTypes.STRING(80), allowNull: false },
    city: { type: DataTypes.STRING(80), allowNull: false },
    suburb: { type: DataTypes.STRING(80), allowNull: true },
    address: { type: DataTypes.STRING(300), allowNull: true },
    image: { type: DataTypes.STRING(600), allowNull: true },
    music_types: { type: DataTypes.ARRAY(DataTypes.STRING(60)), allowNull: false, defaultValue: [] },
    days_open: { type: DataTypes.STRING(80), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    cover_charge: { type: DataTypes.STRING(120), allowNull: true },
    vibe: { type: DataTypes.STRING(160), allowNull: true },
    required_roles: { type: DataTypes.ARRAY(DataTypes.STRING(80)), allowNull: false, defaultValue: [] },
    contact_email: { type: DataTypes.STRING(320), allowNull: true },
    vip_packages: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    rating: { type: DataTypes.DECIMAL(2, 1), allowNull: true },
    status: { type: DataTypes.ENUM('active', 'archived'), allowNull: false, defaultValue: 'active' },
}, {
    tableName: 'night_clubs',
    schema: 'community',
    underscored: true,
    timestamps: true,
    indexes: [{ fields: ['state'] }, { fields: ['city'] }, { fields: ['status'] }],
});
