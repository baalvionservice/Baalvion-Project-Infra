'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('cms_website_members', {
            id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true, allowNull: false },
            website_id: { type: Sequelize.UUID, allowNull: false, references: { model: { tableName: 'cms_websites', schema: 'cms' }, key: 'id' }, onDelete: 'CASCADE' },
            user_id: { type: Sequelize.BIGINT, allowNull: false },
            role: {
                type: Sequelize.ENUM('cms_admin', 'cms_editor', 'cms_publisher', 'cms_reviewer', 'cms_seo_manager', 'cms_author', 'cms_contributor', 'cms_viewer'),
                allowNull: false,
                defaultValue: 'cms_author',
            },
            invited_by: { type: Sequelize.BIGINT, allowNull: true },
            joined_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'cms' });

        await queryInterface.addConstraint('cms.cms_website_members', {
            fields: ['website_id', 'user_id'],
            type: 'unique',
            name: 'cms_members_website_user_unique',
        });
        await queryInterface.addIndex('cms.cms_website_members', ['website_id']);
        await queryInterface.addIndex('cms.cms_website_members', ['user_id']);
    },
    async down(queryInterface) {
        await queryInterface.dropTable({ tableName: 'cms_website_members', schema: 'cms' });
    },
};
