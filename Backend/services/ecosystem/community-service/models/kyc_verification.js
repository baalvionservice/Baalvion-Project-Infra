'use strict';
const { DataTypes } = require('sequelize');

// One KYC case per person. The ID scan and selfie live in kyc_documents (encrypted); this row
// holds only what the reviewer needs to match them. Approval is valid for 24 months.
module.exports = (sequelize) => sequelize.define('KycVerification', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.UUID, allowNull: false, unique: true },
    email_label: { type: DataTypes.STRING(120), allowNull: true },
    full_name: { type: DataTypes.STRING(160), allowNull: false },
    date_of_birth: { type: DataTypes.DATEONLY, allowNull: false },
    nationality: { type: DataTypes.STRING(80), allowNull: false },
    id_type: { type: DataTypes.ENUM('passport', 'government_id', 'driving_license'), allowNull: false },
    id_number_last4: { type: DataTypes.STRING(4), allowNull: false },
    status: { type: DataTypes.ENUM('submitted', 'approved', 'rejected', 'expired'), allowNull: false, defaultValue: 'submitted' },
    rejection_reason: { type: DataTypes.STRING(500), allowNull: true },
    reviewed_by: { type: DataTypes.UUID, allowNull: true },
    reviewed_at: { type: DataTypes.DATE, allowNull: true },
    expires_at: { type: DataTypes.DATE, allowNull: true },
    documents_purged_at: { type: DataTypes.DATE, allowNull: true },
}, {
    tableName: 'kyc_verifications', schema: 'community', underscored: true, timestamps: true,
    indexes: [{ fields: ['status'] }],
});
