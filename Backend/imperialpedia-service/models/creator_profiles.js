module.exports = function (sequelize, DataTypes) {
    return sequelize.define('creator_profiles', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        user_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
        display_name: { type: DataTypes.STRING(200), allowNull: true },
        bio: { type: DataTypes.TEXT, allowNull: true },
        avatar_url: { type: DataTypes.STRING(500), allowNull: true },
        specialization: { type: DataTypes.JSONB, defaultValue: [] },
        article_count: { type: DataTypes.INTEGER, defaultValue: 0 },
        followers_count: { type: DataTypes.INTEGER, defaultValue: 0 },
        total_views: { type: DataTypes.INTEGER, defaultValue: 0 },
        reputation_score: { type: DataTypes.DECIMAL(6, 2), defaultValue: 0 },
        is_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
        social_links: { type: DataTypes.JSONB, defaultValue: {} },
    }, {
        tableName: 'creator_profiles',
        schema: 'imperialpedia',
        timestamps: true,
        underscored: true,
        indexes: [
            { unique: true, fields: ['user_id'] },
            { fields: ['is_verified'] },
            { fields: ['reputation_score'] },
        ],
    });
};
