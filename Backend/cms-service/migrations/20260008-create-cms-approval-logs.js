'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('cms_approval_logs', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true, allowNull: false },
            workflow_id: { type: Sequelize.UUID, allowNull: false, references: { model: { tableName: 'cms_workflows', schema: 'cms' }, key: 'id' }, onDelete: 'CASCADE' },
            content_id: { type: Sequelize.UUID, allowNull: false },
            actor_id: { type: Sequelize.BIGINT, allowNull: false },
            action: {
                type: Sequelize.ENUM('submit_for_review', 'approve', 'request_changes', 'publish', 'schedule', 'unpublish', 'archive', 'restore_to_draft', 'autosave'),
                allowNull: false,
            },
            from_state: { type: Sequelize.STRING(32), allowNull: false },
            to_state: { type: Sequelize.STRING(32), allowNull: false },
            notes: { type: Sequelize.TEXT, allowNull: true },
            metadata: { type: Sequelize.JSONB, allowNull: true, defaultValue: JSON.stringify({}) },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'cms' });

        await queryInterface.addIndex('cms.cms_approval_logs', ['workflow_id']);
        await queryInterface.addIndex('cms.cms_approval_logs', ['content_id']);
        await queryInterface.addIndex('cms.cms_approval_logs', ['actor_id']);
        await queryInterface.addIndex('cms.cms_approval_logs', ['created_at']);
    },
    async down(queryInterface) {
        await queryInterface.dropTable({ tableName: 'cms_approval_logs', schema: 'cms' });
    },
};
