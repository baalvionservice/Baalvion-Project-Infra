'use strict';

module.exports = (sequelize, DataTypes) => {
    const Bid = sequelize.define('Bid', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        org_id: { type: DataTypes.UUID, allowNull: true },
        rfq_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: { tableName: 'rfqs', schema: 'mining' }, key: 'id' },
        },
        bidder_id: { type: DataTypes.INTEGER, allowNull: true },
        bidder_org_id: { type: DataTypes.UUID, allowNull: true },
        price_per_unit: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
        total_price: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
        currency: { type: DataTypes.STRING(10), allowNull: true },
        delivery_days: { type: DataTypes.INTEGER, allowNull: true },
        notes: { type: DataTypes.TEXT, allowNull: true },
        status: {
            type: DataTypes.STRING(20),
            defaultValue: 'pending',
            validate: { isIn: [['pending', 'accepted', 'rejected']] },
        },
    }, {
        tableName: 'bids',
        schema: 'mining',
        underscored: true,
        timestamps: true,
    });

    Bid.associate = (models) => {
        Bid.belongsTo(models.Rfq, { foreignKey: 'rfq_id', as: 'rfq' });
    };

    return Bid;
};
