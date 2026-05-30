'use strict';
module.exports = (sequelize, DataTypes) => {
    const Payout = sequelize.define('Payout', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        lawyer_id: { type: DataTypes.INTEGER, allowNull: false },
        amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
        currency: { type: DataTypes.STRING(3), defaultValue: 'USD' },
        status: {
            type: DataTypes.ENUM('requested', 'processing', 'paid', 'failed', 'cancelled'),
            defaultValue: 'requested',
        },
        method: { type: DataTypes.STRING(40), defaultValue: 'bank_transfer' },
        reference: { type: DataTypes.TEXT },
        notes: { type: DataTypes.TEXT },
        requested_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        processed_at: { type: DataTypes.DATE },
    }, {
        schema: 'legal',
        tableName: 'payouts',
        underscored: true,
        timestamps: true,
    });

    Payout.associate = (db) => {
        Payout.belongsTo(db.Lawyer, { foreignKey: 'lawyer_id', as: 'lawyer' });
    };

    return Payout;
};
