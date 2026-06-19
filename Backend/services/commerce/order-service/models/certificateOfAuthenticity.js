'use strict';
module.exports = function(sequelize, DataTypes) {
    return sequelize.define('CertificateOfAuthenticity', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        consignmentItemId: { type: DataTypes.UUID, allowNull: false },
        itemAuthenticationId: { type: DataTypes.UUID, allowNull: true },
        storeId: { type: DataTypes.UUID, allowNull: false },
        productId: { type: DataTypes.UUID, allowNull: true },
        // Public verification code (COA-XXXX). Unique across the table.
        code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
        serialNumber: { type: DataTypes.STRING(120), allowNull: true },
        brand: { type: DataTypes.STRING(120), allowNull: true },
        model: { type: DataTypes.STRING(200), allowNull: true },
        conditionGrade: { type: DataTypes.STRING(50), allowNull: true },
        issuedBy: { type: DataTypes.BIGINT, allowNull: true },
        issuerName: { type: DataTypes.STRING(200), allowNull: true },
        issuedAt: { type: DataTypes.DATE, allowNull: true },
        status: { type: DataTypes.ENUM('valid', 'revoked'), defaultValue: 'valid' },
        revokedReason: { type: DataTypes.STRING(500), allowNull: true },
        // sha256 of the canonical certificate fields — tamper/integrity check on public verify.
        verificationHash: { type: DataTypes.STRING(64), allowNull: true },
    }, { schema: 'orders', underscored: true, timestamps: true, tableName: 'consignment_certificates' });
};
