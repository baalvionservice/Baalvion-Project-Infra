module.exports = function (sequelize, DataTypes) {
    return sequelize.define('leaderboard_entries', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        user_id: { type: DataTypes.INTEGER, allowNull: false },
        display_name: { type: DataTypes.STRING(200), allowNull: true },
        avatar_url: { type: DataTypes.STRING(500), allowNull: true },
        period: {
            type: DataTypes.ENUM('weekly', 'monthly', 'alltime'),
            defaultValue: 'monthly',
        },
        score: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
        rank: { type: DataTypes.INTEGER, allowNull: true },
        articles_count: { type: DataTypes.INTEGER, defaultValue: 0 },
        views_total: { type: DataTypes.INTEGER, defaultValue: 0 },
        likes_total: { type: DataTypes.INTEGER, defaultValue: 0 },
    }, {
        tableName: 'leaderboard_entries',
        schema: 'imperialpedia',
        timestamps: true,
        underscored: true,
        indexes: [
            { unique: true, fields: ['user_id', 'period'] },
            { fields: ['period'] },
            { fields: ['rank'] },
        ],
    });
};
