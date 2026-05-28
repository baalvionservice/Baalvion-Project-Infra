module.exports = function (sequelize, DataTypes) {
    return sequelize.define('asset_summaries', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        symbol: { type: DataTypes.STRING(20), allowNull: false, unique: true },
        name: { type: DataTypes.STRING(200), allowNull: true },
        asset_type: { type: DataTypes.STRING(50), allowNull: true }, // stock, crypto, etf, commodity, index
        exchange: { type: DataTypes.STRING(50), allowNull: true },
        current_price: { type: DataTypes.DECIMAL(12, 4), allowNull: true },
        change_pct_24h: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
        market_cap: { type: DataTypes.DECIMAL(20, 2), allowNull: true },
        volume_24h: { type: DataTypes.DECIMAL(20, 2), allowNull: true },
        ai_summary: { type: DataTypes.TEXT, allowNull: true },
        sentiment: {
            type: DataTypes.ENUM('bullish', 'bearish', 'neutral'),
            defaultValue: 'neutral',
        },
        key_metrics: { type: DataTypes.JSONB, defaultValue: {} },
        last_updated_at: { type: DataTypes.DATE, allowNull: true },
    }, {
        tableName: 'asset_summaries',
        schema: 'imperialpedia',
        timestamps: true,
        underscored: true,
        indexes: [
            { unique: true, fields: ['symbol'] },
            { fields: ['asset_type'] },
            { fields: ['exchange'] },
        ],
    });
};
