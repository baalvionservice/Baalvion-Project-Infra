'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('EduTeacher', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    display_name: { type: DataTypes.STRING(120), allowNull: false },
    subject: { type: DataTypes.STRING(120), allowNull: false },
    bio: { type: DataTypes.STRING(400), allowNull: false },
    long_bio: { type: DataTypes.TEXT, allowNull: true },
    region_id: { type: DataTypes.STRING(20), allowNull: false },
    country: { type: DataTypes.STRING(80), allowNull: false },
    price_note: { type: DataTypes.STRING(120), allowNull: true },
    avatar_url: { type: DataTypes.STRING(600), allowNull: true },
    tags: { type: DataTypes.ARRAY(DataTypes.STRING(40)), allowNull: false, defaultValue: [] },
    skills: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    education: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    status: { type: DataTypes.ENUM('pending', 'active', 'rejected', 'suspended'), allowNull: false, defaultValue: 'pending' },
    review_note: { type: DataTypes.STRING(500), allowNull: true },
    reviewed_by: { type: DataTypes.STRING(64), allowNull: true },
    reviewed_at: { type: DataTypes.DATE, allowNull: true },
}, {
    tableName: 'edu_teachers', schema: 'community', underscored: true, timestamps: true,
    indexes: [{ fields: ['status'] }, { fields: ['subject'] }, { fields: ['region_id'] }],
});
