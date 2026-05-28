'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('AuditLog', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
    action: { type: DataTypes.STRING(100), allowNull: false },
    entity_type: { type: DataTypes.STRING(100), allowNull: true },
    entity_id: { type: DataTypes.STRING(50), allowNull: true },
    user_id: { type: DataTypes.INTEGER, allowNull: true },
    user_name: { type: DataTypes.STRING(255), allowNull: true },
    role: { type: DataTypes.STRING(50), allowNull: true },
    resource: { type: DataTypes.STRING(255), allowNull: true },
    ip_address: { type: DataTypes.STRING(50), allowNull: true },
    location: { type: DataTypes.STRING(100), allowNull: true },
    status: { type: DataTypes.STRING(20), allowNull: true, defaultValue: 'Success', validate: { isIn: [['Success', 'Failed']] } },
    severity: { type: DataTypes.STRING(20), allowNull: true, defaultValue: 'Info', validate: { isIn: [['Critical', 'Warning', 'Info']] } },
    details: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
}, { schema: 'dashboard', tableName: 'audit_logs', underscored: true, timestamps: true, updatedAt: false });
