'use strict';
// Delegated authority (Compression, Phase 7) — a pre-authorised decision limit.
// Schema `tradeops`, tenant-scoped (RLS + index.js hooks). max_value_minor is
// allowNull:false with NO default on purpose: a blank value limit that silently
// meant "unlimited" is the misconfiguration this table must be unable to express.
// Decisions that are never delegable (sanctions, licences, valuation disputes) are
// enforced in service/authority/policy.js and no row here can override them.
// See migration 084.
module.exports = (sequelize, DataTypes) => {
    const AuthorityDelegation = sequelize.define('AuthorityDelegation', {
        id: { type: DataTypes.TEXT, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        org_id: { type: DataTypes.TEXT },
        label: { type: DataTypes.TEXT },
        decision: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                isIn: [['file_declaration', 'settle_duty', 'approve_amendment', 'accept_duty_variance',
                    'release_cargo', 'waive_finding', 'respond_to_query']],
            },
        },
        status: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'active',
            validate: { isIn: [['active', 'suspended', 'revoked', 'expired']] },
        },
        scope: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        max_value_minor: { type: DataTypes.BIGINT, allowNull: false },
        currency: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'USD' },
        delegate: { type: DataTypes.TEXT },
        granted_by: { type: DataTypes.TEXT },
        effective_from: { type: DataTypes.DATE },
        expires_at: { type: DataTypes.DATE },
        metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    }, {
        schema: 'tradeops',
        tableName: 'authority_delegations',
        underscored: true,
        timestamps: true,
    });

    return AuthorityDelegation;
};
