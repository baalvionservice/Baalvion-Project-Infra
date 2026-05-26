'use strict';
module.exports = (sequelize, DataTypes) => {
    const Subscription = sequelize.define('Subscription', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        client_id: { type: DataTypes.INTEGER, allowNull: false },
        tier: {
            type: DataTypes.ENUM('BASIC', 'PROFESSIONAL', 'ENTERPRISE'),
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('active', 'cancelled', 'expired'),
            defaultValue: 'active',
        },
        started_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        expires_at: { type: DataTypes.DATE, allowNull: true },
    }, {
        schema: 'legal',
        tableName: 'subscriptions',
        underscored: true,
        timestamps: true,
    });

    Subscription.associate = (db) => {
        Subscription.belongsTo(db.Client, { foreignKey: 'client_id', as: 'client' });
    };

    return Subscription;
};
