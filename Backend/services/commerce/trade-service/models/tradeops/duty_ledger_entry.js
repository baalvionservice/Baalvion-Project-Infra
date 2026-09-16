'use strict';
// Duty ledger entry (Compression, Phase 5) — append-only money history. Schema
// `tradeops`, tenant-scoped. idempotency_key is UNIQUE per account, which is what
// makes a retried settlement safe: the customs gateway retries, and a double debit
// here is real money leaving a real account. balance_after/reserved_after snapshot
// the account state the entry produced, so a balance can be audited against its
// history without replaying from zero. See migration 082.
module.exports = (sequelize, DataTypes) => {
    const DutyLedgerEntry = sequelize.define('DutyLedgerEntry', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        account_id: { type: DataTypes.UUID, allowNull: false },
        entry_type: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: { isIn: [['deposit', 'reserve', 'release', 'settle', 'refund', 'fee', 'adjustment']] },
        },
        amount_minor: { type: DataTypes.BIGINT, allowNull: false },
        currency: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'USD' },
        balance_after_minor: { type: DataTypes.BIGINT },
        reserved_after_minor: { type: DataTypes.BIGINT },
        consignment_id: { type: DataTypes.UUID },
        submission_id: { type: DataTypes.UUID },
        fx_lock_id: { type: DataTypes.UUID },
        reference: { type: DataTypes.TEXT },
        description: { type: DataTypes.TEXT },
        idempotency_key: { type: DataTypes.TEXT },
        created_by: { type: DataTypes.TEXT },
    }, {
        schema: 'tradeops',
        tableName: 'duty_ledger_entries',
        underscored: true,
        timestamps: true,
        updatedAt: false,   // append-only: an entry is never amended, only offset
    });

    DutyLedgerEntry.associate = (db) => {
        if (db.DutyAccount) {
            DutyLedgerEntry.belongsTo(db.DutyAccount, { as: 'account', foreignKey: 'account_id' });
        }
    };

    return DutyLedgerEntry;
};
