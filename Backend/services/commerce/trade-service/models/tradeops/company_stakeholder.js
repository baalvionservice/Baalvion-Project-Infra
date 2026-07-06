'use strict';
// Company Stakeholders — directors/owners/shareholders/authorized signatories
// (Phase 2 Trust/Verification/Compliance Foundation, migration 027).
module.exports = (sequelize, DataTypes) => {
    const ROLES = ['director', 'owner', 'shareholder', 'authorized_signatory'];
    const STATUSES = ['submitted', 'under_review', 'approved', 'rejected', 'expired'];

    const CompanyStakeholder = sequelize.define('CompanyStakeholder', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        org_id: { type: DataTypes.INTEGER, allowNull: false },
        person_name: { type: DataTypes.TEXT, allowNull: false },
        role: { type: DataTypes.TEXT, allowNull: false, validate: { isIn: [ROLES] } },
        ownership_percentage: { type: DataTypes.DECIMAL(5, 2) },
        identity_verification_id: { type: DataTypes.UUID },
        status: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'submitted', validate: { isIn: [STATUSES] } },
        reviewed_by: { type: DataTypes.TEXT },
        reviewed_at: { type: DataTypes.DATE },
        rejection_reason: { type: DataTypes.TEXT },
        metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        created_by: { type: DataTypes.TEXT },
        updated_by: { type: DataTypes.TEXT },
        deleted_by: { type: DataTypes.TEXT },
    }, {
        schema: 'tradeops',
        tableName: 'company_stakeholders',
        underscored: true,
        timestamps: true,
        paranoid: true,
        deletedAt: 'deleted_at',
        version: true,
    });

    CompanyStakeholder.ROLES = ROLES;
    CompanyStakeholder.STATUSES = STATUSES;

    CompanyStakeholder.associate = (db) => {
        CompanyStakeholder.belongsTo(db.Organization, { as: 'organization', foreignKey: 'org_id', constraints: false });
        CompanyStakeholder.belongsTo(db.IdentityVerification, { as: 'identityVerification', foreignKey: 'identity_verification_id', constraints: false });
    };

    return CompanyStakeholder;
};
