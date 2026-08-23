'use strict';

// Reader comments on published content. Every row starts 'pending' -- the public
// list endpoint (service/engagementService.js listComments) only ever returns
// 'approved' rows, so nothing a visitor submits is shown as live until an editor
// with cms_reviewer+ moderates it (controller/commentModerationController.js).
// website_id is denormalized alongside content_id so the admin moderation queue
// can scope/paginate by website without joining through cms_contents.
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('cms_content_comments', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true, allowNull: false },
            website_id: { type: Sequelize.UUID, allowNull: false, references: { model: { tableName: 'cms_websites', schema: 'cms' }, key: 'id' }, onDelete: 'CASCADE' },
            content_id: { type: Sequelize.UUID, allowNull: false, references: { model: { tableName: 'cms_contents', schema: 'cms' }, key: 'id' }, onDelete: 'CASCADE' },
            author_name: { type: Sequelize.STRING(120), allowNull: false },
            author_email: { type: Sequelize.STRING(255), allowNull: false },
            body: { type: Sequelize.TEXT, allowNull: false },
            status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'pending' },
            reviewed_by: { type: Sequelize.BIGINT, allowNull: true },
            reviewed_at: { type: Sequelize.DATE, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'cms' });

        await queryInterface.addIndex('cms.cms_content_comments', ['website_id', 'status']);
        await queryInterface.addIndex('cms.cms_content_comments', ['content_id', 'status']);
    },
    async down(queryInterface) {
        await queryInterface.dropTable({ tableName: 'cms_content_comments', schema: 'cms' });
    },
};
