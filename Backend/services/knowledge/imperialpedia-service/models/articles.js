module.exports = function (sequelize, DataTypes) {
    return sequelize.define('articles', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        org_id: { type: DataTypes.UUID, allowNull: true },
        title: { type: DataTypes.STRING(500), allowNull: false },
        slug: { type: DataTypes.STRING(500), allowNull: false, unique: true },
        content: { type: DataTypes.TEXT, allowNull: true },
        summary: { type: DataTypes.TEXT, allowNull: true },
        category: { type: DataTypes.STRING(100), allowNull: true },
        tags: { type: DataTypes.JSONB, defaultValue: [] },
        author_id: { type: DataTypes.INTEGER, allowNull: true },
        author_name: { type: DataTypes.STRING(200), allowNull: true },
        status: {
            type: DataTypes.ENUM('draft', 'published', 'archived'),
            defaultValue: 'draft',
        },
        published_at: { type: DataTypes.DATE, allowNull: true },
        views_count: { type: DataTypes.INTEGER, defaultValue: 0 },
        likes_count: { type: DataTypes.INTEGER, defaultValue: 0 },
        cover_image: { type: DataTypes.STRING(500), allowNull: true },
        reading_time_min: { type: DataTypes.INTEGER, defaultValue: 0 },
    }, {
        tableName: 'articles',
        schema: 'imperialpedia',
        timestamps: true,
        underscored: true,
        indexes: [
            { unique: true, fields: ['slug'] },
            { fields: ['status'] },
            { fields: ['author_id'] },
            { fields: ['category'] },
        ],
    });
};
