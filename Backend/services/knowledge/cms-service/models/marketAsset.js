module.exports = function (sequelize, DataTypes) {
    return sequelize.define('market_assets', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        symbol: { type: DataTypes.STRING(40), allowNull: false },
        providerSymbol: { type: DataTypes.STRING(80), allowNull: false },
        name: { type: DataTypes.STRING(120), allowNull: false },
        type: {
            type: DataTypes.ENUM('index', 'stock', 'crypto', 'forex', 'commodity', 'bond'),
            allowNull: false,
        },
        region: { type: DataTypes.STRING(40), allowNull: true },
        provider: { type: DataTypes.STRING(40), allowNull: false },
        category: { type: DataTypes.STRING(40), allowNull: true },
        newsKeyword: { type: DataTypes.STRING(120), allowNull: true },
        exchange: { type: DataTypes.STRING(40), allowNull: true },
        currency: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'USD' },
        logoUrl: { type: DataTypes.STRING(500), allowNull: true },
        sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    }, {
        sequelize,
        tableName: 'market_assets',
        schema: 'cms',
        timestamps: true,
        underscored: true,
        indexes: [
            { unique: true, fields: ['symbol'], name: 'market_assets_symbol_unique' },
            { fields: ['type'] },
            { fields: ['region'] },
        ],
    });
};
