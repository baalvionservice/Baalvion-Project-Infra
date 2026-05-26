'use strict';
module.exports = (sequelize, DataTypes) => {
    const Booking = sequelize.define('Booking', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        client_id: { type: DataTypes.INTEGER, allowNull: false },
        lawyer_id: { type: DataTypes.INTEGER, allowNull: false },
        case_id: { type: DataTypes.INTEGER, allowNull: true },
        type: {
            type: DataTypes.ENUM('consultation', 'representation', 'review'),
            allowNull: false,
        },
        scheduled_at: { type: DataTypes.DATE, allowNull: false },
        duration: { type: DataTypes.INTEGER, defaultValue: 60, comment: 'Duration in minutes' },
        status: {
            type: DataTypes.ENUM('pending', 'confirmed', 'completed', 'cancelled'),
            defaultValue: 'pending',
        },
        notes: { type: DataTypes.TEXT },
        total_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    }, {
        schema: 'legal',
        tableName: 'bookings',
        underscored: true,
        timestamps: true,
    });

    Booking.associate = (db) => {
        Booking.belongsTo(db.Client, { foreignKey: 'client_id', as: 'client' });
        Booking.belongsTo(db.Lawyer, { foreignKey: 'lawyer_id', as: 'lawyer' });
        Booking.belongsTo(db.Case, { foreignKey: 'case_id', as: 'case' });
        Booking.hasOne(db.Review, { foreignKey: 'booking_id', as: 'review' });
        Booking.hasMany(db.Payment, { foreignKey: 'booking_id', as: 'payments' });
        Booking.hasMany(db.Message, { foreignKey: 'booking_id', as: 'messages' });
    };

    return Booking;
};
