'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('outreach_messages', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    lead_id: { type: DataTypes.INTEGER, allowNull: true },
    lead_name: { type: DataTypes.STRING(255), allowNull: true },
    campaign_id: { type: DataTypes.INTEGER, allowNull: false },
    subject: { type: DataTypes.STRING(500), allowNull: true },
    message: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.STRING(30), defaultValue: 'pending' },
    sent_at: { type: DataTypes.DATE, allowNull: true },
    reply_text: { type: DataTypes.TEXT, allowNull: true },
    is_interested: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
    schema: 'brand',
    tableName: 'outreach_messages',
    timestamps: true,
    underscored: true,
});
