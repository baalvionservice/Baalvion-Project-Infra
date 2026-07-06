'use strict';

/**
 * Contributor invitations — the VIP "invited to write for {publication}" flow.
 *
 * cms-service owns the invitation, the website membership it grants, and the
 * author (E-E-A-T) profile the invitee builds on accept. Account + password +
 * session remain owned by auth-service: the invitee provisions their account
 * through the existing public gateway (register / accept-invite → auto-login),
 * then the token-bound accept here finalises the CMS grant.
 *
 * The raw token is emailed; only its SHA-256 hash is stored, so a DB read can
 * never reconstruct a working link.
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('cms_invitations', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true, allowNull: false },
            website_id: {
                type: Sequelize.UUID, allowNull: false,
                references: { model: { tableName: 'cms_websites', schema: 'cms' }, key: 'id' },
                onDelete: 'CASCADE',
            },
            email: { type: Sequelize.STRING(255), allowNull: false },
            role: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'cms_author' },
            inviter_id: { type: Sequelize.INTEGER, allowNull: true },
            inviter_name: { type: Sequelize.STRING(200), allowNull: true },
            personal_note: { type: Sequelize.TEXT, allowNull: true },
            token_hash: { type: Sequelize.STRING(64), allowNull: false },
            status: { type: Sequelize.ENUM('pending', 'accepted', 'expired', 'revoked'), allowNull: false, defaultValue: 'pending' },
            accepted_by: { type: Sequelize.INTEGER, allowNull: true },
            accepted_at: { type: Sequelize.DATE, allowNull: true },
            expires_at: { type: Sequelize.DATE, allowNull: false },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'cms' });

        await queryInterface.addConstraint('cms.cms_invitations', {
            fields: ['token_hash'],
            type: 'unique',
            name: 'cms_invitations_token_hash_unique',
        });
        await queryInterface.addIndex('cms.cms_invitations', ['website_id']);
        await queryInterface.addIndex('cms.cms_invitations', ['email']);
        // One live (pending) invitation per website+email — re-inviting supersedes.
        await queryInterface.addIndex('cms.cms_invitations', ['website_id', 'email', 'status'], {
            name: 'cms_invitations_website_email_status_idx',
        });
    },
    async down(queryInterface) {
        await queryInterface.dropTable({ tableName: 'cms_invitations', schema: 'cms' });
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "cms"."enum_cms_invitations_status";');
    },
};
