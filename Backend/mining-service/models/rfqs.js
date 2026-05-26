'use strict';

module.exports = (sequelize, DataTypes) => {
    const Rfq = sequelize.define('Rfq', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        org_id: { type: DataTypes.UUID, allowNull: true },
        listing_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: { tableName: 'mineral_listings', schema: 'mining' }, key: 'id' },
        },
        buyer_id: { type: DataTypes.INTEGER, allowNull: true },
        buyer_org_id: { type: DataTypes.UUID, allowNull: true },
        quantity_mt: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
        target_price: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
        currency: { type: DataTypes.STRING(10), allowNull: true },
        delivery_port: { type: DataTypes.STRING(200), allowNull: true },
        required_by: { type: DataTypes.DATEONLY, allowNull: true },
        message: { type: DataTypes.TEXT, allowNull: true },
        status: {
            type: DataTypes.STRING(20),
            defaultValue: 'open',
            validate: { isIn: [['open', 'closed', 'awarded']] },
        },
    }, {
        tableName: 'rfqs',
        schema: 'mining',
        underscored: true,
        timestamps: true,
    });

    Rfq.associate = (models) => {
        Rfq.belongsTo(models.MineralListing, { foreignKey: 'listing_id', as: 'listing' });
        Rfq.hasMany(models.Bid, { foreignKey: 'rfq_id', as: 'bids' });
        Rfq.hasMany(models.Order, { foreignKey: 'rfq_id', as: 'orders' });
    };

    return Rfq;
};
