'use strict';
module.exports = (sequelize, DataTypes) => {
    const Payment = sequelize.define('Payment', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        booking_id: { type: DataTypes.INTEGER, allowNull: true },
        client_id: { type: DataTypes.INTEGER, allowNull: false },
        lawyer_id: { type: DataTypes.INTEGER, allowNull: true },
        amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        currency: { type: DataTypes.STRING(3), defaultValue: 'USD' },
        status: {
            type: DataTypes.ENUM('pending', 'succeeded', 'failed', 'refunded'),
            defaultValue: 'pending',
        },
        provider: { type: DataTypes.TEXT },
        provider_tx_id: { type: DataTypes.TEXT },
    }, {
        schema: 'legal',
        tableName: 'payments',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    });

    Payment.associate = (db) => {
        Payment.belongsTo(db.Booking, { foreignKey: 'booking_id', as: 'booking' });
        Payment.belongsTo(db.Client, { foreignKey: 'client_id', as: 'client' });
        Payment.belongsTo(db.Lawyer, { foreignKey: 'lawyer_id', as: 'lawyer' });
    };

    return Payment;
};
