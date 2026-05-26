module.exports = function (sequelize, DataTypes) {
    return sequelize.define('campaign_applications', {
        id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
        campaign_id: { type: DataTypes.BIGINT, allowNull: false },
        influencer_id: { type: DataTypes.BIGINT, allowNull: false },
        org_id: { type: DataTypes.UUID, allowNull: false },
        pitch: { type: DataTypes.TEXT, allowNull: true },
        proposed_rate: { type: DataTypes.BIGINT, allowNull: true },
        currency: { type: DataTypes.STRING(10), defaultValue: 'INR' },
        portfolio_urls: { type: DataTypes.JSONB, defaultValue: [] },
        status: { type: DataTypes.STRING(32), defaultValue: 'pending' },
        rejection_reason: { type: DataTypes.TEXT, allowNull: true },
        approved_at: { type: DataTypes.DATE, allowNull: true },
    }, {
        tableName: 'campaign_applications',
        schema: 'brand',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['campaign_id'] },
            { fields: ['influencer_id'] },
            { fields: ['org_id'] },
            { fields: ['status'] },
        ],
    });
};
