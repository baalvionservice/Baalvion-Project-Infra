module.exports = function (sequelize, DataTypes) {
    return sequelize.define('partnerships', {
        id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
        campaign_id: { type: DataTypes.BIGINT, allowNull: true },
        brand_id: { type: DataTypes.BIGINT, allowNull: false },
        influencer_id: { type: DataTypes.BIGINT, allowNull: false },
        title: { type: DataTypes.STRING(500), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        agreed_rate: { type: DataTypes.BIGINT, allowNull: false },
        currency: { type: DataTypes.STRING(10), defaultValue: 'INR' },
        start_date: { type: DataTypes.DATEONLY, allowNull: true },
        end_date: { type: DataTypes.DATEONLY, allowNull: true },
        status: { type: DataTypes.STRING(50), defaultValue: 'proposed' },
        deliverables: { type: DataTypes.JSONB, defaultValue: [] },
        payment_status: { type: DataTypes.STRING(32), defaultValue: 'pending' },
        paid_at: { type: DataTypes.DATE, allowNull: true },
        completion_notes: { type: DataTypes.TEXT, allowNull: true },
    }, {
        tableName: 'partnerships',
        schema: 'brand',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['campaign_id'] },
            { fields: ['brand_id'] },
            { fields: ['influencer_id'] },
            { fields: ['status'] },
            { fields: ['payment_status'] },
        ],
    });
};
