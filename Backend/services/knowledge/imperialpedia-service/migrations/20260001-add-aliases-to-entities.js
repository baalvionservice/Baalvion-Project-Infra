'use strict';

// Adds alternate-name matching (e.g. "NVIDIA Corp", "NVDA" -> the canonical
// "NVIDIA" entity) for the entity-linking detector in
// service/entityMentionDetectionService.js. Defensive `CREATE SCHEMA IF NOT
// EXISTS` because this is the first migration ever run against this service —
// previously the schema only existed via index.js's own sync() bootstrap.
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.sequelize.query('CREATE SCHEMA IF NOT EXISTS imperialpedia');
        const table = { tableName: 'entities', schema: 'imperialpedia' };
        await queryInterface.addColumn(table, 'aliases', {
            type: Sequelize.JSONB,
            allowNull: false,
            defaultValue: [],
        });
        await queryInterface.sequelize.query(
            'CREATE INDEX IF NOT EXISTS entities_aliases_gin ON imperialpedia.entities USING GIN (aliases)'
        );
    },
    async down(queryInterface) {
        await queryInterface.sequelize.query('DROP INDEX IF EXISTS imperialpedia.entities_aliases_gin');
        await queryInterface.removeColumn({ tableName: 'entities', schema: 'imperialpedia' }, 'aliases');
    },
};
