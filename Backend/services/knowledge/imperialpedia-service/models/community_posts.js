module.exports = function (sequelize, DataTypes) {
    return sequelize.define('community_posts', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        org_id: { type: DataTypes.UUID, allowNull: true },
        author_id: { type: DataTypes.INTEGER, allowNull: false },
        author_name: { type: DataTypes.STRING(200), allowNull: true },
        title: { type: DataTypes.STRING(500), allowNull: false },
        content: { type: DataTypes.TEXT, allowNull: false },
        category: { type: DataTypes.STRING(100), allowNull: true },
        tags: { type: DataTypes.JSONB, defaultValue: [] },
        upvotes: { type: DataTypes.INTEGER, defaultValue: 0 },
        downvotes: { type: DataTypes.INTEGER, defaultValue: 0 },
        comments_count: { type: DataTypes.INTEGER, defaultValue: 0 },
        is_pinned: { type: DataTypes.BOOLEAN, defaultValue: false },
        status: {
            type: DataTypes.ENUM('active', 'removed'),
            defaultValue: 'active',
        },
    }, {
        tableName: 'community_posts',
        schema: 'imperialpedia',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['author_id'] },
            { fields: ['status'] },
            { fields: ['category'] },
        ],
    });
};
