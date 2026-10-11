'use strict';
/**
 * Screenshot proof on payments, an admin-set review wait (5 to 30 minutes) that users can see, and a
 * QR image / pay link on a payment destination (Binance Pay shows its QR).
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        const bonds = { tableName: 'commerce_seller_category_bonds', schema: 'commerce' };
        await queryInterface.addColumn(bonds, 'submitted_at', { type: Sequelize.DATE, allowNull: true });
        await queryInterface.addColumn(bonds, 'review_wait_minutes', { type: Sequelize.INTEGER, allowNull: true });

        await queryInterface.createTable('commerce_payment_proofs', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
            bond_id: { type: Sequelize.UUID, allowNull: false, references: { model: bonds, key: 'id' }, onDelete: 'CASCADE' },
            user_id: { type: Sequelize.BIGINT, allowNull: false },
            mime: { type: Sequelize.STRING(40), allowNull: false },
            size_bytes: { type: Sequelize.INTEGER, allowNull: false },
            data: { type: Sequelize.BLOB, allowNull: false },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'commerce' });
        await queryInterface.addIndex('commerce.commerce_payment_proofs', ['bond_id']);

        await queryInterface.createTable('commerce_payment_settings', {
            key: { type: Sequelize.STRING(60), primaryKey: true },
            value: { type: Sequelize.STRING(200), allowNull: false },
            updated_by: { type: Sequelize.BIGINT, allowNull: true },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'commerce' });
        await queryInterface.sequelize.query(
            `INSERT INTO commerce.commerce_payment_settings (key, value) VALUES ('review_wait_minutes', '15') ON CONFLICT (key) DO NOTHING`);

        const dest = { tableName: 'commerce_payment_destinations', schema: 'commerce' };
        await queryInterface.addColumn(dest, 'qr_image_url', { type: Sequelize.STRING(300), allowNull: true });
        await queryInterface.addColumn(dest, 'pay_link', { type: Sequelize.STRING(300), allowNull: true });
    },
    async down(queryInterface) {
        const dest = { tableName: 'commerce_payment_destinations', schema: 'commerce' };
        await queryInterface.removeColumn(dest, 'pay_link');
        await queryInterface.removeColumn(dest, 'qr_image_url');
        await queryInterface.dropTable({ tableName: 'commerce_payment_settings', schema: 'commerce' });
        await queryInterface.dropTable({ tableName: 'commerce_payment_proofs', schema: 'commerce' });
        const bonds = { tableName: 'commerce_seller_category_bonds', schema: 'commerce' };
        await queryInterface.removeColumn(bonds, 'review_wait_minutes');
        await queryInterface.removeColumn(bonds, 'submitted_at');
    },
};
