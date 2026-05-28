'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // Media references
        await queryInterface.createTable('cms_media_references', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true, allowNull: false },
            content_id: { type: Sequelize.UUID, allowNull: false, references: { model: { tableName: 'cms_contents', schema: 'cms' }, key: 'id' }, onDelete: 'CASCADE' },
            media_id: { type: Sequelize.UUID, allowNull: false },
            usage_type: { type: Sequelize.ENUM('featured_image', 'block_image', 'block_video', 'gallery', 'attachment'), allowNull: false, defaultValue: 'block_image' },
            metadata: { type: Sequelize.JSONB, allowNull: true, defaultValue: JSON.stringify({}) },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'cms' });

        await queryInterface.addIndex('cms.cms_media_references', ['content_id']);
        await queryInterface.addIndex('cms.cms_media_references', ['media_id']);

        // SEO redirects
        await queryInterface.createTable('cms_seo_redirects', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true, allowNull: false },
            website_id: { type: Sequelize.UUID, allowNull: false, references: { model: { tableName: 'cms_websites', schema: 'cms' }, key: 'id' }, onDelete: 'CASCADE' },
            source_url: { type: Sequelize.STRING(1000), allowNull: false },
            target_url: { type: Sequelize.STRING(1000), allowNull: false },
            redirect_type: { type: Sequelize.ENUM('301', '302'), allowNull: false, defaultValue: '301' },
            is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
            hit_count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'cms' });

        await queryInterface.addConstraint('cms.cms_seo_redirects', {
            fields: ['website_id', 'source_url'],
            type: 'unique',
            name: 'cms_redirects_website_source_unique',
        });
        await queryInterface.addIndex('cms.cms_seo_redirects', ['website_id', 'is_active']);
    },
    async down(queryInterface) {
        await queryInterface.dropTable({ tableName: 'cms_seo_redirects', schema: 'cms' });
        await queryInterface.dropTable({ tableName: 'cms_media_references', schema: 'cms' });
    },
};
