'use strict';

/**
 * cms_article_drafts — a written article held OUTSIDE cms_contents until a human
 * approves it.
 *
 * Keeping drafts in their own table (rather than as another cms_contents status)
 * means an ungated, unreviewed machine draft can never be reached by the public
 * delivery API, the sitemap, or a preview link. `cmsContentId` is set only once
 * approval has copied it into the real content table.
 *
 * `authorSlug` is the byline and `reviewedBy` is the staff user who actually
 * clicked approve — two different questions, two different columns.
 */
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('cms_article_drafts', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        websiteId: { type: DataTypes.UUID, allowNull: false },
        briefId: { type: DataTypes.UUID, allowNull: false },
        title: { type: DataTypes.TEXT, allowNull: false },
        dek: { type: DataTypes.TEXT, allowNull: true },
        slug: { type: DataTypes.STRING(500), allowNull: true },
        contentBlocks: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        citations: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        seoMetadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        authorSlug: { type: DataTypes.STRING(200), allowNull: true },
        reviewerSlug: { type: DataTypes.STRING(200), allowNull: true },
        categoryHint: { type: DataTypes.TEXT, allowNull: true },
        gateStatus: { type: DataTypes.STRING(24), allowNull: false, defaultValue: 'pending' },
        gateResults: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        similarityPct: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
        citationCoveragePct: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
        status: { type: DataTypes.STRING(24), allowNull: false, defaultValue: 'generating' },
        reviewNotes: { type: DataTypes.TEXT, allowNull: true },
        reviewedBy: { type: DataTypes.BIGINT, allowNull: true },
        reviewedAt: { type: DataTypes.DATE, allowNull: true },
        cmsContentId: { type: DataTypes.UUID, allowNull: true },
        modelUsed: { type: DataTypes.TEXT, allowNull: true },
        failureReason: { type: DataTypes.TEXT, allowNull: true },
    }, {
        sequelize,
        tableName: 'cms_article_drafts',
        schema: 'cms',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['website_id', 'status'] },
            { fields: ['brief_id'] },
            { fields: ['cms_content_id'] },
        ],
    });
};
