'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('cms_tags', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true, allowNull: false },
            website_id: { type: Sequelize.UUID, allowNull: false, references: { model: { tableName: 'cms_websites', schema: 'cms' }, key: 'id' }, onDelete: 'CASCADE' },
            name: { type: Sequelize.STRING(100), allowNull: false },
            slug: { type: Sequelize.STRING(100), allowNull: false },
            content_count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'cms' });

        await queryInterface.addConstraint('cms.cms_tags', {
            fields: ['website_id', 'slug'],
            type: 'unique',
            name: 'cms_tags_website_slug_unique',
        });
        await queryInterface.addIndex('cms.cms_tags', ['website_id']);
    },
    async down(queryInterface) {
        await queryInterface.dropTable({ tableName: 'cms_tags', schema: 'cms' });
    },
};
