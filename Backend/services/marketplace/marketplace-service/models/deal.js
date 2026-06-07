'use strict';
module.exports = (sequelize, DataTypes) => sequelize.define('Deal', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    org_id_company: { type: DataTypes.UUID, allowNull: false },
    org_id_investor: { type: DataTypes.UUID, allowNull: false },
    opportunity_id: { type: DataTypes.UUID },
    lead_investor_id: { type: DataTypes.UUID },
    status: { type: DataTypes.STRING(20), defaultValue: 'open' },
}, { schema: 'marketplace', tableName: 'deals', underscored: true, timestamps: true });
