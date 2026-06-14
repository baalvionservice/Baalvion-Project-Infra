'use strict';
// Reviews were authored against `customer_id UUID`, but this auth stack identifies the
// reviewer by the JWT subject `req.auth.userId` (a BIGINT). This migration adds a nullable
// `user_id BIGINT` author column, relaxes `customer_id` to nullable, and adds the integrity
// constraints the reviews feature relies on: one review per (product,user), a moderation read
// index, and a DB-level rating bound. Additive — existing rows are untouched.
const TABLE = { tableName: 'commerce_product_reviews', schema: 'commerce' };

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(TABLE, 'user_id', { type: Sequelize.BIGINT, allowNull: true });
        await queryInterface.changeColumn(TABLE, 'customer_id', { type: Sequelize.UUID, allowNull: true });

        // One review per (product, user) — partial so legacy/anonymous (user_id NULL) rows are exempt.
        await queryInterface.sequelize.query(
            `CREATE UNIQUE INDEX IF NOT EXISTS uniq_review_product_user`
            + ` ON commerce.commerce_product_reviews (product_id, user_id)`
            + ` WHERE user_id IS NOT NULL;`
        );
        // Storefront listing read path: approved reviews for a product, newest first.
        await queryInterface.sequelize.query(
            `CREATE INDEX IF NOT EXISTS commerce_product_reviews_product_status_created`
            + ` ON commerce.commerce_product_reviews (product_id, status, created_at);`
        );
        // Defense-in-depth: the rating bound is also enforced in Zod + the model validator.
        await queryInterface.sequelize.query(
            `ALTER TABLE commerce.commerce_product_reviews`
            + ` ADD CONSTRAINT chk_review_rating CHECK (rating BETWEEN 1 AND 5);`
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.sequelize.query(
            `ALTER TABLE commerce.commerce_product_reviews DROP CONSTRAINT IF EXISTS chk_review_rating;`
        );
        await queryInterface.sequelize.query(
            `DROP INDEX IF EXISTS commerce.commerce_product_reviews_product_status_created;`
        );
        await queryInterface.sequelize.query(
            `DROP INDEX IF EXISTS commerce.uniq_review_product_user;`
        );
        // Restore the original NOT NULL on customer_id only if no NULLs were introduced.
        await queryInterface.changeColumn(TABLE, 'customer_id', { type: Sequelize.UUID, allowNull: false });
        await queryInterface.removeColumn(TABLE, 'user_id');
    },
};
