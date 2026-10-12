'use strict';
const { DataTypes } = require('sequelize');

// What a member chose to tell us about themselves. The photo is a media asset (restricted: owner, admins, verified employers).
module.exports = (sequelize) => sequelize.define('MemberProfile', {
    user_id: { type: DataTypes.STRING(64), primaryKey: true },
    photo_asset_id: { type: DataTypes.UUID, allowNull: true },
    bio: { type: DataTypes.STRING(300), allowNull: true },
    city: { type: DataTypes.STRING(80), allowNull: true },
    interests: { type: DataTypes.ARRAY(DataTypes.STRING(40)), allowNull: false, defaultValue: [] },
    gender: { type: DataTypes.STRING(12), allowNull: true },
    learn_goal: { type: DataTypes.STRING(500), allowNull: true },
}, {
    tableName: 'member_profiles',
    schema: 'community',
    underscored: true,
    timestamps: true,
});
