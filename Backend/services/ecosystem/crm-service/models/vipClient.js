'use strict';
// A VIP / private client of a brand storefront — the CRM record behind the loyalty,
// wallet and certificate surfaces the storefront's account area renders.
module.exports = (sequelize, DataTypes) => {
    const VipClient = sequelize.define('VipClient', {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        brandId: { type: DataTypes.STRING, allowNull: false },
        userId: { type: DataTypes.STRING },
        name: { type: DataTypes.STRING, allowNull: false },
        email: { type: DataTypes.STRING, allowNull: false },
        tier: { type: DataTypes.STRING, defaultValue: 'Silver' },
        loyaltyPoints: { type: DataTypes.INTEGER, defaultValue: 0 },
        totalSpend: { type: DataTypes.DECIMAL, defaultValue: 0 },
        lastPurchase: { type: DataTypes.DATEONLY },
        isSubscriber: { type: DataTypes.BOOLEAN, defaultValue: false },
        subscriptionPlan: { type: DataTypes.STRING },
        status: { type: DataTypes.STRING, defaultValue: 'verified' },
        walletBalance: { type: DataTypes.DECIMAL, defaultValue: 0 },
        certificates: { type: DataTypes.JSONB, defaultValue: [] },
    }, {
        schema: 'crm',
        tableName: 'vip_clients',
        underscored: true,
        timestamps: true,
    });
    return VipClient;
};
