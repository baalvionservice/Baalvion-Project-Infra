'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable(
            'sources',
            {
                id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true, allowNull: false },
                name: { type: Sequelize.STRING(200), allowNull: false },
                // press_release / government are source *tags*, not separate ingestion
                // mechanisms — they are routed through the same RSS/Atom collector
                // (collectors/feedCollector.js) since that's how these are actually
                // published in practice. A bespoke connector is only added when a real
                // source requires one that isn't feed-based.
                type: { type: Sequelize.ENUM('rss', 'press_release', 'government'), allowNull: false, defaultValue: 'rss' },
                feed_url: { type: Sequelize.TEXT, allowNull: false },
                country: { type: Sequelize.STRING(2), allowNull: true },
                language: { type: Sequelize.STRING(10), allowNull: false, defaultValue: 'en' },
                default_category: {
                    type: Sequelize.ENUM('AI', 'Technology', 'Business', 'Finance', 'Startups', 'Cybersecurity', 'World', 'Science'),
                    allowNull: false,
                },
                is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
                poll_interval_minutes: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 15 },
                last_polled_at: { type: Sequelize.DATE, allowNull: true },
                created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
                updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            },
            { schema: 'news_intelligence' }
        );

        await queryInterface.addConstraint('news_intelligence.sources', {
            fields: ['feed_url'],
            type: 'unique',
            name: 'sources_feed_url_unique',
        });
        await queryInterface.addIndex('news_intelligence.sources', ['is_active']);
    },
    async down(queryInterface) {
        await queryInterface.dropTable({ tableName: 'sources', schema: 'news_intelligence' });
    },
};
