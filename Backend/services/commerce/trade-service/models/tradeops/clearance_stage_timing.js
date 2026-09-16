'use strict';
// Clearance Stage Ledger (Clearance Compression, Phase 0) — the per-stage clock.
// Schema `tradeops`, UUID PK, tenant-scoped (RLS + index.js hooks). One row per
// (subject, stage); the unique constraint is what makes stage open/close idempotent
// and lets a reopen bump touch_count instead of forking a second row. Elapsed vs.
// blocked time are separate columns because they imply different fixes. See
// migration 078 + service/clearance/.
module.exports = (sequelize, DataTypes) => {
    const ClearanceStageTiming = sequelize.define('ClearanceStageTiming', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        subject_type: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'consignment',
            validate: { isIn: [['consignment', 'shipment', 'trade_operation']] },
        },
        subject_id: { type: DataTypes.UUID, allowNull: false },
        consignment_id: { type: DataTypes.UUID },
        trade_operation_id: { type: DataTypes.UUID },
        shipment_id: { type: DataTypes.UUID },
        stage: { type: DataTypes.TEXT, allowNull: false },
        track: { type: DataTypes.TEXT },
        owner_party: { type: DataTypes.TEXT },
        status: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'pending',
            validate: { isIn: [['pending', 'active', 'blocked', 'done', 'skipped']] },
        },
        started_at: { type: DataTypes.DATE },
        target_at: { type: DataTypes.DATE },
        completed_at: { type: DataTypes.DATE },
        blocked_since: { type: DataTypes.DATE },      // open block window
        blocked_ms: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 }, // banked
        elapsed_ms: { type: DataTypes.BIGINT },
        waiting_on_party: { type: DataTypes.TEXT },
        blocked_by: { type: DataTypes.TEXT },
        touch_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }, // >1 ⇒ rework
        baseline_hours: { type: DataTypes.DECIMAL(10, 2) },
        target_hours: { type: DataTypes.DECIMAL(10, 2) },
        breached: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    }, {
        schema: 'tradeops',
        tableName: 'clearance_stage_timings',
        underscored: true,
        timestamps: true,
    });

    return ClearanceStageTiming;
};
