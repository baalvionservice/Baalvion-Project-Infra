'use strict';
const { DataTypes } = require('sequelize');

// One message thread per application, shared by the candidate (via /me/*) and the
// hiring team (via the ATS). `sender_type` is set server-side from the caller's
// portal role — never from the request body.
module.exports = (sequelize) => sequelize.define('ApplicationMessage', {
    id:             { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    application_id: { type: DataTypes.BIGINT, allowNull: false },
    org_id:         { type: DataTypes.UUID, allowNull: false },
    sender_type:    { type: DataTypes.STRING(16), allowNull: false, validate: { isIn: [['candidate', 'staff']] } },
    sender_name:    { type: DataTypes.STRING(255), allowNull: true },
    sender_email:   { type: DataTypes.STRING(255), allowNull: true },
    body:           { type: DataTypes.TEXT, allowNull: false },
    read_at:        { type: DataTypes.DATE, allowNull: true },
}, { schema: 'jobs', tableName: 'application_messages', underscored: true, timestamps: true });
