'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('cms_content_revisions', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true, allowNull: false },
            content_id: { type: Sequelize.UUID, allowNull: false, references: { model: { tableName: 'cms_contents', schema: 'cms' }, key: 'id' }, onDelete: 'CASCADE' },
            revision_number: { type: Sequelize.INTEGER, allowNull: false },
            title: { type: Sequelize.STRING(500), allowNull: false },
            snapshot: { type: Sequelize.JSONB, allowNull: false },
            created_by: { type: Sequelize.BIGINT, allowNull: false },
            change_note: { type: Sequelize.STRING(500), allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'cms' });

        await queryInterface.addConstraint('cms.cms_content_revisions', {
            fields: ['content_id', 'revision_number'],
            type: 'unique',
            name: 'cms_revisions_content_rev_unique',
        });
        await queryInterface.addIndex('cms.cms_content_revisions', ['content_id']);
        await queryInterface.addIndex('cms.cms_content_revisions', ['created_by']);
    },
    async down(queryInterface) {
        await queryInterface.dropTable({ tableName: 'cms_content_revisions', schema: 'cms' });
    },
};
