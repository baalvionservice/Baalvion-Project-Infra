module.exports = function (sequelize, DataTypes) {
    // Community bull/bear sentiment per asset. `meta` carries the full frontend AssetSentiment
    // (bullish/bearish counts, trend, history).
    return sequelize.define('asset_sentiments', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        ticker: { type: DataTypes.STRING(20), allowNull: false, unique: true },
        name: { type: DataTypes.STRING(200), allowNull: true },
        meta: { type: DataTypes.JSONB, defaultValue: {} },
    }, {
        tableName: 'asset_sentiments', schema: 'imperialpedia', timestamps: true, underscored: true,
        indexes: [{ unique: true, fields: ['ticker'] }],
    });
};
