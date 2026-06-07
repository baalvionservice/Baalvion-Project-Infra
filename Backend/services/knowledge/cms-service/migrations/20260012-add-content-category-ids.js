'use strict';

// Adds a JSONB `category_ids` array to cms_contents so an article can belong to
// multiple categories. `category_id` is kept as the PRIMARY category (category_ids[0])
// for backwards compatibility with existing readers (live site, admin filters).
module.exports = {
    async up(queryInterface, Sequelize) {
        const table = { tableName: 'cms_contents', schema: 'cms' };
        const desc = await queryInterface.describeTable(table).catch(() => ({}));
        if (!desc.category_ids) {
            await queryInterface.addColumn(table, 'category_ids', {
                type: Sequelize.JSONB,
                allowNull: false,
                defaultValue: JSON.stringify([]),
            });
        }
        // Backfill: seed the array from the existing single category.
        await queryInterface.sequelize.query(
            `UPDATE cms.cms_contents
             SET category_ids = jsonb_build_array(category_id)
             WHERE category_id IS NOT NULL
               AND (category_ids IS NULL OR category_ids = '[]'::jsonb);`,
        );
        // Index for "content in this category" lookups (multi-category public pages).
        await queryInterface.sequelize.query(
            `CREATE INDEX IF NOT EXISTS cms_contents_category_ids_gin
             ON cms.cms_contents USING gin (category_ids);`,
        );
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query(
            `DROP INDEX IF EXISTS cms.cms_contents_category_ids_gin;`,
        );
        await queryInterface.removeColumn({ tableName: 'cms_contents', schema: 'cms' }, 'category_ids');
    },
};
