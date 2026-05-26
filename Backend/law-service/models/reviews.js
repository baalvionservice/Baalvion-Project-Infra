'use strict';
module.exports = (sequelize, DataTypes) => {
    const Review = sequelize.define('Review', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        booking_id: { type: DataTypes.INTEGER, allowNull: false },
        client_id: { type: DataTypes.INTEGER, allowNull: false },
        lawyer_id: { type: DataTypes.INTEGER, allowNull: false },
        rating: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: { min: 1, max: 5 },
        },
        comment: { type: DataTypes.TEXT },
    }, {
        schema: 'legal',
        tableName: 'reviews',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    });

    Review.associate = (db) => {
        Review.belongsTo(db.Booking, { foreignKey: 'booking_id', as: 'booking' });
        Review.belongsTo(db.Client, { foreignKey: 'client_id', as: 'client' });
        Review.belongsTo(db.Lawyer, { foreignKey: 'lawyer_id', as: 'lawyer' });
    };

    return Review;
};
