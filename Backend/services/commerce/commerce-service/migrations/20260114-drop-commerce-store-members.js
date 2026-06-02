'use strict';
// Store/team roles are owned entirely by RBAC (rbac-service) via @baalvion/commerce-rbac.
// The local commerce_store_members table is retired from the authority path (Phase 1) and now
// dropped so no parallel role state can exist. Idempotent: safe whether or not the table exists.
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query('DROP TABLE IF EXISTS commerce.commerce_store_members CASCADE;');
    },

    // Best-effort structural recreate (data is NOT restored — RBAC is the source of truth).
    async down(queryInterface, Sequelize) {
        await queryInterface.createTable(
            { tableName: 'commerce_store_members', schema: 'commerce' },
            {
                id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
                store_id: { type: Sequelize.UUID, allowNull: false },
                user_id: { type: Sequelize.BIGINT, allowNull: false },
                role: { type: Sequelize.STRING(32), allowNull: false },
                invited_by: { type: Sequelize.BIGINT, allowNull: true },
                joined_at: { type: Sequelize.DATE, allowNull: true },
                created_at: { type: Sequelize.DATE, allowNull: false },
                updated_at: { type: Sequelize.DATE, allowNull: false },
            },
        );
        await queryInterface.addConstraint({ tableName: 'commerce_store_members', schema: 'commerce' }, {
            fields: ['store_id', 'user_id'], type: 'unique', name: 'commerce_store_members_store_user_uq',
        });
    },
};
