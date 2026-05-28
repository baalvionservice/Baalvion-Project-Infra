'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('cms_workflows', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true, allowNull: false },
            content_id: { type: Sequelize.UUID, allowNull: false, unique: true, references: { model: { tableName: 'cms_contents', schema: 'cms' }, key: 'id' }, onDelete: 'CASCADE' },
            current_state: {
                type: Sequelize.ENUM('draft', 'pending_review', 'changes_requested', 'approved', 'scheduled', 'published', 'archived'),
                allowNull: false,
                defaultValue: 'draft',
            },
            submitted_by: { type: Sequelize.BIGINT, allowNull: true },
            reviewed_by: { type: Sequelize.BIGINT, allowNull: true },
            approved_by: { type: Sequelize.BIGINT, allowNull: true },
            published_by: { type: Sequelize.BIGINT, allowNull: true },
            submitted_at: { type: Sequelize.DATE, allowNull: true },
            reviewed_at: { type: Sequelize.DATE, allowNull: true },
            approved_at: { type: Sequelize.DATE, allowNull: true },
            published_at: { type: Sequelize.DATE, allowNull: true },
            comments: { type: Sequelize.TEXT, allowNull: true },
            scheduled_publish_at: { type: Sequelize.DATE, allowNull: true },
            schedule_job_id: { type: Sequelize.STRING(100), allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'cms' });

        await queryInterface.addIndex('cms.cms_workflows', ['current_state']);
        await queryInterface.addIndex('cms.cms_workflows', ['submitted_by']);
        await queryInterface.addIndex('cms.cms_workflows', ['scheduled_publish_at']);
    },
    async down(queryInterface) {
        await queryInterface.dropTable({ tableName: 'cms_workflows', schema: 'cms' });
    },
};
