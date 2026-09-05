'use strict';
module.exports = (sequelize, DataTypes) => {
    // Trade insurance policy (Logistics #7): cargo / liability / credit / parametric cover. status is a
    // STRING aligned to the frontend vocab (pending=quoted, active=bound, claimed/expired/cancelled).
    const InsurancePolicy = sequelize.define('InsurancePolicy', {
        id: { type: DataTypes.STRING(64), primaryKey: true }, // 'INS-...'
        tenant_id: { type: DataTypes.TEXT },
        // Real FK to tradeops.shipments since migration 068 — see that file for why
        // tradeops (not the now-dead trade.shipments) is the authoritative table.
        shipment_id: { type: DataTypes.UUID },
        order_id: { type: DataTypes.TEXT },
        policy_number: { type: DataTypes.STRING(80), unique: true },
        insurance_type: { type: DataTypes.STRING(20), defaultValue: 'cargo' },
        status: { type: DataTypes.STRING(20), defaultValue: 'pending', validate: { isIn: [['pending', 'quoted', 'active', 'claimed', 'expired', 'cancelled']] } },
        insured: { type: DataTypes.JSONB, defaultValue: {} },
        beneficiary: { type: DataTypes.JSONB, defaultValue: {} },
        provider: { type: DataTypes.STRING(120) },
        coverage_amount: { type: DataTypes.DECIMAL(20, 2), defaultValue: 0 },
        currency: { type: DataTypes.STRING(10), defaultValue: 'USD' },
        premium: { type: DataTypes.DECIMAL(20, 2), defaultValue: 0 },
        premium_rate: { type: DataTypes.DECIMAL(10, 5) },
        deductible: { type: DataTypes.DECIMAL(20, 2), defaultValue: 0 },
        coverage_terms: { type: DataTypes.JSONB, defaultValue: {} },
        parametric_trigger: { type: DataTypes.JSONB, defaultValue: null }, // {metric,threshold,payout}
        premium_payment_ref: { type: DataTypes.STRING(120) },
        // Placement (migration 071). `premium` is the GROSS the assured pays; these
        // split it between the broker's commission and what is owed to the carrier.
        underwriter_id: { type: DataTypes.STRING(64) },
        underwriter_policy_ref: { type: DataTypes.TEXT },
        placement_status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'unplaced', validate: { isIn: [['unplaced', 'referred', 'placed', 'declined', 'platform_retained']] } },
        commission_rate: { type: DataTypes.DECIMAL(6, 5) },
        commission_amount: { type: DataTypes.DECIMAL(20, 2) },
        net_premium: { type: DataTypes.DECIMAL(20, 2) },
        remittance_ref: { type: DataTypes.STRING(120) },
        // Client money (migration 072): gross premium lands in a segregated trust
        // account; commission is DRAWN from it afterwards, never taken at the door.
        trust_account_id: { type: DataTypes.UUID },
        premium_held_in_trust: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        commission_drawn_at: { type: DataTypes.DATE },
        commission_draw_ref: { type: DataTypes.STRING(120) },
        // The basis on which cover was sold — the broker's defence in an E&O claim.
        advice_basis: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'non_advised', validate: { isIn: [['non_advised', 'advised', 'execution_only']] } },
        disclosure_accepted_at: { type: DataTypes.DATE },
        disclosure_version: { type: DataTypes.STRING(20) },
        // 'voyage' cover runs warehouse-to-warehouse for one sailing (the marine
        // default); 'term'/'open_cover' are the time-based alternatives. Migration 066.
        coverage_basis: { type: DataTypes.STRING(30), validate: { isIn: [['voyage', 'term', 'open_cover']] } },
        // Provenance for the risk multiplier that priced this policy — which lane, how
        // many prior shipments it was measured over, and whether it fell back to base rate.
        risk_assessment: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        start_date: { type: DataTypes.DATE },
        end_date: { type: DataTypes.DATE },
        bound_at: { type: DataTypes.DATE },
        expired_at: { type: DataTypes.DATE },
        metadata: { type: DataTypes.JSONB, defaultValue: {} },
    }, {
        schema: 'trade',
        tableName: 'insurance_policies',
        underscored: true,
        timestamps: true,
    });

    InsurancePolicy.associate = (db) => {
        // Migration 068 settled which shipments table is authoritative and narrowed
        // the column to uuid with a real database-level FK, so the association is
        // finally sound. constraints:false keeps a dev sync() from re-declaring it.
        InsurancePolicy.belongsTo(db.TradeShipment, { as: 'shipment', foreignKey: 'shipment_id', constraints: false });
        InsurancePolicy.hasMany(db.InsuranceClaim, { as: 'claims', foreignKey: 'policy_id', constraints: false });
        InsurancePolicy.belongsTo(db.InsuranceUnderwriter, { as: 'underwriter', foreignKey: 'underwriter_id', constraints: false });
    };

    return InsurancePolicy;
};
