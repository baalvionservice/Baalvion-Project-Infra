'use strict';
/** A draw can be run for one state, and every entry records that the member confirmed they are 18 or older. */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn({ tableName: 'commerce_lottery_draws', schema: 'commerce' }, 'state', { type: Sequelize.STRING(60), allowNull: true });
        await queryInterface.addColumn({ tableName: 'commerce_lottery_entries', schema: 'commerce' }, 'age_confirmed_at', { type: Sequelize.DATE, allowNull: true });
    },
    async down(queryInterface) {
        await queryInterface.removeColumn({ tableName: 'commerce_lottery_entries', schema: 'commerce' }, 'age_confirmed_at');
        await queryInterface.removeColumn({ tableName: 'commerce_lottery_draws', schema: 'commerce' }, 'state');
    },
};
