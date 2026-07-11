'use strict';
module.exports = (sequelize, DataTypes) => {
    const VerificationDocument = sequelize.define('VerificationDocument', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        lawyer_id: { type: DataTypes.INTEGER, allowNull: false },
        // bar_council_certificate | government_id | professional_certificate | selfie
        doc_type: { type: DataTypes.STRING(40), allowNull: false },
        // MinIO object key (never a public URL) — resolved via a presigned URL on review.
        storage_key: { type: DataTypes.TEXT, allowNull: false },
        status: {
            type: DataTypes.ENUM('pending', 'verified', 'rejected'),
            defaultValue: 'pending',
        },
        reviewed_by: { type: DataTypes.TEXT },
        review_notes: { type: DataTypes.TEXT },
        reviewed_at: { type: DataTypes.DATE },
    }, {
        schema: 'legal',
        tableName: 'verification_documents',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    });

    VerificationDocument.associate = (db) => {
        VerificationDocument.belongsTo(db.Lawyer, { foreignKey: 'lawyer_id', as: 'lawyer' });
    };

    return VerificationDocument;
};
