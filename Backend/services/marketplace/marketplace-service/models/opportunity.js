'use strict';
module.exports = (sequelize, DataTypes) => sequelize.define('Opportunity', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    org_id: { type: DataTypes.UUID, allowNull: false },
    company_id: { type: DataTypes.UUID, allowNull: false },
    title: { type: DataTypes.STRING(300), allowNull: false },
    round: { type: DataTypes.STRING(20) },
    amount_sought: { type: DataTypes.DECIMAL(20, 2) },
    pre_money_valuation: { type: DataTypes.DECIMAL(20, 2) },
    equity_offered_pct: { type: DataTypes.DECIMAL(6, 3) },
    min_ticket: { type: DataTypes.DECIMAL(20, 2) },
    deadline: { type: DataTypes.DATEONLY },
    status: { type: DataTypes.STRING(20), defaultValue: 'draft' },
    visibility: { type: DataTypes.STRING(20), defaultValue: 'public' },
    published_at: { type: DataTypes.DATE },
}, { schema: 'marketplace', tableName: 'opportunities', underscored: true, timestamps: true });
