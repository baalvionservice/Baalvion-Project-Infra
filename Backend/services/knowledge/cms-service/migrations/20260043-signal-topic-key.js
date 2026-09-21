'use strict';

// A topic key on a signal: "these items are about one thing, decided by the source that found them".
//
// Trend intake knows that the news links Google lists for a trending topic, and that topic's Wikipedia
// article, are about the same subject. Similarity clustering cannot see that: a biography and three
// differently-worded headlines share too little vocabulary, so the topic was split into clusters of one
// outlet each and the brief stage (which needs corroboration) held every one of them. Signals with a
// topic key are grouped by it; signals without one are clustered by similarity exactly as before.
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn({ tableName: 'cms_story_signals', schema: 'cms' }, 'topic_key', { type: Sequelize.TEXT, allowNull: true });
        await queryInterface.addIndex({ tableName: 'cms_story_signals', schema: 'cms' }, ['website_id', 'topic_key'], { name: 'cms_story_signals_topic_key_idx' });
    },
    async down(queryInterface) {
        await queryInterface.removeIndex({ tableName: 'cms_story_signals', schema: 'cms' }, 'cms_story_signals_topic_key_idx');
        await queryInterface.removeColumn({ tableName: 'cms_story_signals', schema: 'cms' }, 'topic_key');
    },
};
