'use strict';
const { DataTypes } = require('sequelize');

// Durable idempotency claim for payment-service's fulfill callback — mirrors
// community_billing_webhook_events exactly (see community-service/models/community_billing_webhook_event.js).
module.exports = (sequelize) => sequelize.define('GiftCardBillingWebhookEvent', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    provider: { type: DataTypes.STRING(40), allowNull: false },
    event_id: { type: DataTypes.STRING(160), allowNull: false },
    status: { type: DataTypes.ENUM('claimed', 'applied'), allowNull: false, defaultValue: 'claimed' },
    payload: { type: DataTypes.JSONB, allowNull: true },
}, {
    tableName: 'gift_card_billing_webhook_events',
    schema: 'giftcard',
    underscored: true,
    timestamps: true,
    updatedAt: false,
    indexes: [{ unique: true, fields: ['provider', 'event_id'] }],
});
