'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('cms_categories', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true, allowNull: false },
            website_id: { type: Sequelize.UUID, allowNull: false, references: { model: { tableName: 'cms_websites', schema: 'cms' }, key: 'id' }, onDelete: 'CASCADE' },
            parent_id: { type: Sequelize.UUID, allowNull: true, references: { model: { tableName: 'cms_categories', schema: 'cms' }, key: 'id' }, onDelete: 'SET NULL' },
            name: { type: Sequelize.STRING(200), allowNull: false },
            slug: { type: Sequelize.STRING(200), allowNull: false },
            description: { type: Sequelize.TEXT, allowNull: true },
            seo_metadata: { type: Sequelize.JSONB, allowNull: true, defaultValue: JSON.stringify({}) },
            sort_order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
            depth: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
            status: { type: Sequelize.ENUM('active', 'inactive'), allowNull: false, defaultValue: 'active' },
            content_count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'cms' });

        await queryInterface.addIndex('cms.cms_categories', ['website_id']);
        await queryInterface.addIndex('cms.cms_categories', ['parent_id']);
        await queryInterface.addConstraint('cms.cms_categories', {
            fields: ['website_id', 'slug'],
            type: 'unique',
            name: 'cms_categories_website_slug_unique',
        });
    },
    async down(queryInterface) {
        await queryInterface.dropTable({ tableName: 'cms_categories', schema: 'cms' });
    },
};
