'use strict';

// Site access had no end date: every grant was permanent until someone remembered to revoke
// it by hand. Contractors, agencies and freelance writers are the normal case for a CMS, and
// "remember to remove them later" is exactly the step that gets skipped — so access
// accumulates silently.
//
// `expires_at` is NULL for a standing grant (the existing behaviour, unchanged for every row
// already in the table) and a timestamp for a time-boxed one. Access checks treat a grant
// whose expires_at has passed as no grant at all, so it lapses without anyone acting.
//
// The partial index covers the "what is expiring / has expired" queries without carrying an
// index entry for the many rows that never expire.
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(
            { tableName: 'cms_website_members', schema: 'cms' },
            'expires_at',
            { type: Sequelize.DATE, allowNull: true },
        );
        await queryInterface.sequelize.query(
            `CREATE INDEX IF NOT EXISTS cms_members_expires_at
                 ON cms.cms_website_members (expires_at)
              WHERE expires_at IS NOT NULL`,
        );
    },
    async down(queryInterface) {
        await queryInterface.sequelize.query('DROP INDEX IF EXISTS cms.cms_members_expires_at');
        await queryInterface.removeColumn(
            { tableName: 'cms_website_members', schema: 'cms' },
            'expires_at',
        );
    },
};
