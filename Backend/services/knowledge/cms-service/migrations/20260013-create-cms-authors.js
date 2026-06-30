'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('cms_authors', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true, allowNull: false },
            website_id: { type: Sequelize.UUID, allowNull: false, references: { model: { tableName: 'cms_websites', schema: 'cms' }, key: 'id' }, onDelete: 'CASCADE' },
            slug: { type: Sequelize.STRING(200), allowNull: false },
            name: { type: Sequelize.STRING(200), allowNull: false },
            title: { type: Sequelize.STRING(200), allowNull: true },
            credentials: { type: Sequelize.STRING(300), allowNull: true },
            bio: { type: Sequelize.TEXT, allowNull: true },
            avatar_url: { type: Sequelize.TEXT, allowNull: true },
            expertise: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
            social: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
            seo_metadata: { type: Sequelize.JSONB, allowNull: true, defaultValue: {} },
            status: { type: Sequelize.ENUM('active', 'inactive'), allowNull: false, defaultValue: 'active' },
            sort_order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
            content_count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'cms' });

        await queryInterface.addConstraint('cms.cms_authors', {
            fields: ['website_id', 'slug'],
            type: 'unique',
            name: 'cms_authors_website_slug_unique',
        });
        await queryInterface.addIndex('cms.cms_authors', ['website_id']);
        await queryInterface.addIndex('cms.cms_authors', ['sort_order']);
    },
    async down(queryInterface) {
        await queryInterface.dropTable({ tableName: 'cms_authors', schema: 'cms' });
        // Drop the enum type Sequelize creates for the status column on Postgres.
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "cms"."enum_cms_authors_status";');
    },
};
