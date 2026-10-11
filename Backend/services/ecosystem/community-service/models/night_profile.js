'use strict';
const { DataTypes } = require('sequelize');

// A candidate's staffing profile. whatsapp is never serialised in directory responses; it is
// released one profile at a time to verified employers (see gigsService.revealContact).
module.exports = (sequelize) => sequelize.define('NightProfile', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    full_name: { type: DataTypes.STRING(120), allowNull: false },
    gender: { type: DataTypes.ENUM('Female', 'Male', 'Non-binary'), allowNull: false },
    age: { type: DataTypes.INTEGER, allowNull: false },
    height: { type: DataTypes.STRING(20), allowNull: true },
    instagram: { type: DataTypes.STRING(60), allowNull: false },
    zone: { type: DataTypes.STRING(80), allowNull: false },
    roles: { type: DataTypes.ARRAY(DataTypes.STRING(80)), allowNull: false, defaultValue: [] },
    services: { type: DataTypes.ARRAY(DataTypes.STRING(80)), allowNull: false, defaultValue: [] },
    perks: { type: DataTypes.ARRAY(DataTypes.STRING(80)), allowNull: false, defaultValue: [] },
    portrait_url: { type: DataTypes.STRING(600), allowNull: true },
    full_look_url: { type: DataTypes.STRING(600), allowNull: true },
    whatsapp: { type: DataTypes.STRING(32), allowNull: false },
    status: { type: DataTypes.ENUM('pending', 'verified', 'rejected'), allowNull: false, defaultValue: 'pending' },
    review_note: { type: DataTypes.STRING(500), allowNull: true },
    reviewed_by: { type: DataTypes.STRING(64), allowNull: true },
    reviewed_at: { type: DataTypes.DATE, allowNull: true },
}, {
    tableName: 'night_profiles',
    schema: 'community',
    underscored: true,
    timestamps: true,
    indexes: [{ fields: ['status'] }, { fields: ['zone'] }],
});
