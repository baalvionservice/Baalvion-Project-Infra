'use strict';
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('commerce_seller_applications', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        applicantUserId: { type: DataTypes.BIGINT, allowNull: false },
        applicantOrgId: { type: DataTypes.UUID, allowNull: false },
        storeName: { type: DataTypes.STRING(200), allowNull: false },
        storeCode: { type: DataTypes.STRING(20), allowNull: false },
        countryCode: { type: DataTypes.CHAR(2), allowNull: false },
        currencyCode: { type: DataTypes.CHAR(3), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), allowNull: false, defaultValue: 'pending' },
        rejectionReason: { type: DataTypes.TEXT, allowNull: true },
        reviewedBy: { type: DataTypes.BIGINT, allowNull: true },
        reviewedAt: { type: DataTypes.DATE, allowNull: true },
        createdStoreId: { type: DataTypes.UUID, allowNull: true },
        // KYC-lite (structured data, admin-reviewed — see migration 20260721-add-seller-
        // application-kyc-fields.js header for why this isn't a document-upload pipeline).
        legalFullName: { type: DataTypes.STRING(200), allowNull: true },
        dateOfBirth: { type: DataTypes.DATEONLY, allowNull: true },
        phoneNumber: { type: DataTypes.STRING(30), allowNull: true },
        identityVerified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        // Crypto payout destination, collected on the same onboarding step.
        payoutCurrency: { type: DataTypes.STRING(10), allowNull: true },
        payoutWalletAddress: { type: DataTypes.STRING(200), allowNull: true },
    }, {
        schema: 'commerce',
        tableName: 'commerce_seller_applications',
        underscored: true,
        timestamps: true,
        indexes: [{ fields: ['applicant_user_id'] }, { fields: ['status'] }],
    });
};
