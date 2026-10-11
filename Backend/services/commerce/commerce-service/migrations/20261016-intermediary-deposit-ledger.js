'use strict';
/**
 * Deposit-backed protection. An intermediary's confirmed deposit is the guarantee behind their trades:
 * every movement (deposit in, refund to a customer after a dispute, deposit returned) is a ledger row,
 * and the amount a customer is protected for is whatever the ledger still holds.
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('commerce_intermediary_deposit_ledger', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
            intermediary_id: { type: Sequelize.UUID, allowNull: false, references: { model: { tableName: 'commerce_intermediaries', schema: 'commerce' }, key: 'id' }, onDelete: 'CASCADE' },
            delta_usd: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
            reason: { type: Sequelize.STRING(30), allowNull: false },
            trade_id: { type: Sequelize.UUID, allowNull: true },
            note: { type: Sequelize.TEXT, allowNull: true },
            created_by: { type: Sequelize.BIGINT, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'commerce' });
        await queryInterface.addIndex('commerce.commerce_intermediary_deposit_ledger', ['intermediary_id', 'created_at']);
        const trades = { tableName: 'commerce_intermediary_trades', schema: 'commerce' };
        await queryInterface.addColumn(trades, 'refund_usd', { type: Sequelize.DECIMAL(12, 2), allowNull: true });
        await queryInterface.addColumn(trades, 'refund_paid_at', { type: Sequelize.DATE, allowNull: true });
        // Deposits already confirmed before the ledger existed.
        await queryInterface.sequelize.query(
            `INSERT INTO commerce.commerce_intermediary_deposit_ledger (intermediary_id, delta_usd, reason, note)
             SELECT id, deposit_usd, 'deposit', 'Deposit confirmed' FROM commerce.commerce_intermediaries WHERE deposit_confirmed_at IS NOT NULL AND deposit_usd > 0`);
    },
    async down(queryInterface) {
        const trades = { tableName: 'commerce_intermediary_trades', schema: 'commerce' };
        await queryInterface.removeColumn(trades, 'refund_paid_at');
        await queryInterface.removeColumn(trades, 'refund_usd');
        await queryInterface.dropTable({ tableName: 'commerce_intermediary_deposit_ledger', schema: 'commerce' });
    },
};
