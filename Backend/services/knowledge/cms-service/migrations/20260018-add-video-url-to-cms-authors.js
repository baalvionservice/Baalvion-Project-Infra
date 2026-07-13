'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(
            { tableName: 'cms_authors', schema: 'cms' },
            'video_url',
            { type: Sequelize.TEXT, allowNull: true },
        );
    },
    async down(queryInterface) {
        await queryInterface.removeColumn(
            { tableName: 'cms_authors', schema: 'cms' },
            'video_url',
        );
    },
};
