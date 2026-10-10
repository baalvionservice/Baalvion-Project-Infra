'use strict';
/**
 * Where sellers send their category payment. One live row per method and network, edited by a super admin, plus an
 * append-only change log. Each seller payment also stores the address it was issued with, so changing
 * an address never alters a payment already in progress.
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('commerce_payment_destinations', {
            method: { type: Sequelize.STRING(10), primaryKey: true },
            // '' for methods without a network (Binance Pay). Part of the key so USDT can have one address per network.
            network: { type: Sequelize.STRING(30), primaryKey: true, allowNull: false, defaultValue: '' },
            address: { type: Sequelize.STRING(200), allowNull: false },
            // Recipient name shown to the seller so they can confirm who they are paying (e.g. the Binance Pay display name).
            label: { type: Sequelize.STRING(80), allowNull: true },
            is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
            updated_by: { type: Sequelize.BIGINT, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'commerce' });
        await queryInterface.createTable('commerce_payment_destination_changes', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
            method: { type: Sequelize.STRING(10), allowNull: false },
            old_address: { type: Sequelize.STRING(200), allowNull: true },
            new_address: { type: Sequelize.STRING(200), allowNull: true },
            old_network: { type: Sequelize.STRING(30), allowNull: true },
            new_network: { type: Sequelize.STRING(30), allowNull: true },
            action: { type: Sequelize.STRING(20), allowNull: false },
            changed_by: { type: Sequelize.BIGINT, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'commerce' });
        await queryInterface.addIndex('commerce.commerce_payment_destination_changes', ['method', 'created_at']);
        await queryInterface.addColumn({ tableName: 'commerce_seller_category_bonds', schema: 'commerce' }, 'pay_to_address', { type: Sequelize.STRING(200), allowNull: true });
        await queryInterface.addColumn({ tableName: 'commerce_seller_category_bonds', schema: 'commerce' }, 'pay_to_network', { type: Sequelize.STRING(30), allowNull: true });
        await queryInterface.addColumn({ tableName: 'commerce_seller_category_bonds', schema: 'commerce' }, 'pay_to_label', { type: Sequelize.STRING(80), allowNull: true });
    },
    async down(queryInterface) {
        await queryInterface.removeColumn({ tableName: 'commerce_seller_category_bonds', schema: 'commerce' }, 'pay_to_label');
        await queryInterface.removeColumn({ tableName: 'commerce_seller_category_bonds', schema: 'commerce' }, 'pay_to_network');
        await queryInterface.removeColumn({ tableName: 'commerce_seller_category_bonds', schema: 'commerce' }, 'pay_to_address');
        await queryInterface.dropTable({ tableName: 'commerce_payment_destination_changes', schema: 'commerce' });
        await queryInterface.dropTable({ tableName: 'commerce_payment_destinations', schema: 'commerce' });
    },
};
