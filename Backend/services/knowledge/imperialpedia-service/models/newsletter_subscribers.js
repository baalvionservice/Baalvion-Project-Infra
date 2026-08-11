'use strict';
const { DataTypes } = require('sequelize');

// Real, durable newsletter subscriber list (see migration 20260006). Distinct from
// `plans`/`subscriptions` (paid tiers) — this is the free email newsletter list.
module.exports = (sequelize) => sequelize.define('newsletter_subscribers', {
    id:              { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    email:           { type: DataTypes.STRING(320), allowNull: false, unique: true },
    status:          { type: DataTypes.ENUM('active', 'unsubscribed'), allowNull: false, defaultValue: 'active' },
    source:          { type: DataTypes.STRING(100), allowNull: true },
    subscribed_at:   { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    unsubscribed_at: { type: DataTypes.DATE, allowNull: true },
}, { schema: 'imperialpedia', tableName: 'newsletter_subscribers' });
