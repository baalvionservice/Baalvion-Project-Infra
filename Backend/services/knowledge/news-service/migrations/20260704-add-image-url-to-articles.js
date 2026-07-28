'use strict';

module.exports = {
    async up(queryInterface) {
        // Sequelize's addColumn has no IF NOT EXISTS guard, unlike raw SQL -- needed here
        // because the Article model already defines image_url (see models/article.js), so
        // sequelize.sync({alter:false}) on service boot can create the column (as part of a
        // fresh table create) before this migration ever gets a chance to run against a given
        // environment, which then permanently fails this migration with "column already
        // exists" on every future deploy since it's never recorded as applied.
        await queryInterface.sequelize.query(
            'ALTER TABLE news_intelligence.articles ADD COLUMN IF NOT EXISTS image_url TEXT;'
        );
    },
    async down(queryInterface) {
        await queryInterface.removeColumn(
            { tableName: 'articles', schema: 'news_intelligence' },
            'image_url',
        );
    },
};
