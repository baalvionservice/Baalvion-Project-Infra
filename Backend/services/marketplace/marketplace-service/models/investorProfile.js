'use strict';
module.exports = (sequelize, DataTypes) => sequelize.define('InvestorProfile', {
    investor_id: { type: DataTypes.UUID, primaryKey: true },
    thesis: { type: DataTypes.TEXT },
    aum_band: { type: DataTypes.STRING(40) },
    website: { type: DataTypes.STRING(300) },
    contact_email: { type: DataTypes.STRING(255) },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { schema: 'marketplace', tableName: 'investor_profiles', underscored: true, timestamps: false });
