'use strict';

// Lower CMS roles (contributor/author) cannot DELETE /:contentId (requires cms_editor+),
// but the console previously gave them no alternative — clicking Delete just 403'd. This
// adds a lightweight, additive request-flag: a lower role can flag content for deletion,
// an editor+/admin sees it and either deletes it (existing endpoint) or dismisses the flag.
module.exports = {
    async up(queryInterface, Sequelize) {
        const table = { tableName: 'cms_contents', schema: 'cms' };
        await queryInterface.addColumn(table, 'deletion_requested_by', { type: Sequelize.BIGINT, allowNull: true });
        await queryInterface.addColumn(table, 'deletion_requested_at', { type: Sequelize.DATE, allowNull: true });
        await queryInterface.addColumn(table, 'deletion_request_note', { type: Sequelize.TEXT, allowNull: true });
    },
    async down(queryInterface) {
        const table = { tableName: 'cms_contents', schema: 'cms' };
        await queryInterface.removeColumn(table, 'deletion_requested_by');
        await queryInterface.removeColumn(table, 'deletion_requested_at');
        await queryInterface.removeColumn(table, 'deletion_request_note');
    },
};
