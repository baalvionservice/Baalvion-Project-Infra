'use strict';
// Company Verification — workflow wrapper around an org's legal profile, 1:1 with
// trade.organizations (Phase 2 Trust/Verification/Compliance Foundation, migration
// 027). registered_address_id/operational_address_id reference
// tradeops.verified_addresses once migration 028 adds that table + the FK.
module.exports = (sequelize, DataTypes) => {
    const STATUSES = ['submitted', 'under_review', 'approved', 'rejected', 'expired'];

    const CompanyVerification = sequelize.define('CompanyVerification', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        org_id: { type: DataTypes.INTEGER, allowNull: false },
        legal_company_name: { type: DataTypes.TEXT },
        registration_number: { type: DataTypes.TEXT },
        incorporation_date: { type: DataTypes.DATEONLY },
        business_type: { type: DataTypes.TEXT },
        registered_address_id: { type: DataTypes.UUID },
        operational_address_id: { type: DataTypes.UUID },
        company_website: { type: DataTypes.TEXT },
        authorized_representative_user_id: { type: DataTypes.INTEGER },
        status: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'submitted', validate: { isIn: [STATUSES] } },
        submitted_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        reviewed_by: { type: DataTypes.TEXT },
        reviewed_at: { type: DataTypes.DATE },
        rejection_reason: { type: DataTypes.TEXT },
        renewal_due_at: { type: DataTypes.DATE },
        metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        created_by: { type: DataTypes.TEXT },
        updated_by: { type: DataTypes.TEXT },
        deleted_by: { type: DataTypes.TEXT },
    }, {
        schema: 'tradeops',
        tableName: 'company_verifications',
        underscored: true,
        timestamps: true,
        paranoid: true,
        deletedAt: 'deleted_at',
        version: true,
    });

    CompanyVerification.STATUSES = STATUSES;

    CompanyVerification.associate = (db) => {
        CompanyVerification.belongsTo(db.Organization, { as: 'organization', foreignKey: 'org_id', constraints: false });
        CompanyVerification.belongsTo(db.User, { as: 'authorizedRepresentative', foreignKey: 'authorized_representative_user_id', constraints: false });
        CompanyVerification.belongsTo(db.VerifiedAddress, { as: 'registeredAddress', foreignKey: 'registered_address_id', constraints: false });
        CompanyVerification.belongsTo(db.VerifiedAddress, { as: 'operationalAddress', foreignKey: 'operational_address_id', constraints: false });
    };

    return CompanyVerification;
};
