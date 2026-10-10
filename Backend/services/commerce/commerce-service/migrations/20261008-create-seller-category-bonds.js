'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('commerce_seller_category_bonds', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
            seller_user_id: { type: Sequelize.BIGINT, allowNull: false },
            category_id: { type: Sequelize.UUID, allowNull: false },
            amount_usd: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
            currency: { type: Sequelize.STRING(10), allowNull: false },
            status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'awaiting_payment' },
            tx_hash: { type: Sequelize.STRING(200), allowNull: true },
            amount_received: { type: Sequelize.STRING(60), allowNull: true },
            confirmed_by: { type: Sequelize.BIGINT, allowNull: true },
            confirmed_at: { type: Sequelize.DATE, allowNull: true },
            closed_at: { type: Sequelize.DATE, allowNull: true },
            note: { type: Sequelize.TEXT, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'commerce' });
        await queryInterface.addIndex('commerce.commerce_seller_category_bonds', ['seller_user_id']);
        await queryInterface.addIndex('commerce.commerce_seller_category_bonds', ['status']);
        // One live bond per seller per category; closed ones (released/forfeited/rejected) don't count.
        await queryInterface.sequelize.query(
            `CREATE UNIQUE INDEX commerce_seller_category_bonds_live_uq
             ON commerce.commerce_seller_category_bonds (seller_user_id, category_id)
             WHERE status IN ('awaiting_payment','payment_submitted','active')`
        );
        // Non-withdrawable platform tokens: balance = SUM(delta) per seller. Credits come from a
        // confirmed category payment; the only debit is an admin-chat session.
        await queryInterface.createTable('commerce_seller_token_ledger', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
            seller_user_id: { type: Sequelize.BIGINT, allowNull: false },
            delta: { type: Sequelize.INTEGER, allowNull: false },
            reason: { type: Sequelize.STRING(30), allowNull: false },
            ref_id: { type: Sequelize.UUID, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'commerce' });
        await queryInterface.addIndex('commerce.commerce_seller_token_ledger', ['seller_user_id']);
        // A payment can only ever be credited once.
        await queryInterface.sequelize.query(
            `CREATE UNIQUE INDEX commerce_seller_token_ledger_credit_uq
             ON commerce.commerce_seller_token_ledger (ref_id) WHERE reason = 'category_payment'`
        );
        await queryInterface.createTable('commerce_seller_admin_chat_sessions', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
            seller_user_id: { type: Sequelize.BIGINT, allowNull: false },
            tokens_spent: { type: Sequelize.INTEGER, allowNull: false },
            starts_at: { type: Sequelize.DATE, allowNull: false },
            expires_at: { type: Sequelize.DATE, allowNull: false },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'commerce' });
        await queryInterface.addIndex('commerce.commerce_seller_admin_chat_sessions', ['seller_user_id', 'expires_at']);
        await queryInterface.createTable('commerce_seller_admin_chat_messages', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
            session_id: { type: Sequelize.UUID, allowNull: false },
            sender_role: { type: Sequelize.STRING(10), allowNull: false },
            sender_user_id: { type: Sequelize.BIGINT, allowNull: false },
            body: { type: Sequelize.TEXT, allowNull: false },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'commerce' });
        await queryInterface.addIndex('commerce.commerce_seller_admin_chat_messages', ['session_id', 'created_at']);
    },
    async down(queryInterface) {
        await queryInterface.dropTable({ tableName: 'commerce_seller_admin_chat_messages', schema: 'commerce' });
        await queryInterface.dropTable({ tableName: 'commerce_seller_admin_chat_sessions', schema: 'commerce' });
        await queryInterface.dropTable({ tableName: 'commerce_seller_token_ledger', schema: 'commerce' });
        await queryInterface.dropTable({ tableName: 'commerce_seller_category_bonds', schema: 'commerce' });
    },
};
