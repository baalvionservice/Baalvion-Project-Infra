'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('teams', {
    id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    company_id:  { type: DataTypes.UUID, allowNull: false },
    name:        { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT },
    is_active:   { type: DataTypes.BOOLEAN, defaultValue: true },
}, { schema: 'ctm', tableName: 'teams' });
