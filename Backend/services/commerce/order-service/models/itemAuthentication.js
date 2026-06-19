'use strict';
module.exports = function(sequelize, DataTypes) {
    return sequelize.define('ItemAuthentication', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        consignmentItemId: { type: DataTypes.UUID, allowNull: false },
        consignmentRequestId: { type: DataTypes.UUID, allowNull: false },
        storeId: { type: DataTypes.UUID, allowNull: false },
        status: { type: DataTypes.ENUM('pending', 'in_review', 'authenticated', 'rejected'), defaultValue: 'pending' },
        authenticatorId: { type: DataTypes.BIGINT, allowNull: true },
        authenticatorName: { type: DataTypes.STRING(200), allowNull: true },
        method: { type: DataTypes.STRING(100), allowNull: true },
        findings: { type: DataTypes.TEXT, allowNull: true },
        confidence: { type: DataTypes.ENUM('high', 'medium', 'low'), allowNull: true },
        photoUrls: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        decidedAt: { type: DataTypes.DATE, allowNull: true },
    }, { schema: 'orders', underscored: true, timestamps: true, tableName: 'consignment_authentications' });
};
