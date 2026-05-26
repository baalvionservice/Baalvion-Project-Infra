'use strict';
module.exports = (sequelize, DataTypes) => {
    const Referral = sequelize.define('Referral', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        referrer_id: { type: DataTypes.TEXT, allowNull: false },
        referee_id: { type: DataTypes.TEXT, allowNull: true },
        code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
        status: {
            type: DataTypes.ENUM('pending', 'completed'),
            defaultValue: 'pending',
        },
        reward: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    }, {
        schema: 'legal',
        tableName: 'referrals',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    });

    return Referral;
};
