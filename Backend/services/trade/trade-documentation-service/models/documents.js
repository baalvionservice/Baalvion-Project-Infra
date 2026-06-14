'use strict';
module.exports = (sequelize, DataTypes) => {
    const Document = sequelize.define('Document', {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        org_id: { type: DataTypes.TEXT, allowNull: false },
        order_id: { type: DataTypes.TEXT },
        doc_type: {
            type: DataTypes.ENUM('commercial_invoice', 'packing_list', 'bill_of_lading', 'certificate_of_origin', 'lc', 'inspection_cert'),
            allowNull: false,
        },
        status: { type: DataTypes.ENUM('draft', 'issued', 'signed', 'void'), defaultValue: 'draft' },
        version: { type: DataTypes.INTEGER, defaultValue: 1 },
        storage_key: { type: DataTypes.TEXT },
        checksum: { type: DataTypes.TEXT },
        issued_at: { type: DataTypes.DATE },
        issued_by: { type: DataTypes.TEXT },
        metadata: { type: DataTypes.JSONB, defaultValue: {} },
    }, { schema: 'tradedoc', tableName: 'documents', underscored: true, timestamps: true });
    Document.associate = (db) => { Document.hasMany(db.Signature, { foreignKey: 'document_id', as: 'signatures' }); };
    return Document;
};
