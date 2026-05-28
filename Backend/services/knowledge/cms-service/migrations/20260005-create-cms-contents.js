'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('cms_contents', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true, allowNull: false },
            website_id: { type: Sequelize.UUID, allowNull: false, references: { model: { tableName: 'cms_websites', schema: 'cms' }, key: 'id' }, onDelete: 'CASCADE' },
            category_id: { type: Sequelize.UUID, allowNull: true, references: { model: { tableName: 'cms_categories', schema: 'cms' }, key: 'id' }, onDelete: 'SET NULL' },
            author_id: { type: Sequelize.BIGINT, allowNull: false },
            last_edited_by: { type: Sequelize.BIGINT, allowNull: true },
            title: { type: Sequelize.STRING(500), allowNull: false },
            slug: { type: Sequelize.STRING(500), allowNull: false },
            excerpt: { type: Sequelize.TEXT, allowNull: true },
            featured_image: { type: Sequelize.TEXT, allowNull: true },
            content_type: {
                type: Sequelize.ENUM('page', 'post', 'article', 'product', 'event', 'job_listing', 'portfolio_item', 'news', 'doc'),
                allowNull: false,
                defaultValue: 'post',
            },
            content_blocks: { type: Sequelize.JSONB, allowNull: false, defaultValue: JSON.stringify([]) },
            tag_ids: { type: Sequelize.JSONB, allowNull: false, defaultValue: JSON.stringify([]) },
            seo_metadata: { type: Sequelize.JSONB, allowNull: false, defaultValue: JSON.stringify({}) },
            status: {
                type: Sequelize.ENUM('draft', 'pending_review', 'changes_requested', 'approved', 'scheduled', 'published', 'archived'),
                allowNull: false,
                defaultValue: 'draft',
            },
            visibility: { type: Sequelize.ENUM('public', 'private', 'password'), allowNull: false, defaultValue: 'public' },
            published_at: { type: Sequelize.DATE, allowNull: true },
            scheduled_at: { type: Sequelize.DATE, allowNull: true },
            view_count: { type: Sequelize.BIGINT, allowNull: false, defaultValue: 0 },
            revision_count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
            custom_fields: { type: Sequelize.JSONB, allowNull: true, defaultValue: JSON.stringify({}) },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'cms' });

        await queryInterface.addConstraint('cms.cms_contents', {
            fields: ['website_id', 'slug'],
            type: 'unique',
            name: 'cms_contents_website_slug_unique',
        });
        await queryInterface.addIndex('cms.cms_contents', ['website_id']);
        await queryInterface.addIndex('cms.cms_contents', ['category_id']);
        await queryInterface.addIndex('cms.cms_contents', ['author_id']);
        await queryInterface.addIndex('cms.cms_contents', ['status']);
        await queryInterface.addIndex('cms.cms_contents', ['content_type']);
        await queryInterface.addIndex('cms.cms_contents', ['published_at']);
        await queryInterface.addIndex('cms.cms_contents', ['scheduled_at']);

        // Full-text search index on title
        await queryInterface.sequelize.query(
            `CREATE INDEX IF NOT EXISTS cms_contents_title_fts ON cms.cms_contents USING gin(to_tsvector('english', title));`
        );
    },
    async down(queryInterface) {
        await queryInterface.dropTable({ tableName: 'cms_contents', schema: 'cms' });
    },
};
