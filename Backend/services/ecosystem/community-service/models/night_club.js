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
    // Facts from OpenStreetMap (ODbL) for the directory pages; null when the source does not state them.
    latitude: { type: DataTypes.DOUBLE, allowNull: true },
    longitude: { type: DataTypes.DOUBLE, allowNull: true },
    website: { type: DataTypes.STRING(300), allowNull: true },
    phone: { type: DataTypes.STRING(80), allowNull: true },
    opening_hours: { type: DataTypes.STRING(300), allowNull: true },
    venue_type: { type: DataTypes.STRING(20), allowNull: true },
    osm_ref: { type: DataTypes.STRING(30), allowNull: true },
    // What the page says about itself in search results and on the page: written by staff in the admin panel.
    seo_title: { type: DataTypes.STRING(160), allowNull: true },
    seo_description: { type: DataTypes.STRING(320), allowNull: true },
    about: { type: DataTypes.TEXT, allowNull: true },
    faqs: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    gallery: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    price_range: { type: DataTypes.STRING(8), allowNull: true },
    status: { type: DataTypes.ENUM('active', 'archived'), allowNull: false, defaultValue: 'active' },
}, {
    tableName: 'night_clubs',
    schema: 'community',
    underscored: true,
    timestamps: true,
    indexes: [{ fields: ['state'] }, { fields: ['city'] }, { fields: ['status'] }],
});
