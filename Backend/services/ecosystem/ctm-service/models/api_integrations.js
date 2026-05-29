'use strict';
const { DataTypes } = require('sequelize');

// Registry of third-party API connections (Slack, Sentry, Vercel, ...). The api_key is
// stored server-side and never returned in full to the client (masked in the controller).
module.exports = (sequelize) => sequelize.define('api_integrations', {
    id:               { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    company_id:       { type: DataTypes.UUID },
    name:             { type: DataTypes.STRING(160), allowNull: false },
    category:         { type: DataTypes.STRING(60), defaultValue: 'Other' },
    description:      { type: DataTypes.TEXT },
    status:           { type: DataTypes.ENUM('Active', 'Inactive', 'Error'), defaultValue: 'Inactive' },
    api_key:          { type: DataTypes.TEXT },
    endpoint_url:     { type: DataTypes.TEXT },
    subscribed_events:{ type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
    last_sync:        { type: DataTypes.DATE },
    metadata:         { type: DataTypes.JSONB, defaultValue: {} },
}, { schema: 'ctm', tableName: 'api_integrations' });
