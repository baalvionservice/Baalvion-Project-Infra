'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('students', {
    id:              { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    college_id:      { type: DataTypes.INTEGER },
    name:            { type: DataTypes.STRING(200), allowNull: false },
    email:           { type: DataTypes.STRING(255), unique: true, allowNull: false },
    phone:           { type: DataTypes.STRING(30) },
    course:          { type: DataTypes.STRING(200) },
    degree:          { type: DataTypes.STRING(100) },
    graduation_year: { type: DataTypes.INTEGER },
    cgpa:            { type: DataTypes.DECIMAL(4, 2) },
    is_placed:       { type: DataTypes.BOOLEAN, defaultValue: false },
    status:          { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
    ai_score:        { type: DataTypes.DECIMAL(5, 2) },
    verified:        { type: DataTypes.BOOLEAN, defaultValue: false },
    company:         { type: DataTypes.STRING(200) },
    role:            { type: DataTypes.STRING(200) },
    documents:       { type: DataTypes.JSONB, defaultValue: {} },
    skills:          { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
    metadata:        { type: DataTypes.JSONB, defaultValue: {} },
}, { schema: 'jobs', tableName: 'students' });
