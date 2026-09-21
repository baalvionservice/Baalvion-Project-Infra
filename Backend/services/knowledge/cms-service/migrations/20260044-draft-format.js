'use strict';

// Which format a draft was written as ('news' or 'brief'), so the publish gate judges it against the same word budget
// it was drafted to, and not always against the news minimum.
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn({ tableName: 'cms_article_drafts', schema: 'cms' }, 'format', { type: Sequelize.STRING(16), allowNull: false, defaultValue: 'news' });
    },
    async down(queryInterface) {
        await queryInterface.removeColumn({ tableName: 'cms_article_drafts', schema: 'cms' }, 'format');
    },
};
