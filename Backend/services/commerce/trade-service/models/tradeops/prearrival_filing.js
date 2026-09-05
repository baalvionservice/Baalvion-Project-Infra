'use strict';
// Pre-arrival filing (Compression, Phase 4) — one scheduled regulatory filing.
// Schema `tradeops`, tenant-scoped (RLS + index.js hooks). `anchor` records which
// event the deadline runs from: a lading-anchored filing (US ISF, EU ENS) is due
// before the box leaves origin, so scheduling it off ETA misses it entirely.
// `target_at` is the start of the filing window, not the deadline — filing early
// is the whole point. See migration 081 + service/clearance/preArrival.js.
module.exports = (sequelize, DataTypes) => {
    const PrearrivalFiling = sequelize.define('PrearrivalFiling', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        consignment_id: { type: DataTypes.UUID, allowNull: false },
        shipment_id: { type: DataTypes.UUID },
        destination_country: { type: DataTypes.TEXT },
        regime_code: { type: DataTypes.TEXT },
        channel: { type: DataTypes.TEXT },
        filing_key: { type: DataTypes.TEXT, allowNull: false },
        label: { type: DataTypes.TEXT },
        anchor: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'arrival',
            validate: { isIn: [['lading', 'arrival']] },
        },
        anchor_at: { type: DataTypes.DATE },
        earliest_at: { type: DataTypes.DATE },
        due_at: { type: DataTypes.DATE },
        target_at: { type: DataTypes.DATE },
        status: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'scheduled',
            validate: {
                isIn: [['scheduled', 'not_yet_open', 'open', 'due_soon', 'overdue', 'missed',
                    'filing', 'filed', 'failed', 'cancelled', 'not_applicable', 'unschedulable']],
            },
        },
        mandatory: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        submission_id: { type: DataTypes.UUID },   // tradeops.customs_submissions
        filed_at: { type: DataTypes.DATE },
        attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        last_error: { type: DataTypes.TEXT },
        penalty: { type: DataTypes.TEXT },
        regime_version: { type: DataTypes.TEXT },
        metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    }, {
        schema: 'tradeops',
        tableName: 'prearrival_filings',
        underscored: true,
        timestamps: true,
    });

    PrearrivalFiling.associate = (db) => {
        if (db.Consignment) {
            PrearrivalFiling.belongsTo(db.Consignment, { as: 'consignment', foreignKey: 'consignment_id' });
        }
    };

    return PrearrivalFiling;
};
