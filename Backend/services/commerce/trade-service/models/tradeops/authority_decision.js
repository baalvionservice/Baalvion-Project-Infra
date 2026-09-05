'use strict';
// Authority decision audit (Compression, Phase 7). Schema `tradeops`, tenant-scoped.
// Every evaluation is recorded — approved or escalated — with the delegation that
// matched and the wait it incurred. That is what turns the automation rate and the
// hours lost to escalation into measured numbers rather than anecdote, and it is
// also the audit trail for anything that executed without a person. See migration 084.
module.exports = (sequelize, DataTypes) => {
    const AuthorityDecision = sequelize.define('AuthorityDecision', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        org_id: { type: DataTypes.TEXT },
        consignment_id: { type: DataTypes.UUID },
        decision: { type: DataTypes.TEXT, allowNull: false },
        outcome: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: { isIn: [['auto_approved', 'needs_human', 'refused']] },
        },
        auto_approved: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        matched_delegation_id: { type: DataTypes.TEXT },
        amount_minor: { type: DataTypes.BIGINT },
        currency: { type: DataTypes.TEXT },
        request: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        reasons: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        blocked_by: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        coverage: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        escalation_wait_hours: { type: DataTypes.DECIMAL(10, 2) },
        resolved_at: { type: DataTypes.DATE },
        resolved_by: { type: DataTypes.TEXT },
        policy_version: { type: DataTypes.TEXT },
        created_by: { type: DataTypes.TEXT },
    }, {
        schema: 'tradeops',
        tableName: 'authority_decisions',
        underscored: true,
        timestamps: true,
        updatedAt: false,   // append-only audit
    });

    return AuthorityDecision;
};
