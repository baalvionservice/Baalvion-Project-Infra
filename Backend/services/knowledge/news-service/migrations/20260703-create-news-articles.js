'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable(
            'articles',
            {
                id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true, allowNull: false },
                source_id: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    references: { model: { tableName: 'sources', schema: 'news_intelligence' }, key: 'id' },
                    onDelete: 'CASCADE',
                },
                external_guid: { type: Sequelize.TEXT, allowNull: true },
                title: { type: Sequelize.STRING(500), allowNull: false },
                url: { type: Sequelize.TEXT, allowNull: false },
                summary_raw: { type: Sequelize.TEXT, allowNull: true },
                // Populated by the AI-enrichment phase (ml-service integration) — nullable
                // until then so this table doesn't need a migration when that phase lands.
                summary_ai: { type: Sequelize.TEXT, allowNull: true },
                published_at: { type: Sequelize.DATE, allowNull: false },
                ingested_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
                country: { type: Sequelize.STRING(2), allowNull: true },
                language: { type: Sequelize.STRING(10), allowNull: false, defaultValue: 'en' },
                category: {
                    type: Sequelize.ENUM('AI', 'Technology', 'Business', 'Finance', 'Startups', 'Cybersecurity', 'World', 'Science'),
                    allowNull: false,
                },
                sentiment: { type: Sequelize.ENUM('positive', 'neutral', 'negative'), allowNull: true },
                entities: { type: Sequelize.JSONB, allowNull: true },
                dedupe_hash: { type: Sequelize.STRING(64), allowNull: false },
                raw_payload: { type: Sequelize.JSONB, allowNull: false, defaultValue: JSON.stringify({}) },
                created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
                updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            },
            { schema: 'news_intelligence' }
        );

        await queryInterface.addConstraint('news_intelligence.articles', {
            fields: ['dedupe_hash'],
            type: 'unique',
            name: 'articles_dedupe_hash_unique',
        });
        await queryInterface.addIndex('news_intelligence.articles', ['source_id']);
        await queryInterface.addIndex('news_intelligence.articles', ['published_at']);
        await queryInterface.addIndex('news_intelligence.articles', ['category']);
        await queryInterface.addIndex('news_intelligence.articles', ['country']);
        await queryInterface.sequelize.query(
            `CREATE INDEX IF NOT EXISTS articles_title_fts ON news_intelligence.articles USING gin(to_tsvector('english', title));`
        );
    },
    async down(queryInterface) {
        await queryInterface.dropTable({ tableName: 'articles', schema: 'news_intelligence' });
    },
};
