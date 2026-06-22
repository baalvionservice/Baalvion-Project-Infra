'use strict';
// A document attached to a business onboarding application (certificate of incorporation,
// GST/IEC/VAT certificate, signatory ID, address proof, …). Each row carries its own
// verification lifecycle so a reviewer can clear documents independently.
//
// NOTE ON STORAGE: `file_url` holds wherever the bytes live. In this self-contained service
// that is either an external https URL or an inline data: URI captured by the onboarding UI
// (size-capped client-side). For production, swap to object storage + presigned URLs and keep
// only the resulting URL here — the column type (TEXT) already accommodates that.
module.exports = (sequelize, DataTypes) => {
    const IrBusinessDocument = sequelize.define('IrBusinessDocument', {
        id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
        application_id: { type: DataTypes.INTEGER, allowNull: false },
        org_id: { type: DataTypes.UUID, allowNull: false },
        document_type: { type: DataTypes.STRING(60), allowNull: false },
        title: { type: DataTypes.STRING(300), allowNull: false },
        file_url: { type: DataTypes.TEXT, allowNull: false },
        file_name: { type: DataTypes.STRING(300) },
        file_size_bytes: { type: DataTypes.BIGINT },
        mime_type: { type: DataTypes.STRING(120) },
        // pending | verified | rejected
        status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'pending' },
        review_note: { type: DataTypes.TEXT },
        uploaded_by: { type: DataTypes.BIGINT },
    }, {
        schema: 'ir',
        tableName: 'ir_business_documents',
        underscored: true,
        timestamps: true,
        indexes: [{ fields: ['application_id'] }],
    });

    IrBusinessDocument.associate = (db) => {
        IrBusinessDocument.belongsTo(db.IrBusinessApplication, {
            foreignKey: 'application_id',
            as: 'application',
            constraints: false,
        });
    };

    return IrBusinessDocument;
};
