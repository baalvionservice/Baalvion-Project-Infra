'use strict';

// Content delete was a real DELETE FROM with nothing recoverable — one misclick and
// the row was gone. This adds paranoid (soft) delete: deleted_at marks a row as
// trashed without removing it, deleted_by records who trashed it, and the row stays
// fully restorable until a separate, explicit permanent-delete action.
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn({ tableName: 'cms_contents', schema: 'cms' }, 'deleted_at', { type: Sequelize.DATE, allowNull: true });
        await queryInterface.addColumn({ tableName: 'cms_contents', schema: 'cms' }, 'deleted_by', { type: Sequelize.BIGINT, allowNull: true });
        await queryInterface.addIndex({ tableName: 'cms_contents', schema: 'cms' }, ['deleted_at'], { name: 'cms_contents_deleted_at_idx' });
    },
    async down(queryInterface) {
        await queryInterface.removeIndex({ tableName: 'cms_contents', schema: 'cms' }, 'cms_contents_deleted_at_idx');
        await queryInterface.removeColumn({ tableName: 'cms_contents', schema: 'cms' }, 'deleted_by');
        await queryInterface.removeColumn({ tableName: 'cms_contents', schema: 'cms' }, 'deleted_at');
    },
};
