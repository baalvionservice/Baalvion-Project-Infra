'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('ClubBooking', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    club_id: { type: DataTypes.UUID, allowNull: false },
    user_id: { type: DataTypes.UUID, allowNull: true },
    kind: { type: DataTypes.ENUM('guest_list', 'vip_table'), allowNull: false },
    first_name: { type: DataTypes.STRING(80), allowNull: false },
    last_name: { type: DataTypes.STRING(80), allowNull: false },
    email: { type: DataTypes.STRING(320), allowNull: false },
    phone: { type: DataTypes.STRING(32), allowNull: false },
    visit_date: { type: DataTypes.DATEONLY, allowNull: false },
    males: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    females: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    group_size: { type: DataTypes.INTEGER, allowNull: true },
    table_package: { type: DataTypes.STRING(120), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM('pending', 'confirmed', 'declined', 'cancelled'), allowNull: false, defaultValue: 'pending' },
}, {
    tableName: 'club_bookings',
    schema: 'community',
    underscored: true,
    timestamps: true,
    indexes: [{ fields: ['club_id', 'visit_date'] }, { fields: ['user_id'] }, { fields: ['status'] }],
});
