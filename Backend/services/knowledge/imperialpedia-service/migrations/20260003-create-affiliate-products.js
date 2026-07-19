'use strict';

// Affiliate product catalog — e.g. the "best insurance/mortgage/broker" review-page CTAs
// (see Imperialpedia-main's src/data/reviews/*, currently hardcoded TS with an untracked
// ctaUrl). This table makes those entries admin-manageable and click-attributable, with an
// optional loose link to a specific article (no FK constraint, same pattern as
// Article -> CreatorProfile / votes.target_id — see models/index.js).
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.sequelize.query('CREATE SCHEMA IF NOT EXISTS imperialpedia');
        await queryInterface.createTable(
            { tableName: 'affiliate_products', schema: 'imperialpedia' },
            {
                id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
                slug: { type: Sequelize.STRING(200), allowNull: false, unique: true },
                // Unguessable, rotatable outbound-link identifier — deliberately separate from
                // `slug` so the public tracking URL isn't tied to the human-readable name.
                tracking_code: { type: Sequelize.STRING(16), allowNull: false, unique: true },
                product_name: { type: Sequelize.STRING(255), allowNull: false },
                merchant_name: { type: Sequelize.STRING(255), allowNull: false },
                category: { type: Sequelize.STRING(100), allowNull: true },
                cta_url: { type: Sequelize.STRING(2048), allowNull: false },
                disclosure_text: { type: Sequelize.TEXT, allowNull: true },
                commission_rate: { type: Sequelize.DECIMAL(6, 2), allowNull: true },
                // Loose reference to imperialpedia.articles.id — nullable because most affiliate
                // products today (review-page CTAs) aren't tied to one specific article.
                article_id: { type: Sequelize.INTEGER, allowNull: true },
                status: { type: Sequelize.ENUM('active', 'paused', 'archived'), allowNull: false, defaultValue: 'active' },
                clicks_count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
                created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
                updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
            }
        );
        await queryInterface.addIndex({ tableName: 'affiliate_products', schema: 'imperialpedia' }, ['category']);
        await queryInterface.addIndex({ tableName: 'affiliate_products', schema: 'imperialpedia' }, ['article_id']);
        await queryInterface.addIndex({ tableName: 'affiliate_products', schema: 'imperialpedia' }, ['status']);
    },
    async down(queryInterface) {
        await queryInterface.dropTable({ tableName: 'affiliate_products', schema: 'imperialpedia' });
    },
};
