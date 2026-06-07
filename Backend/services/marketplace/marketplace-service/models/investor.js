'use strict';
module.exports = (sequelize, DataTypes) => sequelize.define('Investor', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    org_id: { type: DataTypes.UUID, allowNull: false },
    type: { type: DataTypes.STRING(20), allowNull: false },
    legal_name: { type: DataTypes.STRING(300), allowNull: false },
    country: { type: DataTypes.STRING(2) },
    status: { type: DataTypes.STRING(20), defaultValue: 'pending' },
    kyc_status: { type: DataTypes.STRING(20), defaultValue: 'pending' },
    aml_status: { type: DataTypes.STRING(20), defaultValue: 'pending' },
    accreditation_status: { type: DataTypes.STRING(20), defaultValue: 'pending' },
    created_by: { type: DataTypes.STRING(120) },
}, { schema: 'marketplace', tableName: 'investors', underscored: true, timestamps: true });
