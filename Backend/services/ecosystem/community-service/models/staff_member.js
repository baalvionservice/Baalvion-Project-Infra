'use strict';
const { DataTypes } = require('sequelize');

// Staff granted by a super admin from the console. 'super' is deliberately NOT grantable here:
// super admins come only from the platform role in the login token (super_admin / platform_admin),
// so nobody can escalate to it by editing a row.
module.exports = (sequelize) => sequelize.define('StaffMember', {
    user_id: { type: DataTypes.STRING(64), primaryKey: true },
    tier: { type: DataTypes.ENUM('admin', 'moderator'), allowNull: false },
    label: { type: DataTypes.STRING(160), allowNull: true },
    granted_by: { type: DataTypes.STRING(64), allowNull: false },
}, { tableName: 'staff_members', schema: 'community', underscored: true, timestamps: true });
