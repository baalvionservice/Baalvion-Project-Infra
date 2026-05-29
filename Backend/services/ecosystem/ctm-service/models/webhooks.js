'use strict';
const { DataTypes } = require('sequelize');

// Outbound webhooks. Each has its OWN signing secret (we generate it) — deliveries are
// HMAC-SHA256 signed so receivers can verify authenticity. No third-party account needed.
module.exports = (sequelize) => sequelize.define('webhooks', {
    id:               { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    company_id:       { type: DataTypes.UUID },
    name:             { type: DataTypes.STRING(160), allowNull: false },
    url:              { type: DataTypes.TEXT, allowNull: false },
    events:           { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
    secret:           { type: DataTypes.STRING(120), allowNull: false },
    status:           { type: DataTypes.ENUM('Active', 'Inactive', 'Error'), defaultValue: 'Active' },
    last_triggered_at:{ type: DataTypes.DATE },
    failure_count:    { type: DataTypes.INTEGER, defaultValue: 0 },
    metadata:         { type: DataTypes.JSONB, defaultValue: {} },
}, { schema: 'ctm', tableName: 'webhooks' });
