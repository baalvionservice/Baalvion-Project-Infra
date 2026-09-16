'use strict';

/**
 * cms_editorial_charters — one per website.
 *
 * The site's editorial identity, in data: who we are, who we write for, what our
 * angle is, what we refuse to cover, and the integrity thresholds the machine
 * gates enforce. Every pipeline stage reads this row, which is what stops the
 * output from being a generic rewrite of whatever the wire happened to carry.
 */
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('cms_editorial_charters', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        websiteId: { type: DataTypes.UUID, allowNull: false, unique: true },
        niche: { type: DataTypes.TEXT, allowNull: false },
        audience: { type: DataTypes.TEXT, allowNull: false },
        houseAngle: { type: DataTypes.TEXT, allowNull: false },
        voice: { type: DataTypes.TEXT, allowNull: true },
        // What this site's pipeline produces: 'news' or 'article'. One kind per site.
        outputContentType: { type: DataTypes.STRING(24), allowNull: false, defaultValue: 'news' },
        covers: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        // news-service category names that are genuinely this site's beat.
        wireCategories: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        excludes: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        stanceRules: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        bannedClaims: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        requiredSections: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        minSources: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 2 },
        // A regulator's or court's own announcement is the source of record; it
        // does not need a second outlet to confirm it. See 20260039.
        singlePrimarySourceOk: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        maxSimilarityPct: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 18 },
        minCitationCoveragePct: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 70 },
        requireQuoteVerification: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        status: { type: DataTypes.STRING(24), allowNull: false, defaultValue: 'active' },
        createdBy: { type: DataTypes.BIGINT, allowNull: true },
        updatedBy: { type: DataTypes.BIGINT, allowNull: true },
    }, {
        sequelize,
        tableName: 'cms_editorial_charters',
        schema: 'cms',
        timestamps: true,
        underscored: true,
        indexes: [{ unique: true, fields: ['website_id'], name: 'cms_editorial_charters_website_unique' }],
    });
};
