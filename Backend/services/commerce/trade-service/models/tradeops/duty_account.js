'use strict';
// Duty account (Compression, Phase 5) — the pre-funded balance that turns duty
// payment from a bank transfer into a ledger debit. Schema `tradeops`, tenant-scoped
// (RLS + index.js hooks). reserved_minor is deliberately separate from balance_minor:
// an assessment reserves, a payment settles, and without the split several
// consignments each believe they own the same balance. All amounts are integers in
// the account's minor unit. See migration 082 + service/duty/ledger.js.
module.exports = (sequelize, DataTypes) => {
    const DutyAccount = sequelize.define('DutyAccount', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        org_id: { type: DataTypes.TEXT },
        label: { type: DataTypes.TEXT },
        account_type: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'prefunded_wallet',
            validate: { isIn: [['prefunded_wallet', 'deferred_account', 'broker_bond']] },
        },
        currency: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'USD' },
        balance_minor: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
        reserved_minor: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
        credit_limit_minor: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
        status: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'active',
            validate: { isIn: [['active', 'suspended', 'closed']] },
        },
        guarantee_reference: { type: DataTypes.TEXT },   // deferment guarantee / bond ref
        provider: { type: DataTypes.TEXT },
        metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        created_by: { type: DataTypes.TEXT },
    }, {
        schema: 'tradeops',
        tableName: 'duty_accounts',
        underscored: true,
        timestamps: true,
    });

    DutyAccount.associate = (db) => {
        if (db.DutyLedgerEntry) {
            DutyAccount.hasMany(db.DutyLedgerEntry, { as: 'entries', foreignKey: 'account_id' });
        }
    };

    return DutyAccount;
};
