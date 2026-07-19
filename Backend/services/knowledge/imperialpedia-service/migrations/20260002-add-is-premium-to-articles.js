'use strict';

// Adds the premium-content flag the createArticleSchema/createPostSchema Zod validators have
// expected since they were written (validators/schemas.js `is_premium`), but which never had a
// backing column on `articles` — entitlement gating (service/entitlementService.js) depends on
// this column existing.
module.exports = {
    async up(queryInterface, Sequelize) {
        const table = { tableName: 'articles', schema: 'imperialpedia' };
        await queryInterface.addColumn(table, 'is_premium', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        });
        // Partial index — premium articles are a small minority of rows; this keeps the
        // paywall-listing query cheap without indexing every free article too.
        await queryInterface.sequelize.query(
            'CREATE INDEX IF NOT EXISTS articles_is_premium_idx ON imperialpedia.articles (is_premium) WHERE is_premium = true'
        );
    },
    async down(queryInterface) {
        await queryInterface.sequelize.query('DROP INDEX IF EXISTS imperialpedia.articles_is_premium_idx');
        await queryInterface.removeColumn({ tableName: 'articles', schema: 'imperialpedia' }, 'is_premium');
    },
};
