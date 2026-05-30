module.exports = function (sequelize, DataTypes) {
    // Per-user portfolio holding. Current value/P&L computed live from asset_summaries.
    return sequelize.define('portfolio_holdings', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        user_id: { type: DataTypes.INTEGER, allowNull: false },
        symbol: { type: DataTypes.STRING(20), allowNull: false },
        quantity: { type: DataTypes.DECIMAL(20, 6), allowNull: false, defaultValue: 0 },
        avg_cost: { type: DataTypes.DECIMAL(20, 6), allowNull: false, defaultValue: 0 },
    }, {
        tableName: 'portfolio_holdings', schema: 'imperialpedia', timestamps: true, underscored: true,
        indexes: [{ unique: true, fields: ['user_id', 'symbol'] }, { fields: ['user_id'] }],
    });
};
