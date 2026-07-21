'use strict';
// Real (structured-data) identity fields captured at seller-application time, reviewed by the
// admin alongside the rest of the application (see sellerApplicationController.js). Deliberately
// NOT a document-upload/scan pipeline — building a secure encrypted-upload path for ID documents
// this late in the pass would be rushed given the stakes; legal name + DOB + phone, manually
// reviewed by an admin before approval, is real KYC-lite without that risk. payout_wallet_address
// lives here too (see the crypto-payout companion migration note) since it's collected on the
// same onboarding step.
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('commerce_seller_applications', 'legal_full_name', { type: Sequelize.STRING(200), allowNull: true }, { schema: 'commerce' });
        await queryInterface.addColumn('commerce_seller_applications', 'date_of_birth', { type: Sequelize.DATEONLY, allowNull: true }, { schema: 'commerce' });
        await queryInterface.addColumn('commerce_seller_applications', 'phone_number', { type: Sequelize.STRING(30), allowNull: true }, { schema: 'commerce' });
        await queryInterface.addColumn('commerce_seller_applications', 'identity_verified', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false }, { schema: 'commerce' });
        await queryInterface.addColumn('commerce_seller_applications', 'payout_currency', { type: Sequelize.STRING(10), allowNull: true }, { schema: 'commerce' });
        await queryInterface.addColumn('commerce_seller_applications', 'payout_wallet_address', { type: Sequelize.STRING(200), allowNull: true }, { schema: 'commerce' });
    },
    async down(queryInterface) {
        for (const col of ['legal_full_name', 'date_of_birth', 'phone_number', 'identity_verified', 'payout_currency', 'payout_wallet_address']) {
            await queryInterface.removeColumn({ tableName: 'commerce_seller_applications', schema: 'commerce' }, col);
        }
    },
};
