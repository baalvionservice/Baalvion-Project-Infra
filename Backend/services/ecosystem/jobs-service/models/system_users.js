'use strict';
const { DataTypes } = require('sequelize');

// ATS workspace team members (recruiters/interviewers/admins) — distinct from auth identities.
module.exports = (sequelize) => sequelize.define('SystemUser', {
    id:           { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    org_id:       { type: DataTypes.UUID, allowNull: false },
    auth_user_id: { type: DataTypes.BIGINT, allowNull: true },
    name:         { type: DataTypes.STRING(255), allowNull: false },
    email:        { type: DataTypes.STRING(255), allowNull: false },
    phone:        { type: DataTypes.STRING(30), allowNull: true },
    role: {
        type: DataTypes.STRING(32), defaultValue: 'RECRUITER',
        validate: { isIn: [['SUPER_ADMIN', 'ADMIN', 'RECRUITER', 'INTERVIEWER', 'FINANCE', 'CANDIDATE', 'CLIENT', 'CONTRACTOR', 'VIEWER']] },
    },
    status:       { type: DataTypes.STRING(16), defaultValue: 'active' },
}, { schema: 'jobs', tableName: 'system_users', underscored: true, timestamps: true });
