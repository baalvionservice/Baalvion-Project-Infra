'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Project', {
    id:              { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    org_id:          { type: DataTypes.UUID, allowNull: false },
    title:           { type: DataTypes.STRING(255), allowNull: false },
    description:     { type: DataTypes.TEXT, allowNull: true },
    category:        { type: DataTypes.STRING(100), allowNull: true },
    status: {
        type: DataTypes.STRING(32), defaultValue: 'OPEN',
        validate: { isIn: [['OPEN', 'ACTIVE', 'COMPLETED', 'DRAFT', 'GOVERNANCE_REVIEW']] },
    },
    required_skills: { type: DataTypes.ARRAY(DataTypes.TEXT), defaultValue: [] },
    budget:          { type: DataTypes.BIGINT, allowNull: true },
    currency:        { type: DataTypes.STRING(10), defaultValue: 'USD' },
    country:         { type: DataTypes.STRING(100), allowNull: true },
    owner:           { type: DataTypes.STRING(255), allowNull: true },
    client_id:       { type: DataTypes.STRING(100), allowNull: true },
    contractor_id:   { type: DataTypes.STRING(100), allowNull: true },
    start_date:      { type: DataTypes.DATEONLY, allowNull: true },
    end_date:        { type: DataTypes.DATEONLY, allowNull: true },
    max_team_size:   { type: DataTypes.INTEGER, allowNull: true },
    roles:           { type: DataTypes.JSONB, defaultValue: [] },
}, { schema: 'jobs', tableName: 'projects', underscored: true, timestamps: true });
