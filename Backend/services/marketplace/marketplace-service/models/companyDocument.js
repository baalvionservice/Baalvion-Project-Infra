'use strict';
module.exports = (sequelize, DataTypes) => sequelize.define('CompanyDocument', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    company_id: { type: DataTypes.UUID, allowNull: false },
    type: { type: DataTypes.STRING(30), allowNull: false },
    file_url: { type: DataTypes.STRING(600), allowNull: false },
    file_size: { type: DataTypes.BIGINT },
    mime: { type: DataTypes.STRING(120) },
    visibility: { type: DataTypes.STRING(20), defaultValue: 'private' },
    uploaded_by: { type: DataTypes.STRING(120) },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { schema: 'marketplace', tableName: 'company_documents', underscored: true, timestamps: false });
