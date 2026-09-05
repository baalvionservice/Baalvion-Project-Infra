'use strict';
// Filing precheck result (Compression, Phase 2) — the first-pass-acceptance ledger.
// Schema `tradeops`, tenant-scoped (RLS + index.js hooks). Every gate evaluation is
// kept, and gateway_outcome is backfilled once the matching customs submission
// resolves. That reconciliation is the point: it turns the predicted first-pass
// probability into a measured rate, which is the KPI that says whether the
// rejection loop is actually gone. See migration 080 + service/corridor/.
module.exports = (sequelize, DataTypes) => {
    const FilingPrecheck = sequelize.define('FilingPrecheck', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        consignment_id: { type: DataTypes.UUID },
        shipment_id: { type: DataTypes.UUID },
        submission_id: { type: DataTypes.UUID },   // tradeops.customs_submissions
        origin_country: { type: DataTypes.TEXT },
        destination_country: { type: DataTypes.TEXT },
        direction: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'export',
            validate: { isIn: [['import', 'export']] },
        },
        submittable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        blocking_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        warning_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        findings: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        requirements: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        predicted_first_pass: { type: DataTypes.DECIMAL(5, 4) },
        corridor_floor_hours: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
        gateway_outcome: {
            type: DataTypes.TEXT,
            validate: { isIn: [['accepted', 'rejected']] },
        },
        gateway_reason: { type: DataTypes.TEXT },
        reconciled_at: { type: DataTypes.DATE },
        precheck_version: { type: DataTypes.TEXT },
        matrix_version: { type: DataTypes.TEXT },
        created_by: { type: DataTypes.TEXT },
    }, {
        schema: 'tradeops',
        tableName: 'filing_prechecks',
        underscored: true,
        timestamps: true,
    });

    return FilingPrecheck;
};
