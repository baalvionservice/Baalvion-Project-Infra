'use strict';
module.exports = (sequelize, DataTypes) => {
    const Organization = sequelize.define('Organization', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false },
        // Stable external code (e.g. 'COMP-101') the frontend addresses orgs by.
        code: { type: DataTypes.STRING(64), unique: true },
        name: { type: DataTypes.STRING(255), allowNull: false },
        // Phase 1 company-profile fields (spec: legal name / industry / business
        // type / company size / website) — added in migration 023.
        legal_name: { type: DataTypes.STRING(255) },
        industry: { type: DataTypes.STRING(120) },
        business_type: { type: DataTypes.STRING(120) },
        company_size: { type: DataTypes.STRING(40) },
        website: { type: DataTypes.STRING(255) },
        type: {
            type: DataTypes.ENUM('buyer', 'seller', 'carrier', 'bank', 'insurer', 'regulator'),
        },
        country: { type: DataTypes.STRING(100) },
        registration_number: { type: DataTypes.STRING(100) },
        status: {
            type: DataTypes.ENUM('active', 'suspended', 'pending'),
            defaultValue: 'pending',
        },
        contact_email: { type: DataTypes.STRING },
        kyc_status: {
            type: DataTypes.ENUM('pending', 'verified', 'rejected'),
            defaultValue: 'pending',
        },
        risk_score: { type: DataTypes.DECIMAL(5, 2) },
        // Frontend reads org.verificationStatus; mirror kyc_status into the JSON.
        verificationStatus: {
            type: DataTypes.VIRTUAL,
            get() { return this.getDataValue('kyc_status'); },
        },
        // Phase 2 Verification Center rollup (migration 025) — flips true once every
        // checklist category (identity/company/tax/bank/.../trust_score) is approved.
        verified_badge: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        badge_issued_at: { type: DataTypes.DATE },
        // Migration 043 — cached account-service (financial-services-java) BUSINESS
        // account UUID, lazily provisioned by lib/accountProvisioning.js the first
        // time this org needs an escrow/ledger money movement.
        ledger_account_id: { type: DataTypes.UUID },
    }, {
        schema: 'trade',
        tableName: 'organizations',
        underscored: true,
        timestamps: true,
    });

    Organization.associate = (db) => {
        Organization.hasMany(db.Rfq, { foreignKey: 'buyer_org_id', as: 'rfqs' });
        Organization.hasOne(db.Wallet, { foreignKey: 'org_id', as: 'wallet' });
    };

    return Organization;
};
