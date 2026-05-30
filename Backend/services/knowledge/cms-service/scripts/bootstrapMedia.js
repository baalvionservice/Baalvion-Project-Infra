'use strict';
/**
 * Idempotent bootstrap for the CMS media library tables (cms schema).
 *   - cms.cms_media_folders : optional folder tree
 *   - cms.cms_media_assets  : uploaded files (local-filesystem backed in dev)
 *
 * Usage:  node -r dotenv/config scripts/bootstrapMedia.js
 */
const { sequelize } = require('../models');

async function main() {
    await sequelize.query(`
        CREATE TABLE IF NOT EXISTS cms.cms_media_folders (
            id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            org_id     uuid,
            name       text NOT NULL,
            parent_id  uuid REFERENCES cms.cms_media_folders(id) ON DELETE CASCADE,
            created_by bigint,
            created_at timestamptz NOT NULL DEFAULT now()
        );`);
    await sequelize.query(`
        CREATE TABLE IF NOT EXISTS cms.cms_media_assets (
            id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            org_id        uuid,
            folder_id     uuid REFERENCES cms.cms_media_folders(id) ON DELETE SET NULL,
            storage_key   text NOT NULL,
            filename      text NOT NULL,
            original_name text NOT NULL,
            mime_type     text NOT NULL,
            size          bigint NOT NULL DEFAULT 0,
            url           text NOT NULL,
            thumbnail_url text,
            alt_text      text,
            width         int,
            height        int,
            optimized_at  timestamptz,
            uploaded_by   bigint,
            created_at    timestamptz NOT NULL DEFAULT now(),
            updated_at    timestamptz NOT NULL DEFAULT now()
        );`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_cms_media_org    ON cms.cms_media_assets(org_id);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_cms_media_folder ON cms.cms_media_assets(folder_id);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_cms_folder_org   ON cms.cms_media_folders(org_id);`);

    const [tables] = await sequelize.query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema='cms' AND table_name LIKE 'cms_media%' ORDER BY 1`);
    console.log('media tables:', tables.map((t) => t.table_name).join(', '));
    await sequelize.close();
}

main().catch((e) => { console.error('bootstrapMedia failed:', e.message); process.exit(1); });
