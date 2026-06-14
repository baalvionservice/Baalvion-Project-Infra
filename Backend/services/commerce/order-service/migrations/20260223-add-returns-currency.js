'use strict';
// Persist the order's currency on the return record so the returns UI shows the correct currency
// for non-USD markets (UK/AE/IN/SG) instead of a hardcoded USD. ADDITIVE + NULLABLE: existing
// rows stay null (the serializer falls back to the order/'USD'); the create path stamps it going
// forward. Idempotent via addColumn (Sequelize errors if it exists — guarded by the migration
// runner's single-apply, matching the other addColumn migrations in this service).
const RETURNS = { tableName: 'orders_returns', schema: 'orders' };

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(RETURNS, 'currency_code', {
            type: Sequelize.STRING(3), allowNull: true,
        });
    },
    async down(queryInterface) {
        await queryInterface.removeColumn(RETURNS, 'currency_code');
    },
};
