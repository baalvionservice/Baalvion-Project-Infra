'use strict';
module.exports = (sequelize, DataTypes) => {
    // Insurance claim against a policy (Logistics #7). Lifecycle:
    // filed → evidence_required → under_review → approved → paid (or rejected/withdrawn).
    // Payout composes the finance facade. Tenant-scoped.
    //
    // Migration 066 added the pieces a marine claim cannot settle without:
    // incident_id/container_id (what physically happened, from tradeops), loss_date
    // (checked against the policy's cover period), the deductible actually applied,
    // the required-evidence snapshot, and subrogation — the insurer's recovery from
    // the carrier after it has paid the assured.
    const LOSS_TYPES = ['total_loss', 'partial_loss', 'damage', 'theft', 'delay', 'general_average', 'non_delivery', 'contamination'];
    const STATUSES = ['filed', 'evidence_required', 'under_review', 'approved', 'rejected', 'paid', 'withdrawn'];
    const SUBROGATION_STATUSES = ['none', 'pending', 'recovered', 'partially_recovered', 'waived', 'time_barred', 'failed'];

    const InsuranceClaim = sequelize.define('InsuranceClaim', {
        id: { type: DataTypes.STRING(64), primaryKey: true }, // 'CLM-...'
        tenant_id: { type: DataTypes.TEXT },
        policy_id: { type: DataTypes.STRING(64) },
        shipment_id: { type: DataTypes.UUID },   // FK to tradeops.shipments (migration 068)
        incident_id: { type: DataTypes.UUID },
        container_id: { type: DataTypes.UUID },
        general_average_id: { type: DataTypes.STRING(64) },
        claim_number: { type: DataTypes.STRING(80), unique: true },
        amount: { type: DataTypes.DECIMAL(20, 2), defaultValue: 0 },
        gross_loss: { type: DataTypes.DECIMAL(20, 2) },
        status: { type: DataTypes.STRING(20), defaultValue: 'filed', validate: { isIn: [STATUSES] } },
        loss_type: { type: DataTypes.STRING(30), validate: { isIn: [LOSS_TYPES] } },
        loss_date: { type: DataTypes.DATE },
        reason: { type: DataTypes.TEXT },
        assessor: { type: DataTypes.STRING(120) },
        required_documents: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        evidence_complete: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        payout_amount: { type: DataTypes.DECIMAL(20, 2) },
        deductible_applied: { type: DataTypes.DECIMAL(20, 2) },
        payout_ref: { type: DataTypes.STRING(120) },
        subrogation_status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'none', validate: { isIn: [SUBROGATION_STATUSES] } },
        subrogation_recovered: { type: DataTypes.DECIMAL(20, 2), allowNull: false, defaultValue: 0 },
        subrogation_ref: { type: DataTypes.STRING(160) },
        // What the underwriter settled on their own paper (migration 071) — distinct
        // from subrogation, which is recovery from the party that caused the loss.
        underwriter_claim_ref: { type: DataTypes.TEXT },
        underwriter_settled_amount: { type: DataTypes.DECIMAL(20, 2) },
        underwriter_settled_at: { type: DataTypes.DATE },
        filed_at: { type: DataTypes.DATE },
        resolved_at: { type: DataTypes.DATE },
        paid_at: { type: DataTypes.DATE },
        metadata: { type: DataTypes.JSONB, defaultValue: {} },
    }, {
        schema: 'trade',
        tableName: 'insurance_claims',
        underscored: true,
        timestamps: true,
    });

    InsuranceClaim.LOSS_TYPES = LOSS_TYPES;
    InsuranceClaim.STATUSES = STATUSES;
    InsuranceClaim.SUBROGATION_STATUSES = SUBROGATION_STATUSES;

    InsuranceClaim.associate = (db) => {
        InsuranceClaim.belongsTo(db.InsurancePolicy, { as: 'policy', foreignKey: 'policy_id', constraints: false });
        InsuranceClaim.hasMany(db.InsuranceClaimDocument, { as: 'documents', foreignKey: 'claim_id' });
        // Soft association: incidents live in tradeops with a UUID PK, and the FK is
        // real in the DB (migration 066) — but constraints:false keeps Sequelize from
        // re-declaring it during any dev sync().
        InsuranceClaim.belongsTo(db.Incident, { as: 'incident', foreignKey: 'incident_id', constraints: false });
    };

    return InsuranceClaim;
};
