'use strict';

// Investopedia-style author profiles need structured Education and
// Certifications (previously only the free-text `bio`/`credentials` fields
// existed), plus an editorial role (writer/reviewer/fact-checker/contributor)
// that can drive the public role badge from live CMS data — today that badge
// only reads the offline static-fallback roster because cms_authors has no
// equivalent field.
const ENUM_TYPE = 'enum_cms_authors_editorial_role';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(
            { tableName: 'cms_authors', schema: 'cms' },
            'education',
            { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
        );
        await queryInterface.addColumn(
            { tableName: 'cms_authors', schema: 'cms' },
            'certifications',
            { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
        );
        // Sequelize.ENUM in addColumn issues its own CREATE TYPE with the same
        // enum_<table>_<column> naming it derives for the model definition
        // (models/cmsAuthor.js), so no manual CREATE TYPE is needed here.
        await queryInterface.addColumn(
            { tableName: 'cms_authors', schema: 'cms' },
            'editorial_role',
            { type: Sequelize.ENUM('writer', 'reviewer', 'fact-checker', 'contributor'), allowNull: true },
        );
    },
    async down(queryInterface) {
        await queryInterface.removeColumn(
            { tableName: 'cms_authors', schema: 'cms' },
            'editorial_role',
        );
        await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${ENUM_TYPE}";`);
        await queryInterface.removeColumn(
            { tableName: 'cms_authors', schema: 'cms' },
            'certifications',
        );
        await queryInterface.removeColumn(
            { tableName: 'cms_authors', schema: 'cms' },
            'education',
        );
    },
};
