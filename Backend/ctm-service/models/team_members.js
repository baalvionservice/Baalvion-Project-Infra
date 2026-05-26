'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('team_members', {
    id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    team_id:   { type: DataTypes.UUID, allowNull: false },
    user_id:   { type: DataTypes.BIGINT, allowNull: false },
    role:      { type: DataTypes.ENUM('owner', 'admin', 'member'), defaultValue: 'member' },
    joined_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { schema: 'ctm', tableName: 'team_members' });
