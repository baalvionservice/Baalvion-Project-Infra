'use strict';
module.exports = (sequelize, DataTypes) => {
    const Client = sequelize.define('Client', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        user_id: { type: DataTypes.TEXT, allowNull: false },
        name: { type: DataTypes.STRING(255), allowNull: false },
        email: { type: DataTypes.STRING(255), allowNull: false },
        phone: { type: DataTypes.STRING(50) },
        location: { type: DataTypes.STRING(255) },
        preferred_language: { type: DataTypes.STRING(10), defaultValue: 'en' },
        subscription_tier: {
            type: DataTypes.ENUM('BASIC', 'PROFESSIONAL', 'ENTERPRISE'),
            defaultValue: 'BASIC',
        },
    }, {
        schema: 'legal',
        tableName: 'clients',
        underscored: true,
        timestamps: true,
    });

    Client.associate = (db) => {
        Client.hasMany(db.Booking, { foreignKey: 'client_id', as: 'bookings' });
        Client.hasMany(db.Case, { foreignKey: 'client_id', as: 'cases' });
        Client.hasMany(db.Payment, { foreignKey: 'client_id', as: 'payments' });
        Client.hasMany(db.Subscription, { foreignKey: 'client_id', as: 'subscriptions' });
        Client.hasMany(db.Review, { foreignKey: 'client_id', as: 'reviews' });
    };

    return Client;
};
