'use strict';

// AI-prompt roundup posts — e.g. "5 Best Gemini Halloween Photo Prompts for Men" (the
// AuraPrompt.in content model this was scoped against). One row = one themed article;
// `items` holds the individual prompts inside it (each with its own heading, image(s),
// full prompt text, and optional ChatGPT/Gemini model). `is_trending` + `trending_order`
// are an editorial ranking, not a computed metric — /trending-prompts is a curated view
// over this same table, not a separate one, so both surfaces link to the same canonical
// detail page (see the affiliate_products migration for the identical single-table
// reasoning).
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.sequelize.query('CREATE SCHEMA IF NOT EXISTS imperialpedia');
        await queryInterface.createTable(
            { tableName: 'prompts', schema: 'imperialpedia' },
            {
                id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
                slug: { type: Sequelize.STRING(200), allowNull: false, unique: true },
                title: { type: Sequelize.STRING(300), allowNull: false },
                intro: { type: Sequelize.TEXT, allowNull: true },
                hero_image: { type: Sequelize.STRING(1000), allowNull: true },
                category: { type: Sequelize.STRING(100), allowNull: true },
                tags: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
                // [{ heading, subtitle, prompt_text, model, images: [{url,alt,credit}],
                //    chatgpt_url, gemini_url }] — the individual prompts inside this roundup.
                // Editorial data, same as entities.aliases; never inferred or generated at
                // read time — every image is a real output this exact prompt produced.
                items: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
                pro_tips: { type: Sequelize.TEXT, allowNull: true },
                is_trending: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
                // Only meaningful when is_trending is true; lower sorts first. Nullable so a
                // freshly-flagged post doesn't need a value picked before save.
                trending_order: { type: Sequelize.INTEGER, allowNull: true },
                status: { type: Sequelize.ENUM('active', 'archived'), allowNull: false, defaultValue: 'active' },
                views_count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
                // Total "copy prompt" clicks across every item in this post — not broken out
                // per item, same coarseness as affiliate_products.clicks_count.
                copies_count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
                created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
                updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
            }
        );
        await queryInterface.addIndex({ tableName: 'prompts', schema: 'imperialpedia' }, ['category']);
        await queryInterface.addIndex({ tableName: 'prompts', schema: 'imperialpedia' }, ['status']);
        await queryInterface.addIndex({ tableName: 'prompts', schema: 'imperialpedia' }, ['is_trending', 'trending_order']);
    },
    async down(queryInterface) {
        await queryInterface.dropTable({ tableName: 'prompts', schema: 'imperialpedia' });
    },
};
