'use strict';
// company_profiles has only updated_at (no created_at) → manage timestamps manually.
module.exports = (sequelize, DataTypes) => sequelize.define('CompanyProfile', {
    company_id: { type: DataTypes.UUID, primaryKey: true },
    summary: { type: DataTypes.TEXT },
    problem: { type: DataTypes.TEXT },
    solution: { type: DataTypes.TEXT },
    traction_json: { type: DataTypes.JSONB, defaultValue: {} },
    team_size: { type: DataTypes.INTEGER },
    founded_year: { type: DataTypes.INTEGER },
    revenue_band: { type: DataTypes.STRING(40) },
    funding_raised: { type: DataTypes.DECIMAL(20, 2) },
    funding_target: { type: DataTypes.DECIMAL(20, 2) },
    valuation_target: { type: DataTypes.DECIMAL(20, 2) },
    deck_url: { type: DataTypes.STRING(500) },
    is_published: { type: DataTypes.BOOLEAN, defaultValue: false },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { schema: 'marketplace', tableName: 'company_profiles', underscored: true, timestamps: false });
