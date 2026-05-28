'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Employee', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false },
    role: { type: DataTypes.STRING(100), allowNull: true },
    department: { type: DataTypes.STRING(100), allowNull: true },
    business_id: { type: DataTypes.INTEGER, allowNull: true },
    country: { type: DataTypes.STRING(100), allowNull: true },
    status: { type: DataTypes.STRING(20), allowNull: true, defaultValue: 'active', validate: { isIn: [['active', 'inactive', 'on_leave']] } },
    employment_type: { type: DataTypes.STRING(20), allowNull: true, defaultValue: 'full_time', validate: { isIn: [['full_time', 'part_time', 'contractor']] } },
    join_date: { type: DataTypes.DATEONLY, allowNull: true },
    salary: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
    manager_id: { type: DataTypes.INTEGER, allowNull: true },
    performance_score: { type: DataTypes.DECIMAL(3, 1), allowNull: true },
    tasks_completed: { type: DataTypes.INTEGER, defaultValue: 0 },
    attendance_rate: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
}, { schema: 'dashboard', tableName: 'employees', underscored: true, timestamps: true });
