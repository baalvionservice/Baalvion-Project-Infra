'use strict';
const { DataTypes } = require('sequelize');

// One private thread per hunter (thread_user_id); admins reply into the same thread.
module.exports = (sequelize) => sequelize.define('BountyMessage', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    thread_user_id: { type: DataTypes.STRING(64), allowNull: false },
    sender_id: { type: DataTypes.STRING(64), allowNull: false },
    from_admin: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    sender_label: { type: DataTypes.STRING(80), allowNull: true },
    content: { type: DataTypes.TEXT, allowNull: false },
    read_by_recipient: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, {
    tableName: 'bounty_messages', schema: 'community', underscored: true, timestamps: true, updatedAt: false,
    indexes: [{ fields: ['thread_user_id', 'created_at'] }],
});
