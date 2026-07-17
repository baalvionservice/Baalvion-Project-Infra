'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('CommunityBillingWebhookEvent', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    provider: { type: DataTypes.STRING(40), allowNull: false },
    event_id: { type: DataTypes.STRING(190), allowNull: false },
    status: { type: DataTypes.ENUM('claimed', 'applied'), allowNull: false, defaultValue: 'claimed' },
    payload: { type: DataTypes.JSONB, allowNull: true },
}, {
    tableName: 'community_billing_webhook_events',
    schema: 'community',
    underscored: true,
    timestamps: true,
    updatedAt: false,
    indexes: [{ unique: true, fields: ['provider', 'event_id'] }],
});
