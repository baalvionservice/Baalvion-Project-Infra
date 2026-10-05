'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('EduReview', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    teacher_id: { type: DataTypes.UUID, allowNull: false },
    student_id: { type: DataTypes.STRING(64), allowNull: false },
    student_label: { type: DataTypes.STRING(80), allowNull: true },
    rating: { type: DataTypes.INTEGER, allowNull: false },
    comment: { type: DataTypes.STRING(1500), allowNull: true },
}, {
    tableName: 'edu_reviews', schema: 'community', underscored: true, timestamps: true,
    indexes: [{ unique: true, fields: ['teacher_id', 'student_id'] }],
});
