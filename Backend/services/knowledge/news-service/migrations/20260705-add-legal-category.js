'use strict';

// Adds 'Legal' to the wire category enums.
//
// The original eight (AI/Technology/Business/Finance/Startups/Cybersecurity/
// World/Science) were chosen for Imperialpedia's beat. Law Elite Network runs on
// the same wire, and without a Legal value every court ruling, agency
// enforcement action and product recall had to be filed as 'Business' or
// 'World' -- which made the category column useless for the one site that needs
// it most.
//
// ADD VALUE is not transactional in Postgres, so each is issued on its own and
// guarded by IF NOT EXISTS: re-running this migration on a database that already
// has the value is a no-op rather than an error. There is no down(): Postgres
// cannot drop a single enum value, and rewriting the type to remove it would
// have to rewrite every row that uses it.
const TYPES = ['enum_sources_default_category', 'enum_articles_category'];

module.exports = {
    async up(queryInterface) {
        for (const type of TYPES) {
            await queryInterface.sequelize.query(
                `ALTER TYPE "news_intelligence"."${type}" ADD VALUE IF NOT EXISTS 'Legal'`
            );
        }
    },
    async down() {
        // Intentionally irreversible -- see note above.
    },
};
