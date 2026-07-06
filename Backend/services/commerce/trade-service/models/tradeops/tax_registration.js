'use strict';
// Tax Verification — an org's tax identifiers keyed against the country-
// configurable tax_id_types catalog (Phase 2 Trust/Verification/Compliance
// Foundation, migration 028).
module.exports = (sequelize, DataTypes) => {
    const STATUSES = ['submitted', 'under_review', 'approved', 'rejected', 'expired'];

    const TaxRegistration = sequelize.define('TaxRegistration', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        org_id: { type: DataTypes.INTEGER, allowNull: false },
        tax_id_type_id: { type: DataTypes.UUID, allowNull: false },
        tax_id_value: { type: DataTypes.TEXT, allowNull: false },
        document_id: { type: DataTypes.UUID },
        status: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'submitted', validate: { isIn: [STATUSES] } },
        verified_at: { type: DataTypes.DATE },
        expires_at: { type: DataTypes.DATE },
        reviewed_by: { type: DataTypes.TEXT },
        reviewed_at: { type: DataTypes.DATE },
        rejection_reason: { type: DataTypes.TEXT },
        metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        created_by: { type: DataTypes.TEXT },
        updated_by: { type: DataTypes.TEXT },
        deleted_by: { type: DataTypes.TEXT },
    }, {
        schema: 'tradeops',
        tableName: 'tax_registrations',
        underscored: true,
        timestamps: true,
        paranoid: true,
        deletedAt: 'deleted_at',
        version: true,
    });

    TaxRegistration.STATUSES = STATUSES;

    TaxRegistration.associate = (db) => {
        TaxRegistration.belongsTo(db.Organization, { as: 'organization', foreignKey: 'org_id', constraints: false });
        TaxRegistration.belongsTo(db.TaxIdType, { as: 'taxIdType', foreignKey: 'tax_id_type_id', constraints: false });
        TaxRegistration.belongsTo(db.TradeDocument, { as: 'document', foreignKey: 'document_id', constraints: false });
    };

    return TaxRegistration;
};
