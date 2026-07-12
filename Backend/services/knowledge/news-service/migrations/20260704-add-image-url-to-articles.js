'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(
            { tableName: 'articles', schema: 'news_intelligence' },
            'image_url',
            { type: Sequelize.TEXT, allowNull: true },
        );
    },
    async down(queryInterface) {
        await queryInterface.removeColumn(
            { tableName: 'articles', schema: 'news_intelligence' },
            'image_url',
        );
    },
};
