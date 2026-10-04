'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('EduSession', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    teacher_id: { type: DataTypes.UUID, allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    start_at: { type: DataTypes.DATE, allowNull: false },
    duration_min: { type: DataTypes.INTEGER, allowNull: false },
    capacity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 20 },
    meeting_url: { type: DataTypes.STRING(600), allowNull: false },
    status: { type: DataTypes.ENUM('scheduled', 'cancelled'), allowNull: false, defaultValue: 'scheduled' },
}, {
    tableName: 'edu_sessions', schema: 'community', underscored: true, timestamps: true,
    indexes: [{ fields: ['start_at', 'status'] }, { fields: ['teacher_id'] }],
});
