module.exports = function (sequelize, DataTypes) {
    return sequelize.define('affiliate_clicks', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        product_id: { type: DataTypes.UUID, allowNull: false },
        user_id: { type: DataTypes.UUID, allowNull: true },
        // SHA-256 hash, never the raw IP — see migration comment.
        ip_hash: { type: DataTypes.STRING(64), allowNull: true },
        referrer_url: { type: DataTypes.STRING(2048), allowNull: true },
        user_agent: { type: DataTypes.STRING(512), allowNull: true },
    }, {
        tableName: 'affiliate_clicks',
        schema: 'imperialpedia',
        timestamps: true,
        updatedAt: false,
        underscored: true,
        indexes: [
            { fields: ['product_id', 'created_at'] },
        ],
    });
};
