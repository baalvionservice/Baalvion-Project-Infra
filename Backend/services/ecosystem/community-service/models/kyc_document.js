'use strict';
const { DataTypes } = require('sequelize');

// Ciphertext only. AES-256-GCM, a fresh 12-byte IV per file, auth tag stored alongside.
module.exports = (sequelize) => sequelize.define('KycDocument', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    verification_id: { type: DataTypes.UUID, allowNull: false },
    kind: { type: DataTypes.ENUM('id', 'selfie'), allowNull: false },
    mime: { type: DataTypes.STRING(40), allowNull: false },
    size_bytes: { type: DataTypes.INTEGER, allowNull: false },
    iv: { type: DataTypes.BLOB, allowNull: false },
    auth_tag: { type: DataTypes.BLOB, allowNull: false },
    ciphertext: { type: DataTypes.BLOB, allowNull: false },
}, {
    tableName: 'kyc_documents', schema: 'community', underscored: true, timestamps: true, updatedAt: false,
    indexes: [{ unique: true, fields: ['verification_id', 'kind'] }],
});
