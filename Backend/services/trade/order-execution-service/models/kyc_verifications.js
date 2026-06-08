'use strict';
// Tenant-bound KYC verification registry (closes the caller-supplied kycId IDOR).
// The platform owns the binding (tenant_id, subject_ref) -> provider_verification_id + status;
// the order gate resolves KYC by the ORDER's tenant + subject ref, never by a caller-supplied
// provider id. provider_verification_id is stored server-side and is never accepted at placement.
module.exports = (sequelize, DataTypes) => sequelize.define('KycVerification', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    tenant_id: { type: DataTypes.TEXT, allowNull: false },
    subject_ref: { type: DataTypes.TEXT, allowNull: false },
    subject_type: {
        type: DataTypes.ENUM('INDIVIDUAL', 'BUSINESS'),
        allowNull: false,
        defaultValue: 'BUSINESS',
    },
    provider: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'onfido' },
    provider_verification_id: { type: DataTypes.TEXT },
    status: {
        type: DataTypes.ENUM('NOT_STARTED', 'PENDING', 'APPROVED', 'REJECTED', 'REVIEW', 'RESUBMIT'),
        allowNull: false,
        defaultValue: 'NOT_STARTED',
    },
    reasons: { type: DataTypes.JSONB },
    idempotency_key: { type: DataTypes.TEXT },
    last_checked_at: { type: DataTypes.DATE },
}, { schema: 'oms', tableName: 'kyc_verifications', underscored: true, timestamps: true });
