'use strict';

// The plain (website_id, slug) unique index predates soft delete and doesn't know about
// deleted_at, so a trashed item permanently squats on its slug forever — new content (or
// a wire re-import) can never reuse it even though the trashed row is invisible everywhere.
// Replacing it with a partial index scoped to `deleted_at IS NULL` lets a slug be reused
// the moment the old row is trashed, matching how "it's gone" actually reads to an editor.
module.exports = {
    async up(queryInterface) {
        // It's a table CONSTRAINT (not a plain index), and Postgres constraints can't carry
        // a WHERE clause — only a unique INDEX can be partial — so the constraint has to be
        // dropped outright before a same-named partial index can take its place.
        await queryInterface.sequelize.query('ALTER TABLE cms.cms_contents DROP CONSTRAINT cms_contents_website_slug_unique');
        await queryInterface.sequelize.query(
            'CREATE UNIQUE INDEX cms_contents_website_slug_unique ON cms.cms_contents (website_id, slug) WHERE deleted_at IS NULL',
        );
    },
    async down(queryInterface) {
        await queryInterface.sequelize.query('DROP INDEX cms.cms_contents_website_slug_unique');
        await queryInterface.sequelize.query(
            'ALTER TABLE cms.cms_contents ADD CONSTRAINT cms_contents_website_slug_unique UNIQUE (website_id, slug)',
        );
    },
};
