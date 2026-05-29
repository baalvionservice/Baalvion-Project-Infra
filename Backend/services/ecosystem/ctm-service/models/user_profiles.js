'use strict';
const { DataTypes } = require('sequelize');

// CTM-side projection of an identity-service user. Keyed by the canonical
// identity user id (BIGINT — matches submissions.user_id / companies.owner_user_id).
// Lazily upserted from verified JWT claims, enriched by profile edits. Holds the
// CTM-specific profile + cached performance used by leaderboards and public profiles.
module.exports = (sequelize) => sequelize.define('user_profiles', {
    user_id:         { type: DataTypes.BIGINT, primaryKey: true },
    name:            { type: DataTypes.STRING(200) },
    email:           { type: DataTypes.STRING(320) },
    role:            { type: DataTypes.ENUM('candidate', 'company', 'admin'), defaultValue: 'candidate' },
    company_id:      { type: DataTypes.UUID },
    avatar_url:      { type: DataTypes.TEXT },
    bio:             { type: DataTypes.TEXT },
    location:        { type: DataTypes.STRING(200) },
    experience_level:{ type: DataTypes.ENUM('Beginner', 'Intermediate', 'Advanced', 'Expert') },
    skills:          { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
    github_url:      { type: DataTypes.STRING(500) },
    linkedin_url:    { type: DataTypes.STRING(500) },
    portfolio_links: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
    is_active:       { type: DataTypes.BOOLEAN, defaultValue: true },
    is_verified:     { type: DataTypes.BOOLEAN, defaultValue: false },
    consent_accepted:    { type: DataTypes.BOOLEAN, defaultValue: false },
    consent_accepted_at: { type: DataTypes.DATE },
    onboarding_completed:           { type: DataTypes.BOOLEAN, defaultValue: false },
    candidate_onboarding_completed: { type: DataTypes.BOOLEAN, defaultValue: false },
    ranking:         { type: DataTypes.INTEGER },
    metadata:        { type: DataTypes.JSONB, defaultValue: {} },
}, { schema: 'ctm', tableName: 'user_profiles' });
