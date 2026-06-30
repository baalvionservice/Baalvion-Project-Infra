'use strict';

/**
 * cms_authors — per-website author / contributor profiles.
 *
 * Powers E-E-A-T author bylines and profile pages on delivery sites: a name,
 * editorial title, credentials line, biography, portrait, focus areas, and
 * social links, plus per-profile SEO. Content references a profile by its slug
 * (customFields.authorSlug) so this table stays additive — it does not alter
 * the shared cms_contents table.
 */
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('cms_authors', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        websiteId: { type: DataTypes.UUID, allowNull: false },
        slug: { type: DataTypes.STRING(200), allowNull: false },
        name: { type: DataTypes.STRING(200), allowNull: false },
        title: { type: DataTypes.STRING(200), allowNull: true },
        credentials: { type: DataTypes.STRING(300), allowNull: true },
        bio: { type: DataTypes.TEXT, allowNull: true },
        avatarUrl: { type: DataTypes.TEXT, allowNull: true },
        // Array of focus areas, e.g. ["Business & Corporate", "Tax & Finance"].
        expertise: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        // { x?: string, linkedin?: string }
        social: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        // { title?, description?, keywords?, ogImage?, noIndex? }
        seoMetadata: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
        status: {
            type: DataTypes.ENUM('active', 'inactive'),
            allowNull: false,
            defaultValue: 'active',
        },
        sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        contentCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    }, {
        sequelize,
        tableName: 'cms_authors',
        schema: 'cms',
        timestamps: true,
        underscored: true,
        indexes: [
            { unique: true, fields: ['website_id', 'slug'], name: 'cms_authors_website_slug_unique' },
            { fields: ['website_id'] },
            { fields: ['sort_order'] },
        ],
    });
};
