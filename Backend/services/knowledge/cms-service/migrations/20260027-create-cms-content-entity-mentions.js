'use strict';

// Persisted, save-time entity-mention detections (imperialpedia-service's
// service/entityMentionDetectionService.js writes here via the internal PATCH
// endpoint on publish/unpublish) — the public site reads this instead of
// re-scanning article text on every render. `status`/`reviewed_by`/
// `reviewed_at` are review-workflow-ready fields: Phase 1 always writes
// `status: 'accepted'` (auto-linking), reserved for a future editor
// accept/reject UI that needs no further schema change.
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('cms_content_entity_mentions', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true, allowNull: false },
            content_id: { type: Sequelize.UUID, allowNull: false, references: { model: { tableName: 'cms_contents', schema: 'cms' }, key: 'id' }, onDelete: 'CASCADE' },
            entity_type: { type: Sequelize.STRING(50), allowNull: false },
            entity_slug: { type: Sequelize.STRING(300), allowNull: false },
            entity_name: { type: Sequelize.STRING(300), allowNull: false },
            entity_url: { type: Sequelize.STRING(500), allowNull: false },
            matched_text: { type: Sequelize.STRING(300), allowNull: false },
            status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'accepted' },
            source: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'auto' },
            detected_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            reviewed_by: { type: Sequelize.BIGINT, allowNull: true },
            reviewed_at: { type: Sequelize.DATE, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'cms' });

        await queryInterface.addIndex('cms.cms_content_entity_mentions', ['content_id']);
        await queryInterface.addIndex('cms.cms_content_entity_mentions', ['status']);
        await queryInterface.addIndex('cms.cms_content_entity_mentions', ['content_id', 'entity_type', 'entity_slug'], {
            unique: true,
            name: 'cms_content_entity_mentions_content_entity_unique',
        });
    },
    async down(queryInterface) {
        await queryInterface.dropTable({ tableName: 'cms_content_entity_mentions', schema: 'cms' });
    },
};
