'use strict';
// Trusted-trader accreditation (Compression, Phase 6) — what an operator holds.
// Schema `tradeops`, tenant-scoped (RLS + index.js hooks). expires_at is not
// decoration: accreditation is revocable and periodically re-validated, and a
// lapsed row must be treated as unaccredited by the risk model. `evidence` is the
// per-criterion status an auditor will test. Nothing here grants anything — an
// authority does that. See migration 083 + service/trustedTrader/.
module.exports = (sequelize, DataTypes) => {
    const TraderAccreditation = sequelize.define('TraderAccreditation', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        org_id: { type: DataTypes.TEXT },
        programme: { type: DataTypes.TEXT, allowNull: false },
        status: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'in_progress',
            validate: { isIn: [['in_progress', 'applied', 'active', 'suspended', 'revoked', 'expired']] },
        },
        reference: { type: DataTypes.TEXT },
        authority: { type: DataTypes.TEXT },
        granted_at: { type: DataTypes.DATEONLY },
        expires_at: { type: DataTypes.DATEONLY },
        readiness_pct: { type: DataTypes.DECIMAL(5, 2) },
        evidence: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        last_assessed: { type: DataTypes.DATE },
        metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        created_by: { type: DataTypes.TEXT },
    }, {
        schema: 'tradeops',
        tableName: 'trader_accreditations',
        underscored: true,
        timestamps: true,
    });

    return TraderAccreditation;
};
