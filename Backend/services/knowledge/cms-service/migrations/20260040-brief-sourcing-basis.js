'use strict';

// Why a brief was allowed to proceed, kept on the row.
//
// 'multi_outlet'     -- two or more independent outlets, the default rule.
// 'verified_primary' -- one primary document (regulator, court, agency) under
//                       the charter's singlePrimarySourceOk exception.
//
// Without this column the two are indistinguishable after the fact, and a piece
// resting on a single document reads in the queue exactly like a corroborated
// one. The gate gives the second kind a stricter citation floor, so the basis
// has to survive on the row rather than being recomputed from signals that may
// since have been rescored.
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(
            { tableName: 'cms_story_briefs', schema: 'cms' },
            'sourcing_basis',
            { type: Sequelize.STRING(24), allowNull: true }
        );
    },
    async down(queryInterface) {
        await queryInterface.removeColumn({ tableName: 'cms_story_briefs', schema: 'cms' }, 'sourcing_basis');
    },
};
