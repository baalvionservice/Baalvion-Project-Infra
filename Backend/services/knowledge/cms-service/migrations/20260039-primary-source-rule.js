'use strict';

// The two-source rule, corrected for primary documents.
//
// A live pull produced 62 story clusters across both sites and not one of them
// had two distinct outlets. Under a flat "minimum two sources" rule the pipeline
// would draft nothing, permanently -- the wire simply does not carry that much
// overlapping coverage, and 9 of its 25 sources are regulators and courts
// publishing their own announcements.
//
// The rule exists to stop the desk rewriting another outlet's reporting on a
// single unverified account. It was never meant to apply to a primary document.
// When the DOJ announces a sentencing or the FDA posts a recall, that notice IS
// the source of record; asking a second outlet to confirm what the DOJ said
// about itself adds nothing. So:
//
//   primary source (government / press_release) -> one is enough, cited directly
//   secondary wire reporting                    -> charter.min_sources outlets
//
// source_type is denormalised onto the signal because that distinction has to
// survive on the signal row: it is what the brief stage decides on, long after
// the wire response is gone.
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(
            { tableName: 'cms_story_signals', schema: 'cms' },
            'source_type',
            { type: Sequelize.STRING(24), allowNull: true }
        );
        await queryInterface.addColumn(
            { tableName: 'cms_editorial_charters', schema: 'cms' },
            'single_primary_source_ok',
            { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true }
        );
        await queryInterface.addIndex('cms.cms_story_signals', ['source_type']);
    },
    async down(queryInterface) {
        await queryInterface.removeIndex('cms.cms_story_signals', ['source_type']);
        await queryInterface.removeColumn({ tableName: 'cms_editorial_charters', schema: 'cms' }, 'single_primary_source_ok');
        await queryInterface.removeColumn({ tableName: 'cms_story_signals', schema: 'cms' }, 'source_type');
    },
};
