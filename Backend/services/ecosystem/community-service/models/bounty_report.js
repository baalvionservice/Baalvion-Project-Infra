'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('BountyReport', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    task_id: { type: DataTypes.UUID, allowNull: false },
    user_id: { type: DataTypes.UUID, allowNull: false },
    reporter_label: { type: DataTypes.STRING(80), allowNull: true },
    title: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    evidence_links: { type: DataTypes.ARRAY(DataTypes.STRING(600)), allowNull: false, defaultValue: [] },
    status: { type: DataTypes.ENUM('submitted', 'triaged', 'accepted', 'rejected', 'duplicate', 'paid'), allowNull: false, defaultValue: 'submitted' },
    reviewer_note: { type: DataTypes.TEXT, allowNull: true },
    reward_note: { type: DataTypes.STRING(300), allowNull: true },
    // Payout ledger entry. The site never moves money: an admin pays outside it and records the
    // payment here, so each "paid" report carries what was sent, how, and a traceable reference.
    payout_method: { type: DataTypes.ENUM('bank_transfer', 'upi', 'btc', 'usdt', 'other'), allowNull: true },
    payout_amount: { type: DataTypes.DECIMAL(14, 2), allowNull: true },
    payout_currency: { type: DataTypes.STRING(8), allowNull: true },
    payout_reference: { type: DataTypes.STRING(200), allowNull: true },
    paid_at: { type: DataTypes.DATE, allowNull: true },
    paid_by: { type: DataTypes.UUID, allowNull: true },
    reviewed_by: { type: DataTypes.UUID, allowNull: true },
    reviewed_at: { type: DataTypes.DATE, allowNull: true },
}, {
    tableName: 'bounty_reports', schema: 'community', underscored: true, timestamps: true,
    indexes: [{ fields: ['user_id'] }, { fields: ['task_id'] }, { fields: ['status'] }],
});
