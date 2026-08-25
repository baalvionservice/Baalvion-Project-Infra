'use strict';

// Reader polls, one per article. Options are stored as a JSON array of strings
// on the poll itself; tallies are computed by counting cms_poll_votes rows
// (same "count, don't maintain a running counter" approach as feedback), not
// stored as a mutable column. voter_token mirrors cms_content_feedback exactly
// -- a client-generated id (localStorage), unique per (poll_id, voter_token)
// so the same browser can't vote twice, no account required.
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('cms_content_polls', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true, allowNull: false },
            website_id: { type: Sequelize.UUID, allowNull: false, references: { model: { tableName: 'cms_websites', schema: 'cms' }, key: 'id' }, onDelete: 'CASCADE' },
            content_id: { type: Sequelize.UUID, allowNull: false, references: { model: { tableName: 'cms_contents', schema: 'cms' }, key: 'id' }, onDelete: 'CASCADE' },
            question: { type: Sequelize.STRING(500), allowNull: false },
            options: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
            status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'active' },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'cms' });

        await queryInterface.addIndex('cms.cms_content_polls', ['content_id'], {
            unique: true,
            name: 'cms_content_polls_content_unique',
        });

        await queryInterface.createTable('cms_poll_votes', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true, allowNull: false },
            poll_id: { type: Sequelize.UUID, allowNull: false, references: { model: { tableName: 'cms_content_polls', schema: 'cms' }, key: 'id' }, onDelete: 'CASCADE' },
            option_index: { type: Sequelize.INTEGER, allowNull: false },
            voter_token: { type: Sequelize.STRING(64), allowNull: false },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'cms' });

        await queryInterface.addIndex('cms.cms_poll_votes', ['poll_id']);
        await queryInterface.addIndex('cms.cms_poll_votes', ['poll_id', 'voter_token'], {
            unique: true,
            name: 'cms_poll_votes_poll_voter_unique',
        });
    },
    async down(queryInterface) {
        await queryInterface.dropTable({ tableName: 'cms_poll_votes', schema: 'cms' });
        await queryInterface.dropTable({ tableName: 'cms_content_polls', schema: 'cms' });
    },
};
