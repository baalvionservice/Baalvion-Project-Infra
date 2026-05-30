'use strict';
module.exports = (sequelize, DataTypes) => {
    const LawyerLedger = sequelize.define('LawyerLedger', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        lawyer_id: { type: DataTypes.INTEGER, allowNull: false },
        payment_id: { type: DataTypes.INTEGER, allowNull: true },
        payout_id: { type: DataTypes.INTEGER, allowNull: true },
        entry_type: { type: DataTypes.ENUM('credit', 'debit'), allowNull: false },
        amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
        fee_amount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
        currency: { type: DataTypes.STRING(3), defaultValue: 'USD' },
        description: { type: DataTypes.TEXT },
    }, {
        schema: 'legal',
        tableName: 'lawyer_ledger',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    });

    LawyerLedger.associate = (db) => {
        LawyerLedger.belongsTo(db.Lawyer, { foreignKey: 'lawyer_id', as: 'lawyer' });
    };

    return LawyerLedger;
};
