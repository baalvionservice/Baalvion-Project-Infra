'use strict';
module.exports = (sequelize, DataTypes) => sequelize.define('ProcessedWebhook', {
    webhook_id: { type: DataTypes.TEXT, primaryKey: true },
    event_type: { type: DataTypes.TEXT, allowNull: false },
    payload_hash: { type: DataTypes.TEXT, allowNull: false },
    processed_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { schema: 'oms', tableName: 'processed_webhooks', underscored: true, timestamps: false });
