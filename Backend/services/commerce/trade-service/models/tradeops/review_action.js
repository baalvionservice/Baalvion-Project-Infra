'use strict';
// Manual Review Console — rich, human-facing review decision log (Phase 2 Trust/
// Verification/Compliance Foundation, migration 038). Append-only; every action
// also writes to the existing hash-chained trade.audit_logs (utils/audit.js) for
// tamper-evidence.
module.exports = (sequelize, DataTypes) => {
    const REVIEWABLE_TYPES = [
        'identity', 'company', 'stakeholder', 'tax', 'bank', 'address', 'facility',
        'product_certificate', 'document', 'compliance_rule',
    ];
    const ACTIONS = ['approve', 'reject', 'request_more_info', 'escalate'];

    const ReviewAction = sequelize.define('ReviewAction', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        org_id: { type: DataTypes.INTEGER },
        reviewable_type: { type: DataTypes.TEXT, allowNull: false, validate: { isIn: [REVIEWABLE_TYPES] } },
        reviewable_id: { type: DataTypes.UUID, allowNull: false },
        action: { type: DataTypes.TEXT, allowNull: false, validate: { isIn: [ACTIONS] } },
        reviewer_user_id: { type: DataTypes.TEXT, allowNull: false },
        notes: { type: DataTypes.TEXT },
        escalated_to: { type: DataTypes.TEXT },
    }, {
        schema: 'tradeops',
        tableName: 'review_actions',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    });

    ReviewAction.REVIEWABLE_TYPES = REVIEWABLE_TYPES;
    ReviewAction.ACTIONS = ACTIONS;

    ReviewAction.associate = (db) => {
        ReviewAction.belongsTo(db.Organization, { as: 'organization', foreignKey: 'org_id', constraints: false });
    };

    return ReviewAction;
};
