'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('outreach_campaigns', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    type: { type: DataTypes.STRING(30), defaultValue: 'email' },
    status: { type: DataTypes.STRING(30), defaultValue: 'draft' },
    total_leads: { type: DataTypes.INTEGER, defaultValue: 0 },
    sent_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    reply_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    message_template: { type: DataTypes.TEXT, allowNull: true },
    subject: { type: DataTypes.STRING(500), allowNull: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
}, {
    schema: 'brand',
    tableName: 'outreach_campaigns',
    timestamps: true,
    underscored: true,
});
