'use strict';
// Trader risk profile (Compression, Phase 6) — the record customs is effectively
// scoring. Schema `tradeops`, tenant-scoped. Every field is computed from OBSERVED
// history (filings, precheck outcomes, examination findings), never self-declared:
// a self-reported first-pass rate would defeat the purpose of the metric. See
// migration 083 + service/trustedTrader/risk.js.
module.exports = (sequelize, DataTypes) => {
    const TraderRiskProfile = sequelize.define('TraderRiskProfile', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        org_id: { type: DataTypes.TEXT },
        filings_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        first_pass_rate: { type: DataTypes.DECIMAL(5, 4) },
        prior_exams: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        prior_findings: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        average_consignment_value: { type: DataTypes.DECIMAL(20, 2) },
        known_counterparties: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        months_trading: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        computed_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    }, {
        schema: 'tradeops',
        tableName: 'trader_risk_profiles',
        underscored: true,
        timestamps: true,
    });

    return TraderRiskProfile;
};
