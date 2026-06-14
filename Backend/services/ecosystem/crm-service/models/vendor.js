'use strict';
// A supplying vendor/maison partner with performance KPIs and payout terms.
module.exports = (sequelize, DataTypes) => {
    const Vendor = sequelize.define('Vendor', {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        brandId: { type: DataTypes.STRING, allowNull: false },
        name: { type: DataTypes.STRING, allowNull: false },
        category: { type: DataTypes.STRING },
        performance: { type: DataTypes.INTEGER, defaultValue: 0 },
        productCount: { type: DataTypes.INTEGER, defaultValue: 0 },
        salesTotal: { type: DataTypes.DECIMAL, defaultValue: 0 },
        status: { type: DataTypes.STRING, defaultValue: 'active' },
        payoutSchedule: { type: DataTypes.STRING, defaultValue: 'monthly' },
        joinedDate: { type: DataTypes.DATEONLY },
        kpis: { type: DataTypes.JSONB, defaultValue: {} },
    }, {
        schema: 'crm',
        tableName: 'vendors',
        underscored: true,
        timestamps: true,
    });
    return Vendor;
};
