module.exports = function (sequelize, DataTypes) {
    // Per-user watchlist entry. Priced live by joining symbol → asset_summaries.
    return sequelize.define('watchlist_items', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        user_id: { type: DataTypes.INTEGER, allowNull: false },
        symbol: { type: DataTypes.STRING(20), allowNull: false },
        group_name: { type: DataTypes.STRING(80), allowNull: true, defaultValue: 'My Watchlist' },
    }, {
        tableName: 'watchlist_items', schema: 'imperialpedia', timestamps: true, underscored: true,
        indexes: [{ unique: true, fields: ['user_id', 'symbol'] }, { fields: ['user_id'] }],
    });
};
