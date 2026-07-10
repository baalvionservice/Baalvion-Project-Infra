'use strict';
module.exports = (sequelize, DataTypes) => sequelize.define('InvestorInvitation', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    org_id: { type: DataTypes.UUID, allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false },
    investor_type: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'angel' },
    note: { type: DataTypes.TEXT },
    token: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'pending' },
    invited_by: { type: DataTypes.STRING(120) },
    invited_by_name: { type: DataTypes.STRING(200) },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    accepted_at: { type: DataTypes.DATE },
}, { schema: 'marketplace', tableName: 'investor_invitations', underscored: true, timestamps: true });
