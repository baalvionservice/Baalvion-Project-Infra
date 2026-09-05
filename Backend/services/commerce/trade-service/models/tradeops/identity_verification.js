'use strict';
// Identity Verification — per-user KYC (Phase 2 Trust/Verification/Compliance
// Foundation, migration 026). The ID scan / selfie files live in the existing
// AES-256-GCM Document Management engine (tradeops.documents) and are only
// referenced here by id_document_id/selfie_document_id. Schema `tradeops`, UUID PK,
// paranoid (one active row per user via a partial unique index in the migration).
module.exports = (sequelize, DataTypes) => {
    const ID_TYPES = ['government_id', 'passport', 'driving_license'];
    const LIVENESS_STATUSES = ['not_required', 'pending', 'passed', 'failed'];
    const STATUSES = ['submitted', 'under_review', 'approved', 'rejected', 'expired'];

    const IdentityVerification = sequelize.define('IdentityVerification', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        user_id: { type: DataTypes.INTEGER, allowNull: false },
        org_id: { type: DataTypes.INTEGER },
        full_name: { type: DataTypes.TEXT, allowNull: false },
        date_of_birth: { type: DataTypes.DATEONLY },
        nationality: { type: DataTypes.TEXT },
        id_type: { type: DataTypes.TEXT, allowNull: false, validate: { isIn: [ID_TYPES] } },
        id_number_last4: { type: DataTypes.TEXT },
        id_document_id: { type: DataTypes.UUID },
        selfie_document_id: { type: DataTypes.UUID },
        liveness_check_status: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'pending', validate: { isIn: [LIVENESS_STATUSES] } },
        liveness_provider: { type: DataTypes.TEXT },
        liveness_reference: { type: DataTypes.TEXT },
        status: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'submitted', validate: { isIn: [STATUSES] } },
        reviewed_by: { type: DataTypes.TEXT },
        reviewed_at: { type: DataTypes.DATE },
        rejection_reason: { type: DataTypes.TEXT },
        expires_at: { type: DataTypes.DATE },
        // KYC/KYB vendor holding this case, and its own reference for it (migration 070).
        // Empty means the manual queue owns the record — see service/verification/providerCheck.js.
        provider_name: { type: DataTypes.TEXT },
        provider_ref: { type: DataTypes.TEXT },
        provider_submitted_at: { type: DataTypes.DATE },
        provider_result: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        created_by: { type: DataTypes.TEXT },
        updated_by: { type: DataTypes.TEXT },
        deleted_by: { type: DataTypes.TEXT },
    }, {
        schema: 'tradeops',
        tableName: 'identity_verifications',
        underscored: true,
        timestamps: true,
        paranoid: true,
        deletedAt: 'deleted_at',
        version: true,
    });

    IdentityVerification.ID_TYPES = ID_TYPES;
    IdentityVerification.LIVENESS_STATUSES = LIVENESS_STATUSES;
    IdentityVerification.STATUSES = STATUSES;

    IdentityVerification.associate = (db) => {
        IdentityVerification.belongsTo(db.User, { as: 'user', foreignKey: 'user_id', constraints: false });
        IdentityVerification.belongsTo(db.Organization, { as: 'organization', foreignKey: 'org_id', constraints: false });
        IdentityVerification.belongsTo(db.TradeDocument, { as: 'idDocument', foreignKey: 'id_document_id', constraints: false });
        IdentityVerification.belongsTo(db.TradeDocument, { as: 'selfieDocument', foreignKey: 'selfie_document_id', constraints: false });
    };

    return IdentityVerification;
};
