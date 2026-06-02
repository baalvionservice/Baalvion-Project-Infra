'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('cms_website_integrations', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true, allowNull: false },
            website_id: { type: Sequelize.UUID, allowNull: false, references: { model: { tableName: 'cms_websites', schema: 'cms' }, key: 'id' }, onDelete: 'CASCADE' },
            provider: { type: Sequelize.STRING(64), allowNull: false },
            category: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'other' },
            label: { type: Sequelize.STRING(120), allowNull: true },
            config: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
            secrets_enc: { type: Sequelize.TEXT, allowNull: true },
            secret_hints: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
            enabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
            status: { type: Sequelize.STRING(24), allowNull: false, defaultValue: 'unconfigured' },
            last_tested_at: { type: Sequelize.DATE, allowNull: true },
            last_test_ok: { type: Sequelize.BOOLEAN, allowNull: true },
            last_test_message: { type: Sequelize.STRING(500), allowNull: true },
            created_by: { type: Sequelize.BIGINT, allowNull: true },
            updated_by: { type: Sequelize.BIGINT, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'cms' });

        await queryInterface.addConstraint('cms.cms_website_integrations', {
            fields: ['website_id', 'provider'],
            type: 'unique',
            name: 'cms_integrations_website_provider_unique',
        });
        await queryInterface.addIndex('cms.cms_website_integrations', ['website_id']);
        await queryInterface.addIndex('cms.cms_website_integrations', ['category']);
    },
    async down(queryInterface) {
        await queryInterface.dropTable({ tableName: 'cms_website_integrations', schema: 'cms' });
    },
};
