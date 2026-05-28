module.exports = function (sequelize, DataTypes) {
    return sequelize.define('cms_contents', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        website_id: { type: DataTypes.UUID, allowNull: false },
        category_id: { type: DataTypes.UUID, allowNull: true },
        author_id: { type: DataTypes.BIGINT, allowNull: false },
        last_edited_by: { type: DataTypes.BIGINT, allowNull: true },
        title: { type: DataTypes.STRING(500), allowNull: false },
        slug: { type: DataTypes.STRING(500), allowNull: false },
        excerpt: { type: DataTypes.TEXT, allowNull: true },
        featured_image: { type: DataTypes.TEXT, allowNull: true },
        content_type: {
            type: DataTypes.ENUM(
                'page', 'post', 'article', 'product', 'event',
                'job_listing', 'portfolio_item', 'news', 'doc'
            ),
            allowNull: false,
            defaultValue: 'post',
        },
        content_blocks: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        tag_ids: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        seo_metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        status: {
            type: DataTypes.ENUM(
                'draft', 'pending_review', 'changes_requested',
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
        published_at: { type: DataTypes.DATE, allowNull: true },
        scheduled_at: { type: DataTypes.DATE, allowNull: true },
        view_count: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
        revision_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        custom_fields: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
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
