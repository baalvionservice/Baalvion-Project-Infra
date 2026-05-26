'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('colleges', {
    id:            { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name:          { type: DataTypes.STRING(200), allowNull: false },
    city:          { type: DataTypes.STRING(100) },
    state:         { type: DataTypes.STRING(100) },
    country:       { type: DataTypes.STRING(100), defaultValue: 'India' },
    accreditation: { type: DataTypes.STRING(20) },
    website:       { type: DataTypes.STRING(500) },
    contact_email: { type: DataTypes.STRING(255) },
    contact_phone: { type: DataTypes.STRING(30) },
    is_active:     { type: DataTypes.BOOLEAN, defaultValue: true },
    metadata:      { type: DataTypes.JSONB, defaultValue: {} },
}, { schema: 'jobs', tableName: 'colleges' });
