'use strict';
/**
 * Buyers load a wallet with crypto (confirmed by an admin, exactly like the other payments) and the
 * money becomes points they spend at checkout. This is the append-only points ledger: balance is the
 * sum of a user's rows. Top-ups reuse commerce_seller_category_bonds with kind = 'wallet_topup'.
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('commerce_points_ledger', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
            user_id: { type: Sequelize.BIGINT, allowNull: false },
            // Points as whole numbers (default 100 points = $1), so there are no cents or float drift.
            delta: { type: Sequelize.BIGINT, allowNull: false },
            reason: { type: Sequelize.STRING(20), allowNull: false },       // topup | purchase | refund | adjustment
            ref_id: { type: Sequelize.UUID, allowNull: true },               // top-up payment, order, or refund payment
            order_number: { type: Sequelize.STRING(50), allowNull: true },
            // The buyer's member number at the time, so the admin sees "who paid" without a lookup.
            member_number: { type: Sequelize.INTEGER, allowNull: true },
            note: { type: Sequelize.TEXT, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'commerce' });
        await queryInterface.addIndex('commerce.commerce_points_ledger', ['user_id', 'created_at']);
        // A top-up, a purchase and a refund can each be recorded once per reference: retries are harmless.
        await queryInterface.sequelize.query(
            `CREATE UNIQUE INDEX commerce_points_ledger_ref_uq ON commerce.commerce_points_ledger (ref_id, reason) WHERE ref_id IS NOT NULL`
        );
        // One open top-up per person at a time.
        await queryInterface.sequelize.query(
            `CREATE UNIQUE INDEX commerce_wallet_topup_open_uq ON commerce.commerce_seller_category_bonds (seller_user_id)
             WHERE kind = 'wallet_topup' AND status IN ('awaiting_payment','payment_submitted')`
        );
    },
    async down(queryInterface) {
        await queryInterface.sequelize.query('DROP INDEX IF EXISTS commerce.commerce_wallet_topup_open_uq');
        await queryInterface.sequelize.query("DELETE FROM commerce.commerce_seller_category_bonds WHERE kind = 'wallet_topup'");
        await queryInterface.dropTable({ tableName: 'commerce_points_ledger', schema: 'commerce' });
    },
};
