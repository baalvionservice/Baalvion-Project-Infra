'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('SupportMessage', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    ticket_id: { type: DataTypes.UUID, allowNull: false },
    sender_id: { type: DataTypes.UUID, allowNull: false },
    from_staff: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    sender_label: { type: DataTypes.STRING(160), allowNull: true },
    body: { type: DataTypes.TEXT, allowNull: false },
}, {
    tableName: 'support_messages', schema: 'community', underscored: true, timestamps: true, updatedAt: false,
    indexes: [{ fields: ['ticket_id', 'created_at'] }],
});
