'use strict';
const { DataTypes } = require('sequelize');

// Audit + rate-limit trail for every time an employer is shown a candidate's WhatsApp number.
module.exports = (sequelize) => sequelize.define('NightContactReveal', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    employer_id: { type: DataTypes.UUID, allowNull: false },
    profile_id: { type: DataTypes.UUID, allowNull: false },
}, {
    tableName: 'night_contact_reveals',
    schema: 'community',
    underscored: true,
    timestamps: true,
    updatedAt: false,
    indexes: [{ fields: ['employer_id', 'created_at'] }],
});
