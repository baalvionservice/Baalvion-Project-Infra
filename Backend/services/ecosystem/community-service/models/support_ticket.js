'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('SupportTicket', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.STRING(64), allowNull: false },
    user_label: { type: DataTypes.STRING(160), allowNull: true },
    category: { type: DataTypes.ENUM('order', 'account', 'booking', 'verification', 'payment', 'other'), allowNull: false, defaultValue: 'other' },
    subject: { type: DataTypes.STRING(200), allowNull: false },
    status: { type: DataTypes.ENUM('open', 'pending', 'resolved', 'closed'), allowNull: false, defaultValue: 'open' },
    priority: { type: DataTypes.ENUM('low', 'normal', 'high'), allowNull: false, defaultValue: 'normal' },
    assigned_to: { type: DataTypes.STRING(64), allowNull: true },
    assigned_label: { type: DataTypes.STRING(160), allowNull: true },
    last_message_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
    tableName: 'support_tickets', schema: 'community', underscored: true, timestamps: true,
    indexes: [{ fields: ['user_id'] }, { fields: ['status', 'last_message_at'] }],
});
