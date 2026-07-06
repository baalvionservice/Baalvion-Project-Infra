'use strict';
// Bank Verification — multiple verified payment accounts per org (Phase 2 Trust/
// Verification/Compliance Foundation, migration 029). The raw account number is
// never persisted; only its AES-256-GCM ciphertext + last 4 digits are stored (see
// service/verification/bank.js, which reuses lib/encryption.js).
module.exports = (sequelize, DataTypes) => {
    const STATUSES = ['submitted', 'under_review', 'approved', 'rejected', 'expired'];

    const BankAccount = sequelize.define('BankAccount', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        org_id: { type: DataTypes.INTEGER, allowNull: false },
        bank_name: { type: DataTypes.TEXT, allowNull: false },
        account_holder_name: { type: DataTypes.TEXT, allowNull: false },
        account_number_last4: { type: DataTypes.TEXT },
        account_number_ciphertext: { type: DataTypes.TEXT },
        account_number_iv: { type: DataTypes.TEXT },
        account_number_tag: { type: DataTypes.TEXT },
        account_number_algo: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'none' },
        // Deterministic HMAC-SHA256 of the raw account number — lets fraud
        // detection find duplicates without decrypting the AES-256-GCM ciphertext
        // (which uses a fresh random IV per row, so it never matches across rows).
        account_number_fingerprint: { type: DataTypes.TEXT },
        swift_bic: { type: DataTypes.TEXT },
        iban: { type: DataTypes.TEXT },
        ifsc: { type: DataTypes.TEXT },
        currency: { type: DataTypes.TEXT },
        is_primary: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        document_id: { type: DataTypes.UUID },
        status: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'submitted', validate: { isIn: [STATUSES] } },
        verified_at: { type: DataTypes.DATE },
        reviewed_by: { type: DataTypes.TEXT },
        reviewed_at: { type: DataTypes.DATE },
        rejection_reason: { type: DataTypes.TEXT },
        metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        created_by: { type: DataTypes.TEXT },
        updated_by: { type: DataTypes.TEXT },
        deleted_by: { type: DataTypes.TEXT },
    }, {
        schema: 'tradeops',
        tableName: 'bank_accounts',
        underscored: true,
        timestamps: true,
        paranoid: true,
        deletedAt: 'deleted_at',
        version: true,
        defaultScope: {
            attributes: { exclude: ['account_number_ciphertext', 'account_number_iv', 'account_number_tag'] },
        },
    });

    BankAccount.STATUSES = STATUSES;

    BankAccount.associate = (db) => {
        BankAccount.belongsTo(db.Organization, { as: 'organization', foreignKey: 'org_id', constraints: false });
        BankAccount.belongsTo(db.TradeDocument, { as: 'document', foreignKey: 'document_id', constraints: false });
    };

    return BankAccount;
};
