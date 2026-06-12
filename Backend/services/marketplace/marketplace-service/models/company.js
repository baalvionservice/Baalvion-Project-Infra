'use strict';
module.exports = (sequelize, DataTypes) => sequelize.define('Company', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    org_id: { type: DataTypes.UUID, allowNull: false },
    legal_name: { type: DataTypes.STRING(300), allowNull: false },
    brand_name: { type: DataTypes.STRING(300) },
    registration_no: { type: DataTypes.STRING(60) },
    country: { type: DataTypes.STRING(2) },
    industry_code: { type: DataTypes.STRING(40) },
    stage: { type: DataTypes.STRING(20), defaultValue: 'startup' },
    website: { type: DataTypes.STRING(300) },
    status: { type: DataTypes.STRING(20), defaultValue: 'draft' },
    kyc_status: { type: DataTypes.STRING(20), defaultValue: 'pending' },
    created_by: { type: DataTypes.STRING(120) },
}, { schema: 'marketplace', tableName: 'companies', underscored: true, timestamps: true });
