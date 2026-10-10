'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('EduEnrollment', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    session_id: { type: DataTypes.UUID, allowNull: false },
    student_id: { type: DataTypes.UUID, allowNull: false },
    student_label: { type: DataTypes.STRING(80), allowNull: true },
    note: { type: DataTypes.STRING(1000), allowNull: true },
    status: { type: DataTypes.ENUM('requested', 'approved', 'declined', 'cancelled'), allowNull: false, defaultValue: 'requested' },
}, {
    tableName: 'edu_enrollments', schema: 'community', underscored: true, timestamps: true,
    indexes: [{ unique: true, fields: ['session_id', 'student_id'] }, { fields: ['student_id'] }],
});
