'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('ClubEvent', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    club_id: { type: DataTypes.UUID, allowNull: false },
    event_name: { type: DataTypes.STRING(200), allowNull: false },
    dj_name: { type: DataTypes.STRING(160), allowNull: true },
    event_date: { type: DataTypes.DATEONLY, allowNull: false },
    image: { type: DataTypes.STRING(600), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    tag: { type: DataTypes.ENUM('FREE ON GUEST LIST', 'BUY TICKETS', 'VIP TABLE', 'SOLD OUT'), allowNull: false, defaultValue: 'FREE ON GUEST LIST' },
    ticket_url: { type: DataTypes.STRING(600), allowNull: true },
    status: { type: DataTypes.ENUM('active', 'cancelled'), allowNull: false, defaultValue: 'active' },
}, {
    tableName: 'club_events', schema: 'community', underscored: true, timestamps: true,
    indexes: [{ fields: ['event_date', 'status'] }, { fields: ['club_id'] }],
});
