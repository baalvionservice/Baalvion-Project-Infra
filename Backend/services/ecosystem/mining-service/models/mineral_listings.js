'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const MineralListing = sequelize.define('MineralListing', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        org_id: { type: DataTypes.UUID, allowNull: true },
        title: { type: DataTypes.STRING(300), allowNull: false },
        mineral_type: { type: DataTypes.STRING(100), allowNull: true },
        grade: { type: DataTypes.STRING(50), allowNull: true },
        quantity_mt: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
        unit: { type: DataTypes.STRING(20), defaultValue: 'MT' },
        price_per_unit: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
        currency: { type: DataTypes.STRING(10), defaultValue: 'USD' },
        origin_country: { type: DataTypes.STRING(100), allowNull: true },
        origin_region: { type: DataTypes.STRING(100), allowNull: true },
        certification: { type: DataTypes.STRING(200), allowNull: true },
        images: { type: DataTypes.JSONB, defaultValue: [] },
        documents: { type: DataTypes.JSONB, defaultValue: [] },
        status: {
            type: DataTypes.STRING(20),
            defaultValue: 'draft',
            validate: { isIn: [['draft', 'active', 'sold', 'expired']] },
        },
        seller_id: { type: DataTypes.INTEGER, allowNull: true },
        seller_org_id: { type: DataTypes.UUID, allowNull: true },
        is_featured: { type: DataTypes.BOOLEAN, defaultValue: false },
        views_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    }, {
        tableName: 'mineral_listings',
        schema: 'mining',
        underscored: true,
        timestamps: true,
    });

    MineralListing.associate = (models) => {
        MineralListing.hasMany(models.Rfq, { foreignKey: 'listing_id', as: 'rfqs' });
        MineralListing.hasMany(models.Order, { foreignKey: 'listing_id', as: 'orders' });
        MineralListing.hasMany(models.TradeDocument, { foreignKey: 'listing_id', as: 'tradeDocuments' });
    };

    return MineralListing;
};
