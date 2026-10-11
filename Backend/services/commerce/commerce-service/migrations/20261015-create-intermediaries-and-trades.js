'use strict';
/**
 * Intermediaries: people who help members buy USDT, trade crypto or set up accounts, and are paid
 * directly by the customer. An intermediary applies, pays the activation deposit (a normal platform
 * payment, kind 'agent_activation'), and is listed when an admin confirms it. Trades, chat,
 * payment screenshots and disputes live here so both sides see the same thing on any device.
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        const S = { schema: 'commerce' };
        await queryInterface.createTable('commerce_intermediaries', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
            // Nullable so an intermediary can be listed before their platform account is linked.
            user_id: { type: Sequelize.BIGINT, allowNull: true, unique: true },
            slug: { type: Sequelize.STRING(80), allowNull: false, unique: true },
            display_name: { type: Sequelize.STRING(120), allowNull: false },
            bio: { type: Sequelize.TEXT, allowNull: true },
            services: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
            languages: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
            commission_note: { type: Sequelize.STRING(200), allowNull: true },
            trade_limit_usd: { type: Sequelize.INTEGER, allowNull: true },
            // applied -> payment_submitted -> active (listed) | rejected | suspended
            status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'applied' },
            verified: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
            deposit_usd: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
            deposit_confirmed_at: { type: Sequelize.DATE, allowNull: true },
            deposit_bond_id: { type: Sequelize.UUID, allowNull: true },
            // When the applicant accepted the intermediary rules (pay only via their listed QR, deposit terms, disputes).
            terms_accepted_at: { type: Sequelize.DATE, allowNull: true },
            approved_by: { type: Sequelize.BIGINT, allowNull: true },
            approved_at: { type: Sequelize.DATE, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, S);
        await queryInterface.addIndex('commerce.commerce_intermediaries', ['status']);

        await queryInterface.createTable('commerce_intermediary_qrs', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
            intermediary_id: { type: Sequelize.UUID, allowNull: false, references: { model: { tableName: 'commerce_intermediaries', schema: 'commerce' }, key: 'id' }, onDelete: 'CASCADE' },
            label: { type: Sequelize.STRING(60), allowNull: false },
            mime: { type: Sequelize.STRING(40), allowNull: false },
            size_bytes: { type: Sequelize.INTEGER, allowNull: false },
            data: { type: Sequelize.BLOB, allowNull: false },
            sort: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, S);
        await queryInterface.addIndex('commerce.commerce_intermediary_qrs', ['intermediary_id']);

        await queryInterface.createTable('commerce_intermediary_trades', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
            ref: { type: Sequelize.STRING(20), allowNull: false, unique: true },
            intermediary_id: { type: Sequelize.UUID, allowNull: false },
            customer_user_id: { type: Sequelize.BIGINT, allowNull: false },
            service_type: { type: Sequelize.STRING(20), allowNull: false },
            amount_usdt: { type: Sequelize.DECIMAL(14, 2), allowNull: true },
            instructions: { type: Sequelize.TEXT, allowNull: true },
            // created -> payment_submitted -> in_progress -> completed ; cancelled ; disputed -> (completed | cancelled)
            status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'created' },
            paid_at: { type: Sequelize.DATE, allowNull: true },
            completed_at: { type: Sequelize.DATE, allowNull: true },
            cancelled_by: { type: Sequelize.STRING(20), allowNull: true },
            dispute_reason: { type: Sequelize.TEXT, allowNull: true },
            disputed_by: { type: Sequelize.BIGINT, allowNull: true },
            resolution_note: { type: Sequelize.TEXT, allowNull: true },
            resolved_by: { type: Sequelize.BIGINT, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, S);
        await queryInterface.addIndex('commerce.commerce_intermediary_trades', ['customer_user_id']);
        await queryInterface.addIndex('commerce.commerce_intermediary_trades', ['intermediary_id', 'status']);

        await queryInterface.createTable('commerce_intermediary_trade_messages', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
            trade_id: { type: Sequelize.UUID, allowNull: false, references: { model: { tableName: 'commerce_intermediary_trades', schema: 'commerce' }, key: 'id' }, onDelete: 'CASCADE' },
            sender_user_id: { type: Sequelize.BIGINT, allowNull: false },
            sender_role: { type: Sequelize.STRING(20), allowNull: false },
            body: { type: Sequelize.TEXT, allowNull: false },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, S);
        await queryInterface.addIndex('commerce.commerce_intermediary_trade_messages', ['trade_id', 'created_at']);

        await queryInterface.createTable('commerce_intermediary_trade_proofs', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
            trade_id: { type: Sequelize.UUID, allowNull: false, references: { model: { tableName: 'commerce_intermediary_trades', schema: 'commerce' }, key: 'id' }, onDelete: 'CASCADE' },
            uploaded_by: { type: Sequelize.BIGINT, allowNull: false },
            uploader_role: { type: Sequelize.STRING(20), allowNull: false },
            mime: { type: Sequelize.STRING(40), allowNull: false },
            size_bytes: { type: Sequelize.INTEGER, allowNull: false },
            data: { type: Sequelize.BLOB, allowNull: false },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, S);
        await queryInterface.addIndex('commerce.commerce_intermediary_trade_proofs', ['trade_id']);
    },
    async down(queryInterface) {
        for (const t of ['commerce_intermediary_trade_proofs', 'commerce_intermediary_trade_messages', 'commerce_intermediary_trades', 'commerce_intermediary_qrs', 'commerce_intermediaries']) {
            await queryInterface.dropTable({ tableName: t, schema: 'commerce' });
        }
    },
};
