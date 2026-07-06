'use strict';
// Product & Certificate Verification — quality/safety/product certificates +
// country of origin, optionally classified against the existing HS Code
// Intelligence Engine (Phase 2 Trust/Verification/Compliance Foundation, migration
// 032).
module.exports = (sequelize, DataTypes) => {
    const CERTIFICATE_TYPES = ['quality', 'safety', 'product', 'other'];
    const STATUSES = ['submitted', 'under_review', 'approved', 'rejected', 'expired'];

    const ProductCertificate = sequelize.define('ProductCertificate', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        org_id: { type: DataTypes.INTEGER, allowNull: false },
        product_name: { type: DataTypes.TEXT, allowNull: false },
        hs_code_id: { type: DataTypes.UUID },
        certificate_type: { type: DataTypes.TEXT, allowNull: false, validate: { isIn: [CERTIFICATE_TYPES] } },
        country_of_origin: { type: DataTypes.TEXT },
        document_id: { type: DataTypes.UUID },
        issued_at: { type: DataTypes.DATE },
        expires_at: { type: DataTypes.DATE },
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
        tableName: 'product_certificates',
        underscored: true,
        timestamps: true,
        paranoid: true,
        deletedAt: 'deleted_at',
        version: true,
    });

    ProductCertificate.CERTIFICATE_TYPES = CERTIFICATE_TYPES;
    ProductCertificate.STATUSES = STATUSES;

    ProductCertificate.associate = (db) => {
        ProductCertificate.belongsTo(db.Organization, { as: 'organization', foreignKey: 'org_id', constraints: false });
        ProductCertificate.belongsTo(db.HsCode, { as: 'hsCode', foreignKey: 'hs_code_id', constraints: false });
        ProductCertificate.belongsTo(db.TradeDocument, { as: 'document', foreignKey: 'document_id', constraints: false });
    };

    return ProductCertificate;
};
