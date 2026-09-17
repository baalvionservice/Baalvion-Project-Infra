'use strict';

// "Contact the author" submissions from /authors/[slug] on the public site.
// author_slug/author_name are plain strings, not an FK to cms_authors — the
// site's author identity is already split across the live cms_authors table
// AND the frontend's static roster (config/authors.ts; see resolveAuthor()),
// so several real, published authors have no cms_authors row today. An FK here
// would reject exactly those authors' own contact form. Same rationale as
// content.custom_fields->>'authorSlug' having no FK either (see authorService.js).
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('cms_author_messages', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true, allowNull: false },
            website_id: { type: Sequelize.UUID, allowNull: false, references: { model: { tableName: 'cms_websites', schema: 'cms' }, key: 'id' }, onDelete: 'CASCADE' },
            author_slug: { type: Sequelize.STRING(200), allowNull: false },
            author_name: { type: Sequelize.STRING(200), allowNull: false },
            sender_name: { type: Sequelize.STRING(200), allowNull: false },
            sender_email: { type: Sequelize.STRING(255), allowNull: false },
            message: { type: Sequelize.TEXT, allowNull: false },
            // 'unread' (default) | 'read' — set by an editor viewing it in the admin console.
            status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'unread' },
            // Whether the notification email (service/mailer.js sendAuthorContactMessage)
            // actually sent — the DB row is the durable record either way, so a mail
            // outage never loses the message, just the immediate notification.
            email_delivered: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'cms' });

        await queryInterface.addIndex('cms.cms_author_messages', ['website_id', 'status']);
        await queryInterface.addIndex('cms.cms_author_messages', ['website_id', 'author_slug']);
    },
    async down(queryInterface) {
        await queryInterface.dropTable({ tableName: 'cms_author_messages', schema: 'cms' });
    },
};
