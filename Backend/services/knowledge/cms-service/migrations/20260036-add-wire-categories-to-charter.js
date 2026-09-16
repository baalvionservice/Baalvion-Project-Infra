'use strict';

// Adds `wire_categories` to the editorial charter.
//
// Keyword fit alone cannot separate "Huawei copies Samsung's privacy display"
// from "FDA issues nationwide recall" -- both are a single on-charter word in a
// headline. What separates them is where they came from: one is a Technology
// item from a gadget site, the other a Legal item from a regulator. Recording
// which wire categories are genuinely a site's beat lets intake treat a
// single-term match from an on-beat category as a real signal and the same match
// from an off-beat one as a coincidence.
//
// It also lets the wire pull filter server-side instead of scoring every
// category and discarding most of it.
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(
            { tableName: 'cms_editorial_charters', schema: 'cms' },
            'wire_categories',
            { type: Sequelize.JSONB, allowNull: false, defaultValue: [] }
        );
    },
    async down(queryInterface) {
        await queryInterface.removeColumn(
            { tableName: 'cms_editorial_charters', schema: 'cms' },
            'wire_categories'
        );
    },
};
