'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Attendance', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    employee_id: { type: DataTypes.INTEGER, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'present', validate: { isIn: [['present', 'absent', 'late', 'on_leave']] } },
    hours_worked: { type: DataTypes.DECIMAL(4, 2), allowNull: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
}, { schema: 'dashboard', tableName: 'attendance', underscored: true, timestamps: true });
