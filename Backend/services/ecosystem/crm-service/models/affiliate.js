'use strict';
// An affiliate / referral partner with generated sales and earned commission.
module.exports = (sequelize, DataTypes) => {
    const Affiliate = sequelize.define('Affiliate', {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        brandId: { type: DataTypes.STRING, allowNull: false },
        name: { type: DataTypes.STRING, allowNull: false },
        tier: { type: DataTypes.STRING, defaultValue: 'Gold' },
        referralCode: { type: DataTypes.STRING, allowNull: false },
        salesGenerated: { type: DataTypes.DECIMAL, defaultValue: 0 },
        commissionEarned: { type: DataTypes.DECIMAL, defaultValue: 0 },
        status: { type: DataTypes.STRING, defaultValue: 'active' },
    }, {
        schema: 'crm',
        tableName: 'affiliates',
        underscored: true,
        timestamps: true,
    });
    return Affiliate;
};
