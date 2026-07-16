'use strict';

// Closes the article-schema gap flagged in the news-admin checklist audit: gallery
// images, video URL, reading time, editorial flags (featured/breaking/trending/
// editors-pick/premium), a fixed news-label taxonomy, and external-source attribution.
module.exports = {
    async up(queryInterface, Sequelize) {
        const table = { tableName: 'cms_contents', schema: 'cms' };
        await queryInterface.addColumn(table, 'gallery_images', { type: Sequelize.JSONB, allowNull: false, defaultValue: [] });
        await queryInterface.addColumn(table, 'video_url', { type: Sequelize.TEXT, allowNull: true });
        await queryInterface.addColumn(table, 'reading_time_minutes', { type: Sequelize.INTEGER, allowNull: true });
        await queryInterface.addColumn(table, 'is_featured', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false });
        await queryInterface.addColumn(table, 'is_breaking', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false });
        await queryInterface.addColumn(table, 'is_trending', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false });
        await queryInterface.addColumn(table, 'is_editors_pick', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false });
        await queryInterface.addColumn(table, 'is_premium', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false });
        await queryInterface.addColumn(table, 'news_labels', { type: Sequelize.JSONB, allowNull: false, defaultValue: [] });
        await queryInterface.addColumn(table, 'external_source_name', { type: Sequelize.TEXT, allowNull: true });
        await queryInterface.addColumn(table, 'external_source_url', { type: Sequelize.TEXT, allowNull: true });

        await queryInterface.addIndex(table, ['is_breaking'], { name: 'cms_contents_is_breaking_idx' });
        await queryInterface.addIndex(table, ['is_trending'], { name: 'cms_contents_is_trending_idx' });
        await queryInterface.addIndex(table, ['is_featured'], { name: 'cms_contents_is_featured_idx' });
    },
    async down(queryInterface) {
        const table = { tableName: 'cms_contents', schema: 'cms' };
        await queryInterface.removeIndex(table, 'cms_contents_is_breaking_idx');
        await queryInterface.removeIndex(table, 'cms_contents_is_trending_idx');
        await queryInterface.removeIndex(table, 'cms_contents_is_featured_idx');
        await queryInterface.removeColumn(table, 'gallery_images');
        await queryInterface.removeColumn(table, 'video_url');
        await queryInterface.removeColumn(table, 'reading_time_minutes');
        await queryInterface.removeColumn(table, 'is_featured');
        await queryInterface.removeColumn(table, 'is_breaking');
        await queryInterface.removeColumn(table, 'is_trending');
        await queryInterface.removeColumn(table, 'is_editors_pick');
        await queryInterface.removeColumn(table, 'is_premium');
        await queryInterface.removeColumn(table, 'news_labels');
        await queryInterface.removeColumn(table, 'external_source_name');
        await queryInterface.removeColumn(table, 'external_source_url');
    },
};
