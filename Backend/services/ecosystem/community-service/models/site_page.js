'use strict';
const { DataTypes } = require('sequelize');

// What staff write for a public page: how it shows in search results, and the content under it. Keyed by the page's path, e.g. "clubs/lottery".
module.exports = (sequelize) => sequelize.define('SitePage', {
    slug: { type: DataTypes.STRING(160), primaryKey: true },
    title: { type: DataTypes.STRING(160), allowNull: true },
    seo_title: { type: DataTypes.STRING(160), allowNull: true },
    seo_description: { type: DataTypes.STRING(320), allowNull: true },
    intro: { type: DataTypes.TEXT, allowNull: true },
    body: { type: DataTypes.TEXT, allowNull: true },
    benefits: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    faqs: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    image: { type: DataTypes.STRING(600), allowNull: true },
    noindex: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    updated_by: { type: DataTypes.STRING(64), allowNull: true },
}, { tableName: 'site_pages', schema: 'community', underscored: true, timestamps: true });
