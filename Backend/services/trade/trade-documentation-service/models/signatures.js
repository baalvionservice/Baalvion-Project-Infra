'use strict';
module.exports = (sequelize, DataTypes) => sequelize.define('Signature', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    org_id: { type: DataTypes.TEXT, allowNull: false },
    document_id: { type: DataTypes.UUID, allowNull: false },
    signer_id: { type: DataTypes.TEXT, allowNull: false },
    signature: { type: DataTypes.TEXT, allowNull: false },
    signed_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { schema: 'tradedoc', tableName: 'signatures', underscored: true, timestamps: false });
