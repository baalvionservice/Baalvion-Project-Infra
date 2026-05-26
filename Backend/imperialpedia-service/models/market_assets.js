module.exports = function (sequelize, DataTypes) {
    return sequelize.define('market_assets', {
        id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
        symbol: { type: DataTypes.STRING(50), allowNull: false, unique: true },
        name: { type: DataTypes.STRING(255), allowNull: false },
        asset_type: { type: DataTypes.STRING(50), defaultValue: 'stock' },
        exchange: { type: DataTypes.STRING(100), allowNull: true },
        sector: { type: DataTypes.STRING(100), allowNull: true },
        country: { type: DataTypes.STRING(100), allowNull: true },
        description: { type: DataTypes.TEXT, allowNull: true },
        logo_url: { type: DataTypes.TEXT, allowNull: true },
        website_url: { type: DataTypes.TEXT, allowNull: true },
        is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
        metadata: { type: DataTypes.JSONB, defaultValue: {} },
    }, {
        tableName: 'market_assets',
        schema: 'imperialpedia',
        timestamps: true,
        underscored: true,
        indexes: [
            { unique: true, fields: ['symbol'] },
            { fields: ['asset_type'] },
            { fields: ['is_active'] },
        ],
    });
};
