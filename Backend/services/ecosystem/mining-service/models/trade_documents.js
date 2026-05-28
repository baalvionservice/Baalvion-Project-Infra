'use strict';

module.exports = (sequelize, DataTypes) => {
    const TradeDocument = sequelize.define('TradeDocument', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        org_id: { type: DataTypes.UUID, allowNull: true },
        order_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: { tableName: 'orders', schema: 'mining' }, key: 'id' },
        },
        listing_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: { tableName: 'mineral_listings', schema: 'mining' }, key: 'id' },
        },
        type: {
            type: DataTypes.STRING(50),
            allowNull: true,
            validate: { isIn: [['invoice', 'bl', 'packing_list', 'certificate', 'contract', 'other']] },
        },
        name: { type: DataTypes.STRING(300), allowNull: true },
        url: { type: DataTypes.STRING(500), allowNull: true },
        uploaded_by: { type: DataTypes.INTEGER, allowNull: true },
    }, {
        tableName: 'trade_documents',
        schema: 'mining',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    });

    TradeDocument.associate = (models) => {
        TradeDocument.belongsTo(models.Order, { foreignKey: 'order_id', as: 'order' });
        TradeDocument.belongsTo(models.MineralListing, { foreignKey: 'listing_id', as: 'listing' });
    };

    return TradeDocument;
};
