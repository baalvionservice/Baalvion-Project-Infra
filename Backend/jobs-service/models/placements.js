'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('placements', {
    id:                  { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    student_id:          { type: DataTypes.INTEGER, allowNull: false },
    college_id:          { type: DataTypes.INTEGER },
    company_name:        { type: DataTypes.STRING(200), allowNull: false },
    role:                { type: DataTypes.STRING(200), allowNull: false },
    package_lpa:         { type: DataTypes.DECIMAL(8, 2) },
    offer_letter_url:    { type: DataTypes.TEXT },
    joining_date:        { type: DataTypes.DATEONLY },
    approved:            { type: DataTypes.BOOLEAN, defaultValue: false },
    verified_by_admin_id:{ type: DataTypes.INTEGER },
    audit_logs:          { type: DataTypes.JSONB, defaultValue: [] },
}, { schema: 'jobs', tableName: 'placements' });
