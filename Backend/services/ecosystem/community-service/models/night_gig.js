'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('NightGig', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    employer_id: { type: DataTypes.UUID, allowNull: false },
    title: { type: DataTypes.STRING(240), allowNull: false },
    pay_amount: { type: DataTypes.INTEGER, allowNull: false },
    pay_cycle: { type: DataTypes.STRING(40), allowNull: false },
    venue_address: { type: DataTypes.STRING(300), allowNull: false },
    dress_code: { type: DataTypes.STRING(80), allowNull: true },
    roles_needed: { type: DataTypes.ARRAY(DataTypes.STRING(80)), allowNull: false, defaultValue: [] },
    event_date: { type: DataTypes.DATEONLY, allowNull: false },
    status: { type: DataTypes.ENUM('active', 'filled', 'closed', 'removed'), allowNull: false, defaultValue: 'active' },
}, {
    tableName: 'night_gigs',
    schema: 'community',
    underscored: true,
    timestamps: true,
    indexes: [{ fields: ['status', 'event_date'] }, { fields: ['employer_id'] }],
});
