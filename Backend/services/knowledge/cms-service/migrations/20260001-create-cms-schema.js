'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // Hardcoded to the "baalvion" role name previously -- fails with "role baalvion does
        // not exist" against any DB whose configured user is actually named something else
        // (e.g. box2's RDS user is baalvion_app). Use the role the migration itself is
        // connected as instead. GRANT/ALTER ROLE don't accept bound query parameters, so quote
        // the identifier manually (double-quote + escape embedded quotes) rather than
        // interpolating the raw value.
        const role = `"${String(queryInterface.sequelize.config.username).replace(/"/g, '""')}"`;
        await queryInterface.sequelize.query('CREATE SCHEMA IF NOT EXISTS cms;');
        await queryInterface.sequelize.query(`GRANT ALL PRIVILEGES ON SCHEMA cms TO ${role};`);
        await queryInterface.sequelize.query(
            `ALTER ROLE ${role} SET search_path TO public, auth, jobs, mining, imperialpedia, real_estate, brand, market, ir, dashboard, about, cms;`
        );
    },
    async down(queryInterface) {
        await queryInterface.sequelize.query('DROP SCHEMA IF EXISTS cms CASCADE;');
    },
};
