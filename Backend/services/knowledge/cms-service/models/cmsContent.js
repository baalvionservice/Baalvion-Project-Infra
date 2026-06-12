module.exports = function (sequelize, DataTypes) {
    return sequelize.define('cms_contents', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        websiteId: { type: DataTypes.UUID, allowNull: false },
        categoryId: { type: DataTypes.UUID, allowNull: true },
        categoryIds: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        authorId: { type: DataTypes.BIGINT, allowNull: false },
        lastEditedBy: { type: DataTypes.BIGINT, allowNull: true },
        title: { type: DataTypes.STRING(500), allowNull: false },
        slug: { type: DataTypes.STRING(500), allowNull: false },
        excerpt: { type: DataTypes.TEXT, allowNull: true },
        featuredImage: { type: DataTypes.TEXT, allowNull: true },
        contentType: {
            type: DataTypes.ENUM(
                'page', 'post', 'article', 'product', 'event',
                'job_listing', 'portfolio_item', 'news', 'doc'
            ),
            allowNull: false,
            defaultValue: 'post',
        },
        contentBlocks: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        tagIds: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        seoMetadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        status: {
            type: DataTypes.ENUM(
                'draft', 'pending_review', 'changes_requested', 'compliance_review',
                'approved', 'scheduled', 'published', 'archived'
            ),
            allowNull: false,
            defaultValue: 'draft',
        },
        visibility: {
            type: DataTypes.ENUM('public', 'private', 'password'),
            allowNull: false,
            defaultValue: 'public',
        },
        publishedAt: { type: DataTypes.DATE, allowNull: true },
        scheduledAt: { type: DataTypes.DATE, allowNull: true },
        viewCount: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
        revisionCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        customFields: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
    }, {
        sequelize,
        tableName: 'cms_contents',
        schema: 'cms',
        timestamps: true,
        underscored: true,
        indexes: [
            { unique: true, fields: ['website_id', 'slug'], name: 'cms_contents_website_slug_unique' },
            { fields: ['website_id'] },
            { fields: ['category_id'] },
            { fields: ['author_id'] },
            { fields: ['status'] },
            { fields: ['content_type'] },
            { fields: ['published_at'] },
            { fields: ['scheduled_at'] },
        ],
    });
};
