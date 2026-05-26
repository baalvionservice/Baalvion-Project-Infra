'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.sequelize.query('CREATE SCHEMA IF NOT EXISTS cms;');
        await queryInterface.sequelize.query('GRANT ALL PRIVILEGES ON SCHEMA cms TO baalvion;');
        await queryInterface.sequelize.query(
            "ALTER ROLE baalvion SET search_path TO public, auth, jobs, mining, imperialpedia, real_estate, brand, market, ir, dashboard, about, cms;"
        );
    },
    async down(queryInterface) {
        await queryInterface.sequelize.query('DROP SCHEMA IF EXISTS cms CASCADE;');
    },
};
