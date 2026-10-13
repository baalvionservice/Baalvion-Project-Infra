'use strict';

// "Ask for access" — a signed-in person who is not a member of a website can request a role
// on it; a platform admin approves (which creates the normal membership) or denies. Rows are
// never deleted, so who asked for what, and who decided, stays answerable later.
module.exports = {
    async up(queryInterface, Sequelize) {
        const table = { tableName: 'cms_access_requests', schema: 'cms' };
        await queryInterface.createTable(table, {
            id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
            website_id: {
                type: Sequelize.UUID, allowNull: false,
                references: { model: { tableName: 'cms_websites', schema: 'cms' }, key: 'id' },
                onDelete: 'CASCADE',
            },
            user_id: { type: Sequelize.BIGINT, allowNull: false },
            requester_email: { type: Sequelize.STRING(255), allowNull: true },
            requester_name: { type: Sequelize.STRING(255), allowNull: true },
            requested_role: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'cms_author' },
            note: { type: Sequelize.TEXT, allowNull: true },
            status: { type: Sequelize.STRING(16), allowNull: false, defaultValue: 'pending' },
            decided_by: { type: Sequelize.BIGINT, allowNull: true },
            decided_at: { type: Sequelize.DATE, allowNull: true },
            decision_note: { type: Sequelize.TEXT, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('now()') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('now()') },
        });
        await queryInterface.addIndex(table, ['status', 'created_at'], { name: 'cms_access_requests_status_idx' });
        await queryInterface.addIndex(table, ['user_id'], { name: 'cms_access_requests_user_idx' });
        // One open request per person per site; history rows (approved/denied) are unrestricted.
        await queryInterface.sequelize.query(
            `CREATE UNIQUE INDEX IF NOT EXISTS cms_access_requests_one_pending
             ON cms.cms_access_requests (website_id, user_id) WHERE status = 'pending'`,
        );
    },
    async down(queryInterface) {
        await queryInterface.dropTable({ tableName: 'cms_access_requests', schema: 'cms' });
    },
};
