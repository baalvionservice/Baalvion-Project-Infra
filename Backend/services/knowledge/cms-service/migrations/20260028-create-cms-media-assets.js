'use strict';

// mediaService.js (org-scoped media library, `/cms/media/*`) has queried
// `cms.cms_media_assets` and `cms.cms_media_folders` via raw SQL since the
// feature was built, but no migration ever created either table — every
// upload has failed with `relation "cms.cms_media_assets" does not exist"`
// in any environment whose schema comes only from these migrations.
//
// scripts/bootstrapMedia.js already defines this exact shape as a manual,
// idempotent `CREATE TABLE IF NOT EXISTS` workaround — it was apparently run
// by hand in at least one environment but never wired into the deploy
// pipeline (which only runs `npm run migrate`) or turned into a real
// migration, so production never got the tables. This migration matches
// bootstrapMedia.js's columns/constraints exactly (self-referencing
// parent_id FK included) so both paths produce an identical schema.
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('cms_media_folders', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true, allowNull: false },
            // No FK to an organizations table — orgs live in a different service's
            // database in this microservice split, same pattern cms_websites uses.
            org_id: { type: Sequelize.UUID, allowNull: true },
            name: { type: Sequelize.TEXT, allowNull: false },
            created_by: { type: Sequelize.BIGINT, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'cms' });

        // Self-referencing "parent folder" — added as a follow-up constraint (not
        // inline on the column) since the table doesn't exist yet at the point
        // Sequelize would otherwise need to resolve the FK target.
        await queryInterface.addColumn({ tableName: 'cms_media_folders', schema: 'cms' }, 'parent_id', {
            type: Sequelize.UUID, allowNull: true,
            references: { model: { tableName: 'cms_media_folders', schema: 'cms' }, key: 'id' },
            onDelete: 'CASCADE',
        });
        await queryInterface.addIndex('cms.cms_media_folders', ['org_id']);

        await queryInterface.createTable('cms_media_assets', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true, allowNull: false },
            org_id: { type: Sequelize.UUID, allowNull: true },
            folder_id: {
                type: Sequelize.UUID, allowNull: true,
                references: { model: { tableName: 'cms_media_folders', schema: 'cms' }, key: 'id' },
                // A deleted folder unassigns its files rather than deleting them —
                // matches bootstrapMedia.js and the "media library" UX every other CMS uses.
                onDelete: 'SET NULL',
            },
            // Generated <uuid>.<ext> the file is actually stored under (local disk
            // key or S3 object key) — see mediaService.js saveUpload().
            storage_key: { type: Sequelize.TEXT, allowNull: false },
            filename: { type: Sequelize.TEXT, allowNull: false },
            original_name: { type: Sequelize.TEXT, allowNull: false },
            mime_type: { type: Sequelize.TEXT, allowNull: false },
            size: { type: Sequelize.BIGINT, allowNull: false, defaultValue: 0 },
            url: { type: Sequelize.TEXT, allowNull: false },
            thumbnail_url: { type: Sequelize.TEXT, allowNull: true },
            alt_text: { type: Sequelize.TEXT, allowNull: true },
            width: { type: Sequelize.INTEGER, allowNull: true },
            height: { type: Sequelize.INTEGER, allowNull: true },
            optimized_at: { type: Sequelize.DATE, allowNull: true },
            uploaded_by: { type: Sequelize.BIGINT, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'cms' });
        await queryInterface.addIndex('cms.cms_media_assets', ['org_id']);
        await queryInterface.addIndex('cms.cms_media_assets', ['folder_id']);
    },
    async down(queryInterface) {
        await queryInterface.dropTable({ tableName: 'cms_media_assets', schema: 'cms' });
        await queryInterface.dropTable({ tableName: 'cms_media_folders', schema: 'cms' });
    },
};
