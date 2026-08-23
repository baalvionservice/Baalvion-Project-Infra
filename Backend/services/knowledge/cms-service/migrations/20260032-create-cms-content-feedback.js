'use strict';

// "Was this helpful?" votes. voter_token is a client-generated id (stored in
// localStorage, not tied to any account) purely to stop the same browser from
// voting twice -- the unique (content_id, voter_token) index enforces that at
// the DB level rather than trusting the client. No updated_at: a vote is
// write-once from the reader's side (see engagementService.submitFeedback's
// swallow-and-return-summary handling of the unique-violation case).
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('cms_content_feedback', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true, allowNull: false },
            website_id: { type: Sequelize.UUID, allowNull: false, references: { model: { tableName: 'cms_websites', schema: 'cms' }, key: 'id' }, onDelete: 'CASCADE' },
            content_id: { type: Sequelize.UUID, allowNull: false, references: { model: { tableName: 'cms_contents', schema: 'cms' }, key: 'id' }, onDelete: 'CASCADE' },
            vote: { type: Sequelize.STRING(20), allowNull: false },
            voter_token: { type: Sequelize.STRING(64), allowNull: false },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'cms' });

        await queryInterface.addIndex('cms.cms_content_feedback', ['content_id']);
        await queryInterface.addIndex('cms.cms_content_feedback', ['content_id', 'voter_token'], {
            unique: true,
            name: 'cms_content_feedback_content_voter_unique',
        });
    },
    async down(queryInterface) {
        await queryInterface.dropTable({ tableName: 'cms_content_feedback', schema: 'cms' });
    },
};
