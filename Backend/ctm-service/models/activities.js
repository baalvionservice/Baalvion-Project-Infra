'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('activities', {
    id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id:       { type: DataTypes.BIGINT },
    company_id:    { type: DataTypes.UUID },
    action:        { type: DataTypes.STRING(200), allowNull: false },
    resource_type: { type: DataTypes.STRING(100) },
    resource_id:   { type: DataTypes.STRING(200) },
    description:   { type: DataTypes.TEXT },
    metadata:      { type: DataTypes.JSONB, defaultValue: {} },
    ip_address:    { type: DataTypes.STRING(45) },
}, { schema: 'ctm', tableName: 'activities' });
