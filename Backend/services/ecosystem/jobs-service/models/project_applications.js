'use strict';
const { DataTypes } = require('sequelize');

/**
 * Someone bidding to do a project — alone, or with a team they've brought.
 *
 * `team_members` holds named collaborators inline rather than as portal accounts:
 * they're people on this proposal, and creating user records for them would invent
 * identities nobody has consented to. The lead is the one we correspond with.
 */
module.exports = (sequelize) => sequelize.define('ProjectApplication', {
    id:                { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    project_id:        { type: DataTypes.BIGINT, allowNull: false },
    org_id:            { type: DataTypes.UUID, allowNull: false },
    lead_candidate_id: { type: DataTypes.BIGINT, allowNull: false },
    mode:              { type: DataTypes.STRING(8), allowNull: false, validate: { isIn: [['solo', 'team']] } },
    team_name:         { type: DataTypes.STRING(160), allowNull: true },
    team_members:      { type: DataTypes.JSONB, defaultValue: [] },
    role_applied:      { type: DataTypes.STRING(160), allowNull: true },
    pitch:             { type: DataTypes.TEXT, allowNull: false },
    portfolio_url:     { type: DataTypes.TEXT, allowNull: true },
    expected_rate:     { type: DataTypes.BIGINT, allowNull: true },
    currency:          { type: DataTypes.STRING(10), allowNull: true },
    availability:      { type: DataTypes.STRING(120), allowNull: true },
    status: {
        type: DataTypes.STRING(16), defaultValue: 'submitted',
        validate: { isIn: [['submitted', 'shortlisted', 'accepted', 'rejected', 'withdrawn']] },
    },
}, { schema: 'jobs', tableName: 'project_applications', underscored: true, timestamps: true });
