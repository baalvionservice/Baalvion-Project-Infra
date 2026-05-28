'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.sequelize.query(`
            CREATE TYPE cms.website_status AS ENUM ('active', 'inactive', 'maintenance', 'archived');
            CREATE TYPE cms.website_plan AS ENUM ('basic', 'pro', 'enterprise');
        `).catch(() => {}); // Ignore if already exists

        await queryInterface.createTable('cms_websites', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true, allowNull: false },
            organization_id: { type: Sequelize.UUID, allowNull: false },
            name: { type: Sequelize.STRING(200), allowNull: false },
            slug: { type: Sequelize.STRING(100), allowNull: false, unique: true },
            domain: { type: Sequelize.STRING(255), allowNull: false },
            description: { type: Sequelize.TEXT, allowNull: true },
            status: { type: Sequelize.ENUM('active', 'inactive', 'maintenance', 'archived'), allowNull: false, defaultValue: 'active' },
            plan: { type: Sequelize.ENUM('basic', 'pro', 'enterprise'), allowNull: false, defaultValue: 'basic' },
            modules: { type: Sequelize.JSONB, allowNull: false, defaultValue: JSON.stringify(['pages', 'blog']) },
            config: { type: Sequelize.JSONB, allowNull: false, defaultValue: JSON.stringify({}) },
            branding: { type: Sequelize.JSONB, allowNull: true },
            created_by: { type: Sequelize.BIGINT, allowNull: false },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'cms' });

        await queryInterface.addIndex('cms.cms_websites', ['organization_id']);
        await queryInterface.addIndex('cms.cms_websites', ['status']);
        await queryInterface.addIndex('cms.cms_websites', ['domain']);
    },
    async down(queryInterface) {
        await queryInterface.dropTable({ tableName: 'cms_websites', schema: 'cms' });
    },
};
