'use strict';
// Aligned to the live `ir.ir_documents` table (document_type not category; file_url not
// document_url; file_size_bytes; uploaded_by; year; no tags column).
module.exports = (sequelize, DataTypes) => {
    const IrDocument = sequelize.define('IrDocument', {
        id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
        org_id: { type: DataTypes.UUID, allowNull: false },
        uploaded_by: { type: DataTypes.BIGINT },
        title: { type: DataTypes.STRING(500), allowNull: false },
        document_type: { type: DataTypes.STRING },
        description: { type: DataTypes.TEXT },
        file_url: { type: DataTypes.TEXT, allowNull: false },
        file_size_bytes: { type: DataTypes.BIGINT },
        mime_type: { type: DataTypes.STRING(100) },
        language: { type: DataTypes.STRING(10), defaultValue: 'en' },
        year: { type: DataTypes.INTEGER },
        is_public: { type: DataTypes.BOOLEAN, defaultValue: true },
        downloads_count: { type: DataTypes.INTEGER, defaultValue: 0 },
        published_at: { type: DataTypes.DATE },
    }, {
        schema: 'ir',
        tableName: 'ir_documents',
        underscored: true,
        timestamps: true,
    });
    return IrDocument;
};
