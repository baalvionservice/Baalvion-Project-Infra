'use strict';
// Verification Center — denormalized per-org-per-category status cache (Phase 2
// Trust/Verification/Compliance Foundation, migration 025). One row per category
// per organization; recomputed by service/verification/checklist.js whenever an
// underlying verification record (identity/company/tax/bank/address/...) changes
// state, so the dashboard read is O(1) instead of a fan-out join across every
// verification table.
module.exports = (sequelize, DataTypes) => {
    const CATEGORIES = [
        'identity', 'company', 'business_registration', 'tax', 'bank', 'address',
        'directors', 'documents', 'factory', 'warehouse', 'products', 'certificates',
        'compliance', 'risk', 'trust_score',
    ];
    const STATUSES = ['not_started', 'submitted', 'under_review', 'approved', 'rejected', 'expired'];

    const VerificationChecklistItem = sequelize.define('VerificationChecklistItem', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        org_id: { type: DataTypes.INTEGER, allowNull: false },
        category: { type: DataTypes.TEXT, allowNull: false, validate: { isIn: [CATEGORIES] } },
        status: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'not_started', validate: { isIn: [STATUSES] } },
        item_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        approved_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        last_submitted_at: { type: DataTypes.DATE },
        last_reviewed_at: { type: DataTypes.DATE },
        reviewed_by: { type: DataTypes.TEXT },
        rejection_reason: { type: DataTypes.TEXT },
        expires_at: { type: DataTypes.DATE },
        metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        created_by: { type: DataTypes.TEXT },
        updated_by: { type: DataTypes.TEXT },
    }, {
        schema: 'tradeops',
        tableName: 'verification_checklist_items',
        underscored: true,
        timestamps: true,
        version: true,
    });

    VerificationChecklistItem.CATEGORIES = CATEGORIES;
    VerificationChecklistItem.STATUSES = STATUSES;

    VerificationChecklistItem.associate = (db) => {
        VerificationChecklistItem.belongsTo(db.Organization, { as: 'organization', foreignKey: 'org_id', constraints: false });
    };

    return VerificationChecklistItem;
};
