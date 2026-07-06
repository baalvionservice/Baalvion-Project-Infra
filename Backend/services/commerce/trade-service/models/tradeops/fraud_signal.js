'use strict';
// Fraud Detection — alerts for manual review (Phase 2 Trust/Verification/
// Compliance Foundation, migration 034). At most one OPEN signal per (org, type) —
// see uq_fraud_signals_open_org_type — so re-detecting the same condition doesn't
// spam duplicate alerts; a reviewer must resolve (confirm/dismiss) before a fresh
// one can open.
module.exports = (sequelize, DataTypes) => {
    const SIGNAL_TYPES = [
        'duplicate_company', 'duplicate_tax_id', 'duplicate_bank_account', 'suspicious_login',
        'excessive_failed_logins', 'multi_account_same_identity', 'suspicious_document',
    ];
    const SEVERITIES = ['low', 'medium', 'high', 'critical'];
    const STATUSES = ['open', 'reviewing', 'confirmed', 'dismissed'];

    const FraudSignal = sequelize.define('FraudSignal', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        org_id: { type: DataTypes.INTEGER },
        user_id: { type: DataTypes.INTEGER },
        signal_type: { type: DataTypes.TEXT, allowNull: false, validate: { isIn: [SIGNAL_TYPES] } },
        severity: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'medium', validate: { isIn: [SEVERITIES] } },
        status: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'open', validate: { isIn: [STATUSES] } },
        details: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        reviewed_by: { type: DataTypes.TEXT },
        reviewed_at: { type: DataTypes.DATE },
    }, {
        schema: 'tradeops',
        tableName: 'fraud_signals',
        underscored: true,
        timestamps: true,
    });

    FraudSignal.SIGNAL_TYPES = SIGNAL_TYPES;
    FraudSignal.SEVERITIES = SEVERITIES;
    FraudSignal.STATUSES = STATUSES;

    FraudSignal.associate = (db) => {
        FraudSignal.belongsTo(db.Organization, { as: 'organization', foreignKey: 'org_id', constraints: false });
        FraudSignal.belongsTo(db.User, { as: 'user', foreignKey: 'user_id', constraints: false });
    };

    return FraudSignal;
};
