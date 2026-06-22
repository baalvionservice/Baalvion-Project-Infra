'use strict';
// Business onboarding aggregate root: company profile + KYC + trade/tax registrations
// (IEC / GST / VAT) + the approval workflow. One row per onboarding application.
//
// Statuses are plain VARCHARs (not pg enums) so the set can evolve without a migration —
// they are validated at the schema layer (see validators/schemas.js). The table is created
// automatically on boot via sequelize.sync({ alter:false }) in index.js (schema `ir`).
module.exports = (sequelize, DataTypes) => {
    const IrBusinessApplication = sequelize.define('IrBusinessApplication', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        org_id: { type: DataTypes.UUID, allowNull: false },
        reference: { type: DataTypes.STRING(20), allowNull: false, unique: true },

        // --- Company identity -------------------------------------------------
        legal_name: { type: DataTypes.STRING(300), allowNull: false },
        trade_name: { type: DataTypes.STRING(300) },
        entity_type: { type: DataTypes.STRING(60), allowNull: false },
        incorporation_country: { type: DataTypes.STRING(100), allowNull: false },
        incorporation_date: { type: DataTypes.DATEONLY },
        registration_number: { type: DataTypes.STRING(120) }, // CIN / company number

        // --- Primary contact --------------------------------------------------
        contact_name: { type: DataTypes.STRING(200), allowNull: false },
        contact_email: { type: DataTypes.STRING(255), allowNull: false },
        contact_phone: { type: DataTypes.STRING(40) },
        website: { type: DataTypes.STRING(255) },

        // --- Registered address ----------------------------------------------
        address_line1: { type: DataTypes.STRING(255) },
        address_line2: { type: DataTypes.STRING(255) },
        city: { type: DataTypes.STRING(120) },
        state_region: { type: DataTypes.STRING(120) },
        postal_code: { type: DataTypes.STRING(40) },
        country: { type: DataTypes.STRING(100) },

        // --- Trade & tax registrations (IEC / GST / VAT / PAN) ----------------
        iec_code: { type: DataTypes.STRING(20) },   // Importer Exporter Code
        gstin: { type: DataTypes.STRING(20) },      // GST identification number
        vat_number: { type: DataTypes.STRING(40) }, // VAT registration number
        pan: { type: DataTypes.STRING(20) },        // Permanent Account Number

        // --- KYC --------------------------------------------------------------
        // not_started | pending | verified | rejected
        kyc_status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'pending' },
        authorized_signatory_name: { type: DataTypes.STRING(200) },
        authorized_signatory_email: { type: DataTypes.STRING(255) },
        authorized_signatory_id_type: { type: DataTypes.STRING(40) },
        authorized_signatory_id_number: { type: DataTypes.STRING(120) },
        // [{ name, ownership_pct, nationality, id_type, id_number }]
        beneficial_owners: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },

        // --- Approval workflow ------------------------------------------------
        // draft | submitted | under_review | approved | rejected
        status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'submitted' },
        review_note: { type: DataTypes.TEXT },
        reviewed_by: { type: DataTypes.STRING(120) },
        reviewed_at: { type: DataTypes.DATE },
        submitted_at: { type: DataTypes.DATE },
    }, {
        schema: 'ir',
        tableName: 'ir_business_applications',
        underscored: true,
        timestamps: true,
    });

    // Logical relation only (constraints:false) — keeps sequelize.sync({alter:false})
    // free of FK create-ordering surprises while still enabling eager `include`.
    IrBusinessApplication.associate = (db) => {
        IrBusinessApplication.hasMany(db.IrBusinessDocument, {
            foreignKey: 'application_id',
            as: 'documents',
            constraints: false,
        });
    };

    return IrBusinessApplication;
};
