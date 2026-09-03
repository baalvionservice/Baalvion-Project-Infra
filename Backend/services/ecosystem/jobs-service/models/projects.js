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
    // Marketplace fields. `is_public` is opt-in: a project is org-private until
    // someone publishes it, so enabling the marketplace never exposes existing work.
    is_public:       { type: DataTypes.BOOLEAN, defaultValue: false },
    published_at:    { type: DataTypes.DATE, allowNull: true },
    slug:            { type: DataTypes.STRING(180), allowNull: true, unique: true },
    summary:         { type: DataTypes.TEXT, allowNull: true },
    // Whether the poster wants one person, an assembled team, or doesn't mind.
    collaboration_mode: {
        type: DataTypes.STRING(16), defaultValue: 'either',
        validate: { isIn: [['solo', 'team', 'either']] },
    },
    applications_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    deadline:        { type: DataTypes.DATEONLY, allowNull: true },
}, { schema: 'jobs', tableName: 'projects', underscored: true, timestamps: true });
