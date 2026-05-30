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
        // Recurring-billing fields (see migration 0004 + billingWorker).
        price: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
        currency: { type: DataTypes.STRING(3), defaultValue: 'USD' },
        interval_days: { type: DataTypes.INTEGER, defaultValue: 30 },
        cancel_at_period_end: { type: DataTypes.BOOLEAN, defaultValue: false },
        last_payment_at: { type: DataTypes.DATE, allowNull: true },
        renewal_count: { type: DataTypes.INTEGER, defaultValue: 0 },
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
