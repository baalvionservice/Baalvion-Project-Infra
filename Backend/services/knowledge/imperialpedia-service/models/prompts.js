module.exports = function (sequelize, DataTypes) {
    return sequelize.define('prompts', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        slug: { type: DataTypes.STRING(200), allowNull: false, unique: true },
        title: { type: DataTypes.STRING(300), allowNull: false },
        intro: { type: DataTypes.TEXT, allowNull: true },
        hero_image: { type: DataTypes.STRING(1000), allowNull: true },
        category: { type: DataTypes.STRING(100), allowNull: true },
        tags: { type: DataTypes.JSONB, defaultValue: [] },
        items: { type: DataTypes.JSONB, defaultValue: [] },
        pro_tips: { type: DataTypes.TEXT, allowNull: true },
        is_trending: { type: DataTypes.BOOLEAN, defaultValue: false },
        trending_order: { type: DataTypes.INTEGER, allowNull: true },
        status: { type: DataTypes.ENUM('active', 'archived'), defaultValue: 'active' },
        views_count: { type: DataTypes.INTEGER, defaultValue: 0 },
        copies_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    }, {
        tableName: 'prompts',
        schema: 'imperialpedia',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['category'] },
            { fields: ['status'] },
            { fields: ['is_trending', 'trending_order'] },
        ],
    });
};
